import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { TaxService } from './tax.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { createTaxProfileSchema, taxSummaryQuerySchema } from '@finance-app/validation'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { Permission } from '../authorization/interfaces/permission.interface'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { CreateTaxProfileDto } from './dto/create-tax-profile.dto'
import type { TaxSummaryQueryDto } from './dto/tax-summary-query.dto'
import type { ApiResponse, TaxProfile, TaxSummaryResponse } from '@finance-app/shared-types'

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('summary')
  @RequirePermission(Permission.READ)
  async getSummary(
    @CurrentUser('householdId') householdId: string,
    @Query(new ZodValidationPipe(taxSummaryQuerySchema)) query: TaxSummaryQueryDto,
  ): Promise<ApiResponse<TaxSummaryResponse>> {
    const result = await this.taxService.getSummary(householdId, query.taxYear)
    return {
      success: true,
      data: result,
    }
  }

  @Post('profile')
  @RequirePermission(Permission.CREATE)
  async upsertProfile(
    @CurrentUser('householdId') householdId: string,
    @Body(new ZodValidationPipe(createTaxProfileSchema)) dto: CreateTaxProfileDto,
  ): Promise<ApiResponse<TaxProfile>> {
    const result = await this.taxService.upsertProfile(householdId, dto)
    return {
      success: true,
      data: result as unknown as TaxProfile,
    }
  }

  @Get('profile')
  @RequirePermission(Permission.READ)
  async getProfile(
    @CurrentUser('householdId') householdId: string,
    @Query(new ZodValidationPipe(taxSummaryQuerySchema)) query: TaxSummaryQueryDto,
  ): Promise<ApiResponse<TaxProfile>> {
    const result = await this.taxService.getProfile(householdId, query.taxYear)
    return {
      success: true,
      data: result as unknown as TaxProfile,
    }
  }
}
