import Decimal from 'decimal.js'
import { type Cents, RoundingMode } from '../money/money.types'
import { cents, subtractCents } from '../money/money'
import type { RentalMetricsInput, RentalMetrics } from './rental.types'

// Configure Decimal.js for financial calculations (matches projection engine).
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
})

const MONTHS_PER_YEAR = 12

/** Rounds a Decimal to whole cents, half-up. */
function roundCents(value: Decimal): Cents {
  return cents(value.toDecimalPlaces(0, RoundingMode.ROUND_HALF_UP).toNumber())
}

/** Rounds a Decimal ratio/percentage to two decimals, half-up. */
function roundTwo(value: Decimal): number {
  return value.toDecimalPlaces(2, RoundingMode.ROUND_HALF_UP).toNumber()
}

/**
 * Computes rental-property investment metrics (NOI, cap rate, cash-on-cash,
 * gross rent multiplier, DSCR) with Decimal.js precision.
 *
 * Pure and deterministic: no I/O, no `Date.now()`, no `Math.random`. This is
 * the single source of truth for rental math; the API service is a thin adapter
 * over it.
 */
export function computeRentalMetrics(input: RentalMetricsInput): RentalMetrics {
  const monthlyRent = new Decimal(input.monthlyRentCents)
  const annualRent = monthlyRent.times(MONTHS_PER_YEAR)
  const annualRentCents = roundCents(annualRent)

  // Effective gross income = annual rent adjusted for vacancy.
  const vacancyFraction = new Decimal(input.vacancyRatePercent).dividedBy(100)
  const effectiveGrossIncomeCents = roundCents(
    annualRent.times(new Decimal(1).minus(vacancyFraction)),
  )

  // NOI = EGI − operating expenses − property tax (integer-cents arithmetic).
  const noiCents = subtractCents(
    effectiveGrossIncomeCents,
    input.annualExpensesCents,
    input.propertyTaxAnnualCents,
  )

  // Annual debt service (0 when unmortgaged).
  const annualMortgageCents =
    input.mortgagePaymentCents !== null
      ? roundCents(new Decimal(input.mortgagePaymentCents).times(MONTHS_PER_YEAR))
      : cents(0)

  const cashFlowCents = subtractCents(noiCents, annualMortgageCents)

  const capRatePercent =
    input.currentValueCents > 0
      ? roundTwo(new Decimal(noiCents).dividedBy(input.currentValueCents).times(100))
      : 0

  const cashOnCashReturnPercent =
    input.downPaymentCents > 0
      ? roundTwo(new Decimal(cashFlowCents).dividedBy(input.downPaymentCents).times(100))
      : 0

  const grossRentMultiplier =
    annualRentCents > 0
      ? roundTwo(new Decimal(input.currentValueCents).dividedBy(annualRentCents))
      : 0

  const dscrRatio =
    annualMortgageCents > 0 ? roundTwo(new Decimal(noiCents).dividedBy(annualMortgageCents)) : null

  return {
    effectiveGrossIncomeCents,
    noiCents,
    cashFlowCents,
    capRatePercent,
    cashOnCashReturnPercent,
    grossRentMultiplier,
    dscrRatio,
  }
}
