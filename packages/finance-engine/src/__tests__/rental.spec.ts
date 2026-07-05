import { computeRentalMetrics } from '../rental/rental'
import type { RentalMetricsInput } from '../rental/rental.types'
import { cents } from '../money/money'

/**
 * A mortgaged property with a small negative levered cash flow. Every value is
 * hand-computable so these tests double as documentation of the formulas.
 *
 *   annualRent  = 3,000/mo × 12          = 36,000
 *   EGI         = 36,000 × (1 − 0.05)    = 34,200
 *   NOI         = 34,200 − 6,000 − 6,000 = 22,200
 *   debtService = 2,000/mo × 12          = 24,000
 *   cashFlow    = 22,200 − 24,000        = −1,800
 *   capRate     = 22,200 / 500,000       = 4.44%
 *   cashOnCash  = −1,800 / 100,000       = −1.8%
 *   GRM         = 500,000 / 36,000       = 13.89
 *   DSCR        = 22,200 / 24,000        = 0.93 (0.925 → half-up)
 */
const mortgaged: RentalMetricsInput = {
  currentValueCents: cents(50_000_000),
  downPaymentCents: cents(10_000_000),
  monthlyRentCents: cents(300_000),
  vacancyRatePercent: 5,
  annualExpensesCents: cents(600_000),
  propertyTaxAnnualCents: cents(600_000),
  mortgagePaymentCents: cents(200_000),
}

describe('computeRentalMetrics', () => {
  it('computes all metrics for a mortgaged property', () => {
    const m = computeRentalMetrics(mortgaged)
    expect(m.effectiveGrossIncomeCents).toBe(3_420_000)
    expect(m.noiCents).toBe(2_220_000)
    expect(m.cashFlowCents).toBe(-180_000)
    expect(m.capRatePercent).toBe(4.44)
    expect(m.cashOnCashReturnPercent).toBe(-1.8)
    expect(m.grossRentMultiplier).toBe(13.89)
    expect(m.dscrRatio).toBe(0.93)
  })

  it('returns null DSCR and unlevered cash flow when unmortgaged', () => {
    const m = computeRentalMetrics({ ...mortgaged, mortgagePaymentCents: null })
    expect(m.dscrRatio).toBeNull()
    // No debt service, so cash flow equals NOI.
    expect(m.cashFlowCents).toBe(m.noiCents)
    expect(m.cashOnCashReturnPercent).toBe(22.2) // 2,220,000 / 10,000,000
  })

  it('guards divide-by-zero: zero value, down payment, and rent', () => {
    const m = computeRentalMetrics({
      ...mortgaged,
      currentValueCents: cents(0),
      downPaymentCents: cents(0),
      monthlyRentCents: cents(0),
      mortgagePaymentCents: null,
    })
    expect(m.capRatePercent).toBe(0)
    expect(m.cashOnCashReturnPercent).toBe(0)
    expect(m.grossRentMultiplier).toBe(0)
  })

  it('produces integer-cents outputs (no floating cents)', () => {
    const m = computeRentalMetrics(mortgaged)
    expect(Number.isInteger(m.effectiveGrossIncomeCents)).toBe(true)
    expect(Number.isInteger(m.noiCents)).toBe(true)
    expect(Number.isInteger(m.cashFlowCents)).toBe(true)
  })

  it('is deterministic across repeated calls', () => {
    const first = computeRentalMetrics(mortgaged)
    for (let i = 0; i < 10; i++) {
      expect(computeRentalMetrics(mortgaged)).toEqual(first)
    }
  })
})
