import { buildTaxSummaryDisclosure } from '../disclosure'
import type { TaxSummaryResponse } from '@finance-app/shared-types'

function taxSummary(overrides: Partial<TaxSummaryResponse> = {}): TaxSummaryResponse {
  return {
    taxYear: 2025,
    filingStatus: 'single',
    estimatedGrossIncomeCents: 12_000_000,
    standardDeductionCents: 1_500_000,
    taxableIncomeCents: 10_500_000,
    estimatedTaxLiabilityCents: 1_800_000,
    effectiveTaxRatePercent: 15,
    marginalTaxRatePercent: 24,
    brackets: [],
    deductions: {
      mortgageInterestCents: 0,
      propertyTaxCents: 0,
      standardDeductionCents: 1_500_000,
    },
    ...overrides,
  }
}

describe('buildTaxSummaryDisclosure', () => {
  it('is an estimate and excludes the big real-world tax pieces', () => {
    const payload = buildTaxSummaryDisclosure(taxSummary())
    expect(payload.kind).toBe('estimate')
    expect(payload.notModeled?.some((s) => /state and local/i.test(s))).toBe(true)
    expect(payload.notModeled?.some((s) => /payroll|fica/i.test(s))).toBe(true)
    expect(payload.notModeled?.some((s) => /credit/i.test(s))).toBe(true)
  })

  it('marks the standard deduction as a system default when it is the one applied', () => {
    const payload = buildTaxSummaryDisclosure(taxSummary())
    const deduction = payload.assumptions?.find((a) => a.label === 'Deduction used')
    expect(deduction?.value).toMatch(/standard deduction/i)
    expect(deduction?.source).toBe('default')
  })

  it('marks itemized deductions as user-sourced when they beat the standard', () => {
    const payload = buildTaxSummaryDisclosure(
      taxSummary({
        standardDeductionCents: 2_000_000,
        deductions: {
          mortgageInterestCents: 1_500_000,
          propertyTaxCents: 800_000,
          standardDeductionCents: 1_500_000,
        },
      }),
    )
    const deduction = payload.assumptions?.find((a) => a.label === 'Deduction used')
    expect(deduction?.value).toMatch(/itemized/i)
    expect(deduction?.source).toBe('user')
  })
})
