import {
  runProjection,
  validateProjectionInput,
  projectAssetValue,
  projectLiabilityToYear,
  projectCashFlowItem,
  annualizeCashFlow,
  InvalidProjectionInputError,
  MIN_HORIZON_YEARS,
  MAX_HORIZON_YEARS,
  type ProjectionInput,
  type ProjectionAsset,
  type ProjectionLiability,
  type ProjectionCashFlowItem,
} from '../projection'
import { cents } from '../money/money'

// ============================================
// Test Helpers
// ============================================

function createBaseInput(): ProjectionInput {
  return {
    assets: [],
    liabilities: [],
    cashFlowItems: [],
    startDate: new Date('2024-01-01'),
    horizonYears: 10,
  }
}

function createAsset(overrides: Partial<ProjectionAsset> = {}): ProjectionAsset {
  return {
    id: 'asset-1',
    name: 'Test Asset',
    currentValueCents: cents(10000000), // $100,000
    annualGrowthRatePercent: 5,
    ...overrides,
  }
}

function createLiability(overrides: Partial<ProjectionLiability> = {}): ProjectionLiability {
  return {
    id: 'liability-1',
    name: 'Test Liability',
    currentBalanceCents: cents(20000000), // $200,000
    interestRatePercent: 6,
    minimumPaymentCents: cents(119911), // Standard mortgage payment
    termMonths: 360,
    startDate: new Date('2024-01-01'),
    ...overrides,
  }
}

function createCashFlowItem(
  overrides: Partial<ProjectionCashFlowItem> = {},
): ProjectionCashFlowItem {
  return {
    id: 'cashflow-1',
    name: 'Test Cash Flow',
    type: 'income',
    amountCents: cents(500000), // $5,000/month
    frequency: 'monthly',
    annualGrowthRatePercent: 3,
    startDate: null,
    endDate: null,
    ...overrides,
  }
}

// ============================================
// Determinism Tests
// ============================================

describe('Projection Determinism', () => {
  it('should produce identical results for same input', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset()],
      liabilities: [createLiability()],
      cashFlowItems: [createCashFlowItem()],
    }

    const result1 = runProjection(input)
    const result2 = runProjection(input)

    expect(result1).toEqual(result2)
  })

  it('should be reproducible across 100 calls', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset({ id: 'a1' }), createAsset({ id: 'a2', annualGrowthRatePercent: 7 })],
      liabilities: [createLiability()],
      cashFlowItems: [
        createCashFlowItem({ id: 'cf1' }),
        createCashFlowItem({ id: 'cf2', type: 'expense', amountCents: cents(200000) }),
      ],
    }

    const results = Array.from({ length: 100 }, () => runProjection(input))
    const uniqueResults = new Set(results.map((r) => JSON.stringify(r)))

    expect(uniqueResults.size).toBe(1)
  })

  it('should produce same results regardless of entity order in input', () => {
    const asset1 = createAsset({ id: 'asset-a' })
    const asset2 = createAsset({ id: 'asset-b', annualGrowthRatePercent: 8 })

    const input1: ProjectionInput = {
      ...createBaseInput(),
      assets: [asset1, asset2],
    }

    const input2: ProjectionInput = {
      ...createBaseInput(),
      assets: [asset2, asset1], // Reversed order
    }

    const result1 = runProjection(input1)
    const result2 = runProjection(input2)

    // Net worth should be identical
    expect(result1.summary.endingNetWorthCents).toBe(result2.summary.endingNetWorthCents)

    // All snapshots should have same totals
    for (let i = 0; i <= 10; i++) {
      expect(result1.yearlySnapshots[i].netWorthCents).toBe(
        result2.yearlySnapshots[i].netWorthCents,
      )
    }
  })
})

// ============================================
// Asset Projection Tests
// ============================================

