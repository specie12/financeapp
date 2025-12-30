import Decimal from 'decimal.js'
import {
  cents,
  centsToDollars,
  subtractCents,
  multiplyCents,
  divideCentsSimple,
} from '../money/money'
import type { Cents } from '../money/money.types'
import {
  generateAmortizationSchedule,
  generateAmortizationScheduleWithExtras,
} from '../amortization/amortization'
import type { ExtraPayment } from '../amortization/amortization.types'
import type {
  Insight,
  InsightInput,
  InsightSeverity,
  BaseMetrics,
  InterestSavingsScenario,
} from './insights.types'
import type { RuleConfiguration } from './insights.constants'
import { RULE_IDS } from './insights.constants'

/**
 * Generate a deterministic insight ID.
 *
 * @param prefix - Rule prefix
 * @param referenceDate - Reference date for determinism
 * @param discriminator - Additional discriminator (e.g., goal ID)
 */
function generateInsightId(prefix: string, referenceDate: Date, discriminator?: string): string {
  const dateStr = referenceDate.toISOString().slice(0, 10)
  const discriminatorPart = discriminator ? `_${discriminator}` : ''
  return `${prefix}_${dateStr}${discriminatorPart}`
}

/**
 * Format cents as dollars for display in calculations.
 */
function formatDollars(centsValue: Cents): string {
  return `$${centsToDollars(centsValue)}`
}

// ============================================
// Housing Cost Rule
// ============================================

/**
 * Evaluate the housing cost ratio rule.
 *
 * Compares housing costs as a percentage of income against thresholds.
 * Based on the industry-standard "28/36 rule".
 *
 * @returns Insight if ratio exceeds safe threshold, null otherwise
 */
export function evaluateHousingCostRule(
  metrics: BaseMetrics,
  config: RuleConfiguration['housingCostRule'],
  referenceDate: Date,
): Insight | null {
  if (!config.enabled) {
    return null
  }

  const ratio = metrics.housingCostRatioPercent

  // Determine severity based on thresholds
  let severity: InsightSeverity
  if (ratio >= config.alertThresholdPercent) {
    severity = 'alert'
  } else if (ratio >= config.warningThresholdPercent) {
    severity = 'warning'
  } else if (ratio >= config.safeThresholdPercent) {
    severity = 'info'
  } else {
    // Within safe range, no insight needed
    return null
  }

  // Calculate safe housing amount and excess
  const safeHousingCents = new Decimal(metrics.monthlyIncomeCents)
    .times(config.safeThresholdPercent)
    .dividedBy(100)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber() as Cents

  const excessCents = subtractCents(metrics.monthlyHousingCostsCents, safeHousingCents)

  // Build recommendations
  const recommendations: string[] = []
  if (excessCents > 0) {
    recommendations.push(
      `Reduce housing costs by ${formatDollars(excessCents)}/month to reach the ${config.safeThresholdPercent}% recommended ratio`,
    )
  }
  recommendations.push(
    'Consider refinancing if you have a mortgage with a higher interest rate',
    'Look for more affordable housing options',
    'Increase income to improve the housing cost ratio',
  )

  // Build title based on severity
  const titleMap: Record<InsightSeverity, string> = {
    alert: 'Housing costs are critically high',
    warning: 'Housing costs exceed recommended ratio',
    info: 'Housing costs approaching limit',
  }

  return {
    id: generateInsightId(RULE_IDS.HOUSING_COST, referenceDate),
    ruleId: RULE_IDS.HOUSING_COST,
    category: 'housing',
    severity,
    title: titleMap[severity],
    description: `Your housing costs are ${ratio.toFixed(1)}% of your monthly income. The recommended maximum is ${config.safeThresholdPercent}%.`,
    calculatedValue: ratio,
    threshold: config.safeThresholdPercent,
    unit: 'percent',
    calculation: `Housing costs (${formatDollars(metrics.monthlyHousingCostsCents)}) ÷ Monthly income (${formatDollars(metrics.monthlyIncomeCents)}) × 100 = ${ratio.toFixed(1)}%`,
    recommendations,
    potentialImpact:
      excessCents > 0
        ? {
            description: `Reducing housing costs could free up ${formatDollars(excessCents)}/month`,
            savingsCents: multiplyCents(excessCents, 12), // Annual savings
          }
        : undefined,
    dataSnapshot: {
      monthlyIncomeCents: metrics.monthlyIncomeCents,
      monthlyHousingCostsCents: metrics.monthlyHousingCostsCents,
      ratio,
    },
    priority: config.priority,
  }
}

