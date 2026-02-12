import { Controller, Post, Get, Body } from '@nestjs/common'
import { AiService } from './ai.service'
import { AiAnomalyService } from './ai-anomaly.service'
import { AiPredictionService } from './ai-prediction.service'
import { AdviceRequestDto } from './dto/advice-request.dto'
import { ChatRequestDto } from './dto/chat-request.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import {
  adviceRequestSchema,
  chatRequestSchema,
  aiQueryRequestSchema,
} from '@finance-app/validation'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { Permission } from '../authorization/interfaces/permission.interface'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type {
  ApiResponse,
  AiAdviceResponse,
  AiChatResponse,
  AiQueryResponse,
  AiForecastResponse,
  AiAnomalyResponse,
} from '@finance-app/shared-types'

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly anomalyService: AiAnomalyService,
    private readonly predictionService: AiPredictionService,
  ) {}

  @Post('advice')
  @RequirePermission(Permission.READ)
  async getAdvice(
    @CurrentUser('householdId') householdId: string,
    @Body(new ZodValidationPipe(adviceRequestSchema)) dto: AdviceRequestDto,
  ): Promise<ApiResponse<AiAdviceResponse>> {
    const result = await this.aiService.getAdvice(householdId, dto)
    return {
      success: true,
      data: result,
    }
  }

  @Post('chat')
  @RequirePermission(Permission.READ)
  async chat(
    @CurrentUser('householdId') householdId: string,
    @Body(new ZodValidationPipe(chatRequestSchema)) dto: ChatRequestDto,
  ): Promise<ApiResponse<AiChatResponse>> {
    const result = await this.aiService.chat(householdId, dto)
    return {
      success: true,
      data: result,
    }
  }

  @Post('query')
  @RequirePermission(Permission.READ)
  async queryTransactions(
    @CurrentUser('householdId') householdId: string,
    @Body(new ZodValidationPipe(aiQueryRequestSchema)) dto: { question: string },
  ): Promise<ApiResponse<AiQueryResponse>> {
    const result = await this.aiService.queryTransactions(householdId, dto.question)
    return {
      success: true,
      data: result,
    }
  }

  @Post('forecast')
  @RequirePermission(Permission.READ)
  async forecast(
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<AiForecastResponse>> {
    const result = await this.predictionService.predictMonthEnd(householdId)
    return {
      success: true,
      data: result,
    }
  }

  @Get('anomalies')
  @RequirePermission(Permission.READ)
  async getAnomalies(
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<AiAnomalyResponse>> {
    const result = await this.anomalyService.detectAnomalies(householdId)
    return {
      success: true,
      data: result,
    }
  }
}
