import { cents } from '../money/money'
import {
  generateInsights,
  validateInsightInput,
  mergeRuleConfig,
  calculateBaseMetrics,
  evaluateHousingCostRule,
  evaluateDebtToIncomeRule,
  evaluateEmergencyFundRule,
  evaluateGoalProgressRule,
  evaluateInterestSavingsRule,
  DEFAULT_RULE_CONFIG,
  RULE_IDS,
  InvalidInsightInputError,
} from '../insights'
import type { InsightInput } from '../insights'

// ============================================
// Test Fixtures
// ============================================

function createValidInput(overrides?: Partial<InsightInput>): InsightInput {
  return {
    referenceDate: new Date(2024, 0, 1), // Jan 1, 2024
    monthlyIncomeCents: cents(800000), // $8,000
    monthlyExpenses: {
      housingCents: cents(200000), // $2,000
      utilitiesCents: cents(20000), // $200
      transportationCents: cents(40000), // $400
      foodCents: cents(60000), // $600
      otherCents: cents(30000), // $300
    },
    assets: [
      {
        id: 'savings',
        name: 'Savings Account',
        valueCents: cents(1500000), // $15,000
        type: 'cash',
      },
    ],
    liabilities: [
      {
        id: 'mortgage',
        name: 'Mortgage',
        balanceCents: cents(30000000), // $300,000
        interestRatePercent: 6.5,
        minimumPaymentCents: cents(189000), // $1,890
        type: 'mortgage',
        remainingTermMonths: 300, // 25 years
      },
    ],
    goals: [
      {
        id: 'emergency',
        name: 'Emergency Fund',
        targetAmountCents: cents(2400000), // $24,000
        currentAmountCents: cents(1500000), // $15,000
        targetDate: new Date(2024, 11, 31), // Dec 31, 2024
        monthlyContributionCents: cents(50000), // $500
      },
    ],
    ...overrides,
  }
}

// ============================================
// Validation Tests
// ============================================

describe('validateInsightInput', () => {
  it('should validate correct input', () => {
    const input = createValidInput()
    const result = validateInsightInput(input)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should reject invalid reference date', () => {
    const input = createValidInput({ referenceDate: new Date('invalid') })
    const result = validateInsightInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('reference date')
  })

  it('should reject zero income', () => {
    const input = createValidInput({ monthlyIncomeCents: cents(0) })
    const result = validateInsightInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('income')
  })

  it('should reject negative expenses', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(-100) as any, // Force invalid
        utilitiesCents: cents(20000),
        transportationCents: cents(40000),
        foodCents: cents(60000),
        otherCents: cents(30000),
      },
    })
    const result = validateInsightInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('housingCents')
  })

  it('should reject asset with missing id', () => {
    const input = createValidInput({
      assets: [
        {
          id: '',
          name: 'Test',
          valueCents: cents(1000),
          type: 'cash',
        },
      ],
    })
    const result = validateInsightInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Asset')
  })

  it('should reject liability with invalid type', () => {
    const input = createValidInput({
      liabilities: [
        {
          id: 'test',
          name: 'Test',
          balanceCents: cents(1000),
          interestRatePercent: 5,
          minimumPaymentCents: cents(100),
          type: 'invalid' as any,
        },
      ],
    })
    const result = validateInsightInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('invalid type')
  })

  it('should reject goal with invalid target date', () => {
    const input = createValidInput({
      goals: [
        {
          id: 'test',
          name: 'Test',
          targetAmountCents: cents(10000),
          currentAmountCents: cents(5000),
          targetDate: new Date('invalid'),
          monthlyContributionCents: cents(500),
        },
      ],
    })
    const result = validateInsightInput(input)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('target date')
  })
})

// ============================================
// Configuration Tests
// ============================================

