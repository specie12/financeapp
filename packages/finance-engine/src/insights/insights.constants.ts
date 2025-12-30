import { cents } from '../money/money'
import type { Cents } from '../money/money.types'

/**
 * Configuration for the Housing Cost Rule.
 *
 * Based on the industry-standard "28/36 rule":
 * - Front-end ratio (housing costs) should be ≤ 28% of gross income
 * - Back-end ratio (total debt) should be ≤ 36% of gross income
 *
 * Sources:
 * - Fannie Mae underwriting guidelines
 * - Consumer Financial Protection Bureau (CFPB)
 */
export interface HousingCostRuleConfig {
  /** Whether this rule is enabled */
  enabled: boolean

  /**
   * Safe threshold (percent of gross income).
   * Housing costs at or below this are considered healthy.
   * Default: 28% (standard front-end ratio)
   */
  safeThresholdPercent: number

  /**
   * Warning threshold (percent of gross income).
   * Housing costs above this warrant attention.
   * Default: 36% (stretch but manageable)
   */
  warningThresholdPercent: number

  /**
   * Alert threshold (percent of gross income).
   * Housing costs above this are considered burdensome.
   * Default: 45% (cost-burdened threshold)
   */
  alertThresholdPercent: number

  /** Rule priority (lower = higher priority) */
  priority: number
}

/**
 * Configuration for the Debt-to-Income Rule.
 *
 * Based on lending industry standards:
 * - DTI ≤ 36% is considered healthy
 * - DTI 36-43% may limit borrowing options
 * - DTI > 43% is the QM threshold for ability-to-repay
 *
 * Sources:
 * - Consumer Financial Protection Bureau (CFPB)
 * - Qualified Mortgage (QM) standards
 */
export interface DebtToIncomeRuleConfig {
  /** Whether this rule is enabled */
  enabled: boolean

  /**
   * Safe DTI ratio (percent).
   * Total debt payments at or below this are considered healthy.
   * Default: 36% (standard back-end ratio)
   */
  safeThresholdPercent: number

  /**
   * Warning threshold (percent).
   * Default: 43% (QM threshold)
   */
  warningThresholdPercent: number

  /**
   * Alert threshold (percent).
   * Default: 50% (severely debt-burdened)
   */
  alertThresholdPercent: number

  /** Rule priority */
  priority: number
}

/**
 * Configuration for the Emergency Fund Rule.
 *
 * Based on financial planning best practices:
 * - Minimum: 3 months of expenses (basic safety net)
 * - Recommended: 6 months (standard recommendation)
 * - Extended: 12 months (for self-employed, variable income)
 *
 * Sources:
 * - Certified Financial Planner Board standards
 * - Consumer Financial Protection Bureau (CFPB)
 */
export interface EmergencyFundRuleConfig {
  /** Whether this rule is enabled */
  enabled: boolean

  /**
   * Minimum months of expenses to cover.
   * Below this is considered inadequate.
   * Default: 3 months
   */
  minimumMonths: number

  /**
   * Recommended months of expenses.
   * Standard financial planning target.
   * Default: 6 months
   */
  recommendedMonths: number

  /** Rule priority */
  priority: number
}

/**
 * Configuration for the Goal Progress Rule.
 *
 * Evaluates whether savings goals are on track based on
 * time elapsed vs. progress made.
 */
export interface GoalProgressRuleConfig {
  /** Whether this rule is enabled */
  enabled: boolean

  /**
   * Behind schedule threshold (percent of expected).
   * If actual progress < expected * threshold, goal is behind.
   * Default: 80% (20% buffer before flagging)
   */
  behindThresholdPercent: number

  /** Rule priority */
  priority: number
}

/**
 * Configuration for the Interest Savings Rule.
 *
 * Analyzes potential savings from extra debt payments.
 * Uses amortization engine to calculate actual impact.
 */
export interface InterestSavingsRuleConfig {
  /** Whether this rule is enabled */
  enabled: boolean

  /**
   * Minimum savings to report (in cents).
   * Only generates insight if savings exceed this.
   * Default: $100 (10000 cents)
   */
  minimumSavingsCents: Cents

