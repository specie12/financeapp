import { type Cents } from '../money/money.types'
import { cents } from '../money/money'
import { applyScenarioToEntities } from '../scenario/scenario'
import { runProjection } from '../projection/projection'
import type { ProjectionAsset, ProjectionInput } from '../projection/projection.types'
import { createRng } from './random'
import type { MonteCarloConfig, MonteCarloResult, MonteCarloYearBand } from './monte-carlo.types'

/** An asset can't lose more than ~all its value in a single year. */
const MIN_ANNUAL_RETURN_FRACTION = -0.95

/** Bounds keep a single run cheap and the bands statistically meaningful. */
const MIN_ITERATIONS = 100
const MAX_ITERATIONS = 10_000

/**
 * Nearest-rank percentile of an already-ascending-sorted array.
 * `p` is a fraction in [0, 1].
 */
function percentile(sortedAsc: number[], p: number): number {
  const n = sortedAsc.length
  if (n === 0) return 0
  const idx = Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))))
  return sortedAsc[idx] as number
}

/**
 * Runs a Monte Carlo net-worth projection.
 *
 * Net worth here is stochastic ASSETS minus DETERMINISTIC liabilities:
 *  - Each asset with a non-zero growth rate compounds year-over-year by a
 *    freshly sampled annual return ~ Normal(growth, volatility). Zero-growth
 *    assets are held flat. The path is intentionally computed in plain-number
 *    arithmetic (not Decimal) — this is a statistical distribution, not an
 *    accounting figure — and rounded to whole cents when bands are taken.
 *  - Liabilities are contractual, so their amortized balances are identical
 *    across every path. We get them (and scenario handling, dates, and the
 *    year-0 starting point) from the canonical deterministic `runProjection`.
 *
 * Deterministic given `config.seed`: the same inputs always produce the same
 * bands. With `returnVolatilityPercent = 0` the bands collapse to the
 * deterministic path (within floating-point rounding).
 */
export function runMonteCarloProjection(
  input: ProjectionInput,
  config: MonteCarloConfig,
): MonteCarloResult {
  const iterations = Math.min(
    MAX_ITERATIONS,
    Math.max(MIN_ITERATIONS, Math.floor(config.iterations)),
  )
  const volFraction = config.returnVolatilityPercent / 100

  // Deterministic pass: gives us scenario-adjusted liability totals per year,
  // the per-year dates, and the (deterministic) year-0 starting net worth.
  const deterministic = runProjection(input)
  const liabilityTotalsByYear = deterministic.yearlySnapshots.map((s) => s.totalLiabilitiesCents)
  const datesByYear = deterministic.yearlySnapshots.map((s) => s.date)

  // Scenario-adjust the assets the same way runProjection does, so the
  // stochastic paths start from the overridden values.
  let assets = input.assets
  if (input.scenario && input.scenario.overrides.length > 0) {
    assets = applyScenarioToEntities({
      entities: input.assets as (ProjectionAsset & { id: string })[],
      overrides: input.scenario.overrides,
    }).map((r) => r.entity)
  }
  // Determinism: sort by id, matching the projection engine's convention.
  const sortedAssets = [...assets].sort((a, b) => a.id.localeCompare(b.id))
  const assetMeans = sortedAssets.map((a) => a.annualGrowthRatePercent / 100)
  const assetIsRisky = sortedAssets.map((a) => a.annualGrowthRatePercent !== 0)

  const horizon = input.horizonYears
  const rng = createRng(config.seed)

  // netWorthSamples[year] = net worth across all iterations for that year.
  const netWorthSamples: number[][] = Array.from({ length: horizon + 1 }, () => [])

  for (let iter = 0; iter < iterations; iter++) {
    const running = sortedAssets.map((a) => a.currentValueCents as number)
    for (let year = 0; year <= horizon; year++) {
      if (year > 0) {
        for (let i = 0; i < running.length; i++) {
          if (!assetIsRisky[i]) continue
          let r = (assetMeans[i] as number) + volFraction * rng.nextNormal()
          if (r < MIN_ANNUAL_RETURN_FRACTION) r = MIN_ANNUAL_RETURN_FRACTION
          running[i] = (running[i] as number) * (1 + r)
        }
      }
      const totalAssets = running.reduce((sum, v) => sum + v, 0)
      const nw = Math.round(totalAssets) - (liabilityTotalsByYear[year] as number)
      ;(netWorthSamples[year] as number[]).push(nw)
    }
  }

  const yearlyBands: MonteCarloYearBand[] = netWorthSamples.map((samples, year) => {
    const sorted = [...samples].sort((a, b) => a - b)
    return {
      year,
      date: datesByYear[year] as Date,
      p10NetWorthCents: cents(percentile(sorted, 0.1)),
      p50NetWorthCents: cents(percentile(sorted, 0.5)),
      p90NetWorthCents: cents(percentile(sorted, 0.9)),
    }
  })

  const startingNetWorthCents = (yearlyBands[0]?.p50NetWorthCents ?? cents(0)) as Cents
  const endingSamples = netWorthSamples[horizon] as number[]
  const aboveStart = endingSamples.filter((nw) => nw > startingNetWorthCents).length
  const positive = endingSamples.filter((nw) => nw > 0).length
  const pct = (count: number) => Math.round((count / endingSamples.length) * 1000) / 10

  const endingBand = yearlyBands[horizon] as MonteCarloYearBand

  return {
    iterations,
    seed: config.seed,
    returnVolatilityPercent: config.returnVolatilityPercent,
    startDate: input.startDate,
    horizonYears: horizon,
    yearlyBands,
    summary: {
      startingNetWorthCents,
      endingP10NetWorthCents: endingBand.p10NetWorthCents,
      endingP50NetWorthCents: endingBand.p50NetWorthCents,
      endingP90NetWorthCents: endingBand.p90NetWorthCents,
      probEndAboveStartPercent: pct(aboveStart),
      probEndPositivePercent: pct(positive),
    },
  }
}
