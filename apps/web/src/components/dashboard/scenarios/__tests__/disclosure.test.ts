import { buildScenarioComparisonDisclosure } from '../disclosure'
import type { ScenarioComparisonItem, Scenario } from '@finance-app/shared-types'

function scenario(overrideCount: number): Scenario {
  return {
    id: 's1',
    householdId: 'h1',
    name: 'Buy the rental',
    description: null,
    isBaseline: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    overrides: Array.from({ length: overrideCount }, (_, i) => ({
      id: `o${i}`,
      scenarioId: 's1',
      targetType: 'asset' as const,
      entityId: 'a1',
      fieldName: 'currentValueCents',
      value: '100',
    })),
  }
}

function comparison(horizonYears: number, overrideCount: number): ScenarioComparisonItem {
  return {
    scenario: scenario(overrideCount),
    projection: {
      startDate: new Date(),
      horizonYears,
      yearlySnapshots: [],
      summary: {
        startingNetWorthCents: 0,
        endingNetWorthCents: 0,
        netWorthChangeCents: 0,
        netWorthChangePercent: 0,
        totalIncomeOverPeriodCents: 0,
        totalExpensesOverPeriodCents: 0,
        totalDebtPaidCents: 0,
        totalInterestPaidCents: 0,
      },
    },
  }
}

describe('buildScenarioComparisonDisclosure', () => {
  it('is a projection and discloses the shared comparison horizon', () => {
    const payload = buildScenarioComparisonDisclosure([comparison(10, 2)])
    expect(payload.kind).toBe('projection')
    const horizon = payload.assumptions?.find((a) => a.label === 'Comparison horizon')
    expect(horizon?.value).toContain('10 years')
  })

  it('surfaces the number of overridden fields', () => {
    const payload = buildScenarioComparisonDisclosure([comparison(5, 3)])
    const overrides = payload.assumptions?.find((a) => a.label === 'Scenario overrides')
    expect(overrides?.value).toMatch(/3 fields/i)
  })

  it('warns that volatility and probability are not modeled', () => {
    const payload = buildScenarioComparisonDisclosure([comparison(5, 1)])
    expect(payload.notModeled?.some((s) => /volatility/i.test(s))).toBe(true)
    expect(payload.notModeled?.some((s) => /equally likely|probability/i.test(s))).toBe(true)
  })
})
