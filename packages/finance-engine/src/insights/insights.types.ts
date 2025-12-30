import type { Cents } from '../money/money.types'
import type { RuleConfiguration } from './insights.constants'

// Re-export for convenience
export type { RuleConfiguration } from './insights.constants'

/**
 * Severity level for insights.
 * - info: Informational, no immediate action needed
 * - warning: Attention recommended
 * - alert: Immediate attention needed
 */
export type InsightSeverity = 'info' | 'warning' | 'alert'

/**
 * Categories of insights for grouping and filtering.
 */
export type InsightCategory = 'housing' | 'debt' | 'savings' | 'goals' | 'interest'

/**
 * Asset types for classification.
 */
export type AssetType = 'cash' | 'investment' | 'property' | 'other'

/**
 * Liability types for classification.
 */
export type LiabilityType = 'mortgage' | 'auto' | 'student' | 'credit_card' | 'other'

/**
 * Unit type for calculated values.
 */
export type InsightUnit = 'percent' | 'cents' | 'months' | 'ratio'

// ========================================
// Input Types
// ========================================

/**
 * Monthly expenses breakdown.
 */
export interface MonthlyExpenses {
  /** Housing costs (rent/mortgage + insurance + taxes) */
  housingCents: Cents

  /** Utility costs */
  utilitiesCents: Cents

  /** Transportation costs */
  transportationCents: Cents

  /** Food costs */
  foodCents: Cents

  /** Other miscellaneous costs */
  otherCents: Cents
}

/**
 * Asset input for insights calculation.
 */
export interface AssetInput {
  /** Unique identifier */
  id: string

  /** Display name */
  name: string

  /** Current value in cents */
  valueCents: Cents

  /** Asset classification */
  type: AssetType
}

/**
 * Liability input for insights calculation.
 */
export interface LiabilityInput {
  /** Unique identifier */
  id: string

  /** Display name */
  name: string

  /** Current balance in cents */
  balanceCents: Cents

  /** Annual interest rate as percentage */
  interestRatePercent: number

  /** Minimum monthly payment in cents */
  minimumPaymentCents: Cents

  /** Liability classification */
  type: LiabilityType

  /** Original loan term in months (for amortization calculations) */
  originalTermMonths?: number

  /** Remaining term in months (if known) */
  remainingTermMonths?: number
}

/**
 * Financial goal input.
 */
export interface GoalInput {
  /** Unique identifier */
  id: string

  /** Display name */
  name: string

  /** Target amount to save in cents */
  targetAmountCents: Cents

  /** Current amount saved in cents */
  currentAmountCents: Cents

  /** Target completion date */
  targetDate: Date

  /** Monthly contribution amount in cents */
  monthlyContributionCents: Cents
}

/**
 * Main input for the insights engine.
 */
export interface InsightInput {
  /** Reference date for calculations (for determinism) */
  referenceDate: Date

  /** Monthly gross income in cents */
  monthlyIncomeCents: Cents

  /** Monthly expenses breakdown */
  monthlyExpenses: MonthlyExpenses

  /** Current assets */
  assets: AssetInput[]

  /** Current liabilities */
  liabilities: LiabilityInput[]

  /** Financial goals */
  goals: GoalInput[]

  /** Optional rule configuration overrides */
  ruleConfig?: Partial<RuleConfiguration>
}

// ========================================
// Output Types
// ========================================

/**
 * Potential impact if recommendations are followed.
 */
export interface PotentialImpact {
  /** Human-readable description of the impact */
  description: string

  /** Potential savings in cents (if applicable) */
  savingsCents?: Cents

  /** Timeframe for the impact in days (if applicable) */
  timeframeDays?: number
}

/**
 * Individual insight with full explainability.
 *
 * DETERMINISM GUARANTEES:
 * - Same input always produces same insight
 * - No random IDs - based on rule + input hash
 * - All calculations use Decimal.js for precision
 */
export interface Insight {
  /** Unique identifier for this insight (deterministic) */
  id: string

  /** Rule that generated this insight */
  ruleId: string

  /** Category for grouping */
  category: InsightCategory

  /** Severity level */
  severity: InsightSeverity

  /** Short title */
  title: string

  /** Detailed explanation */
  description: string

  // ========================================
  // Explainability (CRITICAL)
  // ========================================

  /** The calculated metric value */
  calculatedValue: number

  /** The threshold that was compared against */
  threshold: number

