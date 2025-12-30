import Decimal from 'decimal.js'
import { cents, addCents, multiplyCents } from '../money/money'
import type { Cents } from '../money/money.types'
import type {
  InsightInput,
  BaseMetrics,
  GoalProgressMetrics,
  HighestInterestDebt,
} from './insights.types'

/**
 * Calculate the total monthly expenses from the expenses breakdown.
 */
export function calculateTotalMonthlyExpenses(expenses: InsightInput['monthlyExpenses']): Cents {
  return addCents(
    expenses.housingCents,
    expenses.utilitiesCents,
    expenses.transportationCents,
    expenses.foodCents,
    expenses.otherCents,
  )
}

/**
 * Calculate housing cost ratio as percentage of income.
 */
export function calculateHousingCostRatio(
  housingCostsCents: Cents,
  monthlyIncomeCents: Cents,
): number {
  if (monthlyIncomeCents === 0) {
    return housingCostsCents > 0 ? 100 : 0
  }

  const ratio = new Decimal(housingCostsCents)
    .dividedBy(monthlyIncomeCents)
    .times(100)
    .toDecimalPlaces(2)
    .toNumber()

  return ratio
}

/**
 * Calculate total debt balance from all liabilities.
 */
export function calculateTotalDebt(liabilities: InsightInput['liabilities']): Cents {
  if (liabilities.length === 0) {
    return cents(0)
  }

  return liabilities.reduce((sum, liability) => addCents(sum, liability.balanceCents), cents(0))
}

/**
 * Calculate total monthly debt payments from all liabilities.
 */
export function calculateTotalMonthlyDebtPayments(liabilities: InsightInput['liabilities']): Cents {
  if (liabilities.length === 0) {
    return cents(0)
  }

  return liabilities.reduce(
    (sum, liability) => addCents(sum, liability.minimumPaymentCents),
    cents(0),
  )
}

/**
 * Calculate debt-to-income ratio as percentage.
 */
export function calculateDebtToIncomeRatio(
  monthlyDebtPaymentsCents: Cents,
  monthlyIncomeCents: Cents,
): number {
  if (monthlyIncomeCents === 0) {
    return monthlyDebtPaymentsCents > 0 ? 100 : 0
  }

  const ratio = new Decimal(monthlyDebtPaymentsCents)
    .dividedBy(monthlyIncomeCents)
    .times(100)
    .toDecimalPlaces(2)
    .toNumber()

  return ratio
}

/**
 * Calculate total cash assets (cash and cash equivalents).
 */
export function calculateTotalCashAssets(assets: InsightInput['assets']): Cents {
  const cashAssets = assets.filter((asset) => asset.type === 'cash')

  if (cashAssets.length === 0) {
    return cents(0)
  }

  return cashAssets.reduce((sum, asset) => addCents(sum, asset.valueCents), cents(0))
}

/**
 * Calculate emergency fund coverage in months.
 */
export function calculateEmergencyFundMonths(
  totalCashAssetsCents: Cents,
  monthlyExpensesCents: Cents,
): number {
  if (monthlyExpensesCents === 0) {
    // If no expenses, consider it infinite (cap at a large number)
    return totalCashAssetsCents > 0 ? 999 : 0
  }

  const months = new Decimal(totalCashAssetsCents)
    .dividedBy(monthlyExpensesCents)
    .toDecimalPlaces(2)
    .toNumber()

  return months
}

/**
 * Calculate goal progress metrics.
 */
export function calculateGoalProgress(
  goals: InsightInput['goals'],
  referenceDate: Date,
): GoalProgressMetrics[] {
  // Sort by ID for determinism
  const sortedGoals = [...goals].sort((a, b) => a.id.localeCompare(b.id))

  return sortedGoals.map((goal) => {
    // Calculate current progress percentage
    const progressPercent =
      goal.targetAmountCents === 0
        ? 100
        : new Decimal(goal.currentAmountCents)
            .dividedBy(goal.targetAmountCents)
            .times(100)
            .toDecimalPlaces(2)
            .toNumber()

    // Calculate expected progress based on CALENDAR time, not savings progress
    const targetTime = goal.targetDate.getTime()
    const currentTime = referenceDate.getTime()
    const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000

    // Calculate months remaining until target date
    const msRemaining = Math.max(0, targetTime - currentTime)
    const monthsRemaining = Math.max(0, Math.ceil(msRemaining / MS_PER_MONTH))

    // Calculate expected progress based on implied timeline
    // If we're past the target date, expected is 100%
    let expectedProgressPercent = 100

    if (monthsRemaining > 0 && goal.monthlyContributionCents > 0) {
      // Total months needed from start if contributing monthly
      const totalMonthsNeeded = Math.ceil(
        new Decimal(goal.targetAmountCents).dividedBy(goal.monthlyContributionCents).toNumber(),
      )

      // Calculate implied start date (when goal should have started)
      // impliedStartTime = targetTime - (totalMonthsNeeded * MS_PER_MONTH)
      const impliedStartTime = targetTime - totalMonthsNeeded * MS_PER_MONTH

      // Calculate calendar time elapsed from implied start to reference date
      const msElapsed = currentTime - impliedStartTime

      if (msElapsed <= 0) {
        // Reference date is before the implied start date
        // Goal hasn't "started" yet, so expected progress is 0
        expectedProgressPercent = 0
      } else {
        // Calculate expected progress based on calendar time
        const monthsElapsed = msElapsed / MS_PER_MONTH
        expectedProgressPercent = new Decimal(monthsElapsed)
          .dividedBy(totalMonthsNeeded)
          .times(100)
          .toDecimalPlaces(2)
          .toNumber()

        // Cap at 100%
        expectedProgressPercent = Math.min(100, expectedProgressPercent)
      }
    }

    // Determine if on track
    // Consider on track if actual progress >= 80% of expected
    const onTrack = progressPercent >= expectedProgressPercent * 0.8

    return {
      goalId: goal.id,
      progressPercent,
      expectedProgressPercent,
      monthsRemaining,
      onTrack,
    }
  })
}

