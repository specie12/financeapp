import { Controller, Post, Body } from '@nestjs/common'
import { CalculatorsService } from './calculators.service'
import { RentVsBuyDto } from './dto/rent-vs-buy.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { rentVsBuyRequestSchema } from '@finance-app/validation'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { Permission } from '../authorization/interfaces/permission.interface'
import type { ApiResponse } from '@finance-app/shared-types'
import type { RentVsBuyResult } from '@finance-app/finance-engine'

@Controller('calculators')
export class CalculatorsController {
  constructor(private readonly calculatorsService: CalculatorsService) {}

  @Post('rent-vs-buy')
  @RequirePermission(Permission.READ)
  calculate(
    @Body(new ZodValidationPipe(rentVsBuyRequestSchema)) dto: RentVsBuyDto,
  ): ApiResponse<RentVsBuyResult> {
    const result = this.calculatorsService.calculateRentVsBuy(dto)
    return {
      success: true,
      data: result,
    }
  }
}
