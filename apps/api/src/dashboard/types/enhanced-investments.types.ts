import type { Cents } from '@finance-app/finance-engine'
import type { AssetType } from '@finance-app/shared-types'
import type { InvestmentsResponse } from './investments.types'

export interface DividendProjection {
  assetId: string
  assetName: string
  assetType: AssetType
  valueCents: Cents
  /** `null` when the asset has no dividend yield configured. */
  yieldPercent: number | null
  annualDividendCents: Cents | null
  monthlyDividendCents: Cents | null
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
  /** Sum of configured `annualDividendCents`. `null` if no asset has a yield set. */
  totalAnnualDividendsCents: Cents | null
  /** Sum of configured `monthlyDividendCents`. `null` if no asset has a yield set. */
  totalMonthlyDividendsCents: Cents | null
  /** True when at least one asset is missing dividend yield — totals are partial. */
  dividendsPartial: boolean
  goalProgress: GoalProgressSummary[]
}
