import {
  calculateHoldingValue,
  calculatePortfolioValue,
  calculateTotalCostBasis,
  calculateTotalContributions,
  calculateTotalWithdrawals,
  calculateTotalDividends,
  calculateUnrealizedGain,
  summarizeHolding,
  aggregatePortfolio,
  aggregateByPeriod,
  calculateDividendsByPeriod,
  buildPortfolioTimeSeries,
  validateHolding,
  validateTransaction,
} from '../investment'
import { InvalidHoldingError, InvalidTransactionError } from '../investment/investment.errors'
import { cents, type Cents } from '../money'
import type { Holding, Transaction, PortfolioSnapshot } from '../investment/investment.types'

describe('Investment Aggregation Engine', () => {
  // ========================================
  // Test Data Helpers
  // ========================================
  const createHolding = (
    symbol: string,
    shares: number,
    costBasisCents: number,
    currentPriceCents: number,
  ): Holding => ({
    symbol,
    shares,
    costBasisCents: cents(costBasisCents),
    currentPriceCents: cents(currentPriceCents),
  })

  const createTransaction = (
    type: 'contribution' | 'withdrawal' | 'dividend' | 'reinvestment',
    date: Date,
    amountCents: number,
    symbol?: string,
  ): Transaction => ({
    type,
    date,
    amountCents: cents(amountCents),
    symbol,
  })

  // ========================================
  // Validation Tests
  // ========================================
  describe('validateHolding()', () => {
    it('should return valid for correct holding', () => {
      const holding = createHolding('AAPL', 10, 150000, 17500)
      const result = validateHolding(holding)
      expect(result.valid).toBe(true)
    })

    it('should reject empty symbol', () => {
      const holding = createHolding('', 10, 150000, 17500)
      const result = validateHolding(holding)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Symbol')
    })

    it('should reject negative shares', () => {
      const holding = createHolding('AAPL', -10, 150000, 17500)
      const result = validateHolding(holding)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('negative')
    })

    it('should reject negative cost basis', () => {
      const holding: Holding = {
        symbol: 'AAPL',
        shares: 10,
        costBasisCents: -150000 as Cents,
        currentPriceCents: cents(17500),
      }
      const result = validateHolding(holding)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('negative')
    })

    it('should accept zero shares', () => {
      const holding = createHolding('AAPL', 0, 0, 17500)
      const result = validateHolding(holding)
      expect(result.valid).toBe(true)
    })

    it('should accept fractional shares', () => {
      const holding = createHolding('AAPL', 2.5, 37500, 17500)
      const result = validateHolding(holding)
      expect(result.valid).toBe(true)
    })
  })

  describe('validateTransaction()', () => {
    it('should return valid for correct transaction', () => {
      const tx = createTransaction('contribution', new Date('2024-01-15'), 100000)
      const result = validateTransaction(tx)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid type', () => {
      const tx = {
        type: 'invalid' as 'contribution',
        date: new Date('2024-01-15'),
        amountCents: cents(100000),
      }
      const result = validateTransaction(tx)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Type')
    })

    it('should reject invalid date', () => {
      const tx = {
        type: 'contribution' as const,
        date: new Date('invalid'),
        amountCents: cents(100000),
      }
      const result = validateTransaction(tx)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Date')
    })

    it('should reject negative amount', () => {
      const tx: Transaction = {
        type: 'contribution',
        date: new Date('2024-01-15'),
        amountCents: -100000 as Cents,
      }
      const result = validateTransaction(tx)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('negative')
    })
  })

  // ========================================
  // calculateHoldingValue Tests
  // ========================================
  describe('calculateHoldingValue()', () => {
    it('should calculate value as shares × price', () => {
      // 10 shares at $175.00 = $1,750.00 = 175000 cents
      const holding = createHolding('AAPL', 10, 150000, 17500)
      expect(calculateHoldingValue(holding)).toBe(175000)
    })

    it('should handle fractional shares', () => {
      // 2.5 shares at $100.00 = $250.00 = 25000 cents
      const holding = createHolding('AAPL', 2.5, 20000, 10000)
      expect(calculateHoldingValue(holding)).toBe(25000)
    })

    it('should return zero for zero shares', () => {
      const holding = createHolding('AAPL', 0, 0, 17500)
      expect(calculateHoldingValue(holding)).toBe(0)
    })

    it('should return zero for zero price', () => {
      const holding = createHolding('AAPL', 10, 150000, 0)
      expect(calculateHoldingValue(holding)).toBe(0)
    })

    it('should handle large values', () => {
      // 1000 shares at $5,000.00 = $5,000,000.00
      const holding = createHolding('BRK.A', 1000, 400000000, 500000)
      expect(calculateHoldingValue(holding)).toBe(500000000)
    })

    it('should throw for invalid holding', () => {
      const holding: Holding = {
        symbol: '',
        shares: 10,
        costBasisCents: cents(150000),
        currentPriceCents: cents(17500),
      }
      expect(() => calculateHoldingValue(holding)).toThrow(InvalidHoldingError)
    })
  })

  // ========================================
  // calculatePortfolioValue Tests
  // ========================================
  describe('calculatePortfolioValue()', () => {
    it('should sum all holding values', () => {
      const holdings = [
        createHolding('AAPL', 10, 150000, 17500), // 175000
        createHolding('GOOGL', 5, 70000, 15000), // 75000
      ]
      expect(calculatePortfolioValue(holdings)).toBe(250000)
    })

    it('should return zero for empty portfolio', () => {
      expect(calculatePortfolioValue([])).toBe(0)
    })

    it('should handle single holding', () => {
      const holdings = [createHolding('AAPL', 10, 150000, 17500)]
      expect(calculatePortfolioValue(holdings)).toBe(175000)
    })
  })

  // ========================================
  // calculateTotalCostBasis Tests
  // ========================================
  describe('calculateTotalCostBasis()', () => {
    it('should sum all cost bases', () => {
      const holdings = [
        createHolding('AAPL', 10, 150000, 17500),
        createHolding('GOOGL', 5, 70000, 15000),
      ]
      expect(calculateTotalCostBasis(holdings)).toBe(220000)
    })

    it('should return zero for empty portfolio', () => {
      expect(calculateTotalCostBasis([])).toBe(0)
    })
  })

  // ========================================
  // Transaction Aggregation Tests
  // ========================================
  describe('calculateTotalContributions()', () => {
    it('should sum contribution transactions', () => {
      const transactions = [
        createTransaction('contribution', new Date('2024-01-15'), 100000),
        createTransaction('contribution', new Date('2024-02-15'), 50000),
        createTransaction('dividend', new Date('2024-03-15'), 500),
      ]
      expect(calculateTotalContributions(transactions)).toBe(150000)
    })

    it('should return zero for no contributions', () => {
      const transactions = [createTransaction('dividend', new Date('2024-03-15'), 500)]
      expect(calculateTotalContributions(transactions)).toBe(0)
    })

    it('should return zero for empty transactions', () => {
      expect(calculateTotalContributions([])).toBe(0)
    })
  })

  describe('calculateTotalWithdrawals()', () => {
    it('should sum withdrawal transactions', () => {
      const transactions = [
        createTransaction('withdrawal', new Date('2024-01-15'), 25000),
        createTransaction('withdrawal', new Date('2024-02-15'), 15000),
        createTransaction('contribution', new Date('2024-03-15'), 100000),
      ]
      expect(calculateTotalWithdrawals(transactions)).toBe(40000)
    })

    it('should return zero for no withdrawals', () => {
      const transactions = [createTransaction('contribution', new Date('2024-01-15'), 100000)]
      expect(calculateTotalWithdrawals(transactions)).toBe(0)
    })
  })

  describe('calculateTotalDividends()', () => {
    it('should sum dividend transactions', () => {
      const transactions = [
        createTransaction('dividend', new Date('2024-01-15'), 500, 'AAPL'),
        createTransaction('dividend', new Date('2024-04-15'), 500, 'AAPL'),
        createTransaction('dividend', new Date('2024-07-15'), 500, 'AAPL'),
        createTransaction('contribution', new Date('2024-01-01'), 100000),
      ]
      expect(calculateTotalDividends(transactions)).toBe(1500)
    })

    it('should return zero for no dividends', () => {
      const transactions = [createTransaction('contribution', new Date('2024-01-15'), 100000)]
      expect(calculateTotalDividends(transactions)).toBe(0)
    })
  })

  // ========================================
  // calculateUnrealizedGain Tests
  // ========================================
  describe('calculateUnrealizedGain()', () => {
    it('should calculate positive gain', () => {
      // Cost: 150000, Value: 175000, Gain: 25000
      const holdings = [createHolding('AAPL', 10, 150000, 17500)]
      expect(calculateUnrealizedGain(holdings)).toBe(25000)
    })

    it('should calculate negative gain (loss)', () => {
      // Cost: 150000, Value: 125000, Loss: -25000
      const holdings = [createHolding('AAPL', 10, 150000, 12500)]
      expect(calculateUnrealizedGain(holdings)).toBe(-25000)
    })

    it('should return zero for break-even', () => {
      const holdings = [createHolding('AAPL', 10, 150000, 15000)]
      expect(calculateUnrealizedGain(holdings)).toBe(0)
    })

    it('should return zero for empty portfolio', () => {
      expect(calculateUnrealizedGain([])).toBe(0)
    })
  })

  // ========================================
  // summarizeHolding Tests
  // ========================================
  describe('summarizeHolding()', () => {
    it('should calculate all summary fields', () => {
      const holding = createHolding('AAPL', 10, 150000, 17500)
      const portfolioTotal = cents(175000)
      const summary = summarizeHolding(holding, portfolioTotal)

      expect(summary.symbol).toBe('AAPL')
      expect(summary.shares).toBe(10)
      expect(summary.costBasisCents).toBe(150000)
      expect(summary.currentValueCents).toBe(175000)
      expect(summary.gainLossCents).toBe(25000)
      expect(summary.gainLossPercent).toBeCloseTo(16.67, 1)
      expect(summary.allocationPercent).toBe(100)
    })

    it('should calculate allocation for multi-holding portfolio', () => {
      const holding = createHolding('AAPL', 10, 150000, 17500) // 175000
      const portfolioTotal = cents(350000) // Total portfolio is 2x holding
      const summary = summarizeHolding(holding, portfolioTotal)

      expect(summary.allocationPercent).toBe(50)
    })

    it('should handle zero cost basis (100% gain)', () => {
      const holding = createHolding('AAPL', 10, 0, 17500)
      const portfolioTotal = cents(175000)
      const summary = summarizeHolding(holding, portfolioTotal)

      expect(summary.gainLossPercent).toBe(0) // Can't calculate % on zero basis
    })

    it('should handle loss scenario', () => {
      const holding = createHolding('AAPL', 10, 200000, 17500) // Lost 12.5%
      const portfolioTotal = cents(175000)
      const summary = summarizeHolding(holding, portfolioTotal)

      expect(summary.gainLossCents).toBe(-25000)
      expect(summary.gainLossPercent).toBe(-12.5)
    })
  })

  // ========================================
  // aggregatePortfolio Tests
  // ========================================
  describe('aggregatePortfolio()', () => {
    it('should aggregate complete portfolio', () => {
      const holdings = [
        createHolding('AAPL', 10, 150000, 17500), // 175000
        createHolding('GOOGL', 5, 70000, 15000), // 75000
      ]
      const transactions = [
        createTransaction('contribution', new Date('2024-01-15'), 220000),
        createTransaction('dividend', new Date('2024-03-15'), 500),
        createTransaction('dividend', new Date('2024-06-15'), 500),
      ]

      const summary = aggregatePortfolio(holdings, transactions)

      expect(summary.totalValueCents).toBe(250000)
      expect(summary.totalCostBasisCents).toBe(220000)
      expect(summary.totalContributionsCents).toBe(220000)
      expect(summary.totalWithdrawalsCents).toBe(0)
      expect(summary.netContributionsCents).toBe(220000)
      expect(summary.totalDividendsCents).toBe(1000)
      expect(summary.unrealizedGainCents).toBe(30000)
      expect(summary.unrealizedGainPercent).toBeCloseTo(13.64, 1)
      expect(summary.totalReturnCents).toBe(31000) // 30000 + 1000
      expect(summary.holdings.length).toBe(2)
    })

    it('should handle empty portfolio', () => {
      const summary = aggregatePortfolio([], [])

      expect(summary.totalValueCents).toBe(0)
      expect(summary.totalCostBasisCents).toBe(0)
      expect(summary.totalReturnPercent).toBe(0)
      expect(summary.holdings.length).toBe(0)
    })

    it('should handle withdrawals', () => {
      const holdings = [createHolding('AAPL', 5, 75000, 17500)]
      const transactions = [
        createTransaction('contribution', new Date('2024-01-15'), 150000),
        createTransaction('withdrawal', new Date('2024-06-15'), 75000),
      ]

      const summary = aggregatePortfolio(holdings, transactions)

      expect(summary.totalContributionsCents).toBe(150000)
      expect(summary.totalWithdrawalsCents).toBe(75000)
      expect(summary.netContributionsCents).toBe(75000)
    })

    it('should calculate correct allocation percentages', () => {
      const holdings = [
        createHolding('AAPL', 10, 100000, 15000), // 150000 = 60%
        createHolding('GOOGL', 5, 50000, 20000), // 100000 = 40%
      ]
      const summary = aggregatePortfolio(holdings, [])

      expect(summary.holdings[0]!.allocationPercent).toBe(60)
      expect(summary.holdings[1]!.allocationPercent).toBe(40)
    })
  })

  // ========================================
  // aggregateByPeriod Tests
  // ========================================
  describe('aggregateByPeriod()', () => {
    it('should aggregate by month', () => {
      const transactions = [
        createTransaction('contribution', new Date('2024-01-15'), 100000),
        createTransaction('contribution', new Date('2024-01-20'), 50000),
        createTransaction('contribution', new Date('2024-02-15'), 100000),
        createTransaction('dividend', new Date('2024-01-25'), 500),
      ]

      const periods = aggregateByPeriod(transactions, 'month')

      expect(periods.length).toBe(2)
      expect(periods[0]!.label).toBe('2024-01')
      expect(periods[0]!.contributionsCents).toBe(150000)
      expect(periods[0]!.dividendsCents).toBe(500)
      expect(periods[0]!.transactionCount).toBe(3)
      expect(periods[1]!.label).toBe('2024-02')
      expect(periods[1]!.contributionsCents).toBe(100000)
    })

    it('should aggregate by quarter', () => {
      const transactions = [
        createTransaction('contribution', new Date('2024-01-15'), 100000),
        createTransaction('contribution', new Date('2024-04-15'), 100000),
        createTransaction('contribution', new Date('2024-07-15'), 100000),
      ]

      const periods = aggregateByPeriod(transactions, 'quarter')

      expect(periods.length).toBe(3)
      expect(periods[0]!.label).toBe('2024-Q1')
      expect(periods[1]!.label).toBe('2024-Q2')
      expect(periods[2]!.label).toBe('2024-Q3')
    })

    it('should aggregate by year', () => {
      const transactions = [
        createTransaction('contribution', new Date('2023-06-15'), 100000),
        createTransaction('contribution', new Date('2024-06-15'), 100000),
      ]

      const periods = aggregateByPeriod(transactions, 'year')

      expect(periods.length).toBe(2)
      expect(periods[0]!.label).toBe('2023')
      expect(periods[1]!.label).toBe('2024')
    })

    it('should handle empty transactions', () => {
      const periods = aggregateByPeriod([], 'month')
      expect(periods.length).toBe(0)
    })

    it('should sort by date ascending', () => {
      const transactions = [
        createTransaction('contribution', new Date('2024-03-15'), 100000),
        createTransaction('contribution', new Date('2024-01-15'), 100000),
        createTransaction('contribution', new Date('2024-02-15'), 100000),
      ]

      const periods = aggregateByPeriod(transactions, 'month')

      expect(periods[0]!.label).toBe('2024-01')
      expect(periods[1]!.label).toBe('2024-02')
      expect(periods[2]!.label).toBe('2024-03')
    })
  })

  // ========================================
  // calculateDividendsByPeriod Tests
  // ========================================
  describe('calculateDividendsByPeriod()', () => {
    it('should only include dividend transactions', () => {
      const transactions = [
        createTransaction('contribution', new Date('2024-01-15'), 100000),
        createTransaction('dividend', new Date('2024-01-25'), 500),
        createTransaction('dividend', new Date('2024-04-25'), 500),
      ]

      const periods = calculateDividendsByPeriod(transactions, 'quarter')

      expect(periods.length).toBe(2)
      expect(periods[0]!.label).toBe('2024-Q1')
      expect(periods[0]!.dividendsCents).toBe(500)
      expect(periods[0]!.contributionsCents).toBe(0) // No contributions in dividend-only filter
    })

    it('should return empty for no dividends', () => {
      const transactions = [createTransaction('contribution', new Date('2024-01-15'), 100000)]

      const periods = calculateDividendsByPeriod(transactions, 'month')
      expect(periods.length).toBe(0)
    })
  })

  // ========================================
  // buildPortfolioTimeSeries Tests
  // ========================================
  describe('buildPortfolioTimeSeries()', () => {
    it('should sort snapshots by date', () => {
      const snapshots: PortfolioSnapshot[] = [
        {
          date: new Date('2024-03-01'),
          totalValueCents: cents(150000),
          totalContributionsCents: cents(120000),
          totalDividendsCents: cents(500),
        },
        {
          date: new Date('2024-01-01'),
          totalValueCents: cents(100000),
          totalContributionsCents: cents(100000),
          totalDividendsCents: cents(0),
        },
        {
          date: new Date('2024-02-01'),
          totalValueCents: cents(120000),
          totalContributionsCents: cents(110000),
          totalDividendsCents: cents(250),
        },
      ]

      const sorted = buildPortfolioTimeSeries(snapshots)

      expect(sorted[0]!.date.getTime()).toBe(new Date('2024-01-01').getTime())
      expect(sorted[1]!.date.getTime()).toBe(new Date('2024-02-01').getTime())
      expect(sorted[2]!.date.getTime()).toBe(new Date('2024-03-01').getTime())
    })

    it('should handle empty snapshots', () => {
      const sorted = buildPortfolioTimeSeries([])
      expect(sorted.length).toBe(0)
    })

    it('should not mutate original array', () => {
      const snapshots: PortfolioSnapshot[] = [
        {
          date: new Date('2024-02-01'),
          totalValueCents: cents(120000),
          totalContributionsCents: cents(110000),
          totalDividendsCents: cents(250),
        },
        {
          date: new Date('2024-01-01'),
          totalValueCents: cents(100000),
          totalContributionsCents: cents(100000),
          totalDividendsCents: cents(0),
        },
      ]

      const sorted = buildPortfolioTimeSeries(snapshots)

      expect(snapshots[0]!.date.getTime()).toBe(new Date('2024-02-01').getTime())
      expect(sorted[0]!.date.getTime()).toBe(new Date('2024-01-01').getTime())
    })

    it('should throw for invalid date', () => {
      const snapshots: PortfolioSnapshot[] = [
        {
          date: new Date('invalid'),
          totalValueCents: cents(100000),
          totalContributionsCents: cents(100000),
          totalDividendsCents: cents(0),
        },
      ]

      expect(() => buildPortfolioTimeSeries(snapshots)).toThrow(InvalidTransactionError)
    })
  })

  // ========================================
  // Edge Cases and Precision Tests
  // ========================================
  describe('Edge Cases', () => {
    it('should handle very small fractional shares', () => {
      // 0.001 shares at $100 = $0.10 = 10 cents
      const holding = createHolding('AAPL', 0.001, 10, 10000)
      expect(calculateHoldingValue(holding)).toBe(10)
    })

    it('should handle large portfolios', () => {
      const holdings = Array.from({ length: 100 }, (_, i) =>
        createHolding(`STOCK${i}`, 100, 1000000, 11000),
      )
      const totalValue = calculatePortfolioValue(holdings)
      // 100 holdings × 100 shares × $110 = $1,100,000 = 110000000 cents
      expect(totalValue).toBe(110000000)
    })

    it('should maintain cent precision in gain calculations', () => {
      // Specific values that could cause floating point issues
      const holding = createHolding('AAPL', 3, 10001, 3334)
      const value = calculateHoldingValue(holding)
      const gain = value - holding.costBasisCents

      expect(Number.isInteger(value)).toBe(true)
      expect(Number.isInteger(gain)).toBe(true)
    })

    it('should handle zero portfolio total in allocation', () => {
      const holding = createHolding('AAPL', 0, 0, 17500)
      const summary = summarizeHolding(holding, cents(0))
      expect(summary.allocationPercent).toBe(0)
    })
  })

  // ========================================
  // Integration Test
  // ========================================
  describe('Integration', () => {
    it('should handle complete investment lifecycle', () => {
      // Initial investment
      const initialContribution = createTransaction(
        'contribution',
        new Date('2024-01-01'),
        500000, // $5,000
      )

      // Buy some stocks
      const holdings: Holding[] = [
        createHolding('AAPL', 20, 350000, 18500), // $3,500 cost, now worth $3,700
        createHolding('GOOGL', 10, 140000, 15000), // $1,400 cost, now worth $1,500
      ]

      // Receive dividends over the year
      const transactions: Transaction[] = [
        initialContribution,
        createTransaction('dividend', new Date('2024-03-15'), 200, 'AAPL'),
        createTransaction('dividend', new Date('2024-06-15'), 200, 'AAPL'),
        createTransaction('dividend', new Date('2024-09-15'), 200, 'AAPL'),
        createTransaction('dividend', new Date('2024-12-15'), 200, 'AAPL'),
      ]

      // Aggregate the portfolio
      const summary = aggregatePortfolio(holdings, transactions)

      // Verify calculations
      expect(summary.totalValueCents).toBe(520000) // $5,200
      expect(summary.totalCostBasisCents).toBe(490000) // $4,900
      expect(summary.totalContributionsCents).toBe(500000) // $5,000
      expect(summary.totalDividendsCents).toBe(800) // $8.00 in dividends
      expect(summary.unrealizedGainCents).toBe(30000) // $300 unrealized gain
      expect(summary.totalReturnCents).toBe(30800) // $308 total return

      // Check dividend time series
      const dividendsByQuarter = calculateDividendsByPeriod(transactions, 'quarter')
      expect(dividendsByQuarter.length).toBe(4)
      expect(dividendsByQuarter[0]!.dividendsCents).toBe(200) // Q1
      expect(dividendsByQuarter[3]!.dividendsCents).toBe(200) // Q4
    })
  })
})