  /**
   * Extra payment scenarios to analyze (in cents).
   * Each amount will be tested against each qualifying loan.
   * Default: [$100, $200, $500]
   */
  extraPaymentScenariosCents: Cents[]

  /** Rule priority */
  priority: number
}

/**
 * Complete rule configuration for the insights engine.
 */
export interface RuleConfiguration {
  housingCostRule: HousingCostRuleConfig
  debtToIncomeRule: DebtToIncomeRuleConfig
  emergencyFundRule: EmergencyFundRuleConfig
  goalProgressRule: GoalProgressRuleConfig
  interestSavingsRule: InterestSavingsRuleConfig
}

/**
 * Default rule configuration based on industry standards and best practices.
 *
 * All thresholds are documented with their sources and rationale.
 * These can be overridden via the ruleConfig parameter.
 */
export const DEFAULT_RULE_CONFIG: RuleConfiguration = {
  housingCostRule: {
    enabled: true,
    /**
     * Safe threshold: 28%
     * Source: Fannie Mae front-end ratio guideline
     * Most lenders prefer housing costs ≤ 28% of gross income
     */
    safeThresholdPercent: 28,
    /**
     * Warning threshold: 36%
     * Source: Standard lending back-end ratio
     * Housing costs 28-36% are manageable but stretched
     */
    warningThresholdPercent: 36,
    /**
     * Alert threshold: 45%
     * Source: HUD cost-burdened definition
     * Households paying >30% are cost-burdened; >50% severely so
     * Using 45% as the alert threshold
     */
    alertThresholdPercent: 45,
    priority: 1,
  },

  debtToIncomeRule: {
    enabled: true,
    /**
     * Safe threshold: 36%
     * Source: Standard lending back-end ratio
     * Total debt payments ≤ 36% is considered healthy
     */
    safeThresholdPercent: 36,
    /**
     * Warning threshold: 43%
     * Source: Qualified Mortgage (QM) standard
     * CFPB rule: loans with DTI > 43% are non-QM
     */
    warningThresholdPercent: 43,
    /**
     * Alert threshold: 50%
     * Source: Severely debt-burdened threshold
     * Half of income going to debt is unsustainable
     */
    alertThresholdPercent: 50,
    priority: 2,
  },

  emergencyFundRule: {
    enabled: true,
    /**
     * Minimum: 3 months
     * Source: CFP Board minimum recommendation
     * Provides basic safety net for unexpected expenses
     */
    minimumMonths: 3,
    /**
     * Recommended: 6 months
     * Source: Standard financial planning guideline
     * Covers job loss, medical emergency, major repairs
     */
    recommendedMonths: 6,
    priority: 3,
  },

  goalProgressRule: {
    enabled: true,
    /**
     * Behind threshold: 80%
     * If progress is < 80% of expected, flag as behind
     * Provides 20% buffer before generating warning
     */
    behindThresholdPercent: 80,
    priority: 4,
  },

  interestSavingsRule: {
    enabled: true,
    /**
     * Minimum savings: $100
     * Only report if potential savings exceed this amount
     * Avoids noise from trivial savings
     */
    minimumSavingsCents: cents(10000), // $100
    /**
     * Extra payment scenarios: $100, $200, $500
     * Common extra payment amounts to analyze
     * Provides range of options for different budgets
     */
    extraPaymentScenariosCents: [
      cents(10000), // $100
      cents(20000), // $200
      cents(50000), // $500
    ],
    priority: 5,
  },
}

/**
 * Rule IDs for consistent identification.
 */
export const RULE_IDS = {
  HOUSING_COST: 'housing_cost_ratio',
  DEBT_TO_INCOME: 'debt_to_income_ratio',
  EMERGENCY_FUND: 'emergency_fund_status',
  GOAL_PROGRESS: 'goal_progress',
  INTEREST_SAVINGS: 'interest_savings_potential',
} as const

/**
 * Severity order for sorting (lower = more severe).
 */
export const SEVERITY_ORDER: Record<string, number> = {
  alert: 0,
  warning: 1,
  info: 2,
}