// ============================================
// Debt-to-Income Rule
// ============================================

/**
 * Evaluate the debt-to-income ratio rule.
 *
 * Compares total debt payments as a percentage of income against thresholds.
 * Based on standard lending guidelines (36% back-end ratio).
 *
 * @returns Insight if ratio exceeds safe threshold, null otherwise
 */
export function evaluateDebtToIncomeRule(
  metrics: BaseMetrics,
  config: RuleConfiguration['debtToIncomeRule'],
  referenceDate: Date,
): Insight | null {
  if (!config.enabled) {
    return null
  }

  const ratio = metrics.debtToIncomeRatioPercent

  // Determine severity based on thresholds
  let severity: InsightSeverity
  if (ratio >= config.alertThresholdPercent) {
    severity = 'alert'
  } else if (ratio >= config.warningThresholdPercent) {
    severity = 'warning'
  } else if (ratio >= config.safeThresholdPercent) {
    severity = 'info'
  } else {
    // Within safe range, no insight needed
    return null
  }

  // Calculate safe debt payment amount and excess
  const safeDebtPaymentCents = new Decimal(metrics.monthlyIncomeCents)
    .times(config.safeThresholdPercent)
    .dividedBy(100)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber() as Cents

  const excessCents = subtractCents(metrics.monthlyDebtPaymentsCents, safeDebtPaymentCents)

  // Build recommendations
  const recommendations: string[] = []
  if (excessCents > 0) {
    recommendations.push(
      `Reduce debt payments by ${formatDollars(excessCents)}/month to reach the ${config.safeThresholdPercent}% recommended ratio`,
    )
  }

  if (metrics.highestInterestDebt) {
    recommendations.push(
      `Prioritize paying off ${metrics.highestInterestDebt.name} (${metrics.highestInterestDebt.rate.toFixed(1)}% interest rate)`,
    )
  }

  recommendations.push(
    'Consider debt consolidation to lower monthly payments',
    'Avoid taking on new debt until ratio improves',
    'Increase income to improve the debt-to-income ratio',
  )

  // Build title based on severity
  const titleMap: Record<InsightSeverity, string> = {
    alert: 'Debt-to-income ratio is critically high',
    warning: 'Debt-to-income ratio exceeds recommended limit',
    info: 'Debt-to-income ratio approaching limit',
  }

  return {
    id: generateInsightId(RULE_IDS.DEBT_TO_INCOME, referenceDate),
    ruleId: RULE_IDS.DEBT_TO_INCOME,
    category: 'debt',
    severity,
    title: titleMap[severity],
    description: `Your debt-to-income ratio is ${ratio.toFixed(1)}%. Lenders typically prefer a DTI below ${config.safeThresholdPercent}%.`,
    calculatedValue: ratio,
    threshold: config.safeThresholdPercent,
    unit: 'percent',
    calculation: `Debt payments (${formatDollars(metrics.monthlyDebtPaymentsCents)}) ÷ Monthly income (${formatDollars(metrics.monthlyIncomeCents)}) × 100 = ${ratio.toFixed(1)}%`,
    recommendations,
    potentialImpact:
      excessCents > 0
        ? {
            description: `Reducing debt payments could improve borrowing capacity and financial flexibility`,
            savingsCents: multiplyCents(excessCents, 12),
          }
        : undefined,
    dataSnapshot: {
      monthlyIncomeCents: metrics.monthlyIncomeCents,
      monthlyDebtPaymentsCents: metrics.monthlyDebtPaymentsCents,
      totalDebtCents: metrics.totalDebtCents,
      ratio,
    },
    priority: config.priority,
  }
}

// ============================================
// Emergency Fund Rule
// ============================================

/**
 * Evaluate the emergency fund status rule.
 *
 * Compares emergency fund coverage (in months) against minimum and recommended thresholds.
 * Standard recommendation: 3-6 months of expenses.
 *
 * @returns Insight if fund is below recommended, null otherwise
 */
