import type { ScenarioComparisonItem } from '@finance-app/shared-types'
import type {
  DisclosurePayload,
  DisclosureAssumption,
} from '@/components/dashboard/shared/disclosure.types'

/**
 * Build the disclosure for a scenario comparison.
 *
 * Each scenario is run through the same projection engine as the net-worth
 * forecast: assets compound at their own constant rates, liabilities amortize,
 * and cash-flow items compound at the rates set on them. A scenario differs
 * from the baseline only by its overrides. The comparison ranks scenarios by
 * the headline metrics in the table — it does not weight risk or liquidity, so
 * the "best" row is best *only* on those metrics under these assumptions.
 */
export function buildScenarioComparisonDisclosure(
  comparisons: ScenarioComparisonItem[],
): DisclosurePayload {
  // Horizon is shared across the comparison; fall back gracefully if empty.
  const horizonYears = comparisons[0]?.projection.horizonYears ?? 0
  const overrideCount = comparisons.reduce((sum, c) => sum + c.scenario.overrides.length, 0)

  const assumptions: DisclosureAssumption[] = [
    {
      label: 'Comparison horizon',
      value: horizonYears > 0 ? `${horizonYears} years` : 'unset',
      source: 'user',
      note: 'every scenario is projected to the same horizon and ranked at that point only',
    },
    {
      label: 'Growth & amortization',
      value: 'per-entity rates',
      source: 'derived',
      note: 'assets compound at their own constant rate; loans amortize at their current rate and term',
    },
    {
      label: 'Income & expenses',
      value: 'as entered',
      source: 'user',
      note: 'each cash-flow item compounds at the rate you set on it — no automatic inflation',
    },
    {
      label: 'Scenario overrides',
      value: `${overrideCount} field${overrideCount === 1 ? '' : 's'} changed`,
      source: 'user',
      note: 'a scenario differs from the baseline only by the fields you overrode; everything else is shared',
    },
  ]

  return {
    kind: 'projection',
    framing:
      'A side-by-side projection of each scenario through the same horizon. Scenarios are ranked only by the metrics in the table — the comparison does not weight risk, liquidity, or how likely each scenario is.',
    assumptions,
    notModeled: [
      'Market volatility — assets compound at a flat rate per year; real returns vary and can be negative.',
      'Taxes on asset sales, retirement-account withdrawals, or realized gains.',
      'New contributions, raises, bonuses, or windfalls beyond the cash-flow items entered.',
      'Income interruptions, health events, or other personal shocks.',
      'Variable rates on loans (HELOC, ARM, credit-card APR changes).',
      'Probability — the comparison treats every scenario as equally likely.',
    ],
    caveats: [
      'A 5-year horizon is far more reliable than a 30-year one. Treat distant years as scenarios, not forecasts.',
      'The "best" scenario is best only on the metrics shown — it may carry more risk or less liquidity than the runner-up.',
    ],
  }
}
