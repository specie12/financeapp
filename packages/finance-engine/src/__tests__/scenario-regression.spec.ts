/**
 * P1.3 — Scenario regression fixtures.
 *
 * Locks scenario integrity:
 *   1. Determinism — same scenario input produces same projection across runs.
 *   2. Reproducibility — JSON-serialized engine output equals the locked fixture.
 *   3. Override precedence — typed JSON values flow through without coercion.
 *   4. Baseline immutability — running a projection never mutates its input
 *      entities or scenario.
 *
 * Fixtures live in `goldens/scenario-projection.golden.json`. Each fixture is
 * the captured canonical engine output for a representative scenario. If the
 * engine drifts, the JSON diff makes the failure obvious; if a default
 * changes, fixtures must be re-generated consciously.
 */

import { runProjection } from '../projection/projection'
import {
  type ProjectionAsset,
  type ProjectionLiability,
  type ProjectionCashFlowItem,
} from '../projection/projection.types'
import { type Scenario } from '../scenario/scenario.types'
import { cents } from '../money/money'
import scenarioGoldens from './goldens/scenario-projection.golden.json'

// ─────────────────────────────────────────────────────────────────────────────
// Shared base entities. These mirror the inputs used to generate the fixture
// (`__tests__/goldens/scenario-projection.golden.json`). Update both here and
// in the fixture if you intentionally change the base shape.
// ─────────────────────────────────────────────────────────────────────────────

const startDate = new Date('2026-01-01T00:00:00.000Z')

const baseAssets: ProjectionAsset[] = [
  {
    id: 'a1',
    name: 'Investment account',
    currentValueCents: cents(10000000),
    annualGrowthRatePercent: 7,
  },
  { id: 'a2', name: 'Checking', currentValueCents: cents(1500000), annualGrowthRatePercent: 0.5 },
]

const baseLiabilities: ProjectionLiability[] = [
  {
    id: 'l1',
    name: 'Mortgage',
    currentBalanceCents: cents(25000000),
    interestRatePercent: 6.5,
    minimumPaymentCents: cents(200000),
    termMonths: 360,
    startDate: new Date('2026-01-01T00:00:00.000Z'),
  },
]

const baseCashFlowItems: ProjectionCashFlowItem[] = [
  {
    id: 'c1',
    name: 'Salary',
    type: 'income',
    amountCents: cents(800000),
    frequency: 'monthly',
    annualGrowthRatePercent: 3,
    startDate: null,
    endDate: null,
  },
  {
    id: 'c2',
    name: 'Living expenses',
    type: 'expense',
    amountCents: cents(400000),
    frequency: 'monthly',
    annualGrowthRatePercent: 2,
    startDate: null,
    endDate: null,
  },
]

const scenarios: Record<string, Scenario> = {
  s1: { id: 's1', name: 'Empty', isBaseline: false, overrides: [] },
  s2: {
    id: 's2',
    name: 'Bump asset',
    isBaseline: false,
    overrides: [
      {
        entityId: 'a1',
        targetType: 'asset',
        overrides: [{ fieldName: 'currentValueCents', value: 15000000 }],
      },
    ],
  },
  s3: {
    id: 's3',
    name: 'Cross',
    isBaseline: false,
    overrides: [
      {
        entityId: 'a1',
        targetType: 'asset',
        overrides: [{ fieldName: 'currentValueCents', value: 15000000 }],
      },
      {
        entityId: 'l1',
        targetType: 'liability',
        overrides: [{ fieldName: 'currentBalanceCents', value: 20000000 }],
      },
      {
        entityId: 'c1',
        targetType: 'cash_flow_item',
        overrides: [{ fieldName: 'amountCents', value: 1000000 }],
      },
    ],
  },
  s4: {
    id: 's4',
    name: 'Null term',
    isBaseline: false,
    overrides: [
      {
        entityId: 'l1',
        targetType: 'liability',
        overrides: [{ fieldName: 'termMonths', value: null }],
      },
    ],
  },
}

const runFixture = (scenarioId: string, horizonYears: number) =>
  runProjection({
    assets: baseAssets,
    liabilities: baseLiabilities,
    cashFlowItems: baseCashFlowItems,
    startDate,
    horizonYears,
    scenario: scenarios[scenarioId]!,
  })

// JSON canonicalization makes Date → ISO string so equality with the fixture
// is byte-exact regardless of underlying object identity.
const canonicalize = (value: unknown) => JSON.parse(JSON.stringify(value))

// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario regression — JSON equality with locked fixtures', () => {
  it.each(scenarioGoldens.cases)('$label', ({ input, expected }) => {
    const actual = runFixture(input.scenarioId, input.horizonYears)
    expect(canonicalize(actual)).toEqual(expected)
  })
})

describe('Scenario determinism', () => {
  it.each(scenarioGoldens.cases)('$label is byte-stable across 10 runs', ({ input }) => {
    const runs = Array.from({ length: 10 }, () =>
      canonicalize(runFixture(input.scenarioId, input.horizonYears)),
    )
    const first = runs[0]
    for (let i = 1; i < runs.length; i++) {
      expect(runs[i]).toEqual(first)
    }
  })
})

describe('Baseline immutability — runProjection never mutates input', () => {
  it('does not mutate base assets, liabilities, or cash flow items', () => {
    // Snapshot the inputs BEFORE running the projection. The engine clones
    // entities internally via structuredClone (see scenario.ts); we lock that
    // contract here so a future refactor can't accidentally introduce mutation.
    const beforeAssets = JSON.parse(JSON.stringify(baseAssets))
    const beforeLiabilities = JSON.parse(JSON.stringify(baseLiabilities))
    const beforeCashFlow = JSON.parse(JSON.stringify(baseCashFlowItems))
    const beforeScenario = JSON.parse(JSON.stringify(scenarios.s3))

    runFixture('s3', 5)

    expect(JSON.parse(JSON.stringify(baseAssets))).toEqual(beforeAssets)
    expect(JSON.parse(JSON.stringify(baseLiabilities))).toEqual(beforeLiabilities)
    expect(JSON.parse(JSON.stringify(baseCashFlowItems))).toEqual(beforeCashFlow)
    expect(JSON.parse(JSON.stringify(scenarios.s3))).toEqual(beforeScenario)
  })

  it('does not mutate the scenario overrides array', () => {
    const before = JSON.parse(JSON.stringify(scenarios.s2))
    runFixture('s2', 5)
    runFixture('s2', 5)
    runFixture('s2', 5)
    expect(JSON.parse(JSON.stringify(scenarios.s2))).toEqual(before)
  })
})

describe('Override precedence — typed JSON values flow through without coercion', () => {
  it('null override replaces termMonths with null in the projection input', () => {
    // The s4 fixture overrides termMonths → null; the engine should accept
    // the null and apply the projection's default (360 mo) per
    // projectLiabilityToYear's `?? 360` fallback.
    const result = runFixture('s4', 5)
    // No NaN should ever appear in projected snapshots.
    for (const snap of result.yearlySnapshots) {
      expect(Number.isFinite(snap.totalAssetsCents)).toBe(true)
      expect(Number.isFinite(snap.totalLiabilitiesCents)).toBe(true)
      expect(Number.isFinite(snap.netWorthCents)).toBe(true)
    }
  })
})
