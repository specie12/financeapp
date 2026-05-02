/**
 * P0.2 — `mortgage-vs-invest` rewrite with Decimal.js.
 *
 * Locks the public API shape, enforces determinism, exercises edge cases,
 * and ties the simulator to the canonical amortization engine so the two
 * cannot drift.
 *
 * Per the audit's no-fabrication rule, headline expectations are either:
 *   - hand-verifiable (zero-rate cases, sign/bounds checks), OR
 *   - tied to another already-locked engine output (canonical amortization).
 * Numerical golden fixtures for headline 30/15-yr cases live in P1.1
 * (`goldens.spec.ts`) so they can be cross-referenced against published
 * sources.
 */

import { calculateMortgageVsInvest } from '../mortgage-vs-invest/mortgage-vs-invest'
import { generateAmortizationSchedule } from '../amortization/amortization'
import { cents } from '../money/money'
import type { MortgageVsInvestInput } from '../mortgage-vs-invest/mortgage-vs-invest.types'

const baseInput: MortgageVsInvestInput = {
  currentBalanceCents: 30_000_000, // $300,000
  mortgageRatePercent: 6.5,
  remainingTermMonths: 360,
  extraMonthlyPaymentCents: 20_000, // $200/mo extra
  expectedReturnPercent: 7,
  capitalGainsTaxPercent: 15,
  horizonYears: 30,
  mortgageInterestDeductible: false,
  marginalTaxRatePercent: 24,
}

describe('calculateMortgageVsInvest — public API and determinism', () => {
  it('preserves the documented public result shape', () => {
    const result = calculateMortgageVsInvest(baseInput)

    expect(result).toHaveProperty('input')
    expect(result).toHaveProperty('yearlyComparisons')
    expect(result).toHaveProperty('payExtraSummary')
    expect(result).toHaveProperty('investSummary')
    expect(result).toHaveProperty('recommendation')
    expect(result).toHaveProperty('breakEvenReturnPercent')

    expect(result.yearlyComparisons).toHaveLength(baseInput.horizonYears)

    const yc = result.yearlyComparisons[0]!
    expect(yc).toMatchObject({
      year: 1,
      payExtraCumulativePaidCents: expect.any(Number),
      payExtraInterestSavedCents: expect.any(Number),
      payExtraRemainingBalanceCents: expect.any(Number),
      investPortfolioValueCents: expect.any(Number),
      investCumulativeContributedCents: expect.any(Number),
      investAdvantageNetCents: expect.any(Number),
    })

    expect(['pay_extra', 'invest', 'neutral']).toContain(result.recommendation)
  })

  it('is deterministic — 10 runs of the same input produce identical results', () => {
    const runs = Array.from({ length: 10 }, () => calculateMortgageVsInvest(baseInput))
    const first = runs[0]
    for (let i = 1; i < runs.length; i++) {
      expect(runs[i]).toEqual(first)
    }
  })

  it('returns integer cents for every monetary field', () => {
    const result = calculateMortgageVsInvest(baseInput)

    const integerFields: number[] = [
      result.payExtraSummary.totalInterestWithoutExtraCents,
      result.payExtraSummary.totalInterestWithExtraCents,
      result.payExtraSummary.interestSavedCents,
      result.investSummary.totalContributedCents,
      result.investSummary.finalPortfolioValueCents,
      result.investSummary.totalGainCents,
      result.investSummary.afterTaxGainCents,
      result.investSummary.afterTaxPortfolioValueCents,
    ]
    for (const value of integerFields) {
      expect(Number.isInteger(value)).toBe(true)
    }

    for (const yc of result.yearlyComparisons) {
      expect(Number.isInteger(yc.payExtraCumulativePaidCents)).toBe(true)
      expect(Number.isInteger(yc.payExtraInterestSavedCents)).toBe(true)
      expect(Number.isInteger(yc.payExtraRemainingBalanceCents)).toBe(true)
      expect(Number.isInteger(yc.investPortfolioValueCents)).toBe(true)
      expect(Number.isInteger(yc.investCumulativeContributedCents)).toBe(true)
      expect(Number.isInteger(yc.investAdvantageNetCents)).toBe(true)
    }
  })
})

