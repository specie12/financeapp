import {
  calculateRentVsBuy,
  validateRentVsBuyInput,
  mergeAssumptions,
  InvalidRentVsBuyInputError,
  DEFAULT_ASSUMPTIONS,
  MIN_PROJECTION_YEARS,
  MAX_PROJECTION_YEARS,
  type RentVsBuyInput,
  type BuyScenarioInput,
  type RentScenarioInput,
} from '../rent-vs-buy'
import { cents } from '../money/money'

// ============================================
// Test Helpers
// ============================================

function createBuyInput(overrides: Partial<BuyScenarioInput> = {}): BuyScenarioInput {
  return {
    homePriceCents: cents(40000000), // $400,000
    downPaymentPercent: 20,
    mortgageInterestRatePercent: 6.5,
    mortgageTermYears: 30,
    closingCostPercent: 3,
    homeownersInsuranceAnnualCents: cents(180000), // $1,800/year
    hoaMonthlyDuesCents: cents(0),
    ...overrides,
  }
}

function createRentInput(overrides: Partial<RentScenarioInput> = {}): RentScenarioInput {
  return {
    monthlyRentCents: cents(200000), // $2,000/month
    securityDepositMonths: 1,
    rentersInsuranceAnnualCents: cents(24000), // $240/year
    ...overrides,
  }
}

function createBaseInput(overrides: Partial<RentVsBuyInput> = {}): RentVsBuyInput {
  return {
    startDate: new Date(2024, 0, 1),
    projectionYears: 10,
    buy: createBuyInput(),
    rent: createRentInput(),
    ...overrides,
  }
}

// ============================================
// Input Validation Tests
// ============================================

describe('validateRentVsBuyInput', () => {
  it('should accept valid input', () => {
    const input = createBaseInput()
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(true)
  })

  it('should reject missing start date', () => {
    const input = { ...createBaseInput(), startDate: null as unknown as Date }
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Start date')
  })

  it('should reject invalid start date', () => {
    const input = { ...createBaseInput(), startDate: new Date('invalid') }
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(false)
  })

  it('should reject non-integer projection years', () => {
    const input = { ...createBaseInput(), projectionYears: 10.5 }
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('integer')
  })

  it('should reject projection years below minimum', () => {
    const input = { ...createBaseInput(), projectionYears: MIN_PROJECTION_YEARS - 1 }
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(false)
  })

  it('should reject projection years above maximum', () => {
    const input = { ...createBaseInput(), projectionYears: MAX_PROJECTION_YEARS + 1 }
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(false)
  })

  it('should accept minimum projection years', () => {
    const input = { ...createBaseInput(), projectionYears: MIN_PROJECTION_YEARS }
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(true)
  })

  it('should accept maximum projection years', () => {
    const input = { ...createBaseInput(), projectionYears: MAX_PROJECTION_YEARS }
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(true)
  })

  it('should reject invalid home price', () => {
    const input = createBaseInput({ buy: createBuyInput({ homePriceCents: cents(0) }) })
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Home price')
  })

  it('should reject negative down payment percent', () => {
    const input = createBaseInput({ buy: createBuyInput({ downPaymentPercent: -5 }) })
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Down payment')
  })

  it('should reject down payment percent over 100', () => {
    const input = createBaseInput({ buy: createBuyInput({ downPaymentPercent: 105 }) })
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Down payment')
  })

  it('should reject negative mortgage rate', () => {
    const input = createBaseInput({ buy: createBuyInput({ mortgageInterestRatePercent: -1 }) })
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Mortgage interest rate')
  })

  it('should reject invalid mortgage term', () => {
    const input = createBaseInput({ buy: createBuyInput({ mortgageTermYears: 0 }) })
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Mortgage term')
  })

  it('should reject invalid monthly rent', () => {
    const input = createBaseInput({ rent: createRentInput({ monthlyRentCents: cents(0) }) })
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Monthly rent')
  })

  it('should reject negative security deposit', () => {
    const input = createBaseInput({ rent: createRentInput({ securityDepositMonths: -1 }) })
    const result = validateRentVsBuyInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Security deposit')
  })
})

