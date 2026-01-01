import { Controller, Get, Post, Param, Query, Body, ParseUUIDPipe } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { Permission } from '../authorization/interfaces/permission.interface'
import { type ApiResponse } from '@finance-app/shared-types'
import type {
  NetWorthResponse,
  LoansResponse,
  LoanAmortizationResponse,
  InvestmentsResponse,
  LoanSimulationRequest,
  LoanSimulationResponse,
  EnhancedInvestmentsResponse,
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

  @Get('investments/enhanced')
  @RequirePermission(Permission.READ)
  async getEnhancedInvestments(
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<EnhancedInvestmentsResponse>> {
    const data = await this.dashboardService.getEnhancedInvestments(householdId)
    return {
      success: true,
      data,
    }
  }

  @Post('loans/:id/simulate')
  @RequirePermission(Permission.READ)
  async simulateLoanPayoff(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
    @Body() request: LoanSimulationRequest,
  ): Promise<ApiResponse<LoanSimulationResponse>> {
    const data = await this.dashboardService.simulateLoanPayoff(householdId, id, request)
    return {
      success: true,
      data,
    }
  }
}
