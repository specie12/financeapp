import type { Cents } from '../money/money.types'
import type {
  InsightInput,
  InsightsResult,
  InsightValidationResult,
  Insight,
  InsightsSummary,
} from './insights.types'
import type { RuleConfiguration } from './insights.constants'
import { DEFAULT_RULE_CONFIG, SEVERITY_ORDER } from './insights.constants'
import { InvalidInsightInputError } from './insights.errors'
import { calculateBaseMetrics } from './insights.metrics'
import {
  evaluateHousingCostRule,
  evaluateDebtToIncomeRule,
  evaluateEmergencyFundRule,
  evaluateGoalProgressRule,
  evaluateInterestSavingsRule,
} from './insights.rules'

/**
 * Deeply merge rule configurations, with overrides taking precedence.
 */
export function mergeRuleConfig(overrides?: Partial<RuleConfiguration>): RuleConfiguration {
  if (!overrides) {
    return { ...DEFAULT_RULE_CONFIG }
  }

  return {
    housingCostRule: {
      ...DEFAULT_RULE_CONFIG.housingCostRule,
      ...overrides.housingCostRule,
    },
    debtToIncomeRule: {
      ...DEFAULT_RULE_CONFIG.debtToIncomeRule,
      ...overrides.debtToIncomeRule,
    },
    emergencyFundRule: {
      ...DEFAULT_RULE_CONFIG.emergencyFundRule,
      ...overrides.emergencyFundRule,
    },
    goalProgressRule: {
      ...DEFAULT_RULE_CONFIG.goalProgressRule,
      ...overrides.goalProgressRule,
    },
    interestSavingsRule: {
      ...DEFAULT_RULE_CONFIG.interestSavingsRule,
      ...overrides.interestSavingsRule,
    },
  }
}

/**
 * Validate a cents value is a non-negative integer.
 */
