import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common'
import { type DashboardService } from './dashboard.service'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { Permission } from '../authorization/interfaces/permission.interface'
import { type ApiResponse } from '@finance-app/shared-types'
import type {
  NetWorthResponse,
  LoansResponse,
  LoanAmortizationResponse,
  InvestmentsResponse,
} from './types'

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('net-worth')
  @RequirePermission(Permission.READ)
  async getNetWorth(
    @CurrentUser('householdId') householdId: string,
    @Query('horizonYears') horizonYears?: string,
  ): Promise<ApiResponse<NetWorthResponse>> {
    const years = horizonYears ? parseInt(horizonYears, 10) : 5
    const data = await this.dashboardService.getNetWorth(householdId, years)
    return {
      success: true,
      data,
    }
  }

  @Get('loans')
  @RequirePermission(Permission.READ)
  async getLoans(
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<LoansResponse>> {
    const data = await this.dashboardService.getLoans(householdId)
    return {
      success: true,
      data,
    }
  }

  @Get('loans/:id/amortization')
  @RequirePermission(Permission.READ)
  async getLoanAmortization(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<LoanAmortizationResponse>> {
    const data = await this.dashboardService.getLoanAmortization(householdId, id)
    return {
      success: true,
      data,
    }
  }

  @Get('investments')
  @RequirePermission(Permission.READ)
  async getInvestments(
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<InvestmentsResponse>> {
    const data = await this.dashboardService.getInvestments(householdId)
    return {
      success: true,
      data,
    }
  }
}