describe('zero-rate edge cases', () => {
  it('produces zero total interest for a 0% mortgage rate', () => {
    const result = calculateMortgageVsInvest({
      ...baseInput,
      mortgageRatePercent: 0,
      extraMonthlyPaymentCents: 0,
    })
    expect(result.payExtraSummary.totalInterestWithoutExtraCents).toBe(0)
    expect(result.payExtraSummary.totalInterestWithExtraCents).toBe(0)
    expect(result.payExtraSummary.interestSavedCents).toBe(0)
  })

  it('produces zero portfolio gain for 0% return rate', () => {
    const result = calculateMortgageVsInvest({
      ...baseInput,
      expectedReturnPercent: 0,
      extraMonthlyPaymentCents: 50_000, // $500/mo
    })
    expect(result.investSummary.totalGainCents).toBe(0)
    expect(result.investSummary.afterTaxGainCents).toBe(0)
    // Final portfolio value with 0% return = total contributed
    expect(result.investSummary.finalPortfolioValueCents).toBe(
      result.investSummary.totalContributedCents,
    )
  })

  it('zero extra payment makes pay-extra path identical to baseline', () => {
    const result = calculateMortgageVsInvest({
      ...baseInput,
      extraMonthlyPaymentCents: 0,
    })
    expect(result.payExtraSummary.totalInterestWithExtraCents).toBe(
      result.payExtraSummary.totalInterestWithoutExtraCents,
    )
    expect(result.payExtraSummary.interestSavedCents).toBe(0)
    expect(result.payExtraSummary.monthsSaved).toBe(0)
    expect(result.payExtraSummary.newPayoffMonths).toBe(result.payExtraSummary.originalPayoffMonths)
  })
})

describe('equivalence with canonical amortization engine', () => {
  // The baseline (extra = 0) simulator MUST agree with the canonical
  // amortization engine on total interest paid for the original term.
  // If they diverge, one of the two engines has drifted — the goldens
  // (P1.1) will catch the deviation, but locking equivalence here makes
  // the failure mode obvious.

  const equivalenceCases: Array<{
    label: string
    principalCents: number
    annualRatePercent: number
    termMonths: number
  }> = [
    {
      label: '30-yr $300k @ 6.5%',
      principalCents: 30_000_000,
      annualRatePercent: 6.5,
      termMonths: 360,
    },
    {
      label: '15-yr $150k @ 5.0%',
      principalCents: 15_000_000,
      annualRatePercent: 5.0,
      termMonths: 180,
    },
    { label: '5-yr $25k @ 7.0%', principalCents: 2_500_000, annualRatePercent: 7, termMonths: 60 },
  ]

  it.each(equivalenceCases)(
    'baseline interest matches generateAmortizationSchedule for $label',
    ({ principalCents, annualRatePercent, termMonths }) => {
      const horizonYears = Math.ceil(termMonths / 12)
      const mvi = calculateMortgageVsInvest({
        currentBalanceCents: principalCents,
        mortgageRatePercent: annualRatePercent,
        remainingTermMonths: termMonths,
        extraMonthlyPaymentCents: 0,
        expectedReturnPercent: 0,
        capitalGainsTaxPercent: 0,
        horizonYears,
        mortgageInterestDeductible: false,
        marginalTaxRatePercent: 0,
      })

      const canonical = generateAmortizationSchedule({
        principalCents: cents(principalCents),
        annualInterestRatePercent: annualRatePercent,
        termMonths,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
      })

      // Allow 1-cent slack: the simulator uses balance-based monthly accrual
      // identical to the canonical engine, but the canonical engine's last
      // payment is "balloon to zero" while the simulator's last payment can
      // overshoot by the same payment amount and clamp. In practice these
      // produce the same total at scale; we accept |Δ| <= 1 cent.
      expect(
        Math.abs(mvi.payExtraSummary.totalInterestWithoutExtraCents - canonical.totalInterestCents),
      ).toBeLessThanOrEqual(1)
    },
  )
})

