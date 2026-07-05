import type { Cents } from '../money/money.types'

/**
 * Configuration for a Monte Carlo net-worth projection.
 */
export interface MonteCarloConfig {
  /** Number of simulated paths. More paths = smoother bands, slower run. */
  iterations: number
  /** Seed for the PRNG. A fixed seed makes the result reproducible. */
  seed: number
  /**
   * Annual return volatility (standard deviation) as a whole-number percentage,
   * applied to every asset with a non-zero growth rate. Zero-growth (cash-like)
   * assets are held flat. This is a single portfolio-wide simplification.
   */
  returnVolatilityPercent: number
}

/**
 * Net-worth percentile band for one year across all simulated paths.
 */
export interface MonteCarloYearBand {
  year: number
  date: Date
  /** 10th percentile (pessimistic) net worth. */
  p10NetWorthCents: Cents
  /** 50th percentile (median) net worth. */
  p50NetWorthCents: Cents
  /** 90th percentile (optimistic) net worth. */
  p90NetWorthCents: Cents
}

/**
 * Headline statistics for the simulation.
 */
export interface MonteCarloSummary {
  startingNetWorthCents: Cents
  endingP10NetWorthCents: Cents
  endingP50NetWorthCents: Cents
  endingP90NetWorthCents: Cents
  /** Share of paths whose ending net worth exceeds today's, as a percentage. */
  probEndAboveStartPercent: number
  /** Share of paths whose ending net worth is positive, as a percentage. */
  probEndPositivePercent: number
}

/**
 * Complete Monte Carlo projection result.
 */
export interface MonteCarloResult {
  iterations: number
  seed: number
  returnVolatilityPercent: number
  startDate: Date
  horizonYears: number
  yearlyBands: MonteCarloYearBand[]
  summary: MonteCarloSummary
}