/**
 * Find the highest interest rate debt.
 */
export function findHighestInterestDebt(
  liabilities: InsightInput['liabilities'],
): HighestInterestDebt | null {
  if (liabilities.length === 0) {
    return null
  }

  // Sort by interest rate descending, then by ID for determinism
  const sorted = [...liabilities].sort((a, b) => {
    if (b.interestRatePercent !== a.interestRatePercent) {
      return b.interestRatePercent - a.interestRatePercent
    }
    return a.id.localeCompare(b.id)
  })

  const highest = sorted[0]!

  return {
    id: highest.id,
    name: highest.name,
    rate: highest.interestRatePercent,
    balanceCents: highest.balanceCents,
  }
}

/**
 * Estimate total annual interest paid across all liabilities.
 * Uses simple interest approximation for quick estimates.
 */
export function estimateTotalAnnualInterest(liabilities: InsightInput['liabilities']): Cents {
  if (liabilities.length === 0) {
    return cents(0)
  }

  // Sum up estimated annual interest for each liability
  let totalInterest = cents(0)

  for (const liability of liabilities) {
    // Simple interest approximation: balance * rate
    const annualInterest = new Decimal(liability.balanceCents)
      .times(liability.interestRatePercent)
      .dividedBy(100)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toNumber()

    totalInterest = addCents(totalInterest, cents(annualInterest))
  }

  return totalInterest
}

/**
 * Calculate all base metrics from input.
 *
 * DETERMINISM GUARANTEES:
 * - Uses input.referenceDate for all time-based calculations
 * - Sorts arrays by ID before processing
 * - Uses Decimal.js for all calculations
 */
export function calculateBaseMetrics(input: InsightInput): BaseMetrics {
  // Income metrics
  const monthlyIncomeCents = input.monthlyIncomeCents
  const annualIncomeCents = multiplyCents(monthlyIncomeCents, 12)

  // Housing metrics
  const monthlyHousingCostsCents = input.monthlyExpenses.housingCents
  const housingCostRatioPercent = calculateHousingCostRatio(
    monthlyHousingCostsCents,
    monthlyIncomeCents,
  )

  // Debt metrics
  const totalDebtCents = calculateTotalDebt(input.liabilities)
  const monthlyDebtPaymentsCents = calculateTotalMonthlyDebtPayments(input.liabilities)
  const debtToIncomeRatioPercent = calculateDebtToIncomeRatio(
    monthlyDebtPaymentsCents,
    monthlyIncomeCents,
  )

  // Savings metrics
  const totalCashAssetsCents = calculateTotalCashAssets(input.assets)
  const monthlyExpensesCents = calculateTotalMonthlyExpenses(input.monthlyExpenses)
  const emergencyFundMonths = calculateEmergencyFundMonths(
    totalCashAssetsCents,
    monthlyExpensesCents,
  )

  // Goal metrics
  const goalProgress = calculateGoalProgress(input.goals, input.referenceDate)

  // Interest metrics
  const totalInterestPaidAnnuallyCents = estimateTotalAnnualInterest(input.liabilities)
  const highestInterestDebt = findHighestInterestDebt(input.liabilities)

  return {
    monthlyIncomeCents,
    annualIncomeCents,
    monthlyHousingCostsCents,
    housingCostRatioPercent,
    totalDebtCents,
    monthlyDebtPaymentsCents,
    debtToIncomeRatioPercent,
    totalCashAssetsCents,
    monthlyExpensesCents,
    emergencyFundMonths,
    goalProgress,
    totalInterestPaidAnnuallyCents,
    highestInterestDebt,
  }
}
