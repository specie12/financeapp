import type { RentalProperty } from '@prisma/client'
import {
  buildRentalProjectionContributions,
  DEFAULT_APPRECIATION_RATE_PERCENT,
} from '../rental-projection.util'

/**
 * Builds a RentalProperty fixture. Decimal columns are supplied as plain
 * numbers (the util coerces via `Number(...)`), so we cast through unknown.
 */
function makeRental(overrides: Partial<RentalProperty> = {}): RentalProperty {
  return {
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
    appreciationRatePercent: null,
    linkedAssetId: null,
    linkedLiabilityId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as unknown as RentalProperty
}

const START = new Date('2026-01-01T00:00:00.000Z')

describe('buildRentalProjectionContributions', () => {
  it('synthesizes asset, liability, and NOI cash flow for an unlinked mortgaged rental', () => {
    const out = buildRentalProjectionContributions([makeRental()], new Set(), new Set(), START)

    expect(out.assets).toHaveLength(1)
    expect(out.assets[0]).toMatchObject({
      id: 'rental-asset:r1',
      currentValueCents: 50_000_000,
      annualGrowthRatePercent: DEFAULT_APPRECIATION_RATE_PERCENT,
    })

    expect(out.liabilities).toHaveLength(1)
    expect(out.liabilities[0]).toMatchObject({
      id: 'rental-liability:r1',
      // value − down payment proxy
      currentBalanceCents: 40_000_000,
      interestRatePercent: 6,
      termMonths: 360,
    })

    expect(out.cashFlowItems).toHaveLength(1)
    expect(out.cashFlowItems[0]).toMatchObject({
      id: 'rental-noi:r1',
      type: 'income',
      amountCents: 2_220_000, // NOI from computeRentalMetrics
      frequency: 'annually',
    })
  })

  it('respects an explicit appreciation rate', () => {
    const out = buildRentalProjectionContributions(
      [
        makeRental({
          appreciationRatePercent: 4.5 as unknown as RentalProperty['appreciationRatePercent'],
        }),
      ],
      new Set(),
      new Set(),
      START,
    )
    expect(out.assets[0]?.annualGrowthRatePercent).toBe(4.5)
  })

  it('does NOT synthesize an asset when linked to a tracked asset (no double count)', () => {
    const out = buildRentalProjectionContributions(
      [makeRental({ linkedAssetId: 'asset-1' })],
      new Set(['asset-1']),
      new Set(),
      START,
    )
    expect(out.assets).toHaveLength(0)
    // Mortgage still synthesized (not linked), NOI still added.
    expect(out.liabilities).toHaveLength(1)
    expect(out.cashFlowItems).toHaveLength(1)
  })

  it('does NOT synthesize a liability when linked to a tracked liability (no double count)', () => {
    const out = buildRentalProjectionContributions(
      [makeRental({ linkedLiabilityId: 'liab-1' })],
      new Set(),
      new Set(['liab-1']),
      START,
    )
    expect(out.liabilities).toHaveLength(0)
    expect(out.assets).toHaveLength(1)
  })

  it('still synthesizes when linked ids are dangling (not in the household set)', () => {
    const out = buildRentalProjectionContributions(
      [makeRental({ linkedAssetId: 'ghost-a', linkedLiabilityId: 'ghost-l' })],
      new Set(),
      new Set(),
      START,
    )
    expect(out.assets).toHaveLength(1)
    expect(out.liabilities).toHaveLength(1)
  })

  it('adds no liability for an unmortgaged rental', () => {
    const out = buildRentalProjectionContributions(
      [makeRental({ mortgagePaymentCents: null })],
      new Set(),
      new Set(),
      START,
    )
    expect(out.liabilities).toHaveLength(0)
    expect(out.assets).toHaveLength(1)
    expect(out.cashFlowItems).toHaveLength(1)
  })

  it('is deterministic and sorted by rental id', () => {
    const rentals = [makeRental({ id: 'b' }), makeRental({ id: 'a' })]
    const out = buildRentalProjectionContributions(rentals, new Set(), new Set(), START)
    expect(out.assets.map((a) => a.id)).toEqual(['rental-asset:a', 'rental-asset:b'])
  })
})
