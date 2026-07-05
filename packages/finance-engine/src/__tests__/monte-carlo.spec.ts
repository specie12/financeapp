import { runMonteCarloProjection } from '../monte-carlo/monte-carlo'
import { createRng } from '../monte-carlo/random'
import { runProjection } from '../projection/projection'
import { cents } from '../money/money'
import type { ProjectionInput } from '../projection/projection.types'

const baseInput: ProjectionInput = {
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  horizonYears: 10,
  assets: [
    {
      id: 'a1',
      name: 'Brokerage',
      currentValueCents: cents(10_000_000),
      annualGrowthRatePercent: 7,
    },
    { id: 'a2', name: 'Cash', currentValueCents: cents(2_000_000), annualGrowthRatePercent: 0 },
  ],
  liabilities: [
    {
      id: 'l1',
      name: 'Mortgage',
      currentBalanceCents: cents(30_000_000),
      interestRatePercent: 6,
      minimumPaymentCents: cents(180_000),
      termMonths: 360,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
    },
  ],
  cashFlowItems: [],
}

const config = { iterations: 500, seed: 42, returnVolatilityPercent: 15 }

describe('createRng', () => {
  it('is deterministic for a given seed and diverges across seeds', () => {
    const a = createRng(1)
    const b = createRng(1)
    const c = createRng(2)
    expect(a.next()).toBe(b.next())
    expect(a.next()).not.toBe(c.next())
  })
})

describe('runMonteCarloProjection', () => {
  it('is deterministic for a fixed seed', () => {
    const first = runMonteCarloProjection(baseInput, config)
    const second = runMonteCarloProjection(baseInput, config)
    expect(second).toEqual(first)
  })

  it('produces different bands for a different seed', () => {
    const a = runMonteCarloProjection(baseInput, config)
    const b = runMonteCarloProjection(baseInput, { ...config, seed: 99 })
    expect(b.summary.endingP90NetWorthCents).not.toBe(a.summary.endingP90NetWorthCents)
  })

  it('orders percentiles p10 <= p50 <= p90 every year', () => {
    const result = runMonteCarloProjection(baseInput, config)
    for (const band of result.yearlyBands) {
      expect(band.p10NetWorthCents).toBeLessThanOrEqual(band.p50NetWorthCents)
      expect(band.p50NetWorthCents).toBeLessThanOrEqual(band.p90NetWorthCents)
    }
  })

  it('has a zero-width band at year 0 matching the deterministic start', () => {
    const result = runMonteCarloProjection(baseInput, config)
    const y0 = result.yearlyBands[0]!
    // Year 0 has no sampled returns, so all percentiles coincide.
    expect(y0.p10NetWorthCents).toBe(y0.p90NetWorthCents)
    // …and it equals the canonical deterministic year-0 net worth.
    const deterministicStart = runProjection(baseInput).yearlySnapshots[0]!.netWorthCents
    expect(result.summary.startingNetWorthCents).toBe(deterministicStart)
  })

  it('widens the p10–p90 spread as the horizon extends', () => {
    const result = runMonteCarloProjection(baseInput, config)
    const spread = (i: number) =>
      result.yearlyBands[i]!.p90NetWorthCents - result.yearlyBands[i]!.p10NetWorthCents
    expect(spread(10)).toBeGreaterThan(spread(1))
  })

  it('collapses to the deterministic projection when volatility is zero', () => {
    const result = runMonteCarloProjection(baseInput, { ...config, returnVolatilityPercent: 0 })
    const deterministic = runProjection(baseInput)

    for (let year = 0; year <= baseInput.horizonYears; year++) {
      const band = result.yearlyBands[year]!
      // No volatility → every path is identical.
      expect(band.p10NetWorthCents).toBe(band.p50NetWorthCents)
      expect(band.p50NetWorthCents).toBe(band.p90NetWorthCents)
      // …and it tracks the exact Decimal engine within floating-point rounding
      // (a few cents on eight-figure balances).
      const expected = deterministic.yearlySnapshots[year]!.netWorthCents
      expect(Math.abs(band.p50NetWorthCents - expected)).toBeLessThanOrEqual(50)
    }
  })

  it('reports probabilities in [0, 100]', () => {
    const result = runMonteCarloProjection(baseInput, config)
    expect(result.summary.probEndAboveStartPercent).toBeGreaterThanOrEqual(0)
    expect(result.summary.probEndAboveStartPercent).toBeLessThanOrEqual(100)
    expect(result.summary.probEndPositivePercent).toBeGreaterThanOrEqual(0)
    expect(result.summary.probEndPositivePercent).toBeLessThanOrEqual(100)
  })

  it('clamps iterations into the supported range', () => {
    const tiny = runMonteCarloProjection(baseInput, { ...config, iterations: 5 })
    expect(tiny.iterations).toBe(100)
    const huge = runMonteCarloProjection(baseInput, { ...config, iterations: 999_999 })
    expect(huge.iterations).toBe(10_000)
  })
})
