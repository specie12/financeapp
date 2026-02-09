import { Controller, Post, Body } from '@nestjs/common'
import { AiService } from './ai.service'
import { AdviceRequestDto } from './dto/advice-request.dto'
import { ChatRequestDto } from './dto/chat-request.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { adviceRequestSchema, chatRequestSchema } from '@finance-app/validation'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { Permission } from '../authorization/interfaces/permission.interface'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { ApiResponse, AiAdviceResponse, AiChatResponse } from '@finance-app/shared-types'

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

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
}