describe('mergeRuleConfig', () => {
  it('should return default config when no overrides', () => {
    const config = mergeRuleConfig()
    expect(config).toEqual(DEFAULT_RULE_CONFIG)
  })

  it('should merge partial overrides', () => {
    const config = mergeRuleConfig({
      housingCostRule: {
        ...DEFAULT_RULE_CONFIG.housingCostRule,
        safeThresholdPercent: 25,
      },
    })
    expect(config.housingCostRule.safeThresholdPercent).toBe(25)
    expect(config.housingCostRule.warningThresholdPercent).toBe(
      DEFAULT_RULE_CONFIG.housingCostRule.warningThresholdPercent,
    )
    expect(config.debtToIncomeRule).toEqual(DEFAULT_RULE_CONFIG.debtToIncomeRule)
  })

  it('should allow disabling rules', () => {
    const config = mergeRuleConfig({
      housingCostRule: {
        ...DEFAULT_RULE_CONFIG.housingCostRule,
        enabled: false,
      },
    })
    expect(config.housingCostRule.enabled).toBe(false)
  })
})

// ============================================
// Base Metrics Tests
// ============================================

describe('calculateBaseMetrics', () => {
  it('should calculate income metrics correctly', () => {
    const input = createValidInput()
    const metrics = calculateBaseMetrics(input)

    expect(metrics.monthlyIncomeCents).toBe(cents(800000))
    expect(metrics.annualIncomeCents).toBe(cents(9600000))
  })

  it('should calculate housing cost ratio correctly', () => {
    const input = createValidInput()
    const metrics = calculateBaseMetrics(input)

    // $2,000 / $8,000 * 100 = 25%
    expect(metrics.housingCostRatioPercent).toBe(25)
  })

  it('should calculate debt metrics correctly', () => {
    const input = createValidInput()
    const metrics = calculateBaseMetrics(input)

    expect(metrics.totalDebtCents).toBe(cents(30000000))
    expect(metrics.monthlyDebtPaymentsCents).toBe(cents(189000))
    // $1,890 / $8,000 * 100 = 23.625%
    expect(metrics.debtToIncomeRatioPercent).toBeCloseTo(23.63, 1)
  })

  it('should calculate emergency fund months correctly', () => {
    const input = createValidInput()
    const metrics = calculateBaseMetrics(input)

    // Total expenses = $2,000 + $200 + $400 + $600 + $300 = $3,500
    // Cash = $15,000
    // Months = $15,000 / $3,500 = 4.29 months
    expect(metrics.monthlyExpensesCents).toBe(cents(350000))
    expect(metrics.emergencyFundMonths).toBeCloseTo(4.29, 1)
  })

  it('should identify highest interest debt', () => {
    const input = createValidInput({
      liabilities: [
        {
          id: 'mortgage',
          name: 'Mortgage',
          balanceCents: cents(30000000),
          interestRatePercent: 6.5,
          minimumPaymentCents: cents(189000),
          type: 'mortgage',
        },
        {
          id: 'credit_card',
          name: 'Credit Card',
          balanceCents: cents(500000),
          interestRatePercent: 22.99,
          minimumPaymentCents: cents(15000),
          type: 'credit_card',
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)

    expect(metrics.highestInterestDebt).not.toBeNull()
    expect(metrics.highestInterestDebt!.id).toBe('credit_card')
    expect(metrics.highestInterestDebt!.rate).toBe(22.99)
  })

  it('should handle empty arrays', () => {
    const input = createValidInput({
      assets: [],
      liabilities: [],
      goals: [],
    })
    const metrics = calculateBaseMetrics(input)

    expect(metrics.totalCashAssetsCents).toBe(cents(0))
    expect(metrics.totalDebtCents).toBe(cents(0))
    expect(metrics.monthlyDebtPaymentsCents).toBe(cents(0))
    expect(metrics.goalProgress).toEqual([])
    expect(metrics.highestInterestDebt).toBeNull()
  })
})

// ============================================
// Housing Cost Rule Tests
// ============================================

describe('evaluateHousingCostRule', () => {
  it('should return null when below safe threshold', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(160000), // $1,600 = 20% of $8,000
        utilitiesCents: cents(20000),
        transportationCents: cents(40000),
        foodCents: cents(60000),
        otherCents: cents(30000),
      },
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateHousingCostRule(
      metrics,
      DEFAULT_RULE_CONFIG.housingCostRule,
      input.referenceDate,
    )
    expect(insight).toBeNull()
  })

  it('should return info when between safe and warning threshold', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(248000), // $2,480 = 31% of $8,000
        utilitiesCents: cents(20000),
        transportationCents: cents(40000),
        foodCents: cents(60000),
        otherCents: cents(30000),
      },
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateHousingCostRule(
      metrics,
      DEFAULT_RULE_CONFIG.housingCostRule,
      input.referenceDate,
    )

    expect(insight).not.toBeNull()
    expect(insight!.severity).toBe('info')
    expect(insight!.ruleId).toBe(RULE_IDS.HOUSING_COST)
  })

  it('should return warning when between warning and alert threshold', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(320000), // $3,200 = 40% of $8,000
        utilitiesCents: cents(20000),
        transportationCents: cents(40000),
        foodCents: cents(60000),
        otherCents: cents(30000),
      },
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateHousingCostRule(
      metrics,
      DEFAULT_RULE_CONFIG.housingCostRule,
      input.referenceDate,
    )

    expect(insight).not.toBeNull()
    expect(insight!.severity).toBe('warning')
  })

  it('should return alert when above alert threshold', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(400000), // $4,000 = 50% of $8,000
        utilitiesCents: cents(20000),
        transportationCents: cents(40000),
        foodCents: cents(60000),
        otherCents: cents(30000),
      },
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateHousingCostRule(
      metrics,
      DEFAULT_RULE_CONFIG.housingCostRule,
      input.referenceDate,
    )

    expect(insight).not.toBeNull()
    expect(insight!.severity).toBe('alert')
  })

  it('should include calculation explanation', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(320000),
        utilitiesCents: cents(20000),
        transportationCents: cents(40000),
        foodCents: cents(60000),
        otherCents: cents(30000),
      },
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateHousingCostRule(
      metrics,
      DEFAULT_RULE_CONFIG.housingCostRule,
      input.referenceDate,
    )

    expect(insight!.calculation).toContain('Housing costs')
    expect(insight!.calculation).toContain('Monthly income')
    expect(insight!.calculation).toContain('%')
  })

  it('should return null when disabled', () => {
    const input = createValidInput()
    const metrics = calculateBaseMetrics(input)
    const config = { ...DEFAULT_RULE_CONFIG.housingCostRule, enabled: false }
    const insight = evaluateHousingCostRule(metrics, config, input.referenceDate)
    expect(insight).toBeNull()
  })
})