export function evaluateEmergencyFundRule(
  metrics: BaseMetrics,
  config: RuleConfiguration['emergencyFundRule'],
  referenceDate: Date,
): Insight | null {
  if (!config.enabled) {
    return null
  }

  const months = metrics.emergencyFundMonths

  // Determine severity based on thresholds
  let severity: InsightSeverity
  if (months < config.minimumMonths) {
    severity = 'alert'
  } else if (months < config.recommendedMonths) {
    severity = 'warning'
  } else {
    // At or above recommended, no insight needed
    return null
  }

  // Calculate target amount needed
  const targetMonths = severity === 'alert' ? config.minimumMonths : config.recommendedMonths
  const targetAmountCents = multiplyCents(metrics.monthlyExpensesCents, targetMonths)
  const shortfallCents = subtractCents(targetAmountCents, metrics.totalCashAssetsCents)

  // Build recommendations
  const recommendations: string[] = []
  if (shortfallCents > 0) {
    recommendations.push(
      `Save an additional ${formatDollars(shortfallCents)} to reach ${targetMonths} months of expenses`,
    )
  }
  recommendations.push(
    'Set up automatic transfers to a dedicated emergency savings account',
    'Start with smaller goals and gradually build up',
    'Keep emergency fund in a high-yield savings account for accessibility and growth',
  )

  // Build title based on severity
  const titleMap: Record<InsightSeverity, string> = {
    alert: 'Emergency fund is critically low',
    warning: 'Emergency fund below recommended level',
    info: 'Emergency fund status',
  }

  return {
    id: generateInsightId(RULE_IDS.EMERGENCY_FUND, referenceDate),
    ruleId: RULE_IDS.EMERGENCY_FUND,
    category: 'savings',
    severity,
    title: titleMap[severity],
    description: `Your emergency fund covers ${months.toFixed(1)} months of expenses. ${severity === 'alert' ? `The minimum recommendation is ${config.minimumMonths} months.` : `The recommended amount is ${config.recommendedMonths} months.`}`,
    calculatedValue: months,
    threshold: severity === 'alert' ? config.minimumMonths : config.recommendedMonths,
    unit: 'months',
    calculation: `Cash assets (${formatDollars(metrics.totalCashAssetsCents)}) ÷ Monthly expenses (${formatDollars(metrics.monthlyExpensesCents)}) = ${months.toFixed(1)} months`,
    recommendations,
    potentialImpact:
      shortfallCents > 0
        ? {
            description: `Building emergency fund to ${targetMonths} months provides financial security`,
            savingsCents: shortfallCents,
          }
        : undefined,
    dataSnapshot: {
      totalCashAssetsCents: metrics.totalCashAssetsCents,
      monthlyExpensesCents: metrics.monthlyExpensesCents,
      months,
    },
    priority: config.priority,
  }
}

// ============================================
// Goal Progress Rule
// ============================================

/**
 * Evaluate goal progress for all goals.
 *
 * Compares actual progress against expected progress based on time elapsed.
 * Flags goals that are significantly behind schedule.
 *
 * @returns Array of insights for goals that are behind schedule
 */
