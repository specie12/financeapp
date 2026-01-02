import { Controller, Post, Body } from '@nestjs/common'
import { CalculatorsService } from './calculators.service'
import { RentVsBuyDto } from './dto/rent-vs-buy.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { rentVsBuyRequestSchema } from '@finance-app/validation'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { Permission } from '../authorization/interfaces/permission.interface'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { ApiResponse, RentVsBuyResultWithAffordability } from '@finance-app/shared-types'

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
}