describe('calculateRentVsBuy validation', () => {
  it('should throw InvalidRentVsBuyInputError for invalid input', () => {
    const input = { ...createBaseInput(), projectionYears: 100 }
    expect(() => calculateRentVsBuy(input)).toThrow(InvalidRentVsBuyInputError)
  })
})

// ============================================
// Assumptions Tests
// ============================================

describe('mergeAssumptions', () => {
  it('should return defaults when no overrides provided', () => {
    const result = mergeAssumptions()
    expect(result).toEqual(DEFAULT_ASSUMPTIONS)
  })

  it('should return defaults when undefined provided', () => {
    const result = mergeAssumptions(undefined)
    expect(result).toEqual(DEFAULT_ASSUMPTIONS)
  })

  it('should merge partial overrides with defaults', () => {
    const result = mergeAssumptions({
      propertyAppreciationRatePercent: 5,
      investmentReturnRatePercent: 10,
    })

    expect(result.propertyAppreciationRatePercent).toBe(5)
    expect(result.investmentReturnRatePercent).toBe(10)
    expect(result.rentIncreaseRatePercent).toBe(DEFAULT_ASSUMPTIONS.rentIncreaseRatePercent)
    expect(result.propertyTaxRatePercent).toBe(DEFAULT_ASSUMPTIONS.propertyTaxRatePercent)
  })
})

// ============================================
// Buy Scenario Calculation Tests
// ============================================

describe('Buy Scenario Calculations', () => {
  it('should correctly calculate down payment', () => {
    const input = createBaseInput()
    const result = calculateRentVsBuy(input)

    // $400,000 × 20% = $80,000
    expect(result.summary.initialBuyCostsCents).toBeGreaterThanOrEqual(8000000 + 1200000) // Down + closing
  })

  it('should correctly calculate closing costs', () => {
    const input = createBaseInput({
      buy: createBuyInput({ closingCostPercent: 3 }),
    })
    const result = calculateRentVsBuy(input)

    // $400,000 × 3% = $12,000
    // Initial buy costs = down payment + closing = $80,000 + $12,000 = $92,000
    expect(result.summary.initialBuyCostsCents).toBe(9200000)
  })

  it('should correctly project home appreciation', () => {
    const input = createBaseInput({
      projectionYears: 10,
      assumptions: { propertyAppreciationRatePercent: 3 },
    })
    const result = calculateRentVsBuy(input)

    // $400,000 at 3% for 10 years = $537,566.55 (with Decimal.js precision)
    const year10 = result.yearlyComparisons[10]
    expect(year10?.buy.homeValueCents).toBe(53756655)
  })

  it('should correctly track mortgage balance decrease', () => {
    const input = createBaseInput({ projectionYears: 5 })
    const result = calculateRentVsBuy(input)

    // Mortgage balance should decrease each year
    for (let i = 1; i <= 5; i++) {
      const current = result.yearlyComparisons[i]!.buy.mortgageBalanceCents
      const previous = result.yearlyComparisons[i - 1]!.buy.mortgageBalanceCents
      expect(current).toBeLessThan(previous)
    }
  })

  it('should calculate home equity correctly', () => {
    const input = createBaseInput()
    const result = calculateRentVsBuy(input)

    for (const comparison of result.yearlyComparisons) {
      const expectedEquity = comparison.buy.homeValueCents - comparison.buy.mortgageBalanceCents
      expect(comparison.buy.homeEquityCents).toBe(expectedEquity)
    }
  })

  it('should calculate property taxes based on home value', () => {
    const input = createBaseInput({
      assumptions: { propertyTaxRatePercent: 1.2 },
    })
    const result = calculateRentVsBuy(input)

    const year0 = result.yearlyComparisons[0]!
    // $400,000 × 1.2% = $4,800
    expect(year0.buy.propertyTaxesCents).toBe(480000)
  })

  it('should calculate mortgage interest deduction', () => {
    const input = createBaseInput({
      assumptions: { marginalTaxRatePercent: 25 },
    })
    const result = calculateRentVsBuy(input)

    for (const comparison of result.yearlyComparisons) {
      // Deduction should be 25% of interest paid
      const expectedDeduction = Math.round(comparison.buy.interestPaidCents * 0.25)
      expect(comparison.buy.mortgageInterestDeductionCents).toBe(expectedDeduction)
    }
  })
})