export function evaluateGoalProgressRule(
  metrics: BaseMetrics,
  input: InsightInput,
  config: RuleConfiguration['goalProgressRule'],
  referenceDate: Date,
): Insight[] {
  if (!config.enabled) {
    return []
  }

  const insights: Insight[] = []

  // Sort goals by ID for determinism
  const sortedGoals = [...input.goals].sort((a, b) => a.id.localeCompare(b.id))

  for (const goal of sortedGoals) {
    const goalMetric = metrics.goalProgress.find((gp) => gp.goalId === goal.id)
    if (!goalMetric) {
      continue
    }

    // Skip if on track
    if (goalMetric.onTrack) {
      continue
    }

    // Calculate progress ratio
    const progressRatio =
      goalMetric.expectedProgressPercent === 0
        ? 1
        : goalMetric.progressPercent / goalMetric.expectedProgressPercent

    // Determine severity
    let severity: InsightSeverity
    if (progressRatio < 0.5) {
      severity = 'alert'
    } else if (progressRatio < config.behindThresholdPercent / 100) {
      severity = 'warning'
    } else {
      continue // Not behind enough to flag
    }

    // Calculate shortfall and required increase
    const expectedAmountCents = new Decimal(goal.targetAmountCents)
      .times(goalMetric.expectedProgressPercent)
      .dividedBy(100)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toNumber() as Cents

    const shortfallCents =
      expectedAmountCents > goal.currentAmountCents
        ? subtractCents(expectedAmountCents, goal.currentAmountCents)
        : cents(0)

    // Calculate additional monthly contribution needed
    const additionalMonthlyNeeded =
      goalMetric.monthsRemaining > 0 && shortfallCents > 0
        ? divideCentsSimple(shortfallCents, goalMetric.monthsRemaining)
        : cents(0)

    // Build recommendations
    const recommendations: string[] = []
    if (additionalMonthlyNeeded > 0) {
      recommendations.push(
        `Increase monthly contribution by ${formatDollars(additionalMonthlyNeeded)} to get back on track`,
      )
    }
    recommendations.push(
      'Review your budget to find additional savings',
      'Consider if your target date or amount needs adjustment',
      'Set up automatic contributions to ensure consistency',
    )

    insights.push({
      id: generateInsightId(RULE_IDS.GOAL_PROGRESS, referenceDate, goal.id),
      ruleId: RULE_IDS.GOAL_PROGRESS,
      category: 'goals',
      severity,
      title: `${goal.name} is behind schedule`,
      description: `You're at ${goalMetric.progressPercent.toFixed(1)}% of your goal, but should be at ${goalMetric.expectedProgressPercent.toFixed(1)}% by now based on your target date.`,
      calculatedValue: goalMetric.progressPercent,
      threshold: goalMetric.expectedProgressPercent,
      unit: 'percent',
      calculation: `Current amount (${formatDollars(goal.currentAmountCents)}) ÷ Target amount (${formatDollars(goal.targetAmountCents)}) × 100 = ${goalMetric.progressPercent.toFixed(1)}%`,
      recommendations,
      potentialImpact:
        shortfallCents > 0
          ? {
              description: `Catching up would require saving an additional ${formatDollars(shortfallCents)}`,
              savingsCents: shortfallCents,
            }
          : undefined,
      dataSnapshot: {
        goalId: goal.id,
        goalName: goal.name,
        targetAmountCents: goal.targetAmountCents,
        currentAmountCents: goal.currentAmountCents,
        progressPercent: goalMetric.progressPercent,
        expectedProgressPercent: goalMetric.expectedProgressPercent,
        monthsRemaining: goalMetric.monthsRemaining,
      },
      priority: config.priority,
    })
  }

  return insights
}

// ============================================
// Interest Savings Rule
// ============================================

/**
 * Analyze interest savings potential for a single liability.
 */
function analyzeInterestSavings(
  liability: InsightInput['liabilities'][0],
  extraPaymentCents: Cents,
  referenceDate: Date,
): InterestSavingsScenario | null {
  // Need remaining term to calculate amortization
  // If not provided, estimate based on balance and payment
  let remainingTermMonths = liability.remainingTermMonths

  if (!remainingTermMonths || remainingTermMonths <= 0) {
    // Estimate remaining term from payment and balance
    // Using payment = P * (r(1+r)^n) / ((1+r)^n - 1) formula, solve for n
    // Simplified: estimate as balance / payment
    if (liability.minimumPaymentCents > 0) {
      const estimatedMonths = Math.ceil(
        new Decimal(liability.balanceCents).dividedBy(liability.minimumPaymentCents).toNumber(),
      )
      remainingTermMonths = Math.min(estimatedMonths * 2, 360) // Cap at 30 years
    } else {
      return null // Cannot analyze without payment info
    }
  }

  if (remainingTermMonths <= 0 || liability.balanceCents <= 0) {
    return null
  }

  try {
    // Generate base amortization schedule
    const baseSchedule = generateAmortizationSchedule({
      principalCents: liability.balanceCents,
      annualInterestRatePercent: liability.interestRatePercent,
      termMonths: remainingTermMonths,
      startDate: referenceDate,
    })

    // Generate schedule with extra payments
    const extraPayments: ExtraPayment[] = []
    for (let i = 1; i <= remainingTermMonths; i++) {
      extraPayments.push({
        paymentNumber: i,
        amountCents: extraPaymentCents,
      })
    }

    const scheduleWithExtras = generateAmortizationScheduleWithExtras({
      principalCents: liability.balanceCents,
      annualInterestRatePercent: liability.interestRatePercent,
      termMonths: remainingTermMonths,
      startDate: referenceDate,
      extraPayments,
    })

    // Calculate savings
    const interestSavedCents = subtractCents(
      baseSchedule.totalInterestCents,
      scheduleWithExtras.totalInterestCents,
    )
    const monthsSaved = baseSchedule.actualPayoffMonth - scheduleWithExtras.actualPayoffMonth

    return {
      liabilityId: liability.id,
      liabilityName: liability.name,
      extraPaymentCents,
      interestSavedCents,
      monthsSaved,
      originalTotalInterestCents: baseSchedule.totalInterestCents,
      newTotalInterestCents: scheduleWithExtras.totalInterestCents,
    }
  } catch {
    // If amortization calculation fails, skip this liability
    return null
  }
}

