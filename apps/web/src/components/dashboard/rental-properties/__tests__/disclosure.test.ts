import { buildRentalDisclosure } from '../disclosure'
import type { RentalPortfolioSummary, RentalPropertyMetrics } from '@finance-app/shared-types'

function metrics(appreciationRatePercent: number | null): RentalPropertyMetrics {
  return {
    property: {
      id: 'r1',
      householdId: 'h1',
      name: 'Maple St',
      address: null,
      purchasePriceCents: 40_000_000,
      currentValueCents: 50_000_000,
      downPaymentCents: 10_000_000,
      monthlyRentCents: 300_000,
      vacancyRatePercent: 5,
      annualExpensesCents: 600_000,
      propertyTaxAnnualCents: 600_000,
      mortgagePaymentCents: 200_000,
      mortgageRatePercent: 6,
      appreciationRatePercent,
      linkedAssetId: null,
      linkedLiabilityId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    noiCents: 2_220_000,
    capRatePercent: 4.44,
    cashOnCashReturnPercent: -1.8,
    grossRentMultiplier: 13.89,
    dscrRatio: 0.93,
  }
}

function summary(properties: RentalPropertyMetrics[]): RentalPortfolioSummary {
  return {
    totalProperties: properties.length,
    totalValueCents: 50_000_000,
    totalEquityCents: 10_000_000,
    totalMonthlyRentCents: 300_000,
    totalNOICents: 2_220_000,
    averageCapRatePercent: 4.44,
    averageCashOnCashPercent: -1.8,
    properties,
  }
}

describe('buildRentalDisclosure', () => {
  it('is an estimate and never fabricates — lists real-world exclusions', () => {
    const payload = buildRentalDisclosure(summary([metrics(4)]))
    expect(payload.kind).toBe('estimate')
    expect(payload.notModeled?.some((s) => /depreciation|tax/i.test(s))).toBe(true)
    expect(payload.notModeled?.some((s) => /rent growth/i.test(s))).toBe(true)
  })

  it('flags the default appreciation assumption when a property has none set', () => {
    const payload = buildRentalDisclosure(summary([metrics(null)]))
    const appreciation = payload.assumptions?.find((a) => a.label === 'Appreciation')
    expect(appreciation?.source).toBe('default')
    expect(appreciation?.value).toMatch(/default/i)
  })

  it('marks appreciation as user-sourced when every property sets it', () => {
    const payload = buildRentalDisclosure(summary([metrics(4), metrics(3.5)]))
    const appreciation = payload.assumptions?.find((a) => a.label === 'Appreciation')
    expect(appreciation?.source).toBe('user')
  })
})