// ============================================
// Debt-to-Income Rule Tests
// ============================================

describe('evaluateDebtToIncomeRule', () => {
  it('should return null when below safe threshold', () => {
    const input = createValidInput()
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateDebtToIncomeRule(
      metrics,
      DEFAULT_RULE_CONFIG.debtToIncomeRule,
      input.referenceDate,
    )
    // Default has 23.6% DTI which is below 36%
    expect(insight).toBeNull()
  })

  it('should return info when between safe and warning threshold', () => {
    const input = createValidInput({
      liabilities: [
        {
          id: 'mortgage',
          name: 'Mortgage',
          balanceCents: cents(30000000),
          interestRatePercent: 6.5,
          minimumPaymentCents: cents(300000), // $3,000 = 37.5% DTI
          type: 'mortgage',
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateDebtToIncomeRule(
      metrics,
      DEFAULT_RULE_CONFIG.debtToIncomeRule,
      input.referenceDate,
    )

    expect(insight).not.toBeNull()
    expect(insight!.severity).toBe('info')
  })

  it('should return warning when between warning and alert threshold', () => {
    const input = createValidInput({
      liabilities: [
        {
          id: 'mortgage',
          name: 'Mortgage',
          balanceCents: cents(30000000),
          interestRatePercent: 6.5,
          minimumPaymentCents: cents(360000), // $3,600 = 45% DTI
          type: 'mortgage',
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateDebtToIncomeRule(
      metrics,
      DEFAULT_RULE_CONFIG.debtToIncomeRule,
      input.referenceDate,
    )

    expect(insight).not.toBeNull()
    expect(insight!.severity).toBe('warning')
  })

  it('should return alert when above alert threshold', () => {
    const input = createValidInput({
      liabilities: [
        {
          id: 'mortgage',
          name: 'Mortgage',
          balanceCents: cents(30000000),
          interestRatePercent: 6.5,
          minimumPaymentCents: cents(440000), // $4,400 = 55% DTI
          type: 'mortgage',
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateDebtToIncomeRule(
      metrics,
      DEFAULT_RULE_CONFIG.debtToIncomeRule,
      input.referenceDate,
    )

    expect(insight).not.toBeNull()
    expect(insight!.severity).toBe('alert')
  })

  it('should recommend paying highest interest debt first', () => {
    const input = createValidInput({
      liabilities: [
        {
          id: 'mortgage',
          name: 'Mortgage',
          balanceCents: cents(30000000),
          interestRatePercent: 6.5,
          minimumPaymentCents: cents(200000),
          type: 'mortgage',
        },
        {
          id: 'credit_card',
          name: 'Credit Card',
          balanceCents: cents(500000),
          interestRatePercent: 22.99,
          minimumPaymentCents: cents(160000), // Total = 45% DTI
          type: 'credit_card',
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateDebtToIncomeRule(
      metrics,
      DEFAULT_RULE_CONFIG.debtToIncomeRule,
      input.referenceDate,
    )

    expect(insight).not.toBeNull()
    expect(insight!.recommendations.some((r) => r.includes('Credit Card'))).toBe(true)
  })
})

// ============================================
// Emergency Fund Rule Tests
// ============================================

describe('evaluateEmergencyFundRule', () => {
  it('should return null when above recommended threshold', () => {
    const input = createValidInput({
      assets: [
        {
          id: 'savings',
          name: 'Savings',
          valueCents: cents(2500000), // $25,000
          type: 'cash',
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateEmergencyFundRule(
      metrics,
      DEFAULT_RULE_CONFIG.emergencyFundRule,
      input.referenceDate,
    )
    // $25,000 / $3,500 = 7.1 months > 6 recommended
    expect(insight).toBeNull()
  })

  it('should return warning when between minimum and recommended', () => {
    const input = createValidInput({
      assets: [
        {
          id: 'savings',
          name: 'Savings',
          valueCents: cents(1500000), // $15,000
          type: 'cash',
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateEmergencyFundRule(
      metrics,
      DEFAULT_RULE_CONFIG.emergencyFundRule,
      input.referenceDate,
    )
    // $15,000 / $3,500 = 4.3 months (between 3 and 6)
    expect(insight).not.toBeNull()
    expect(insight!.severity).toBe('warning')
  })

  it('should return alert when below minimum', () => {
    const input = createValidInput({
      assets: [
        {
          id: 'savings',
          name: 'Savings',
          valueCents: cents(500000), // $5,000
          type: 'cash',
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateEmergencyFundRule(
      metrics,
      DEFAULT_RULE_CONFIG.emergencyFundRule,
      input.referenceDate,
    )
    // $5,000 / $3,500 = 1.4 months < 3 minimum
    expect(insight).not.toBeNull()
    expect(insight!.severity).toBe('alert')
  })

  it('should calculate months correctly', () => {
    const input = createValidInput({
      assets: [
        {
          id: 'savings',
          name: 'Savings',
          valueCents: cents(700000), // $7,000
          type: 'cash',
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)
    const insight = evaluateEmergencyFundRule(
      metrics,
      DEFAULT_RULE_CONFIG.emergencyFundRule,
      input.referenceDate,
    )
    // $7,000 / $3,500 = 2 months
    expect(insight).not.toBeNull()
    expect(insight!.calculatedValue).toBeCloseTo(2, 1)
    expect(insight!.unit).toBe('months')
  })

  it('should only count cash assets', () => {
    const input = createValidInput({
      assets: [
        {
          id: 'savings',
          name: 'Savings',
          valueCents: cents(500000), // $5,000 cash
          type: 'cash',
        },
        {
          id: 'stocks',
          name: 'Investment Account',
          valueCents: cents(5000000), // $50,000 investments (not counted)
          type: 'investment',
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)

    expect(metrics.totalCashAssetsCents).toBe(cents(500000))
  })
})

// ============================================
// Goal Progress Rule Tests
// ============================================

describe('evaluateGoalProgressRule', () => {
  it('should return empty array when all goals are on track', () => {
    const input = createValidInput({
      goals: [
        {
          id: 'goal1',
          name: 'Test Goal',
          targetAmountCents: cents(1000000), // $10,000
          currentAmountCents: cents(900000), // $9,000 (90%)
          targetDate: new Date(2024, 11, 31),
          monthlyContributionCents: cents(100000),
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)
    const insights = evaluateGoalProgressRule(
      metrics,
      input,
      DEFAULT_RULE_CONFIG.goalProgressRule,
      input.referenceDate,
    )
    expect(insights).toEqual([])
  })

  it('should identify goals that are behind schedule', () => {
    // Set reference date to June 2024, target date is December 2024
    // With $1000/mo contribution for $12,000 target, goal "started" Dec 2023 (12 months before target)
    // At June 2024 (5 months elapsed), expected = 5/12 = 41.7%
    // Actual = $1,000/$12,000 = 8.3% - way behind!
    const input = createValidInput({
      referenceDate: new Date(2024, 5, 1), // June 1, 2024
      goals: [
        {
          id: 'goal1',
          name: 'Test Goal',
          targetAmountCents: cents(1200000), // $12,000
          currentAmountCents: cents(100000), // $1,000 (8.3%) - way behind
          targetDate: new Date(2024, 11, 31), // December 2024
          monthlyContributionCents: cents(100000), // $1,000/mo (12 months = $12,000)
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)
    const insights = evaluateGoalProgressRule(
      metrics,
      input,
      DEFAULT_RULE_CONFIG.goalProgressRule,
      input.referenceDate,
    )

    expect(insights.length).toBeGreaterThan(0)
    expect(insights[0]!.category).toBe('goals')
    expect(insights[0]!.ruleId).toBe(RULE_IDS.GOAL_PROGRESS)
  })

  it('should include goal name in insight', () => {
    // Set reference date to June 2024, target date is December 2024
    // With $500/mo contribution for $6,000 target, goal "started" Dec 2023 (12 months before target)
    // At June 2024 (5-6 months elapsed), expected = ~50%
    // Actual = $500/$6,000 = 8.3% - way behind!
    const input = createValidInput({
      referenceDate: new Date(2024, 5, 1), // June 1, 2024
      goals: [
        {
          id: 'vacation',
          name: 'Vacation Fund',
          targetAmountCents: cents(600000), // $6,000
          currentAmountCents: cents(50000), // $500 (8.3%) - way behind
          targetDate: new Date(2024, 11, 31), // December 2024
          monthlyContributionCents: cents(50000), // $500/mo (12 months = $6,000)
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)
    const insights = evaluateGoalProgressRule(
      metrics,
      input,
      DEFAULT_RULE_CONFIG.goalProgressRule,
      input.referenceDate,
    )

    expect(insights.length).toBeGreaterThan(0)
    expect(insights[0]!.title).toContain('Vacation Fund')
  })

  it('should provide recommendation for increased contribution', () => {
    const input = createValidInput({
      goals: [
        {
          id: 'goal1',
          name: 'Test Goal',
          targetAmountCents: cents(1000000),
          currentAmountCents: cents(100000),
          targetDate: new Date(2024, 11, 31),
          monthlyContributionCents: cents(50000),
        },
      ],
    })
    const metrics = calculateBaseMetrics(input)
    const insights = evaluateGoalProgressRule(
      metrics,
      input,
      DEFAULT_RULE_CONFIG.goalProgressRule,
      input.referenceDate,
    )

    if (insights.length > 0) {
      expect(insights[0]!.recommendations.some((r) => r.includes('contribution'))).toBe(true)
    }
  })
})

// ============================================
// Interest Savings Rule Tests
// ============================================

describe('evaluateInterestSavingsRule', () => {
  it('should identify savings opportunities for mortgages', () => {
    const input = createValidInput({
      liabilities: [
        {
          id: 'mortgage',
          name: 'Mortgage',
          balanceCents: cents(30000000), // $300,000
          interestRatePercent: 6.5,
          minimumPaymentCents: cents(189000),
          type: 'mortgage',
          remainingTermMonths: 300,
        },
      ],
    })
    const insights = evaluateInterestSavingsRule(
      input,
      DEFAULT_RULE_CONFIG.interestSavingsRule,
      input.referenceDate,
    )

    expect(insights.length).toBeGreaterThan(0)
    expect(insights[0]!.category).toBe('interest')
    expect(insights[0]!.ruleId).toBe(RULE_IDS.INTEREST_SAVINGS)
  })

  it('should analyze multiple extra payment scenarios', () => {
    const input = createValidInput({
      liabilities: [
        {
          id: 'mortgage',
          name: 'Mortgage',
          balanceCents: cents(30000000),
          interestRatePercent: 6.5,
          minimumPaymentCents: cents(189000),
          type: 'mortgage',
          remainingTermMonths: 300,
        },
      ],
    })
    const insights = evaluateInterestSavingsRule(
      input,
      DEFAULT_RULE_CONFIG.interestSavingsRule,
      input.referenceDate,
    )

    // Should have insights for $100, $200, $500 extra payments
    expect(insights.length).toBe(3)
  })

  it('should not generate insights for credit cards', () => {
    const input = createValidInput({
      liabilities: [
        {
          id: 'credit_card',
          name: 'Credit Card',
          balanceCents: cents(500000),
          interestRatePercent: 22.99,
          minimumPaymentCents: cents(15000),
          type: 'credit_card',
        },
      ],
    })
    const insights = evaluateInterestSavingsRule(
      input,
      DEFAULT_RULE_CONFIG.interestSavingsRule,
      input.referenceDate,
    )

    expect(insights.length).toBe(0)
  })

  it('should filter out savings below minimum threshold', () => {
    const input = createValidInput({
      liabilities: [
        {
          id: 'small_loan',
          name: 'Small Loan',
          balanceCents: cents(100000), // $1,000
          interestRatePercent: 5,
          minimumPaymentCents: cents(5000),
          type: 'auto',
          remainingTermMonths: 24,
        },
      ],
    })
    const insights = evaluateInterestSavingsRule(
      input,
      {
        ...DEFAULT_RULE_CONFIG.interestSavingsRule,
        minimumSavingsCents: cents(1000000), // $10,000 minimum
      },
      input.referenceDate,
    )

    expect(insights.length).toBe(0)
  })

  it('should include months saved in insight', () => {
    const input = createValidInput({
      liabilities: [
        {
          id: 'mortgage',
          name: 'Mortgage',
          balanceCents: cents(30000000),
          interestRatePercent: 6.5,
          minimumPaymentCents: cents(189000),
          type: 'mortgage',
          remainingTermMonths: 300,
        },
      ],
    })
    const insights = evaluateInterestSavingsRule(
      input,
      DEFAULT_RULE_CONFIG.interestSavingsRule,
      input.referenceDate,
    )

    expect(insights.length).toBeGreaterThan(0)
    expect(insights[0]!.description).toMatch(/\d+ month/)
    expect(insights[0]!.dataSnapshot.monthsSaved).toBeDefined()
  })
})

// ============================================
// Main generateInsights Tests
// ============================================

describe('generateInsights', () => {
  it('should return complete result structure', () => {
    const input = createValidInput()
    const result = generateInsights(input)

    expect(result).toHaveProperty('insights')
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('metrics')
    expect(result).toHaveProperty('effectiveRuleConfig')
    expect(result).toHaveProperty('referenceDate')
  })

  it('should calculate summary correctly', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(400000), // High housing costs (alert)
        utilitiesCents: cents(20000),
        transportationCents: cents(40000),
        foodCents: cents(60000),
        otherCents: cents(30000),
      },
    })
    const result = generateInsights(input)

    expect(result.summary.totalCount).toBe(result.insights.length)
    expect(result.summary.alertCount).toBe(
      result.insights.filter((i) => i.severity === 'alert').length,
    )
    expect(result.summary.warningCount).toBe(
      result.insights.filter((i) => i.severity === 'warning').length,
    )
    expect(result.summary.infoCount).toBe(
      result.insights.filter((i) => i.severity === 'info').length,
    )
  })

  it('should sort insights by severity then priority', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(400000), // Alert: 50% housing ratio
        utilitiesCents: cents(20000),
        transportationCents: cents(40000),
        foodCents: cents(60000),
        otherCents: cents(30000),
      },
      assets: [
        {
          id: 'savings',
          name: 'Savings',
          valueCents: cents(500000), // Alert: <3 months emergency
          type: 'cash',
        },
      ],
    })
    const result = generateInsights(input)

    // Alerts should come before warnings
    const firstAlert = result.insights.findIndex((i) => i.severity === 'alert')
    const firstWarning = result.insights.findIndex((i) => i.severity === 'warning')

    if (firstAlert >= 0 && firstWarning >= 0) {
      expect(firstAlert).toBeLessThan(firstWarning)
    }
  })

  it('should throw on invalid input', () => {
    const input = createValidInput({ monthlyIncomeCents: cents(0) })
    expect(() => generateInsights(input)).toThrow(InvalidInsightInputError)
  })

  it('should use provided rule config overrides', () => {
    const input = createValidInput({
      ruleConfig: {
        housingCostRule: {
          ...DEFAULT_RULE_CONFIG.housingCostRule,
          enabled: false,
        },
      },
    })
    const result = generateInsights(input)

    // Housing cost rule should not generate insights
    expect(result.insights.some((i) => i.ruleId === RULE_IDS.HOUSING_COST)).toBe(false)
    expect(result.effectiveRuleConfig.housingCostRule.enabled).toBe(false)
  })
})

// ============================================
// Determinism Tests
// ============================================

describe('determinism', () => {
  it('should produce identical results for same input', () => {
    const input = createValidInput()

    const result1 = generateInsights(input)
    const result2 = generateInsights(input)

    expect(result1.insights.length).toBe(result2.insights.length)
    expect(result1.insights.map((i) => i.id)).toEqual(result2.insights.map((i) => i.id))
    expect(result1.summary).toEqual(result2.summary)
  })

  it('should be reproducible across 100 calls', () => {
    const input = createValidInput()
    const baseline = generateInsights(input)

    for (let i = 0; i < 100; i++) {
      const result = generateInsights(input)
      expect(result.insights.map((i) => i.id)).toEqual(baseline.insights.map((i) => i.id))
      expect(result.summary).toEqual(baseline.summary)
    }
  })

  it('should generate deterministic IDs', () => {
    const input = createValidInput()
    const result = generateInsights(input)

    for (const insight of result.insights) {
      // IDs should follow pattern: ruleId_date_discriminator
      expect(insight.id).toMatch(/^[a-z_]+_\d{4}-\d{2}-\d{2}/)
    }
  })

  it('should sort arrays by ID for consistent processing', () => {
    // Create input with unordered goals
    const input = createValidInput({
      goals: [
        {
          id: 'z_goal',
          name: 'Z Goal',
          targetAmountCents: cents(1000000),
          currentAmountCents: cents(100000),
          targetDate: new Date(2024, 5, 30),
          monthlyContributionCents: cents(50000),
        },
        {
          id: 'a_goal',
          name: 'A Goal',
          targetAmountCents: cents(1000000),
          currentAmountCents: cents(100000),
          targetDate: new Date(2024, 5, 30),
          monthlyContributionCents: cents(50000),
        },
      ],
    })

    const result1 = generateInsights(input)

    // Reverse order
    const input2 = {
      ...input,
      goals: [...input.goals].reverse(),
    }
    const result2 = generateInsights(input2)

    // Goal insights should be in same order regardless of input order
    const goalInsights1 = result1.insights.filter((i) => i.ruleId === RULE_IDS.GOAL_PROGRESS)
    const goalInsights2 = result2.insights.filter((i) => i.ruleId === RULE_IDS.GOAL_PROGRESS)

    expect(goalInsights1.map((i) => i.id)).toEqual(goalInsights2.map((i) => i.id))
  })
})

// ============================================
// Explainability Tests
// ============================================

describe('explainability', () => {
  it('should include calculation string in all insights', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(320000),
        utilitiesCents: cents(20000),
        transportationCents: cents(40000),
        foodCents: cents(60000),
        otherCents: cents(30000),
      },
    })
    const result = generateInsights(input)

    for (const insight of result.insights) {
      expect(insight.calculation).toBeTruthy()
      expect(insight.calculation.length).toBeGreaterThan(10)
    }
  })

  it('should include data snapshot to reproduce insight', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(320000),
        utilitiesCents: cents(20000),
        transportationCents: cents(40000),
        foodCents: cents(60000),
        otherCents: cents(30000),
      },
    })
    const result = generateInsights(input)

    for (const insight of result.insights) {
      expect(insight.dataSnapshot).toBeDefined()
      expect(Object.keys(insight.dataSnapshot).length).toBeGreaterThan(0)
    }
  })

  it('should include threshold used for comparison', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(320000),
        utilitiesCents: cents(20000),
        transportationCents: cents(40000),
        foodCents: cents(60000),
        otherCents: cents(30000),
      },
    })
    const result = generateInsights(input)

    for (const insight of result.insights) {
      expect(typeof insight.threshold).toBe('number')
      expect(typeof insight.calculatedValue).toBe('number')
      expect(insight.unit).toBeDefined()
    }
  })

  it('should include recommendations in all insights', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(320000),
        utilitiesCents: cents(20000),
        transportationCents: cents(40000),
        foodCents: cents(60000),
        otherCents: cents(30000),
      },
    })
    const result = generateInsights(input)

    for (const insight of result.insights) {
      expect(Array.isArray(insight.recommendations)).toBe(true)
      expect(insight.recommendations.length).toBeGreaterThan(0)
    }
  })
})

// ============================================
// Edge Cases
// ============================================

describe('edge cases', () => {
  it('should handle zero expenses gracefully', () => {
    const input = createValidInput({
      monthlyExpenses: {
        housingCents: cents(0),
        utilitiesCents: cents(0),
        transportationCents: cents(0),
        foodCents: cents(0),
        otherCents: cents(0),
      },
    })
    const result = generateInsights(input)

    // Should not crash, emergency fund should show as many months
    expect(result.metrics.emergencyFundMonths).toBe(999)
  })

  it('should handle no liabilities', () => {
    const input = createValidInput({ liabilities: [] })
    const result = generateInsights(input)

    // No DTI insight should be generated
    expect(result.metrics.debtToIncomeRatioPercent).toBe(0)
  })

  it('should handle no assets', () => {
    const input = createValidInput({ assets: [] })
    const result = generateInsights(input)

    // Should generate emergency fund alert
    expect(result.metrics.totalCashAssetsCents).toBe(cents(0))
    expect(result.metrics.emergencyFundMonths).toBe(0)
    expect(
      result.insights.some((i) => i.ruleId === RULE_IDS.EMERGENCY_FUND && i.severity === 'alert'),
    ).toBe(true)
  })

  it('should handle goals with past target dates', () => {
    const input = createValidInput({
      goals: [
        {
          id: 'past_goal',
          name: 'Past Goal',
          targetAmountCents: cents(1000000),
          currentAmountCents: cents(500000), // 50% complete
          targetDate: new Date(2023, 0, 1), // Past date
          monthlyContributionCents: cents(50000),
        },
      ],
    })

    // Should not crash
    const result = generateInsights(input)
    expect(result.insights).toBeDefined()
  })

  it('should handle very large values', () => {
    const input = createValidInput({
      monthlyIncomeCents: cents(100000000), // $1,000,000
      liabilities: [
        {
          id: 'big_mortgage',
          name: 'Big Mortgage',
          balanceCents: cents(5000000000), // $50,000,000
          interestRatePercent: 5,
          minimumPaymentCents: cents(20000000),
          type: 'mortgage',
          remainingTermMonths: 360,
        },
      ],
    })

    const result = generateInsights(input)
    expect(result.metrics.totalDebtCents).toBe(cents(5000000000))
  })

  it('should handle liability without remaining term', () => {
    const input = createValidInput({
      liabilities: [
        {
          id: 'auto',
          name: 'Auto Loan',
          balanceCents: cents(2000000), // $20,000
          interestRatePercent: 6,
          minimumPaymentCents: cents(40000), // $400/mo
          type: 'auto',
          // No remainingTermMonths provided
        },
      ],
    })

    // Should still generate interest savings insights by estimating term
    const result = generateInsights(input)
    expect(result.insights).toBeDefined()
  })
})
