import type { Cents } from '@finance-app/finance-engine'

export interface ScenarioOverrideResponse {
  id: string
  targetType: 'asset' | 'liability' | 'cash_flow_item'
  entityId: string
  fieldName: string
  value: string
}

export interface ScenarioResponse {
  id: string
  householdId: string
  name: string
  description: string | null
  isBaseline: boolean
  createdAt: Date
  updatedAt: Date
  overrides: ScenarioOverrideResponse[]
}

export interface ScenarioListResponse {
  scenarios: ScenarioResponse[]
}

export interface YearlyProjectionSnapshot {
  year: number
  date: Date
  totalAssetsCents: Cents
  totalLiabilitiesCents: Cents
  netWorthCents: Cents
  totalIncomeCents: Cents
  totalExpensesCents: Cents
  debtPaymentsCents: Cents
  netCashFlowCents: Cents
}

export interface ProjectionSummaryResponse {
  startingNetWorthCents: Cents
  endingNetWorthCents: Cents
  netWorthChangeCents: Cents
  netWorthChangePercent: number
  totalIncomeOverPeriodCents: Cents
  totalExpensesOverPeriodCents: Cents
  totalDebtPaidCents: Cents
  totalInterestPaidCents: Cents
}

export interface ScenarioProjectionResponse {
  scenario: ScenarioResponse
  startDate: Date
  horizonYears: number
  yearlySnapshots: YearlyProjectionSnapshot[]
  summary: ProjectionSummaryResponse
}

export interface ScenarioComparisonItem {
  scenario: ScenarioResponse
  projection: {
    startDate: Date
    horizonYears: number
    yearlySnapshots: YearlyProjectionSnapshot[]
    summary: ProjectionSummaryResponse
  }
}

export interface ScenarioComparisonResponse {
  comparisons: ScenarioComparisonItem[]
}
