import type { RentVsBuyResultWithAffordability } from '@finance-app/shared-types'
import type {
  DisclosurePayload,
  DisclosureAssumption,
} from '@/components/dashboard/shared/disclosure.types'

const fmtPercent = (value: number) => `${value.toFixed(1)}% / yr`

/**
 * Build the assumption disclosure for a rent-vs-buy result.
 *
 * Sources are determined by inspecting which fields the user explicitly
 * provided in `input.assumptions`; the rest came from engine defaults
 * (see `packages/finance-engine/src/rent-vs-buy/rent-vs-buy.constants.ts`).
 */
export function buildRentVsBuyDisclosure(
  result: RentVsBuyResultWithAffordability,
): DisclosurePayload {
  const eff = result.calculation.effectiveAssumptions
  const userOverrides = result.calculation.input.assumptions ?? {}

  // Map field names to the (optional) user-input keys so we can label sources.
  const wasUserProvided = (key: keyof typeof userOverrides) => userOverrides[key] !== undefined

  const assumptions: DisclosureAssumption[] = [
    {
      label: 'Home appreciation',
      value: fmtPercent(eff.propertyAppreciationRatePercent),
      source: wasUserProvided('homeAppreciationRatePercent') ? 'user' : 'default',
      note: 'used to project the home value over time',
    },
    {
      label: 'Investment return (rent path)',
      value: fmtPercent(eff.investmentReturnRatePercent),
      source: wasUserProvided('investmentReturnRatePercent') ? 'user' : 'default',
      note: 'what the down payment would have earned if invested instead',
    },
    {
      label: 'Inflation',
      value: fmtPercent(eff.inflationRatePercent),
      source: wasUserProvided('inflationRatePercent') ? 'user' : 'default',
      note: 'applied to insurance and HOA dues each year',
    },
    {
      label: 'Property tax rate',
      value: fmtPercent(eff.propertyTaxRatePercent),
      source:
        result.calculation.input.buy.propertyTaxRateOverride !== undefined
          ? 'user'
          : wasUserProvided('propertyTaxRatePercent')
            ? 'user'
            : 'default',
      note: 'recomputed yearly against the appreciated home value',
    },
    {
      label: 'Maintenance',
      value: fmtPercent(eff.maintenanceRatePercent),
      source:
        result.calculation.input.buy.maintenanceRateOverride !== undefined
          ? 'user'
          : wasUserProvided('maintenanceRatePercent')
            ? 'user'
            : 'default',
      note: 'recomputed yearly against the appreciated home value',
    },
    {
      label: 'Rent increase',
      value: fmtPercent(eff.rentIncreaseRatePercent),
      source:
        result.calculation.input.rent.rentIncreaseRateOverride !== undefined
          ? 'user'
          : wasUserProvided('rentIncreaseRatePercent')
            ? 'user'
            : 'default',
      note: 'compounded annually on the monthly rent',
    },
    {
      label: 'Marginal tax rate',
      value: `${eff.marginalTaxRatePercent.toFixed(0)}%`,
      source: wasUserProvided('marginalTaxRatePercent') ? 'user' : 'default',
      note: 'used for the mortgage-interest deduction estimate',
    },
    {
      label: 'Selling cost (at end of horizon)',
      value: `${eff.sellingCostPercent.toFixed(1)}%`,
      source: wasUserProvided('sellingCostPercent') ? 'user' : 'default',
      note: 'subtracted from home equity in the final net-worth figure',
    },
  ]

  return {
    kind: 'projection',
    framing:
      'A multi-year financial comparison. The numbers depend on the assumptions below — change any of them and the recommendation can change.',
    assumptions,
    notModeled: [
      'Tax law changes — the mortgage-interest deduction is applied at the rate above; TCJA caps and AGI phase-outs are not modeled.',
      'Market volatility — investment returns are smoothed at a constant rate; real markets are not.',
      'Refinancing, recasts, ARM resets, or prepayment penalties.',
      'Unexpected maintenance shocks (roof, HVAC, foundation), special assessments, or rising HOA dues beyond inflation.',
      'Life events — job loss, relocation, family changes, or a forced sale before the end of the horizon.',
      'Closing delays, contingency falls, or non-monetary aspects of homeownership (commute, schools, flexibility).',
    ],
    caveats: [
      'The recommendation is a comparison of projected net worth at the end of the horizon. It is not personalized tax or legal advice.',
    ],
  }
}