describe('projectAssetValue', () => {
  it('should return same value for year 0', () => {
    const value = projectAssetValue(cents(10000000), 5, 0)
    expect(value).toBe(10000000)
  })

  it('should return 0 for 0 current value', () => {
    const value = projectAssetValue(cents(0), 5, 10)
    expect(value).toBe(0)
  })

  it('should correctly calculate compound growth', () => {
    // $100,000 at 5% for 10 years = $162,889.46
    const value = projectAssetValue(cents(10000000), 5, 10)
    expect(value).toBe(16288946)
  })

  it('should handle 0% growth rate', () => {
    const value = projectAssetValue(cents(10000000), 0, 10)
    expect(value).toBe(10000000)
  })

  it('should handle negative growth rate', () => {
    // $100,000 at -5% for 2 years = $90,250
    const value = projectAssetValue(cents(10000000), -5, 2)
    expect(value).toBe(9025000)
  })

  it('should handle high growth rates', () => {
    // $100,000 at 20% for 5 years = $248,832
    const value = projectAssetValue(cents(10000000), 20, 5)
    expect(value).toBe(24883200)
  })
})

describe('Asset projection in runProjection', () => {
  it('should project multiple assets independently', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [
        createAsset({ id: 'a1', currentValueCents: cents(10000000), annualGrowthRatePercent: 5 }),
        createAsset({ id: 'a2', currentValueCents: cents(5000000), annualGrowthRatePercent: 10 }),
      ],
      horizonYears: 5,
    }

    const result = runProjection(input)

    // Year 5: Asset 1 = $127,628.16, Asset 2 = $80,525.50
    const year5 = result.yearlySnapshots[5]
    expect(year5.assetValues.find((a) => a.id === 'a1')?.valueCents).toBe(12762816)
    expect(year5.assetValues.find((a) => a.id === 'a2')?.valueCents).toBe(8052550)
    expect(year5.totalAssetsCents).toBe(12762816 + 8052550)
  })
})

// ============================================
// Liability Projection Tests
// ============================================

describe('projectLiabilityToYear', () => {
  it('should return 0 balance for already paid off liability', () => {
    const liability = createLiability({ currentBalanceCents: cents(0) })
    const result = projectLiabilityToYear(liability, new Date('2024-01-01'), 5)

    expect(result.balanceCents).toBe(0)
    expect(result.yearlyPaymentCents).toBe(0)
  })

  it('should correctly calculate year 1 for a mortgage', () => {
    const liability = createLiability({
      currentBalanceCents: cents(20000000), // $200,000
      interestRatePercent: 6,
      termMonths: 360,
    })

    const result = projectLiabilityToYear(liability, new Date('2024-01-01'), 1)

    // After 12 months, balance should be reduced
    expect(result.balanceCents).toBeLessThan(20000000)
    expect(result.yearlyPaymentCents).toBeGreaterThan(0)
    expect(result.yearlyInterestCents).toBeGreaterThan(0)
    expect(result.yearlyPrincipalCents).toBeGreaterThan(0)
  })

  it('should return 0 balance after loan term ends', () => {
    const liability = createLiability({
      currentBalanceCents: cents(10000000),
      interestRatePercent: 5,
      termMonths: 60, // 5 year loan
    })

    const result = projectLiabilityToYear(liability, new Date('2024-01-01'), 10)

    expect(result.balanceCents).toBe(0)
  })
})

describe('Liability projection in runProjection', () => {
  it('should track liability paydown over time', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      liabilities: [
        createLiability({
          currentBalanceCents: cents(20000000),
          interestRatePercent: 6,
          termMonths: 360,
        }),
      ],
      horizonYears: 10,
    }

    const result = runProjection(input)

    // Balance should decrease each year
    for (let i = 1; i <= 10; i++) {
      expect(result.yearlySnapshots[i].totalLiabilitiesCents).toBeLessThan(
        result.yearlySnapshots[i - 1].totalLiabilitiesCents,
      )
    }
  })

  it('should include debt payments in cash flow', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      liabilities: [createLiability()],
      horizonYears: 5,
    }

    const result = runProjection(input)

    // Each year should have debt payments
    for (let i = 0; i <= 5; i++) {
      expect(result.yearlySnapshots[i].debtPaymentsCents).toBeGreaterThan(0)
    }
  })
})

