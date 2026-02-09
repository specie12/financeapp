import { Controller, Post, Body } from '@nestjs/common'
import { CalculatorsService } from './calculators.service'
import { RentVsBuyDto } from './dto/rent-vs-buy.dto'
import { MortgageVsInvestDto } from './dto/mortgage-vs-invest.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { rentVsBuyRequestSchema, mortgageVsInvestRequestSchema } from '@finance-app/validation'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { Permission } from '../authorization/interfaces/permission.interface'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type {
  ApiResponse,
  RentVsBuyResultWithAffordability,
  MortgageVsInvestResult,
} from '@finance-app/shared-types'

@Controller('calculators')
export class CalculatorsController {
  constructor(private readonly calculatorsService: CalculatorsService) {}

  @Post('rent-vs-buy')
  @RequirePermission(Permission.READ)
  async calculate(
    @CurrentUser('householdId') householdId: string,
    @Body(new ZodValidationPipe(rentVsBuyRequestSchema)) dto: RentVsBuyDto,
  ): Promise<ApiResponse<RentVsBuyResultWithAffordability>> {
    const result = await this.calculatorsService.calculateRentVsBuyWithAffordability(
      householdId,
      dto,
    )
    return {
      success: true,
      data: result,
    }
  }

  @Post('mortgage-vs-invest')
  @RequirePermission(Permission.READ)
  async calculateMortgageVsInvest(
    @Body(new ZodValidationPipe(mortgageVsInvestRequestSchema)) dto: MortgageVsInvestDto,
  ): Promise<ApiResponse<MortgageVsInvestResult>> {
    const result = this.calculatorsService.calculateMortgageVsInvest(dto)
    return {
      success: true,
      data: result,
    }
  }
}