/**
 * Evaluate interest savings potential rule.
 *
 * Analyzes potential savings from making extra payments on amortizing loans.
 * Uses the amortization engine for accurate calculations.
 *
 * @returns Array of insights for significant savings opportunities
 */
export function evaluateInterestSavingsRule(
  input: InsightInput,
  config: RuleConfiguration['interestSavingsRule'],
  referenceDate: Date,
): Insight[] {
  if (!config.enabled) {
    return []
  }

  const insights: Insight[] = []

  // Filter to amortizing loans (mortgage, auto, student)
  const amortizingLoans = input.liabilities.filter(
    (l) => l.type === 'mortgage' || l.type === 'auto' || l.type === 'student',
  )

  // Sort by ID for determinism
  const sortedLoans = [...amortizingLoans].sort((a, b) => a.id.localeCompare(b.id))

  for (const liability of sortedLoans) {
    // Sort extra payment scenarios for determinism
    const sortedScenarios = [...config.extraPaymentScenariosCents].sort((a, b) => a - b)

    for (const extraPaymentCents of sortedScenarios) {
      const savings = analyzeInterestSavings(liability, extraPaymentCents, referenceDate)

      if (!savings || savings.interestSavedCents < config.minimumSavingsCents) {
        continue
      }

      insights.push({
        id: generateInsightId(
          RULE_IDS.INTEREST_SAVINGS,
          referenceDate,
          `${liability.id}_${extraPaymentCents}`,
        ),
        ruleId: RULE_IDS.INTEREST_SAVINGS,
        category: 'interest',
        severity: 'info',
        title: `Save ${formatDollars(savings.interestSavedCents)} on ${liability.name}`,
        description: `Adding ${formatDollars(extraPaymentCents)}/month extra to your ${liability.name} payment could save ${formatDollars(savings.interestSavedCents)} in interest and pay off ${savings.monthsSaved} month${savings.monthsSaved === 1 ? '' : 's'} early.`,
        calculatedValue: savings.interestSavedCents,
        threshold: config.minimumSavingsCents,
        unit: 'cents',
        calculation: `Original total interest (${formatDollars(savings.originalTotalInterestCents)}) - New total interest (${formatDollars(savings.newTotalInterestCents)}) = ${formatDollars(savings.interestSavedCents)} saved`,
        recommendations: [
          `Add ${formatDollars(extraPaymentCents)}/month to your ${liability.name} payment`,
          `Pay off ${savings.monthsSaved} month${savings.monthsSaved === 1 ? '' : 's'} earlier`,
          'Consider setting up automatic extra payments',
          'Verify there are no prepayment penalties',
        ],
        potentialImpact: {
          description: `Save ${formatDollars(savings.interestSavedCents)} over the loan lifetime`,
          savingsCents: savings.interestSavedCents,
          timeframeDays: savings.monthsSaved * 30,
        },
        dataSnapshot: {
          liabilityId: liability.id,
          liabilityName: liability.name,
          currentBalance: liability.balanceCents,
          interestRate: liability.interestRatePercent,
          extraPaymentAmount: extraPaymentCents,
          interestSaved: savings.interestSavedCents,
          monthsSaved: savings.monthsSaved,
        },
        priority: config.priority,
      })
    }
  }

  return insights
}