describe('pay-extra reduces interest and shortens the loan', () => {
  it('positive extra payment produces positive interest savings and months saved', () => {
    const result = calculateMortgageVsInvest(baseInput)
    expect(result.payExtraSummary.interestSavedCents).toBeGreaterThan(0)
    expect(result.payExtraSummary.monthsSaved).toBeGreaterThan(0)
    expect(result.payExtraSummary.newPayoffMonths).toBeLessThan(
      result.payExtraSummary.originalPayoffMonths,
    )
  })

  it('larger extra payment saves at least as much interest', () => {
    const small = calculateMortgageVsInvest({ ...baseInput, extraMonthlyPaymentCents: 10_000 })
    const large = calculateMortgageVsInvest({ ...baseInput, extraMonthlyPaymentCents: 50_000 })
    expect(large.payExtraSummary.interestSavedCents).toBeGreaterThanOrEqual(
      small.payExtraSummary.interestSavedCents,
    )
    expect(large.payExtraSummary.monthsSaved).toBeGreaterThanOrEqual(
      small.payExtraSummary.monthsSaved,
    )
  })
})

describe('tax-deductible mortgage interest', () => {
  it('reduces effective interest savings by the marginal rate', () => {
    const withDeduction = calculateMortgageVsInvest({
      ...baseInput,
      mortgageInterestDeductible: true,
      marginalTaxRatePercent: 30,
    })
    const withoutDeduction = calculateMortgageVsInvest({
      ...baseInput,
      mortgageInterestDeductible: false,
      marginalTaxRatePercent: 30,
    })

    // Year-by-year: deductible-true value MUST be <= deductible-false (we
    // subtract the lost-deduction value from the gross interest savings).
    for (let i = 0; i < withDeduction.yearlyComparisons.length; i++) {
      const a = withDeduction.yearlyComparisons[i]!.payExtraInterestSavedCents
      const b = withoutDeduction.yearlyComparisons[i]!.payExtraInterestSavedCents
      expect(a).toBeLessThanOrEqual(b)
    }
  })

  it('marginalTaxRatePercent=0 is a no-op even when deductible=true', () => {
    const withRate0Deductible = calculateMortgageVsInvest({
      ...baseInput,
      mortgageInterestDeductible: true,
      marginalTaxRatePercent: 0,
    })
    const withoutDeduction = calculateMortgageVsInvest({
      ...baseInput,
      mortgageInterestDeductible: false,
      marginalTaxRatePercent: 0,
    })

    for (let i = 0; i < withRate0Deductible.yearlyComparisons.length; i++) {
      expect(withRate0Deductible.yearlyComparisons[i]!.payExtraInterestSavedCents).toBe(
        withoutDeduction.yearlyComparisons[i]!.payExtraInterestSavedCents,
      )
    }
  })
})

describe('recommendation threshold', () => {
  it("recommends 'invest' when expected return is high enough", () => {
    const r = calculateMortgageVsInvest({
      ...baseInput,
      mortgageRatePercent: 3,
      expectedReturnPercent: 12,
    })
    expect(r.recommendation).toBe('invest')
  })

  it("recommends 'pay_extra' when mortgage rate exceeds expected return", () => {
    const r = calculateMortgageVsInvest({
      ...baseInput,
      mortgageRatePercent: 12,
      expectedReturnPercent: 3,
    })
    expect(r.recommendation).toBe('pay_extra')
  })
})

describe('breakEvenReturnPercent', () => {
  it('returns a finite value within [0, 30]', () => {
    const result = calculateMortgageVsInvest(baseInput)
    expect(Number.isFinite(result.breakEvenReturnPercent)).toBe(true)
    expect(result.breakEvenReturnPercent).toBeGreaterThanOrEqual(0)
    expect(result.breakEvenReturnPercent).toBeLessThanOrEqual(30)
  })

  it('is quantized to two decimal places (stable serialization)', () => {
    const result = calculateMortgageVsInvest(baseInput)
    const scaled = result.breakEvenReturnPercent * 100
    expect(Math.abs(scaled - Math.round(scaled))).toBeLessThan(1e-9)
  })
})