  /** Unit of the calculated value */
  unit: InsightUnit

  /** Human-readable explanation of the calculation */
  calculation: string

  // ========================================
  // Actionable Recommendations
  // ========================================

  /** Specific actions user can take */
  recommendations: string[]

  /** Potential impact if recommendations followed */
  potentialImpact?: PotentialImpact

  // ========================================
  // Traceability
  // ========================================

  /** Minimal data needed to reproduce this insight */
  dataSnapshot: Record<string, Cents | number | string>

  /** Priority for sorting (lower = higher priority) */
  priority: number
}

// ========================================
// Base Metrics Types
// ========================================

/**
 * Goal progress metrics.
 */
export interface GoalProgressMetrics {
  /** Goal ID */
  goalId: string

  /** Current progress as percentage (0-100) */
  progressPercent: number

  /** Expected progress as percentage based on time elapsed */
  expectedProgressPercent: number

  /** Months remaining until target date */
  monthsRemaining: number

  /** Whether the goal is on track */
  onTrack: boolean
}

/**
 * Information about highest interest debt.
 */
export interface HighestInterestDebt {
  /** Liability ID */
  id: string

  /** Display name */
  name: string

  /** Interest rate as percentage */
  rate: number

  /** Current balance in cents */
  balanceCents: Cents
}

/**
 * Pre-calculated base metrics used by all rules.
 * Calculated once and reused for efficiency.
 */
export interface BaseMetrics {
  // ========================================
  // Income Metrics
  // ========================================

  /** Monthly gross income */
  monthlyIncomeCents: Cents

  /** Annual gross income */
  annualIncomeCents: Cents

  // ========================================
  // Housing Metrics
  // ========================================

  /** Monthly housing costs */
  monthlyHousingCostsCents: Cents

  /** Housing cost ratio as percentage of income */
  housingCostRatioPercent: number

  // ========================================
  // Debt Metrics
  // ========================================

  /** Total debt balance */
  totalDebtCents: Cents

  /** Total monthly debt payments */
  monthlyDebtPaymentsCents: Cents

  /** Debt-to-income ratio as percentage */
  debtToIncomeRatioPercent: number

  // ========================================
  // Savings Metrics
  // ========================================

  /** Total cash and cash-equivalent assets */
  totalCashAssetsCents: Cents

  /** Total monthly expenses */
  monthlyExpensesCents: Cents

  /** Emergency fund coverage in months */
  emergencyFundMonths: number

  // ========================================
  // Goal Metrics
  // ========================================

  /** Progress metrics for each goal */
  goalProgress: GoalProgressMetrics[]

  // ========================================
  // Interest Metrics
  // ========================================

  /** Estimated total interest paid annually */
  totalInterestPaidAnnuallyCents: Cents

  /** Highest interest rate debt (for prioritization) */
  highestInterestDebt: HighestInterestDebt | null
}

// ========================================
// Summary Types
// ========================================

/**
 * Summary counts for insights.
 */
export interface InsightsSummary {
  /** Total number of insights generated */
  totalCount: number

  /** Number of alert-level insights */
  alertCount: number

  /** Number of warning-level insights */
  warningCount: number

  /** Number of info-level insights */
  infoCount: number
}

/**
 * Complete result from the insights engine.
 */
export interface InsightsResult {
  /** All generated insights, sorted by priority and severity */
  insights: Insight[]

  /** Summary counts */
  summary: InsightsSummary

  /** Calculated base metrics (reusable) */
  metrics: BaseMetrics

  /** Effective rule configuration used */
  effectiveRuleConfig: RuleConfiguration

  /** Reference date used for calculations */
  referenceDate: Date
}

// ========================================
// Validation Types
// ========================================

/**
 * Validation result for insight input.
 */
export interface InsightValidationResult {
  valid: boolean
  error?: string
}

// ========================================
// Interest Savings Types
// ========================================

/**
 * Interest savings analysis for a specific extra payment scenario.
 */
export interface InterestSavingsScenario {
  /** Liability ID */
  liabilityId: string

  /** Liability name */
  liabilityName: string

  /** Extra payment amount in cents */
  extraPaymentCents: Cents

  /** Total interest saved over loan lifetime */
  interestSavedCents: Cents

  /** Months saved (early payoff) */
  monthsSaved: number

  /** Original total interest */
  originalTotalInterestCents: Cents

  /** New total interest with extra payments */
  newTotalInterestCents: Cents
}
