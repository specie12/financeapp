import {
  calculateMonthlyPayment,
  calculateMonthlyInterest,
  generateAmortizationSchedule,
  generateAmortizationScheduleWithExtras,
  analyzeEarlyPayoff,
  getLoanBalanceAtPayment,
  calculateInterestSaved,
  validateAmortizationInput,
} from '../amortization'
import { InvalidAmortizationInputError } from '../amortization/amortization.errors'
import { cents, addCents, type Cents } from '../money'

describe('Amortization Engine', () => {
  // ========================================
  // calculateMonthlyPayment Tests
  // ========================================
  describe('calculateMonthlyPayment()', () => {
    it('should calculate correct payment for standard 30-year mortgage', () => {
      // $200,000 at 6.5% for 30 years
      const payment = calculateMonthlyPayment(cents(20000000), 6.5, 360)
      // Expected: ~$1,264.14 = 126414 cents
      expect(payment).toBeGreaterThan(126000)
      expect(payment).toBeLessThan(127000)
    })

    it('should calculate correct payment for 15-year mortgage', () => {
      // $200,000 at 6% for 15 years
      const payment = calculateMonthlyPayment(cents(20000000), 6.0, 180)
      // Expected: ~$1,687.71 = 168771 cents
      expect(payment).toBeGreaterThan(168000)
      expect(payment).toBeLessThan(170000)
    })

    it('should handle zero interest rate (divide principal by term)', () => {
      // $12,000 at 0% for 12 months = $1,000/month
      const payment = calculateMonthlyPayment(cents(1200000), 0, 12)
      expect(payment).toBe(100000)
    })

    it('should handle very high interest rates (25%)', () => {
      // $10,000 at 25% for 12 months
      const payment = calculateMonthlyPayment(cents(1000000), 25, 12)
      // Payment should be reasonable and include interest
      expect(payment).toBeGreaterThan(90000)
      expect(payment).toBeLessThan(110000)
    })

    it('should handle very low interest rates (0.5%)', () => {
      // $10,000 at 0.5% for 12 months
      const payment = calculateMonthlyPayment(cents(1000000), 0.5, 12)
      // Payment should be slightly higher than $833.33
      expect(payment).toBeGreaterThan(83000)
      expect(payment).toBeLessThan(85000)
    })

    it('should throw for negative principal', () => {
      expect(() => calculateMonthlyPayment(cents(-1000) as Cents, 5, 12)).toThrow(
        InvalidAmortizationInputError,
      )
    })

    it('should throw for negative interest rate', () => {
      expect(() => calculateMonthlyPayment(cents(10000), -5, 12)).toThrow(
        InvalidAmortizationInputError,
      )
    })

    it('should throw for zero term months', () => {
      expect(() => calculateMonthlyPayment(cents(10000), 5, 0)).toThrow(
        InvalidAmortizationInputError,
      )
    })

    it('should throw for negative term months', () => {
      expect(() => calculateMonthlyPayment(cents(10000), 5, -12)).toThrow(
        InvalidAmortizationInputError,
      )
    })

    it('should handle minimum viable loan ($1, 1 month, 0%)', () => {
      const payment = calculateMonthlyPayment(cents(100), 0, 1)
      expect(payment).toBe(100)
    })

    it('should handle large loan amounts ($10M)', () => {
      const payment = calculateMonthlyPayment(cents(1000000000), 5, 360)
      // Should not throw and should return a reasonable value
      expect(payment).toBeGreaterThan(0)
    })
  })

  // ========================================
  // calculateMonthlyInterest Tests
  // ========================================
  describe('calculateMonthlyInterest()', () => {
    it('should calculate correct monthly interest', () => {
      // $100,000 balance at 6% annual = $500/month interest
      const interest = calculateMonthlyInterest(cents(10000000), 6)
      expect(interest).toBe(50000)
    })

    it('should return zero for zero interest rate', () => {
      const interest = calculateMonthlyInterest(cents(10000000), 0)
      expect(interest).toBe(0)
    })

    it('should handle small balances', () => {
      // $1 at 12% = ~$0.01/month
      const interest = calculateMonthlyInterest(cents(100), 12)
      expect(interest).toBe(1)
    })
  })

  // ========================================
  // generateAmortizationSchedule Tests
  // ========================================
  describe('generateAmortizationSchedule()', () => {
    const standardInput = {
      principalCents: cents(1200000), // $12,000
      annualInterestRatePercent: 6,
      termMonths: 12,
      startDate: new Date('2024-01-01'),
    }

    it('should generate correct number of entries', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      expect(schedule.schedule.length).toBe(12)
    })

    it('should have first entry beginning balance equal to principal', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      expect(schedule.schedule[0]!.beginningBalanceCents).toBe(1200000)
    })

    it('should have final entry ending balance of zero', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      const lastEntry = schedule.schedule[schedule.schedule.length - 1]!
      expect(lastEntry.endingBalanceCents).toBe(0)
    })

    it('should sum principal to original principal', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      expect(schedule.totalPrincipalCents).toBe(1200000)
    })

    it('should have correct payment dates (monthly increments)', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      // First payment is 1 month after start date
      const firstPaymentDate = schedule.schedule[0]!.paymentDate
      const lastPaymentDate = schedule.schedule[11]!.paymentDate
      // Verify payments are spaced monthly
      expect(lastPaymentDate.getTime()).toBeGreaterThan(firstPaymentDate.getTime())
      // 11 months between first and last
      const monthsDiff =
        (lastPaymentDate.getFullYear() - firstPaymentDate.getFullYear()) * 12 +
        (lastPaymentDate.getMonth() - firstPaymentDate.getMonth())
      expect(monthsDiff).toBe(11)
    })

    it('should track cumulative totals correctly', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      const lastEntry = schedule.schedule[schedule.schedule.length - 1]!
      expect(lastEntry.cumulativePrincipalCents).toBe(schedule.totalPrincipalCents)
      expect(lastEntry.cumulativeInterestCents).toBe(schedule.totalInterestCents)
    })

    it('should handle zero interest rate loan', () => {
      const zeroInterest = {
        ...standardInput,
        annualInterestRatePercent: 0,
      }
      const schedule = generateAmortizationSchedule(zeroInterest)
      expect(schedule.totalInterestCents).toBe(0)
      expect(schedule.monthlyPaymentCents).toBe(100000) // $1,000/month
    })

    it('should handle very small loan ($1)', () => {
      const smallLoan = {
        principalCents: cents(100),
        annualInterestRatePercent: 6,
        termMonths: 1,
        startDate: new Date('2024-01-01'),
      }
      const schedule = generateAmortizationSchedule(smallLoan)
      expect(schedule.schedule.length).toBe(1)
      expect(schedule.totalPrincipalCents).toBe(100)
    })

    it('should handle very large loan ($10,000,000)', () => {
      const largeLoan = {
        principalCents: cents(1000000000),
        annualInterestRatePercent: 5,
        termMonths: 360,
        startDate: new Date('2024-01-01'),
      }
      const schedule = generateAmortizationSchedule(largeLoan)
      expect(schedule.schedule.length).toBe(360)
      expect(schedule.totalPrincipalCents).toBe(1000000000)
    })

    it('should handle single payment loan (1 month term)', () => {
      const singlePayment = {
        principalCents: cents(100000),
        annualInterestRatePercent: 12,
        termMonths: 1,
        startDate: new Date('2024-01-01'),
      }
      const schedule = generateAmortizationSchedule(singlePayment)
      expect(schedule.schedule.length).toBe(1)
      // Interest for one month: $1000 * 12%/12 = $10
      expect(schedule.schedule[0]!.interestCents).toBe(1000)
    })

    it('should maintain balance consistency (ending = next beginning)', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      for (let i = 0; i < schedule.schedule.length - 1; i++) {
        expect(schedule.schedule[i]!.endingBalanceCents).toBe(
          schedule.schedule[i + 1]!.beginningBalanceCents,
        )
      }
    })

    it('should throw for invalid input', () => {
      expect(() =>
        generateAmortizationSchedule({
          ...standardInput,
          principalCents: cents(0),
        }),
      ).toThrow(InvalidAmortizationInputError)
    })
  })

  // ========================================
  // generateAmortizationScheduleWithExtras Tests
  // ========================================
  describe('generateAmortizationScheduleWithExtras()', () => {
    const standardInput = {
      principalCents: cents(1200000), // $12,000
      annualInterestRatePercent: 6,
      termMonths: 12,
      startDate: new Date('2024-01-01'),
      extraPayments: [] as { paymentNumber: number; amountCents: Cents }[],
    }

    it('should apply extra payment entirely to principal', () => {
      const withExtras = {
        ...standardInput,
        extraPayments: [{ paymentNumber: 1, amountCents: cents(10000) }],
      }
      const schedule = generateAmortizationScheduleWithExtras(withExtras)
      expect(schedule.schedule[0]!.extraPaymentCents).toBe(10000)
    })

    it('should reduce ending balance by extra payment amount', () => {
      const withoutExtras = generateAmortizationSchedule(standardInput)
      const withExtras = generateAmortizationScheduleWithExtras({
        ...standardInput,
        extraPayments: [{ paymentNumber: 1, amountCents: cents(10000) }],
      })

      const expectedEndingBalance = withoutExtras.schedule[0]!.endingBalanceCents - 10000
      expect(withExtras.schedule[0]!.endingBalanceCents).toBe(expectedEndingBalance)
    })

    it('should terminate schedule early on payoff', () => {
      // Pay off half the loan as extra on first payment
      const withExtras = {
        ...standardInput,
        extraPayments: [{ paymentNumber: 1, amountCents: cents(600000) }],
      }
      const schedule = generateAmortizationScheduleWithExtras(withExtras)
      expect(schedule.schedule.length).toBeLessThan(12)
      expect(schedule.actualPayoffMonth).toBeLessThan(12)
    })

    it('should handle multiple extra payments', () => {
      const withExtras = {
        ...standardInput,
        extraPayments: [
          { paymentNumber: 1, amountCents: cents(10000) },
          { paymentNumber: 6, amountCents: cents(20000) },
        ],
      }
      const schedule = generateAmortizationScheduleWithExtras(withExtras)
      expect(schedule.schedule[0]!.extraPaymentCents).toBe(10000)
      expect(schedule.schedule[5]!.extraPaymentCents).toBe(20000)
    })

    it('should handle extra payment on first month', () => {
      const withExtras = {
        ...standardInput,
        extraPayments: [{ paymentNumber: 1, amountCents: cents(50000) }],
      }
      const schedule = generateAmortizationScheduleWithExtras(withExtras)
      expect(schedule.schedule[0]!.extraPaymentCents).toBe(50000)
    })

    it('should cap extra payment at remaining balance', () => {
      // Try to pay more than the remaining balance
      const withExtras = {
        ...standardInput,
        extraPayments: [{ paymentNumber: 1, amountCents: cents(2000000) }], // More than loan
      }
      const schedule = generateAmortizationScheduleWithExtras(withExtras)
      // Should pay off in first month
      expect(schedule.schedule.length).toBe(1)
      expect(schedule.schedule[0]!.endingBalanceCents).toBe(0)
    })

    it('should correctly calculate cumulative totals with extras', () => {
      const withExtras = {
        ...standardInput,
        extraPayments: [{ paymentNumber: 1, amountCents: cents(10000) }],
      }
      const schedule = generateAmortizationScheduleWithExtras(withExtras)
      const lastEntry = schedule.schedule[schedule.schedule.length - 1]!
      expect(lastEntry.cumulativePrincipalCents).toBe(schedule.totalPrincipalCents)
    })

    it('should handle recurring monthly extra payments', () => {
      // Larger extra payments to ensure early payoff
      const extraPayments = Array.from({ length: 12 }, (_, i) => ({
        paymentNumber: i + 1,
        amountCents: cents(50000), // $500 extra per month
      }))
      const withExtras = {
        ...standardInput,
        extraPayments,
      }
      const schedule = generateAmortizationScheduleWithExtras(withExtras)
      // Should pay off faster than original with $500/month extra on a $12k loan
      expect(schedule.actualPayoffMonth).toBeLessThan(12)
    })
  })

  // ========================================
  // analyzeEarlyPayoff Tests
  // ========================================
  describe('analyzeEarlyPayoff()', () => {
    const standardInput = {
      principalCents: cents(1200000),
      annualInterestRatePercent: 6,
      termMonths: 12,
      startDate: new Date('2024-01-01'),
    }

    it('should calculate correct months saved', () => {
      const extraPayments = [{ paymentNumber: 1, amountCents: cents(100000) }]
      const analysis = analyzeEarlyPayoff(standardInput, extraPayments)
      expect(analysis.monthsSaved).toBeGreaterThanOrEqual(0)
      expect(analysis.modifiedSchedule.actualPayoffMonth).toBeLessThanOrEqual(
        analysis.originalSchedule.actualPayoffMonth,
      )
    })

    it('should calculate correct interest saved', () => {
      const extraPayments = [{ paymentNumber: 1, amountCents: cents(100000) }]
      const analysis = analyzeEarlyPayoff(standardInput, extraPayments)
      expect(analysis.interestSavedCents).toBeGreaterThan(0)
      expect(analysis.interestSavedCents).toBe(
        analysis.originalSchedule.totalInterestCents - analysis.modifiedSchedule.totalInterestCents,
      )
    })

    it('should detect early payoff correctly', () => {
      const extraPayments = [{ paymentNumber: 1, amountCents: cents(500000) }]
      const analysis = analyzeEarlyPayoff(standardInput, extraPayments)
      expect(analysis.isPaidOffEarly).toBe(true)
    })

    it('should handle no extra payments (zero savings)', () => {
      const analysis = analyzeEarlyPayoff(standardInput, [])
      expect(analysis.monthsSaved).toBe(0)
      expect(analysis.interestSavedCents).toBe(0)
      expect(analysis.isPaidOffEarly).toBe(false)
    })

    it('should handle lump sum payoff', () => {
      // Pay off entire loan with first payment
      const extraPayments = [{ paymentNumber: 1, amountCents: cents(1200000) }]
      const analysis = analyzeEarlyPayoff(standardInput, extraPayments)
      expect(analysis.modifiedSchedule.actualPayoffMonth).toBe(1)
      expect(analysis.isPaidOffEarly).toBe(true)
    })

    it('should compare payoff dates correctly', () => {
      const extraPayments = [{ paymentNumber: 1, amountCents: cents(100000) }]
      const analysis = analyzeEarlyPayoff(standardInput, extraPayments)
      expect(analysis.newPayoffDate.getTime()).toBeLessThanOrEqual(
        analysis.originalPayoffDate.getTime(),
      )
    })

    it('should return both original and modified schedules', () => {
      const extraPayments = [{ paymentNumber: 1, amountCents: cents(100000) }]
      const analysis = analyzeEarlyPayoff(standardInput, extraPayments)
      expect(analysis.originalSchedule).toBeDefined()
      expect(analysis.modifiedSchedule).toBeDefined()
      expect(analysis.originalSchedule.schedule.length).toBeGreaterThanOrEqual(
        analysis.modifiedSchedule.schedule.length,
      )
    })
  })

  // ========================================
  // getLoanBalanceAtPayment Tests
  // ========================================
  describe('getLoanBalanceAtPayment()', () => {
    const standardInput = {
      principalCents: cents(1200000),
      annualInterestRatePercent: 6,
      termMonths: 12,
      startDate: new Date('2024-01-01'),
    }

    it('should return correct balance at specific payment', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      const summary = getLoanBalanceAtPayment(schedule, 6)
      expect(summary.currentBalanceCents).toBe(schedule.schedule[5]!.endingBalanceCents)
    })

    it('should throw for payment number 0', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      expect(() => getLoanBalanceAtPayment(schedule, 0)).toThrow(InvalidAmortizationInputError)
    })

    it('should throw for payment number beyond schedule', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      expect(() => getLoanBalanceAtPayment(schedule, 15)).toThrow(InvalidAmortizationInputError)
    })

    it('should return zero balance at final payment', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      const summary = getLoanBalanceAtPayment(schedule, 12)
      expect(summary.currentBalanceCents).toBe(0)
    })

    it('should calculate remaining payments correctly', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      const summary = getLoanBalanceAtPayment(schedule, 6)
      expect(summary.remainingPayments).toBe(6)
    })

    it('should calculate principal and interest paid correctly', () => {
      const schedule = generateAmortizationSchedule(standardInput)
      const summary = getLoanBalanceAtPayment(schedule, 6)
      expect(summary.principalPaidCents).toBe(schedule.schedule[5]!.cumulativePrincipalCents)
      expect(summary.interestPaidCents).toBe(schedule.schedule[5]!.cumulativeInterestCents)
    })
  })

  // ========================================
  // calculateInterestSaved Tests
  // ========================================
  describe('calculateInterestSaved()', () => {
    it('should calculate interest saved for one-time extra payment', () => {
      const saved = calculateInterestSaved(
        cents(10000000), // $100,000 balance
        6,
        120, // 10 years remaining
        cents(1000000), // $10,000 extra
      )
      expect(saved).toBeGreaterThan(0)
    })

    it('should return zero for zero extra payment', () => {
      const saved = calculateInterestSaved(cents(10000000), 6, 120, cents(0))
      expect(saved).toBe(0)
    })

    it('should handle extra payment equal to balance (full payoff)', () => {
      const saved = calculateInterestSaved(
        cents(1000000), // $10,000 balance
        6,
        12,
        cents(1000000), // Pay it all off
      )
      // Should save all remaining interest
      expect(saved).toBeGreaterThan(0)
    })

    it('should handle very small extra payment ($1)', () => {
      const saved = calculateInterestSaved(
        cents(10000000),
        6,
        120,
        cents(100), // $1
      )
      // Should save something, even if tiny
      expect(saved).toBeGreaterThanOrEqual(0)
    })
  })

  // ========================================
  // validateAmortizationInput Tests
  // ========================================
  describe('validateAmortizationInput()', () => {
    const validInput = {
      principalCents: cents(1200000),
      annualInterestRatePercent: 6,
      termMonths: 12,
      startDate: new Date('2024-01-01'),
    }

    it('should return valid for correct input', () => {
      const result = validateAmortizationInput(validInput)
      expect(result.valid).toBe(true)
    })

    it('should reject zero principal', () => {
      const result = validateAmortizationInput({
        ...validInput,
        principalCents: cents(0),
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('positive')
    })

    it('should reject negative principal', () => {
      const result = validateAmortizationInput({
        ...validInput,
        principalCents: -1000 as Cents,
      })
      expect(result.valid).toBe(false)
    })

    it('should reject negative interest rate', () => {
      const result = validateAmortizationInput({
        ...validInput,
        annualInterestRatePercent: -5,
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('negative')
    })

    it('should reject zero term', () => {
      const result = validateAmortizationInput({
        ...validInput,
        termMonths: 0,
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('positive')
    })

    it('should reject invalid date', () => {
      const result = validateAmortizationInput({
        ...validInput,
        startDate: new Date('invalid'),
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Date')
    })

    it('should reject non-integer principal cents', () => {
      const result = validateAmortizationInput({
        ...validInput,
        principalCents: 1000.5 as Cents,
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('integer')
    })
  })

  // ========================================
  // Edge Cases - Precision and Rounding
  // ========================================
  describe('Precision and Rounding', () => {
    it('should maintain penny precision throughout schedule', () => {
      const schedule = generateAmortizationSchedule({
        principalCents: cents(1234567),
        annualInterestRatePercent: 7.25,
        termMonths: 36,
        startDate: new Date('2024-01-01'),
      })

      // All values should be integers
      for (const entry of schedule.schedule) {
        expect(Number.isInteger(entry.principalCents)).toBe(true)
        expect(Number.isInteger(entry.interestCents)).toBe(true)
        expect(Number.isInteger(entry.endingBalanceCents)).toBe(true)
      }
    })

    it('should not accumulate rounding errors', () => {
      const schedule = generateAmortizationSchedule({
        principalCents: cents(5000000),
        annualInterestRatePercent: 6.125, // Decimal rate
        termMonths: 60,
        startDate: new Date('2024-01-01'),
      })

      // Total principal should equal original principal
      expect(schedule.totalPrincipalCents).toBe(5000000)
      // Final balance should be exactly zero
      expect(schedule.schedule[schedule.schedule.length - 1]!.endingBalanceCents).toBe(0)
    })

    it('should handle interest rates with many decimals (6.125%)', () => {
      const schedule = generateAmortizationSchedule({
        principalCents: cents(10000000),
        annualInterestRatePercent: 6.125,
        termMonths: 360,
        startDate: new Date('2024-01-01'),
      })

      expect(schedule.schedule.length).toBe(360)
      expect(schedule.totalPrincipalCents).toBe(10000000)
    })

    it('should verify total payments = principal + interest', () => {
      const schedule = generateAmortizationSchedule({
        principalCents: cents(1200000),
        annualInterestRatePercent: 6,
        termMonths: 12,
        startDate: new Date('2024-01-01'),
      })

      expect(schedule.totalPaymentsCents).toBe(
        addCents(schedule.totalPrincipalCents, schedule.totalInterestCents),
      )
    })
  })

  // ========================================
  // Edge Cases - Long Term Loans
  // ========================================
  describe('Long Term Loans', () => {
    it('should handle 40-year mortgage (480 months)', () => {
      const schedule = generateAmortizationSchedule({
        principalCents: cents(50000000), // $500,000
        annualInterestRatePercent: 5,
        termMonths: 480,
        startDate: new Date('2024-01-01'),
      })

      expect(schedule.schedule.length).toBe(480)
      expect(schedule.actualPayoffMonth).toBe(480)
      expect(schedule.schedule[479]!.endingBalanceCents).toBe(0)
    })
  })

  // ========================================
  // Integration Test
  // ========================================
  describe('Integration', () => {
    it('should handle complete workflow: schedule, extras, analysis', () => {
      const input = {
        principalCents: cents(24000000), // $240,000
        annualInterestRatePercent: 6.5,
        termMonths: 360,
        startDate: new Date('2024-01-01'),
      }

      // Generate original schedule
      const original = generateAmortizationSchedule(input)
      expect(original.schedule.length).toBe(360)

      // Generate with monthly extras of $200
      const monthlyExtras = Array.from({ length: 360 }, (_, i) => ({
        paymentNumber: i + 1,
        amountCents: cents(20000),
      }))
      const withExtras = generateAmortizationScheduleWithExtras({
        ...input,
        extraPayments: monthlyExtras,
      })

      // Should pay off early
      expect(withExtras.actualPayoffMonth).toBeLessThan(360)

      // Analyze the difference
      const analysis = analyzeEarlyPayoff(input, monthlyExtras)
      expect(analysis.monthsSaved).toBeGreaterThan(0)
      expect(analysis.interestSavedCents).toBeGreaterThan(0)
      expect(analysis.isPaidOffEarly).toBe(true)

      // Check balance at midpoint
      const midpoint = getLoanBalanceAtPayment(original, 180)
      expect(midpoint.remainingPayments).toBe(180)
      expect(midpoint.principalPaidCents).toBeGreaterThan(0)
    })
  })
})