// ============================================
// Cash Flow Projection Tests
// ============================================

describe('annualizeCashFlow', () => {
  it('should correctly annualize monthly amounts', () => {
    const annual = annualizeCashFlow(cents(100000), 'monthly')
    expect(annual).toBe(1200000)
  })

  it('should correctly annualize weekly amounts', () => {
    const annual = annualizeCashFlow(cents(100000), 'weekly')
    expect(annual).toBe(5200000)
  })

  it('should correctly annualize biweekly amounts', () => {
    const annual = annualizeCashFlow(cents(100000), 'biweekly')
    expect(annual).toBe(2600000)
  })

  it('should correctly annualize quarterly amounts', () => {
    const annual = annualizeCashFlow(cents(100000), 'quarterly')
    expect(annual).toBe(400000)
  })

  it('should keep annual amounts unchanged', () => {
    const annual = annualizeCashFlow(cents(100000), 'annually')
    expect(annual).toBe(100000)
  })

  it('should keep one_time amounts unchanged', () => {
    const annual = annualizeCashFlow(cents(100000), 'one_time')
    expect(annual).toBe(100000)
  })
})

describe('projectCashFlowItem', () => {
  it('should return annualized amount for year 0', () => {
    const item = createCashFlowItem({
      amountCents: cents(500000),
      frequency: 'monthly',
    })

    const result = projectCashFlowItem(item, new Date('2024-01-01'), 0)
    expect(result).toBe(6000000) // $5,000 * 12
  })

  it('should apply growth rate for future years', () => {
    const item = createCashFlowItem({
      amountCents: cents(500000),
      frequency: 'monthly',
      annualGrowthRatePercent: 3,
    })

    const year0 = projectCashFlowItem(item, new Date('2024-01-01'), 0)
    const year1 = projectCashFlowItem(item, new Date('2024-01-01'), 1)

    expect(year0).toBe(6000000)
    expect(year1).toBe(6180000) // $60,000 * 1.03
  })

  it('should return 0 for inactive items', () => {
    const item = createCashFlowItem({
      startDate: new Date('2030-01-01'), // Starts in the future
    })

    const result = projectCashFlowItem(item, new Date('2024-01-01'), 0)
    expect(result).toBe(0)
  })

  it('should return 0 for one_time items after year 0', () => {
    const item = createCashFlowItem({
      frequency: 'one_time',
      amountCents: cents(100000),
    })

    const year0 = projectCashFlowItem(item, new Date('2024-01-01'), 0)
    const year1 = projectCashFlowItem(item, new Date('2024-01-01'), 1)

    expect(year0).toBe(100000)
    expect(year1).toBe(0)
  })

  it('should respect end date', () => {
    const item = createCashFlowItem({
      endDate: new Date('2025-06-01'),
    })

    const year0 = projectCashFlowItem(item, new Date('2024-01-01'), 0)
    const year5 = projectCashFlowItem(item, new Date('2024-01-01'), 5)

    expect(year0).toBeGreaterThan(0)
    expect(year5).toBe(0)
  })
})

