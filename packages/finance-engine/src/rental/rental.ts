import Decimal from 'decimal.js'
import { type Cents, RoundingMode } from '../money/money.types'
import { cents, subtractCents } from '../money/money'
import type {
  RentalMetricsInput,
  RentalMetrics,
  RentalDealInput,
  RentalDealAssessment,
  RentalDealFactor,
} from './rental.types'

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

function formatDollars(centsValue: number): string {
  const sign = centsValue < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(centsValue / 100)).toLocaleString('en-US')}`
}

/**
 * Rules-based assessment of a candidate rental deal. Deliberately transparent:
 * it returns the individual factors it weighed, and an overall signal derived
 * from them — never a black-box "buy." Thresholds are conventional rules of
 * thumb, not guarantees, and are surfaced to the user via the disclosure layer.
 */
export function assessRentalDeal(input: RentalDealInput): RentalDealAssessment {
  const factors: RentalDealFactor[] = []

  // Cash flow: is the property self-supporting after debt service?
  factors.push({
    label: 'Monthly cash flow',
    status: input.cashFlowCents >= 0 ? 'positive' : 'negative',
    detail:
      input.cashFlowCents >= 0
        ? `Positive — about ${formatDollars(input.cashFlowCents / 12)}/mo after the mortgage.`
        : `Negative — about ${formatDollars(input.cashFlowCents / 12)}/mo out of pocket after the mortgage.`,
  })

  // DSCR: only meaningful when there is a mortgage.
  if (input.dscrRatio !== null) {
    const dscr = input.dscrRatio
    factors.push({
      label: 'Debt-service coverage',
      status: dscr >= 1.25 ? 'positive' : dscr >= 1.0 ? 'neutral' : 'negative',
      detail:
        dscr >= 1.25
          ? `Strong — income covers the mortgage ${dscr.toFixed(2)}×.`
          : dscr >= 1.0
            ? `Tight — income covers the mortgage ${dscr.toFixed(2)}×.`
            : `Short — income covers only ${dscr.toFixed(2)}× of the mortgage.`,
    })
  }

  // Cap rate: a rough yield gauge (market-dependent).
  factors.push({
    label: 'Cap rate',
    status:
      input.capRatePercent >= 5 ? 'positive' : input.capRatePercent >= 3 ? 'neutral' : 'negative',
    detail: `${input.capRatePercent.toFixed(2)}% — unleveraged yield on today's value.`,
  })

  // Long-run effect on net worth (from the projection).
  factors.push({
    label: 'Long-term net worth',
    status: input.netWorthDeltaCents >= 0 ? 'positive' : 'negative',
    detail:
      input.netWorthDeltaCents >= 0
        ? `Higher by about ${formatDollars(input.netWorthDeltaCents)} at the horizon vs not buying.`
        : `Lower by about ${formatDollars(input.netWorthDeltaCents)} at the horizon vs not buying.`,
  })

  const hardFail = input.dscrRatio !== null && input.dscrRatio < 1.0
  const negatives = factors.filter((f) => f.status === 'negative').length

  let signal: RentalDealAssessment['signal']
  if (hardFail || negatives >= 2) {
    signal = 'unfavorable'
  } else if (negatives === 0) {
    signal = 'favorable'
  } else {
    signal = 'caution'
  }

  return { signal, factors }
}