function isValidCents(value: unknown): value is Cents {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

/**
 * Validate a cents value allows negative (for some cases).
 */
function isValidCentsAllowNegative(value: unknown): value is Cents {
  return typeof value === 'number' && Number.isInteger(value)
}

/**
 * Validate insight input data.
 *
 * @returns Validation result with any error message
 */
export function validateInsightInput(input: InsightInput): InsightValidationResult {
  // Validate reference date
  if (!(input.referenceDate instanceof Date) || isNaN(input.referenceDate.getTime())) {
    return { valid: false, error: 'Invalid reference date' }
  }

  // Validate monthly income (must be positive)
  if (!isValidCents(input.monthlyIncomeCents) || input.monthlyIncomeCents <= 0) {
    return { valid: false, error: 'Monthly income must be a positive integer in cents' }
  }

  // Validate monthly expenses
  const expenseFields: (keyof typeof input.monthlyExpenses)[] = [
    'housingCents',
    'utilitiesCents',
    'transportationCents',
    'foodCents',
    'otherCents',
  ]
  for (const field of expenseFields) {
    if (!isValidCents(input.monthlyExpenses[field])) {
      return { valid: false, error: `Invalid expense value for ${field}` }
    }
  }

  // Validate assets
  for (const asset of input.assets) {
    if (!asset.id || typeof asset.id !== 'string') {
      return { valid: false, error: 'Asset must have a valid id' }
    }
    if (!asset.name || typeof asset.name !== 'string') {
      return { valid: false, error: `Asset "${asset.id}" must have a valid name` }
    }
    if (!isValidCentsAllowNegative(asset.valueCents)) {
      return { valid: false, error: `Asset "${asset.id}" has invalid value` }
    }
    if (!['cash', 'investment', 'property', 'other'].includes(asset.type)) {
      return { valid: false, error: `Asset "${asset.id}" has invalid type` }
    }
  }

  // Validate liabilities
  for (const liability of input.liabilities) {
    if (!liability.id || typeof liability.id !== 'string') {
      return { valid: false, error: 'Liability must have a valid id' }
    }
    if (!liability.name || typeof liability.name !== 'string') {
      return { valid: false, error: `Liability "${liability.id}" must have a valid name` }
    }
    if (!isValidCents(liability.balanceCents)) {
      return { valid: false, error: `Liability "${liability.id}" has invalid balance` }
    }
    if (typeof liability.interestRatePercent !== 'number' || liability.interestRatePercent < 0) {
      return { valid: false, error: `Liability "${liability.id}" has invalid interest rate` }
    }
    if (!isValidCents(liability.minimumPaymentCents)) {
      return { valid: false, error: `Liability "${liability.id}" has invalid minimum payment` }
    }
    if (!['mortgage', 'auto', 'student', 'credit_card', 'other'].includes(liability.type)) {
      return { valid: false, error: `Liability "${liability.id}" has invalid type` }
    }
  }

  // Validate goals
  for (const goal of input.goals) {
    if (!goal.id || typeof goal.id !== 'string') {
      return { valid: false, error: 'Goal must have a valid id' }
    }
    if (!goal.name || typeof goal.name !== 'string') {
      return { valid: false, error: `Goal "${goal.id}" must have a valid name` }
    }
    if (!isValidCents(goal.targetAmountCents) || goal.targetAmountCents <= 0) {
      return { valid: false, error: `Goal "${goal.id}" has invalid target amount` }
    }
    if (!isValidCents(goal.currentAmountCents)) {
      return { valid: false, error: `Goal "${goal.id}" has invalid current amount` }
    }
    if (!(goal.targetDate instanceof Date) || isNaN(goal.targetDate.getTime())) {
      return { valid: false, error: `Goal "${goal.id}" has invalid target date` }
    }
    if (!isValidCents(goal.monthlyContributionCents)) {
      return { valid: false, error: `Goal "${goal.id}" has invalid monthly contribution` }
    }
  }

  return { valid: true }
}

/**
 * Assert that input is valid, throwing if not.
 */
function assertValidInput(input: InsightInput): void {
  const validation = validateInsightInput(input)
  if (!validation.valid) {
    throw new InvalidInsightInputError(validation.error!)
  }
}

/**
 * Sort insights by severity and priority.
 */
function sortInsights(insights: Insight[]): Insight[] {
  return [...insights].sort((a, b) => {
    // First by severity (alert > warning > info)
    const severityDiff = SEVERITY_ORDER[a.severity]! - SEVERITY_ORDER[b.severity]!
    if (severityDiff !== 0) {
      return severityDiff
    }

    // Then by priority (lower = higher priority)
    const priorityDiff = a.priority - b.priority
    if (priorityDiff !== 0) {
      return priorityDiff
    }

    // Finally by ID for determinism
    return a.id.localeCompare(b.id)
  })
}

/**
 * Calculate summary statistics for insights.
 */
function calculateSummary(insights: Insight[]): InsightsSummary {
  return {
    totalCount: insights.length,
    alertCount: insights.filter((i) => i.severity === 'alert').length,
    warningCount: insights.filter((i) => i.severity === 'warning').length,
    infoCount: insights.filter((i) => i.severity === 'info').length,
  }
}

/**
 * Generate financial insights based on input data and rule configuration.
 *
 * DETERMINISM GUARANTEES:
 * - Uses input.referenceDate for all time-based calculations
 * - Sorts arrays by ID before processing
 * - Uses Decimal.js for all financial calculations
 * - Same input always produces same output
 *
 * @param input - Financial data and optional rule overrides
 * @returns Complete insights result with metrics and summary
 * @throws InvalidInsightInputError if input validation fails
 */
export function generateInsights(input: InsightInput): InsightsResult {
  // Validate input
  assertValidInput(input)

  // Merge rule configuration
  const effectiveRuleConfig = mergeRuleConfig(input.ruleConfig)

  // Calculate base metrics
  const metrics = calculateBaseMetrics(input)

  // Collect all insights
  const allInsights: Insight[] = []

  // Evaluate each rule
  const housingInsight = evaluateHousingCostRule(
    metrics,
    effectiveRuleConfig.housingCostRule,
    input.referenceDate,
  )
  if (housingInsight) {
    allInsights.push(housingInsight)
  }

  const dtiInsight = evaluateDebtToIncomeRule(
    metrics,
    effectiveRuleConfig.debtToIncomeRule,
    input.referenceDate,
  )
  if (dtiInsight) {
    allInsights.push(dtiInsight)
  }

  const emergencyFundInsight = evaluateEmergencyFundRule(
    metrics,
    effectiveRuleConfig.emergencyFundRule,
    input.referenceDate,
  )
  if (emergencyFundInsight) {
    allInsights.push(emergencyFundInsight)
  }

  const goalInsights = evaluateGoalProgressRule(
    metrics,
    input,
    effectiveRuleConfig.goalProgressRule,
    input.referenceDate,
  )
  allInsights.push(...goalInsights)

  const interestInsights = evaluateInterestSavingsRule(
    input,
    effectiveRuleConfig.interestSavingsRule,
    input.referenceDate,
  )
  allInsights.push(...interestInsights)

  // Sort insights
  const sortedInsights = sortInsights(allInsights)

  // Calculate summary
  const summary = calculateSummary(sortedInsights)

  return {
    insights: sortedInsights,
    summary,
    metrics,
    effectiveRuleConfig,
    referenceDate: input.referenceDate,
  }
}