describe('Cash flow in runProjection', () => {
  it('should separate income and expenses', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      cashFlowItems: [
        createCashFlowItem({
          id: 'income',
          type: 'income',
          amountCents: cents(500000),
          frequency: 'monthly',
        }),
        createCashFlowItem({
          id: 'expense',
          type: 'expense',
          amountCents: cents(200000),
          frequency: 'monthly',
        }),
      ],
      horizonYears: 5,
    }

    const result = runProjection(input)
    const year0 = result.yearlySnapshots[0]

    expect(year0.totalIncomeCents).toBe(6000000)
    expect(year0.totalExpensesCents).toBe(2400000)
  })

  it('should calculate net cash flow correctly', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      cashFlowItems: [
        createCashFlowItem({
          type: 'income',
          amountCents: cents(1000000),
          frequency: 'monthly',
          annualGrowthRatePercent: null,
        }),
        createCashFlowItem({
          id: 'expense',
          type: 'expense',
          amountCents: cents(300000),
          frequency: 'monthly',
          annualGrowthRatePercent: null,
        }),
      ],
      horizonYears: 5,
    }

    const result = runProjection(input)
    const year0 = result.yearlySnapshots[0]

    // Net cash flow = income - expenses - debt payments
    expect(year0.netCashFlowCents).toBe(12000000 - 3600000 - 0)
  })
})

// ============================================
// Net Worth Calculation Tests
// ============================================

describe('Net Worth calculation', () => {
  it('should calculate net worth as assets minus liabilities', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset({ currentValueCents: cents(50000000) })],
      liabilities: [
        createLiability({
          currentBalanceCents: cents(20000000),
          termMonths: 360,
        }),
      ],
      horizonYears: 5,
    }

    const result = runProjection(input)
    const year0 = result.yearlySnapshots[0]

    expect(year0.netWorthCents).toBe(year0.totalAssetsCents - year0.totalLiabilitiesCents)
  })

  it('should handle negative net worth', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset({ currentValueCents: cents(10000000) })],
      liabilities: [
        createLiability({
          currentBalanceCents: cents(50000000),
          termMonths: 360,
        }),
      ],
      horizonYears: 5,
    }

    const result = runProjection(input)
    expect(result.yearlySnapshots[0].netWorthCents).toBeLessThan(0)
  })
})

// ============================================
// Summary Calculation Tests
// ============================================

describe('Projection Summary', () => {
  it('should correctly calculate net worth change', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset({ currentValueCents: cents(10000000), annualGrowthRatePercent: 5 })],
      horizonYears: 10,
    }

    const result = runProjection(input)

    expect(result.summary.startingNetWorthCents).toBe(10000000)
    expect(result.summary.endingNetWorthCents).toBe(16288946)
    expect(result.summary.netWorthChangeCents).toBe(16288946 - 10000000)
  })

  it('should calculate percentage change correctly', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset({ currentValueCents: cents(10000000), annualGrowthRatePercent: 0 })],
      horizonYears: 5,
    }

    const result = runProjection(input)

    expect(result.summary.netWorthChangePercent).toBe(0)
  })

  it('should sum totals over entire period', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      cashFlowItems: [
        createCashFlowItem({
          type: 'income',
          amountCents: cents(100000),
          frequency: 'monthly',
          annualGrowthRatePercent: null,
        }),
      ],
      horizonYears: 5,
    }

    const result = runProjection(input)

    // 6 years (0-5) * $1,200/year = $7,200
    expect(result.summary.totalIncomeOverPeriodCents).toBe(1200000 * 6)
  })
})

// ============================================
// Input Validation Tests
// ============================================

