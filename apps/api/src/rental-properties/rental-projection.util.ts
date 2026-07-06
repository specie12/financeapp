import {
  computeRentalMetrics,
  type Cents,
  type ProjectionAsset,
  type ProjectionLiability,
  type ProjectionCashFlowItem,
} from '@finance-app/finance-engine'
import type { RentalProperty } from '@prisma/client'

/** Default annual appreciation when a rental has none set and isn't linked to an asset. */
export const DEFAULT_APPRECIATION_RATE_PERCENT = 3
/** Default amortization term for a synthesized rental mortgage (30 years). */
const DEFAULT_MORTGAGE_TERM_MONTHS = 360

export interface RentalProjectionContributions {
  assets: ProjectionAsset[]
  liabilities: ProjectionLiability[]
  cashFlowItems: ProjectionCashFlowItem[]
}

/**
 * Turns a household's rental properties into projection contributions so the
 * projection engine reflects them in net worth and cash flow.
 *
 * Hybrid, double-count-safe design:
 *  - **Property value** is added as a synthesized appreciating asset UNLESS the
 *    rental is linked to a household asset already in the projection (that asset
 *    already carries the value).
 *  - **Mortgage** is added as a synthesized amortizing liability UNLESS the
 *    rental is linked to a household liability already in the projection. With no
 *    stored balance on the rental, the starting balance is approximated by the
 *    same `value − downPayment` proxy used for portfolio equity.
 *  - **Net operating income** is always added as an annual income cash-flow item.
 *    Debt service is captured by the (linked or synthesized) liability, so NOI —
 *    not NOI minus debt service — is used here to avoid double counting.
 *
 * Pure and deterministic: rentals are sorted by id and synthesized entities use
 * stable, prefixed ids that can't collide with real entity ids.
 */
export function buildRentalProjectionContributions(
  rentals: RentalProperty[],
  existingAssetIds: Set<string>,
  existingLiabilityIds: Set<string>,
  startDate: Date,
): RentalProjectionContributions {
  const assets: ProjectionAsset[] = []
  const liabilities: ProjectionLiability[] = []
  const cashFlowItems: ProjectionCashFlowItem[] = []

  const sorted = [...rentals].sort((a, b) => a.id.localeCompare(b.id))

  for (const r of sorted) {
    const metrics = computeRentalMetrics({
      currentValueCents: r.currentValueCents as Cents,
      downPaymentCents: r.downPaymentCents as Cents,
      monthlyRentCents: r.monthlyRentCents as Cents,
      vacancyRatePercent: Number(r.vacancyRatePercent),
      annualExpensesCents: r.annualExpensesCents as Cents,
      propertyTaxAnnualCents: r.propertyTaxAnnualCents as Cents,
      mortgagePaymentCents: (r.mortgagePaymentCents ?? null) as Cents | null,
    })

    const hasLinkedAsset = r.linkedAssetId != null && existingAssetIds.has(r.linkedAssetId)
    if (!hasLinkedAsset) {
      assets.push({
        id: `rental-asset:${r.id}`,
        name: `${r.name} (property)`,
        currentValueCents: r.currentValueCents as Cents,
        annualGrowthRatePercent:
          r.appreciationRatePercent != null
            ? Number(r.appreciationRatePercent)
            : DEFAULT_APPRECIATION_RATE_PERCENT,
      })
    }

    const hasLinkedLiability =
      r.linkedLiabilityId != null && existingLiabilityIds.has(r.linkedLiabilityId)
    const hasMortgage = r.mortgageBalanceCents != null || r.mortgagePaymentCents != null
    if (!hasLinkedLiability && hasMortgage) {
      // Prefer the exact outstanding balance when the user entered it; otherwise
      // approximate it with the same (value − down payment) proxy as equity.
      const balanceCents =
        r.mortgageBalanceCents != null
          ? r.mortgageBalanceCents
          : Math.max(0, r.currentValueCents - r.downPaymentCents)
      if (balanceCents > 0) {
        liabilities.push({
          id: `rental-liability:${r.id}`,
          name: `${r.name} (mortgage)`,
          currentBalanceCents: balanceCents as Cents,
          interestRatePercent: r.mortgageRatePercent != null ? Number(r.mortgageRatePercent) : 0,
          minimumPaymentCents: (r.mortgagePaymentCents ?? 0) as Cents,
          termMonths: r.mortgageTermMonths ?? DEFAULT_MORTGAGE_TERM_MONTHS,
          startDate,
        })
      }
    }

    if (metrics.noiCents !== 0) {
      cashFlowItems.push({
        id: `rental-noi:${r.id}`,
        name: `${r.name} (net operating income)`,
        type: metrics.noiCents >= 0 ? 'income' : 'expense',
        amountCents: Math.abs(metrics.noiCents) as Cents,
        frequency: 'annually',
        annualGrowthRatePercent: null,
        startDate: null,
        endDate: null,
      })
    }
  }

  return { assets, liabilities, cashFlowItems }
}