// ============================================
// Rent Scenario Calculation Tests
// ============================================

describe('Rent Scenario Calculations', () => {
  it('should correctly project rent increases', () => {
    const input = createBaseInput({
      projectionYears: 5,
      rent: createRentInput({ monthlyRentCents: cents(200000) }),
      assumptions: { rentIncreaseRatePercent: 3 },
    })
    const result = calculateRentVsBuy(input)

    // Year 0: $2,000/mo
    expect(result.yearlyComparisons[0]!.rent.monthlyRentCents).toBe(200000)

    // Year 5: $2,000 × (1.03)^5 = $2,318.55
    expect(result.yearlyComparisons[5]!.rent.monthlyRentCents).toBe(231855)
  })

  it('should correctly model investment of down payment', () => {
    const input = createBaseInput({
      projectionYears: 10,
      buy: createBuyInput({
        homePriceCents: cents(40000000),
        downPaymentPercent: 20,
        closingCostPercent: 3,
      }),
      assumptions: { investmentReturnRatePercent: 7 },
    })
    const result = calculateRentVsBuy(input)

    // Initial investment = $80,000 + $12,000 = $92,000
    // At 7% for 10 years: $92,000 × (1.07)^10 = $180,977.92 (with Decimal.js precision)
    expect(result.yearlyComparisons[10]!.rent.investmentBalanceCents).toBe(18097792)
  })

  it('should track investment gains yearly', () => {
    const input = createBaseInput({
      projectionYears: 5,
      assumptions: { investmentReturnRatePercent: 7 },
    })
    const result = calculateRentVsBuy(input)

    // Year 0 should have no gains
    expect(result.yearlyComparisons[0]!.rent.investmentGainsCents).toBe(0)

    // Subsequent years should have positive gains
    for (let i = 1; i <= 5; i++) {
      expect(result.yearlyComparisons[i]!.rent.investmentGainsCents).toBeGreaterThan(0)
    }
  })

  it('should include security deposit in year 0 costs', () => {
    const input = createBaseInput({
      rent: createRentInput({
        monthlyRentCents: cents(200000),
        securityDepositMonths: 2,
      }),
    })
    const result = calculateRentVsBuy(input)

    // Year 0 rent costs should include security deposit
    // Security deposit = $2,000 × 2 = $4,000
    expect(result.summary.initialRentCostsCents).toBe(400000)
  })
})

// ============================================
// Net Worth Comparison Tests
// ============================================

describe('Net Worth Comparison', () => {
  it('should calculate buy net worth as home equity', () => {
    const input = createBaseInput()
    const result = calculateRentVsBuy(input)

    for (const comparison of result.yearlyComparisons) {
      expect(comparison.buyNetWorthCents).toBe(comparison.buy.homeEquityCents)
    }
  })

  it('should calculate rent net worth as investment balance', () => {
    const input = createBaseInput()
    const result = calculateRentVsBuy(input)

    for (const comparison of result.yearlyComparisons) {
      expect(comparison.rentNetWorthCents).toBe(comparison.rent.investmentBalanceCents)
    }
  })

  it('should correctly calculate net worth difference', () => {
    const input = createBaseInput()
    const result = calculateRentVsBuy(input)

    for (const comparison of result.yearlyComparisons) {
      const expectedDiff = comparison.buyNetWorthCents - comparison.rentNetWorthCents
      expect(comparison.netWorthDifferenceCents).toBe(expectedDiff)
    }
  })

  it('should correctly identify break-even year', () => {
    const input = createBaseInput({
      projectionYears: 15,
      // Standard scenario should have a break-even
    })
    const result = calculateRentVsBuy(input)

    if (result.summary.breakEvenYear !== null) {
      // Before break-even, renting should be better
      for (let i = 1; i < result.summary.breakEvenYear; i++) {
        expect(result.yearlyComparisons[i]!.buyIsBetterThisYear).toBe(false)
      }

      // At and after break-even, buying should be better
      expect(result.yearlyComparisons[result.summary.breakEvenYear]!.buyIsBetterThisYear).toBe(true)
    }
  })
})

