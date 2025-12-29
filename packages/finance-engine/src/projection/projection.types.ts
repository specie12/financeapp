import type { Cents } from '../money/money.types'
import type { Scenario } from '../scenario/scenario.types'

/**
 * Frequency for recurring items.
 */
export type Frequency = 'one_time' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'

/**
 * Asset entity for projection.
 */
export interface ProjectionAsset {
  id: string
  name: string
  currentValueCents: Cents
  annualGrowthRatePercent: number
}

/**
 * Liability entity for projection.
 */
export interface ProjectionLiability {
  id: string
  name: string
  currentBalanceCents: Cents
  interestRatePercent: number
  minimumPaymentCents: Cents
  termMonths: number | null
  startDate: Date
}

/**
 * Cash flow item type.
 */
export type CashFlowType = 'income' | 'expense'

/**
 * Cash flow item entity for projection.
 */
export interface ProjectionCashFlowItem {
  id: string
  name: string
  type: CashFlowType
  amountCents: Cents
  frequency: Frequency
  annualGrowthRatePercent: number | null
  startDate: Date | null
  endDate: Date | null
}

/**
 * Input for running a projection.
 */
export interface ProjectionInput {
  /** Assets to project */
  assets: ProjectionAsset[]
  /** Liabilities to project */
  liabilities: ProjectionLiability[]
  /** Cash flow items to project */
  cashFlowItems: ProjectionCashFlowItem[]
  /** Start date for projection (for determinism) */
  startDate: Date
  /** Number of years to project (5-30) */
  horizonYears: number
  /** Optional scenario overrides to apply before projection */
  scenario?: Scenario
}

/**
 * Asset value at a point in time.
 */
export interface AssetValue {
  id: string
  valueCents: Cents
}

/**
 * Liability balance at a point in time.
 */
export interface LiabilityBalance {
  id: string
  balanceCents: Cents
}

/**
 * Yearly snapshot of financial state.
 */
export interface YearlySnapshot {
  /** Year number (0 = start, 1 = after 1 year, etc.) */
  year: number
  /** Date of this snapshot */
  date: Date

  // Net Worth
  /** Total value of all assets */
  totalAssetsCents: Cents
  /** Total balance of all liabilities */
  totalLiabilitiesCents: Cents
  /** Net worth (assets - liabilities) */
  netWorthCents: Cents

  // Cash Flow (annual)
  /** Total income for this year */
  totalIncomeCents: Cents
  /** Total expenses for this year */
  totalExpensesCents: Cents
  /** Total debt payments for this year (principal + interest) */
  debtPaymentsCents: Cents
  /** Net cash flow (income - expenses - debt payments) */
  netCashFlowCents: Cents

  // Breakdowns
  /** Individual asset values */
  assetValues: AssetValue[]
  /** Individual liability balances */
  liabilityBalances: LiabilityBalance[]
}

/**
 * Summary statistics for the projection period.
 */
export interface ProjectionSummary {
  /** Net worth at start of projection */
  startingNetWorthCents: Cents
  /** Net worth at end of projection */
  endingNetWorthCents: Cents
  /** Change in net worth */
  netWorthChangeCents: Cents
  /** Percentage change in net worth */
  netWorthChangePercent: number

  /** Total income over entire period */
  totalIncomeOverPeriodCents: Cents
  /** Total expenses over entire period */
  totalExpensesOverPeriodCents: Cents
  /** Total debt principal paid over period */
  totalDebtPaidCents: Cents
  /** Total interest paid over period */
  totalInterestPaidCents: Cents
}

/**
 * Complete projection result.
 */
export interface ProjectionResult {
  /** Start date used for projection */
  startDate: Date
  /** Number of years projected */
  horizonYears: number
  /** Year-by-year snapshots (length = horizonYears + 1, including year 0) */
  yearlySnapshots: YearlySnapshot[]
  /** Summary statistics */
  summary: ProjectionSummary
}

/**
 * Result of projecting a liability for a specific year.
 */
export interface LiabilityYearProjection {
  /** Remaining balance at end of year */
  balanceCents: Cents
  /** Total payments made during year */
  yearlyPaymentCents: Cents
  /** Interest portion of payments */
  yearlyInterestCents: Cents
  /** Principal portion of payments */
  yearlyPrincipalCents: Cents
}

/**
 * Validation result for projection input.
 */
export interface ProjectionValidationResult {
  valid: boolean
  error?: string
}

/**
 * Frequency multipliers for annualization.
 */
export const FREQUENCY_MULTIPLIERS: Record<Frequency, number> = {
  one_time: 1,
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  annually: 1,
}

/**
 * Minimum projection horizon in years.
 */
export const MIN_HORIZON_YEARS = 5

/**
 * Maximum projection horizon in years.
 */
export const MAX_HORIZON_YEARS = 30