describe('validateProjectionInput', () => {
  it('should accept valid input', () => {
    const input = createBaseInput()
    const result = validateProjectionInput(input)
    expect(result.valid).toBe(true)
  })

  it('should reject missing start date', () => {
    const input = { ...createBaseInput(), startDate: null as unknown as Date }
    const result = validateProjectionInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Start date')
  })

  it('should reject invalid start date', () => {
    const input = { ...createBaseInput(), startDate: new Date('invalid') }
    const result = validateProjectionInput(input)
    expect(result.valid).toBe(false)
  })

  it('should reject non-integer horizon', () => {
    const input = { ...createBaseInput(), horizonYears: 10.5 }
    const result = validateProjectionInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('integer')
  })

  it('should reject horizon below minimum', () => {
    const input = { ...createBaseInput(), horizonYears: MIN_HORIZON_YEARS - 1 }
    const result = validateProjectionInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain(String(MIN_HORIZON_YEARS))
  })

  it('should reject horizon above maximum', () => {
    const input = { ...createBaseInput(), horizonYears: MAX_HORIZON_YEARS + 1 }
    const result = validateProjectionInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain(String(MAX_HORIZON_YEARS))
  })

  it('should accept minimum horizon', () => {
    const input = { ...createBaseInput(), horizonYears: MIN_HORIZON_YEARS }
    const result = validateProjectionInput(input)
    expect(result.valid).toBe(true)
  })

  it('should accept maximum horizon', () => {
    const input = { ...createBaseInput(), horizonYears: MAX_HORIZON_YEARS }
    const result = validateProjectionInput(input)
    expect(result.valid).toBe(true)
  })

  it('should reject non-array assets', () => {
    const input = { ...createBaseInput(), assets: 'invalid' as unknown as [] }
    const result = validateProjectionInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Assets')
  })

  it('should reject non-array liabilities', () => {
    const input = { ...createBaseInput(), liabilities: {} as unknown as [] }
    const result = validateProjectionInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Liabilities')
  })

  it('should reject non-array cashFlowItems', () => {
    const input = { ...createBaseInput(), cashFlowItems: null as unknown as [] }
    const result = validateProjectionInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Cash flow')
  })
})

describe('runProjection validation', () => {
  it('should throw InvalidProjectionInputError for invalid input', () => {
    const input = { ...createBaseInput(), horizonYears: 100 }
    expect(() => runProjection(input)).toThrow(InvalidProjectionInputError)
  })
})

// ============================================
// Edge Cases
// ============================================

describe('Edge Cases', () => {
  it('should handle empty entities', () => {
    const input = createBaseInput()
    const result = runProjection(input)

    expect(result.yearlySnapshots.length).toBe(11) // 0-10
    expect(result.yearlySnapshots[0].netWorthCents).toBe(0)
    expect(result.summary.startingNetWorthCents).toBe(0)
  })

  it('should handle 5-year minimum horizon', () => {
    const input = { ...createBaseInput(), horizonYears: 5 }
    const result = runProjection(input)

    expect(result.yearlySnapshots.length).toBe(6) // 0-5
    expect(result.horizonYears).toBe(5)
  })

  it('should handle 30-year maximum horizon', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset()],
      horizonYears: 30,
    }
    const result = runProjection(input)

    expect(result.yearlySnapshots.length).toBe(31) // 0-30
    expect(result.horizonYears).toBe(30)
  })

  it('should handle paid-off liabilities correctly', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      liabilities: [
        createLiability({
          currentBalanceCents: cents(10000000),
          interestRatePercent: 5,
          termMonths: 24, // 2 year loan
        }),
      ],
      horizonYears: 10,
    }

    const result = runProjection(input)

    // After year 2, balance should be 0
    expect(result.yearlySnapshots[3].totalLiabilitiesCents).toBe(0)
    expect(result.yearlySnapshots[10].totalLiabilitiesCents).toBe(0)
  })

  it('should handle expired cash flow items', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      cashFlowItems: [
        createCashFlowItem({
          endDate: new Date('2024-06-01'),
        }),
      ],
      horizonYears: 5,
    }

    const result = runProjection(input)

    // Year 0 should have income, but later years should not
    expect(result.yearlySnapshots[0].totalIncomeCents).toBeGreaterThan(0)
    expect(result.yearlySnapshots[2].totalIncomeCents).toBe(0)
  })

  it('should handle zero growth rate assets', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset({ annualGrowthRatePercent: 0 })],
      horizonYears: 10,
    }

    const result = runProjection(input)

    // Value should remain constant
    for (let i = 0; i <= 10; i++) {
      expect(result.yearlySnapshots[i].totalAssetsCents).toBe(10000000)
    }
  })

  it('should handle very small amounts', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset({ currentValueCents: cents(1) })],
      horizonYears: 5,
    }

    const result = runProjection(input)
    expect(result.yearlySnapshots[0].totalAssetsCents).toBe(1)
  })

  it('should handle very large amounts', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset({ currentValueCents: cents(100000000000) })], // $1 billion
      horizonYears: 5,
    }

    const result = runProjection(input)
    expect(result.yearlySnapshots[5].totalAssetsCents).toBeGreaterThan(100000000000)
  })
})

