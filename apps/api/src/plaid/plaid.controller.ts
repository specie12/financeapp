import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common'
import { PlaidService } from './plaid.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { plaidExchangeTokenSchema, plaidWebhookSchema } from '@finance-app/validation'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { Permission } from '../authorization/interfaces/permission.interface'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Public } from '../auth/decorators/public.decorator'
import type { ExchangeTokenDto } from './dto/exchange-token.dto'
import type { PlaidWebhookDto } from './dto/plaid-webhook.dto'
import type { ApiResponse, PlaidItem, PlaidLinkTokenResponse } from '@finance-app/shared-types'

@Controller('plaid')
export class PlaidController {
  constructor(private readonly plaidService: PlaidService) {}

  @Post('link-token')
  @RequirePermission(Permission.CREATE)
  async createLinkToken(
    @CurrentUser('id') userId: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<PlaidLinkTokenResponse>> {
    const result = await this.plaidService.createLinkToken(userId, householdId)
    return {
      success: true,
      data: result,
    }
  }

  @Post('exchange-token')
  @RequirePermission(Permission.CREATE)
  async exchangeToken(
    @CurrentUser('householdId') householdId: string,
    @Body(new ZodValidationPipe(plaidExchangeTokenSchema)) dto: ExchangeTokenDto,
  ): Promise<ApiResponse<PlaidItem>> {
    const result = await this.plaidService.exchangePublicToken(householdId, dto)
    return {
      success: true,
      data: result as unknown as PlaidItem,
    }
  }

  @Get('items')
  @RequirePermission(Permission.READ)
  async getItems(
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<PlaidItem[]>> {
    const items = await this.plaidService.getItems(householdId)
    return {
      success: true,
      data: items as unknown as PlaidItem[],
    }
  }

  @Post('sync/:id')
  @RequirePermission(Permission.UPDATE)
  async sync(
    @CurrentUser('householdId') householdId: string,
    @Param('id') id: string,
  ): Promise<ApiResponse<{ synced: number }>> {
    const result = await this.plaidService.syncTransactions(id, householdId)
    return {
      success: true,
      data: result,
    }
  }

  @Delete('items/:id')
  @RequirePermission(Permission.DELETE)
  async deleteItem(
    @CurrentUser('householdId') householdId: string,
    @Param('id') id: string,
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    await this.plaidService.deleteItem(id, householdId)
    return {
      success: true,
      data: { deleted: true },
    }
  }

  @Post('webhook')
  @Public()
  async handleWebhook(
    @Body(new ZodValidationPipe(plaidWebhookSchema)) dto: PlaidWebhookDto,
  ): Promise<{ received: boolean }> {
    await this.plaidService.handleWebhook(dto.item_id, dto.webhook_code)
    return { received: true }
  }
}