// ============================================
// Opportunity Cost Modeling Tests
// ============================================

describe('Opportunity Cost Modeling', () => {
  it('should show renting advantage when investment returns exceed appreciation', () => {
    const input = createBaseInput({
      projectionYears: 5,
      assumptions: {
        propertyAppreciationRatePercent: 2, // Low appreciation
        investmentReturnRatePercent: 10, // High investment returns
      },
    })
    const result = calculateRentVsBuy(input)

    // With high investment returns and low appreciation, renting should be advantageous
    expect(result.summary.recommendation).toBe('rent')
  })

  it('should show buying advantage when appreciation exceeds investment returns', () => {
    const input = createBaseInput({
      projectionYears: 15, // Longer period for buying to win
      assumptions: {
        propertyAppreciationRatePercent: 6, // High appreciation
        investmentReturnRatePercent: 4, // Low investment returns
      },
    })
    const result = calculateRentVsBuy(input)

    // With high appreciation and low investment returns, buying should be advantageous
    expect(result.summary.recommendation).toBe('buy')
  })

  it('should track total investment gains', () => {
    const input = createBaseInput({
      projectionYears: 10,
      assumptions: { investmentReturnRatePercent: 7 },
    })
    const result = calculateRentVsBuy(input)

    // Total investment gains should be positive
    expect(result.summary.totalInvestmentGainsCents).toBeGreaterThan(0)

    // Investment gains = final balance - initial investment
    const initialInvestment = result.summary.initialBuyCostsCents
    const finalBalance = result.summary.finalInvestmentBalanceCents
    expect(result.summary.totalInvestmentGainsCents).toBe(finalBalance - initialInvestment)
  })
})

// ============================================
// Edge Cases
// ============================================

