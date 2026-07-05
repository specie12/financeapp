/**
 * P1.1 — Golden financial test fixtures.
 *
 * Loads JSON fixtures from `__tests__/goldens/` and asserts byte-exact
 * equality between engine output and the locked reference values. Fixtures
 * are documented in `goldens/README.md`. Every fixture has at least one
 * hand-verifiable invariant (e.g. `total = principal + interest`) so the
 * spec catches not just drift but loss of meaning.
 */

import {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  calculateTaxLiability,
  calculateRentVsBuy,
  calculateMortgageVsInvest,
  computeRentalMetrics,
  cents,
} from '../index'

import pmtGoldens from './goldens/pmt.golden.json'
import amortizationGoldens from './goldens/amortization.golden.json'
import taxGoldens from './goldens/tax.golden.json'
import rentVsBuyGoldens from './goldens/rent-vs-buy.golden.json'
import mortgageVsInvestGoldens from './goldens/mortgage-vs-invest.golden.json'
import rentalGoldens from './goldens/rental.golden.json'

// ─────────────────────────────────────────────────────────────────────────────
// PMT
// ─────────────────────────────────────────────────────────────────────────────

describe('Goldens — PMT', () => {
  it.each(pmtGoldens.cases)('$label', ({ input, expected }) => {
    const actual = calculateMonthlyPayment(
      cents(input.principalCents),
      input.annualRatePercent,
      input.termMonths,
    )
    expect(actual).toBe(expected.monthlyPaymentCents)
    expect(Number.isInteger(actual)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Amortization (full schedule totals)
// ─────────────────────────────────────────────────────────────────────────────

describe('Goldens — Amortization', () => {
  it.each(amortizationGoldens.cases)('$label', ({ input, expected }) => {
    const schedule = generateAmortizationSchedule({
      principalCents: cents(input.principalCents),
      annualInterestRatePercent: input.annualInterestRatePercent,
      termMonths: input.termMonths,
      startDate: new Date(input.startDate),
    })

    expect(schedule.monthlyPaymentCents).toBe(expected.monthlyPaymentCents)
    expect(schedule.totalPaymentsCents).toBe(expected.totalPaymentsCents)
    expect(schedule.totalInterestCents).toBe(expected.totalInterestCents)
    expect(schedule.actualPayoffMonth).toBe(expected.actualPayoffMonth)

    // Hand-verifiable invariant: total interest paid equals total payments
    // minus the original principal (rounding-stable because both come from
    // the same schedule).
    expect(schedule.totalInterestCents).toBe(schedule.totalPaymentsCents - input.principalCents)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tax
// ─────────────────────────────────────────────────────────────────────────────

describe('Goldens — Tax', () => {
  it.each(taxGoldens.cases)('$label', ({ input, expected }) => {
    const result = calculateTaxLiability({
      taxYear: input.taxYear,
      filingStatus: input.filingStatus as 'single' | 'married_filing_jointly' | 'head_of_household',
      grossIncomeCents: input.grossIncomeCents,
    })

    expect(result.standardDeductionCents).toBe(expected.standardDeductionCents)
    expect(result.taxableIncomeCents).toBe(expected.taxableIncomeCents)
    expect(result.estimatedTaxLiabilityCents).toBe(expected.estimatedTaxLiabilityCents)
    expect(result.effectiveTaxRatePercent).toBe(expected.effectiveTaxRatePercent)
    expect(result.marginalTaxRatePercent).toBe(expected.marginalTaxRatePercent)

    // Hand-verifiable invariant: when standard deduction beats itemized,
    // taxable income is gross minus the standard deduction (clamped at 0).
    expect(result.taxableIncomeCents).toBe(
      Math.max(0, input.grossIncomeCents - expected.standardDeductionCents),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Rent vs Buy
// ─────────────────────────────────────────────────────────────────────────────

describe('Goldens — Rent vs Buy', () => {
  it.each(rentVsBuyGoldens.cases)('$label', ({ input, expected }) => {
    const result = calculateRentVsBuy({
      startDate: new Date(input.startDate),
      projectionYears: input.projectionYears,
      buy: {
        homePriceCents: cents(input.buy.homePriceCents),
        downPaymentPercent: input.buy.downPaymentPercent,
        mortgageInterestRatePercent: input.buy.mortgageInterestRatePercent,
        mortgageTermYears: input.buy.mortgageTermYears,
        closingCostPercent: input.buy.closingCostPercent,
        homeownersInsuranceAnnualCents: cents(input.buy.homeownersInsuranceAnnualCents),
        hoaMonthlyDuesCents: cents(input.buy.hoaMonthlyDuesCents),
      },
      rent: {
        monthlyRentCents: cents(input.rent.monthlyRentCents),
        securityDepositMonths: input.rent.securityDepositMonths,
        rentersInsuranceAnnualCents: cents(input.rent.rentersInsuranceAnnualCents),
      },
    })

    expect(result.summary).toEqual(expected.summary)

    // Hand-verifiable: net worth advantage = buy net worth − rent net worth
    expect(result.summary.netWorthAdvantageCents).toBe(
      result.summary.finalBuyNetWorthCents - result.summary.finalRentNetWorthCents,
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Mortgage vs Invest
// ─────────────────────────────────────────────────────────────────────────────

describe('Goldens — Mortgage vs Invest', () => {
  it.each(mortgageVsInvestGoldens.cases)('$label', ({ input, expected }) => {
    const result = calculateMortgageVsInvest(input)

    expect(result.payExtraSummary).toEqual(expected.payExtraSummary)
    expect(result.investSummary).toEqual(expected.investSummary)
    expect(result.recommendation).toBe(expected.recommendation)
    expect(result.breakEvenReturnPercent).toBe(expected.breakEvenReturnPercent)

    // Hand-verifiable: total contributed = monthly contribution × horizon months
    expect(result.investSummary.totalContributedCents).toBe(
      input.extraMonthlyPaymentCents * input.horizonYears * 12,
    )

    // Hand-verifiable: months saved = original − new payoff months
    expect(result.payExtraSummary.monthsSaved).toBe(
      result.payExtraSummary.originalPayoffMonths - result.payExtraSummary.newPayoffMonths,
    )

    // Hand-verifiable: interest saved = without − with
    expect(result.payExtraSummary.interestSavedCents).toBe(
      result.payExtraSummary.totalInterestWithoutExtraCents -
        result.payExtraSummary.totalInterestWithExtraCents,
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Rental Property Metrics
// ─────────────────────────────────────────────────────────────────────────────

describe('Goldens — Rental Metrics', () => {
  it.each(rentalGoldens.cases)('$label', ({ input, expected }) => {
    const result = computeRentalMetrics({
      currentValueCents: cents(input.currentValueCents),
      downPaymentCents: cents(input.downPaymentCents),
      monthlyRentCents: cents(input.monthlyRentCents),
      vacancyRatePercent: input.vacancyRatePercent,
      annualExpensesCents: cents(input.annualExpensesCents),
      propertyTaxAnnualCents: cents(input.propertyTaxAnnualCents),
      mortgagePaymentCents:
        input.mortgagePaymentCents === null ? null : cents(input.mortgagePaymentCents),
    })

    expect(result.effectiveGrossIncomeCents).toBe(expected.effectiveGrossIncomeCents)
    expect(result.noiCents).toBe(expected.noiCents)
    expect(result.cashFlowCents).toBe(expected.cashFlowCents)
    expect(result.capRatePercent).toBe(expected.capRatePercent)
    expect(result.cashOnCashReturnPercent).toBe(expected.cashOnCashReturnPercent)
    expect(result.grossRentMultiplier).toBe(expected.grossRentMultiplier)
    expect(result.dscrRatio).toBe(expected.dscrRatio)

    // Hand-verifiable invariant: NOI = EGI − operating expenses − property tax.
    expect(result.noiCents).toBe(
      result.effectiveGrossIncomeCents - input.annualExpensesCents - input.propertyTaxAnnualCents,
    )
  })
})
