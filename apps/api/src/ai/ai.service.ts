import { Injectable, ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import { PromptBuilderService } from './prompt-builder.service'
import { PlanLimitsService } from '../plan-limits/plan-limits.service'
import type { AdviceRequestDto } from './dto/advice-request.dto'
import type { ChatRequestDto } from './dto/chat-request.dto'
import type { AiAdviceResponse, AiChatResponse, AiInsight } from '@finance-app/shared-types'
import { randomUUID } from 'crypto'

interface ConversationEntry {
  role: 'user' | 'assistant'
  content: string
}

@Injectable()
export class AiService {
  private readonly client: Anthropic
  private readonly model: string
  private readonly maxTokens: number
  private readonly conversations = new Map<string, ConversationEntry[]>()
  private readonly dailyCounts = new Map<string, { count: number; date: string }>()

  constructor(
    private readonly configService: ConfigService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly planLimitsService: PlanLimitsService,
  ) {
    const apiKey = this.configService.get<string>('anthropic.apiKey')
    this.client = new Anthropic({ apiKey: apiKey || undefined })
    this.model = this.configService.get<string>('anthropic.model') || 'claude-sonnet-4-5-20250929'
    this.maxTokens = this.configService.get<number>('anthropic.maxTokens') || 2048
  }

  private getDailyCount(householdId: string): number {
    const today = new Date().toISOString().slice(0, 10)
    const entry = this.dailyCounts.get(householdId)
    if (!entry || entry.date !== today) {
      return 0
    }
    return entry.count
  }

  private incrementDailyCount(householdId: string): void {
    const today = new Date().toISOString().slice(0, 10)
    const entry = this.dailyCounts.get(householdId)
    if (!entry || entry.date !== today) {
      this.dailyCounts.set(householdId, { count: 1, date: today })
    } else {
      entry.count++
    }
  }

  async getAdvice(householdId: string, dto: AdviceRequestDto): Promise<AiAdviceResponse> {
    const currentCount = this.getDailyCount(householdId)
    await this.planLimitsService.assertCanMakeAiCall(householdId, currentCount)

    const financialContext = await this.promptBuilder.buildFinancialContext(householdId)

    const systemPrompt = `You are a knowledgeable personal finance advisor. Analyze the user's financial data and provide actionable insights.

FINANCIAL DATA:
${financialContext}

Respond with a JSON object (no markdown, just raw JSON) with this structure:
{
  "insights": [
    {
      "category": "savings|debt|investment|budget|goal|general",
      "severity": "info|warning|success|critical",
      "message": "Clear description of the insight",
      "action": "Specific actionable recommendation"
    }
  ],
  "summary": "2-3 sentence overall financial health summary"
}

Provide 3-6 actionable insights. Be specific with numbers from the data. Focus on the most impactful advice.`

    const userMessage = dto.topic
      ? `Please focus your analysis on: ${dto.topic}`
      : 'Please provide a comprehensive financial health analysis.'

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      })

      this.incrementDailyCount(householdId)

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('')

      return this.parseAdviceResponse(text)
    } catch (error) {
      if (error instanceof ForbiddenException) throw error
      return {
        insights: [
          {
            category: 'general',
            severity: 'info',
            message: 'AI analysis is temporarily unavailable.',
            action: 'Please try again later or check your API configuration.',
          },
        ],
        summary: 'Unable to generate AI insights at this time.',
      }
    }
  }

  async chat(householdId: string, dto: ChatRequestDto): Promise<AiChatResponse> {
    const currentCount = this.getDailyCount(householdId)
    await this.planLimitsService.assertCanMakeAiCall(householdId, currentCount)

    const conversationId = dto.conversationId || randomUUID()
    const history = this.conversations.get(conversationId) || []

    // Build context on first message
    if (history.length === 0) {
      const financialContext = await this.promptBuilder.buildFinancialContext(householdId)
      history.push({
        role: 'user',
        content: `Here is my financial data for context:\n\n${financialContext}\n\nI'll ask you questions about my finances.`,
      })
      history.push({
        role: 'assistant',
        content: "I've reviewed your financial data. How can I help you with your finances?",
      })
    }

    history.push({ role: 'user', content: dto.message })

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system:
          'You are a helpful personal finance advisor. Use the financial data provided in the conversation to give specific, actionable advice. Be concise and reference specific numbers when relevant.',
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      })

      this.incrementDailyCount(householdId)

      const assistantMessage = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('')

      history.push({ role: 'assistant', content: assistantMessage })
      this.conversations.set(conversationId, history)

      // Clean up old conversations (keep max 100)
      if (this.conversations.size > 100) {
        const firstKey = this.conversations.keys().next().value
        if (firstKey) this.conversations.delete(firstKey)
      }

      return {
        message: assistantMessage,
        conversationId,
      }
    } catch (error) {
      if (error instanceof ForbiddenException) throw error
      return {
        message: "I'm unable to respond right now. Please try again later.",
        conversationId,
      }
    }
  }

  private parseAdviceResponse(text: string): AiAdviceResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          insights: (parsed.insights || []).map((i: AiInsight) => ({
            category: i.category || 'general',
            severity: i.severity || 'info',
            message: i.message || '',
            action: i.action || '',
          })),
          summary: parsed.summary || 'Financial analysis complete.',
        }
      }
    } catch {
      // Fall through to default
    }

    return {
      insights: [
        {
          category: 'general',
          severity: 'info',
          message: text.slice(0, 500),
          action: 'Review the analysis above for details.',
        },
      ],
      summary: 'Financial analysis complete.',
    }
  }
}