describe('Edge Cases', () => {
  it('should handle 0% down payment', () => {
    const input = createBaseInput({
      buy: createBuyInput({ downPaymentPercent: 0 }),
    })
    const result = calculateRentVsBuy(input)

    // Should work without errors
    expect(result.yearlyComparisons.length).toBe(11)

    // Full home price should be mortgaged (balance after year 0 is slightly lower due to payments)
    const year0 = result.yearlyComparisons[0]!
    // Initial loan is $400,000, but by end of year 0, some principal has been paid
    expect(year0.buy.mortgageBalanceCents).toBeLessThan(40000000)
    expect(year0.buy.mortgageBalanceCents).toBeGreaterThan(39000000) // Reasonable range
  })

  it('should handle 100% down payment (no mortgage)', () => {
    const input = createBaseInput({
      buy: createBuyInput({ downPaymentPercent: 100 }),
    })
    const result = calculateRentVsBuy(input)

    // No mortgage payments should exist
    for (const comparison of result.yearlyComparisons) {
      expect(comparison.buy.mortgageBalanceCents).toBe(0)
      expect(comparison.buy.interestPaidCents).toBe(0)
    }

    // Home equity should equal home value
    for (const comparison of result.yearlyComparisons) {
      expect(comparison.buy.homeEquityCents).toBe(comparison.buy.homeValueCents)
    }
  })

  it('should handle 0% mortgage interest rate', () => {
    const input = createBaseInput({
      buy: createBuyInput({ mortgageInterestRatePercent: 0 }),
    })
    const result = calculateRentVsBuy(input)

    // All payments should be principal only
    for (const comparison of result.yearlyComparisons) {
      expect(comparison.buy.interestPaidCents).toBe(0)
    }
  })

  it('should handle 0% rent increase', () => {
    const input = createBaseInput({
      projectionYears: 10,
      rent: createRentInput({ rentIncreaseRateOverride: 0 }),
    })
    const result = calculateRentVsBuy(input)

    // Rent should stay constant
    const year0Rent = result.yearlyComparisons[0]!.rent.monthlyRentCents
    for (const comparison of result.yearlyComparisons) {
      expect(comparison.rent.monthlyRentCents).toBe(year0Rent)
    }
  })

  it('should handle equal investment and appreciation rates', () => {
    const input = createBaseInput({
      assumptions: {
        propertyAppreciationRatePercent: 5,
        investmentReturnRatePercent: 5,
      },
    })
    const result = calculateRentVsBuy(input)

    // Should produce valid results
    expect(result.yearlyComparisons.length).toBeGreaterThan(0)
  })

  it('should handle very short projection (1 year)', () => {
    const input = createBaseInput({ projectionYears: 1 })
    const result = calculateRentVsBuy(input)

    expect(result.yearlyComparisons.length).toBe(2) // Year 0 and Year 1
    expect(result.summary.recommendation).toBeDefined()
  })

  it('should handle very long projection (30 years)', () => {
    const input = createBaseInput({ projectionYears: 30 })
    const result = calculateRentVsBuy(input)

    expect(result.yearlyComparisons.length).toBe(31) // Years 0-30
    expect(result.summary.recommendation).toBeDefined()
  })

  it('should handle no HOA dues', () => {
    const input = createBaseInput({
      buy: createBuyInput({ hoaMonthlyDuesCents: cents(0) }),
    })
    const result = calculateRentVsBuy(input)

    for (const comparison of result.yearlyComparisons) {
      expect(comparison.buy.hoaDuesCents).toBe(0)
    }
  })

  it('should handle high HOA dues', () => {
    const input = createBaseInput({
      buy: createBuyInput({ hoaMonthlyDuesCents: cents(50000) }), // $500/month
    })
    const result = calculateRentVsBuy(input)

    // Year 0: $500 × 12 = $6,000
    expect(result.yearlyComparisons[0]!.buy.hoaDuesCents).toBe(600000)
  })

  it('should handle property tax rate override', () => {
    const input = createBaseInput({
      buy: createBuyInput({ propertyTaxRateOverride: 2.5 }),
    })
    const result = calculateRentVsBuy(input)

    // Year 0: $400,000 × 2.5% = $10,000
    expect(result.yearlyComparisons[0]!.buy.propertyTaxesCents).toBe(1000000)
  })

  it('should handle maintenance rate override', () => {
    const input = createBaseInput({
      buy: createBuyInput({ maintenanceRateOverride: 2 }),
    })
    const result = calculateRentVsBuy(input)

    // Year 0: $400,000 × 2% = $8,000
    expect(result.yearlyComparisons[0]!.buy.maintenanceCents).toBe(800000)
  })
})

// ============================================
// Summary Statistics Tests
// ============================================

describe('Summary Statistics', () => {
  it('should calculate total costs correctly', () => {
    const input = createBaseInput()
    const result = calculateRentVsBuy(input)

    // Total buy costs should match cumulative
    expect(result.summary.totalBuyCostsCents).toBe(
      result.yearlyComparisons[result.yearlyComparisons.length - 1]!.buy.cumulativeCostsCents,
    )

    // Total rent costs should match cumulative
    expect(result.summary.totalRentCostsCents).toBe(
      result.yearlyComparisons[result.yearlyComparisons.length - 1]!.rent.cumulativeCostsCents,
    )
  })

  it('should track years buying vs renting is better', () => {
    const input = createBaseInput()
    const result = calculateRentVsBuy(input)

    const totalYears = result.summary.yearsBuyingIsBetter + result.summary.yearsRentingIsBetter
    expect(totalYears).toBe(result.yearlyComparisons.length)
  })

  it('should calculate final net worth with selling costs', () => {
    const input = createBaseInput({
      assumptions: { sellingCostPercent: 6 },
    })
    const result = calculateRentVsBuy(input)

    const lastComparison = result.yearlyComparisons[result.yearlyComparisons.length - 1]!
    const expectedSellingCosts = Math.round(lastComparison.buy.homeValueCents * 0.06)
    const expectedBuyNetWorth = lastComparison.buy.homeEquityCents - expectedSellingCosts

    expect(result.summary.finalBuyNetWorthCents).toBe(expectedBuyNetWorth)
  })

  it('should generate correct recommendation', () => {
    const buyInput = createBaseInput({
      projectionYears: 20,
      assumptions: { propertyAppreciationRatePercent: 5 },
    })
    const buyResult = calculateRentVsBuy(buyInput)

    if (buyResult.summary.netWorthAdvantageCents > 0) {
      expect(buyResult.summary.recommendation).toBe('buy')
    } else if (buyResult.summary.netWorthAdvantageCents < 0) {
      expect(buyResult.summary.recommendation).toBe('rent')
    } else {
      expect(buyResult.summary.recommendation).toBe('neutral')
    }
  })

  it('should sum mortgage interest correctly', () => {
    const input = createBaseInput()
    const result = calculateRentVsBuy(input)

    let expectedTotal = 0
    for (const comparison of result.yearlyComparisons) {
      expectedTotal += comparison.buy.interestPaidCents
    }

    expect(result.summary.totalMortgageInterestPaidCents).toBe(expectedTotal)
  })

  it('should sum property taxes correctly', () => {
    const input = createBaseInput()
    const result = calculateRentVsBuy(input)

    let expectedTotal = 0
    for (const comparison of result.yearlyComparisons) {
      expectedTotal += comparison.buy.propertyTaxesCents
    }

    expect(result.summary.totalPropertyTaxesPaidCents).toBe(expectedTotal)
  })

  it('should sum rent correctly', () => {
    const input = createBaseInput()
    const result = calculateRentVsBuy(input)

    let expectedTotal = 0
    for (const comparison of result.yearlyComparisons) {
      expectedTotal += comparison.rent.annualRentCents
    }

    expect(result.summary.totalRentPaidCents).toBe(expectedTotal)
  })
})

