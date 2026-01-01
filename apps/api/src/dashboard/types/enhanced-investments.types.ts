import type { Cents } from '@finance-app/finance-engine'
import type { AssetType } from '@finance-app/shared-types'
import type { InvestmentsResponse } from './investments.types'

export interface DividendProjection {
  assetId: string
  assetName: string
  assetType: AssetType
  valueCents: Cents
  yieldPercent: number
  annualDividendCents: Cents
  monthlyDividendCents: Cents
  isCustomYield: boolean
}

export interface GoalProgressSummary {
  goalId: string
  goalName: string
  goalType: 'net_worth_target' | 'savings_target' | 'debt_freedom'
  targetAmountCents: Cents
  currentAmountCents: Cents
  progressPercent: number
  remainingCents: Cents
  onTrack: boolean
  projectedCompletionDate: Date | null
}

export interface EnhancedInvestmentsResponse extends InvestmentsResponse {
  dividendProjections: DividendProjection[]
  totalAnnualDividendsCents: Cents
  totalMonthlyDividendsCents: Cents
  goalProgress: GoalProgressSummary[]
}
