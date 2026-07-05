import type { RentalPortfolioSummary } from '@finance-app/shared-types'
import type {
  DisclosurePayload,
  DisclosureAssumption,
} from '@/components/dashboard/shared/disclosure.types'

const DEFAULT_APPRECIATION_RATE_PERCENT = 3

/**
 * Build the disclosure for the rental portfolio.
 *
 * Rental metrics (cap rate, cash-on-cash, GRM, DSCR) are point-in-time
 * ESTIMATES computed from today's rent and value — they don't compound. When
 * rentals flow into the net-worth/scenario projection, each property's value
 * appreciates and its mortgage amortizes; its NOI feeds annual cash flow.
 */
export function buildRentalDisclosure(summary: RentalPortfolioSummary): DisclosurePayload {
  const usingDefaultAppreciation = summary.properties.some(
    (m) => m.property.appreciationRatePercent == null,
  )

  const assumptions: DisclosureAssumption[] = [
    {
      label: 'Vacancy rate',
      value: 'as entered per property',
      source: 'user',
      note: 'reduces gross rent to effective gross income; assumed constant every year',
    },
    {
      label: 'Appreciation',
      value: usingDefaultAppreciation
        ? `${DEFAULT_APPRECIATION_RATE_PERCENT}%/yr default where unset`
        : 'as entered per property',
      source: usingDefaultAppreciation ? 'default' : 'user',
      note: 'drives property value in the net-worth and scenario projections',
    },
    {
      label: 'Operating expenses & property tax',
      value: 'flat annual figures',
      source: 'user',
      note: 'held constant — no expense inflation or tax reassessment is modeled',
    },
    {
      label: 'Metrics basis',
      value: "today's rent & value",
      source: 'derived',
      note: 'cap rate, cash-on-cash, GRM and DSCR are snapshots, not forecasts',
    },
  ]

  return {
    kind: 'estimate',
    title: 'How these numbers are built',
    framing:
      'Rental metrics are point-in-time estimates from the figures you entered. They do not compound, and several real-world costs are excluded.',
    assumptions,
    notModeled: [
      'Rent growth over time.',
      'Capital expenditures, tenant turnover, and major repairs (roof, HVAC, etc.).',
      'Depreciation and tax treatment — deductions, passive-loss rules, and recapture on sale.',
      'Mortgage rate resets or refinancing. For a rental not linked to a tracked loan, the mortgage balance is approximated from value minus down payment.',
      'Selling costs, transfer taxes, and capital gains at disposition.',
      'Property-specific vacancy shocks or market cycles.',
    ],
    caveats: [
      'DSCR is shown only for mortgaged properties; cash-on-cash needs a down payment to be meaningful.',
      'In projections, a property moves net worth through appreciation and mortgage paydown; its NOI is added to annual cash flow.',
    ],
  }
}