// ============================================
// Scenario Integration Tests
// ============================================

describe('Scenario Integration', () => {
  it('should apply scenario overrides before projection', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset({ id: 'asset-1', annualGrowthRatePercent: 5 })],
      horizonYears: 5,
      scenario: {
        id: 'scenario-1',
        name: 'Optimistic',
        isBaseline: false,
        overrides: [
          {
            entityId: 'asset-1',
            targetType: 'asset',
            overrides: [{ fieldName: 'annualGrowthRatePercent', value: 10 }],
          },
        ],
      },
    }

    const result = runProjection(input)

    // With 10% growth instead of 5%
    // $100,000 at 10% for 5 years = $161,051
    expect(result.yearlySnapshots[5].totalAssetsCents).toBe(16105100)
  })

  it('should not modify original entities when applying scenario', () => {
    const originalAsset = createAsset({ annualGrowthRatePercent: 5 })
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [originalAsset],
      horizonYears: 5,
      scenario: {
        id: 'scenario-1',
        name: 'Test',
        isBaseline: false,
        overrides: [
          {
            entityId: originalAsset.id,
            targetType: 'asset',
            overrides: [{ fieldName: 'annualGrowthRatePercent', value: 20 }],
          },
        ],
      },
    }

    runProjection(input)

    // Original should be unchanged
    expect(originalAsset.annualGrowthRatePercent).toBe(5)
  })

  it('should project with baseline (no overrides) when scenario is empty', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset()],
      horizonYears: 5,
      scenario: {
        id: 'baseline',
        name: 'Baseline',
        isBaseline: true,
        overrides: [],
      },
    }

    const resultWithScenario = runProjection(input)
    const resultWithoutScenario = runProjection({ ...input, scenario: undefined })

    expect(resultWithScenario.summary.endingNetWorthCents).toBe(
      resultWithoutScenario.summary.endingNetWorthCents,
    )
  })
})

// ============================================
// Result Structure Tests
// ============================================

describe('Result Structure', () => {
  it('should include correct number of yearly snapshots', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      horizonYears: 10,
    }

    const result = runProjection(input)

    expect(result.yearlySnapshots.length).toBe(11) // 0 through 10
  })

  it('should include correct dates in snapshots', () => {
    const startDate = new Date(2024, 0, 1) // Jan 1, 2024 in local time
    const input: ProjectionInput = {
      ...createBaseInput(),
      startDate,
      horizonYears: 5,
    }

    const result = runProjection(input)

    expect(result.yearlySnapshots[0].date.getFullYear()).toBe(2024)
    expect(result.yearlySnapshots[5].date.getFullYear()).toBe(2029)
  })

  it('should include year numbers in snapshots', () => {
    const input = createBaseInput()
    const result = runProjection(input)

    for (let i = 0; i <= 10; i++) {
      expect(result.yearlySnapshots[i].year).toBe(i)
    }
  })

  it('should include asset and liability breakdowns', () => {
    const input: ProjectionInput = {
      ...createBaseInput(),
      assets: [createAsset({ id: 'a1' }), createAsset({ id: 'a2' })],
      liabilities: [createLiability({ id: 'l1' })],
      horizonYears: 5,
    }

    const result = runProjection(input)
    const year5 = result.yearlySnapshots[5]

    expect(year5.assetValues.length).toBe(2)
    expect(year5.liabilityBalances.length).toBe(1)
    expect(year5.assetValues.map((a) => a.id).sort()).toEqual(['a1', 'a2'])
    expect(year5.liabilityBalances[0].id).toBe('l1')
  })
})