// ============================================
// Determinism Tests
// ============================================

describe('Determinism', () => {
  it('should produce identical results for same input', () => {
    const input = createBaseInput()

    const result1 = calculateRentVsBuy(input)
    const result2 = calculateRentVsBuy(input)

    expect(result1).toEqual(result2)
  })

  it('should be reproducible across 100 calls', () => {
    const input = createBaseInput()

    const results = Array.from({ length: 100 }, () => calculateRentVsBuy(input))
    const uniqueResults = new Set(results.map((r) => JSON.stringify(r)))

    expect(uniqueResults.size).toBe(1)
  })

  it('should produce same results with equivalent inputs', () => {
    const input1 = createBaseInput()
    const input2 = {
      ...createBaseInput(),
      startDate: new Date(2024, 0, 1), // Same date, different object
    }

    const result1 = calculateRentVsBuy(input1)
    const result2 = calculateRentVsBuy(input2)

    expect(result1.summary).toEqual(result2.summary)
  })
})

// ============================================
// Result Structure Tests
// ============================================

describe('Result Structure', () => {
  it('should include correct number of yearly comparisons', () => {
    const input = createBaseInput({ projectionYears: 10 })
    const result = calculateRentVsBuy(input)

    expect(result.yearlyComparisons.length).toBe(11) // 0 through 10
  })

  it('should include correct dates in comparisons', () => {
    const startDate = new Date(2024, 0, 1)
    const input = createBaseInput({ startDate, projectionYears: 5 })
    const result = calculateRentVsBuy(input)

    expect(result.yearlyComparisons[0]!.date.getFullYear()).toBe(2024)
    expect(result.yearlyComparisons[5]!.date.getFullYear()).toBe(2029)
  })

  it('should include year numbers in comparisons', () => {
    const input = createBaseInput({ projectionYears: 10 })
    const result = calculateRentVsBuy(input)

    for (let i = 0; i <= 10; i++) {
      expect(result.yearlyComparisons[i]!.year).toBe(i)
    }
  })

  it('should include effective assumptions in result', () => {
    const input = createBaseInput({
      assumptions: { propertyAppreciationRatePercent: 5 },
    })
    const result = calculateRentVsBuy(input)

    expect(result.effectiveAssumptions.propertyAppreciationRatePercent).toBe(5)
    expect(result.effectiveAssumptions.rentIncreaseRatePercent).toBe(
      DEFAULT_ASSUMPTIONS.rentIncreaseRatePercent,
    )
  })

  it('should include original input in result', () => {
    const input = createBaseInput()
    const result = calculateRentVsBuy(input)

    expect(result.input).toEqual(input)
  })
})
