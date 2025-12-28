import {
  cents,
  isCents,
  validateCents,
  assertCents,
  centsToDollars,
  dollarsToCents,
  addCents,
  subtractCents,
  multiplyCents,
  divideCents,
  divideCentsSimple,
  calculatePercentage,
  percentageOf,
  addPercentage,
  subtractPercentage,
  allocateCents,
  allocateCentsByRatio,
  compareCents,
  maxCents,
  minCents,
  absCents,
  negateCents,
  isZeroCents,
  isPositiveCents,
  isNegativeCents,
  formatCentsAsCurrency,
  RoundingMode,
  type Cents,
} from '../money'
import { InvalidCentsError, DivisionByZeroError, OverflowError } from '../money/money.errors'

describe('Money Utilities', () => {
  // ========================================
  // Validation Tests
  // ========================================
  describe('Validation', () => {
    describe('cents()', () => {
      it('should create cents from valid integer', () => {
        expect(cents(100)).toBe(100)
        expect(cents(0)).toBe(0)
        expect(cents(-500)).toBe(-500)
      })

      it('should throw InvalidCentsError for non-integer', () => {
        expect(() => cents(10.5)).toThrow(InvalidCentsError)
        expect(() => cents(0.1)).toThrow(InvalidCentsError)
      })

      it('should throw for non-number types', () => {
        expect(() => cents('100' as unknown as number)).toThrow(InvalidCentsError)
        expect(() => cents(null as unknown as number)).toThrow(InvalidCentsError)
        expect(() => cents(undefined as unknown as number)).toThrow(InvalidCentsError)
      })

      it('should throw for Infinity and NaN', () => {
        expect(() => cents(Infinity)).toThrow(InvalidCentsError)
        expect(() => cents(-Infinity)).toThrow(InvalidCentsError)
        expect(() => cents(NaN)).toThrow(InvalidCentsError)
      })

      it('should handle large safe integers', () => {
        expect(cents(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER)
        expect(cents(Number.MIN_SAFE_INTEGER)).toBe(Number.MIN_SAFE_INTEGER)
      })
    })

    describe('isCents()', () => {
      it('should return true for valid cents', () => {
        expect(isCents(100)).toBe(true)
        expect(isCents(0)).toBe(true)
        expect(isCents(-500)).toBe(true)
      })

      it('should return false for invalid values', () => {
        expect(isCents(10.5)).toBe(false)
        expect(isCents('100')).toBe(false)
        expect(isCents(NaN)).toBe(false)
      })
    })

    describe('validateCents()', () => {
      it('should return valid: true for integers', () => {
        expect(validateCents(100)).toEqual({ valid: true })
      })

      it('should return valid: false with error for non-integers', () => {
        const result = validateCents(10.5)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('integer')
      })

      it('should return valid: false for non-numbers', () => {
        const result = validateCents('100')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Expected number')
      })

      it('should return valid: false for non-finite values', () => {
        expect(validateCents(Infinity).valid).toBe(false)
        expect(validateCents(NaN).valid).toBe(false)
      })
    })

    describe('assertCents()', () => {
      it('should not throw for valid cents', () => {
        expect(() => assertCents(100)).not.toThrow()
      })

      it('should throw InvalidCentsError for invalid values', () => {
        expect(() => assertCents(10.5)).toThrow(InvalidCentsError)
      })
    })
  })

  // ========================================
  // Conversion Tests
  // ========================================
  describe('Conversions', () => {
    describe('centsToDollars()', () => {
      it('should convert positive cents to dollars', () => {
        expect(centsToDollars(cents(1299))).toBe('12.99')
        expect(centsToDollars(cents(100))).toBe('1.00')
        expect(centsToDollars(cents(1))).toBe('0.01')
        expect(centsToDollars(cents(10000))).toBe('100.00')
      })

      it('should convert zero cents', () => {
        expect(centsToDollars(cents(0))).toBe('0.00')
      })

      it('should convert negative cents', () => {
        expect(centsToDollars(cents(-500))).toBe('-5.00')
        expect(centsToDollars(cents(-1))).toBe('-0.01')
      })

      it('should always return exactly 2 decimal places', () => {
        const result = centsToDollars(cents(100))
        expect(result).toMatch(/^-?\d+\.\d{2}$/)
      })
    })

    describe('dollarsToCents()', () => {
      it('should convert dollar strings to cents', () => {
        expect(dollarsToCents('12.99')).toBe(1299)
        expect(dollarsToCents('1.00')).toBe(100)
        expect(dollarsToCents('0.01')).toBe(1)
      })

      it('should convert dollar numbers to cents', () => {
        expect(dollarsToCents(12.99)).toBe(1299)
        expect(dollarsToCents(100)).toBe(10000)
      })

      it('should handle rounding with ROUND_HALF_UP (default)', () => {
        expect(dollarsToCents('12.995')).toBe(1300)
        expect(dollarsToCents('12.994')).toBe(1299)
      })

      it('should respect custom rounding modes', () => {
        expect(dollarsToCents('12.999', RoundingMode.ROUND_DOWN)).toBe(1299)
        expect(dollarsToCents('12.991', RoundingMode.ROUND_UP)).toBe(1300)
        expect(dollarsToCents('12.999', RoundingMode.ROUND_FLOOR)).toBe(1299)
        expect(dollarsToCents('-12.999', RoundingMode.ROUND_FLOOR)).toBe(-1300)
      })

      it('should handle negative dollar amounts', () => {
        expect(dollarsToCents('-5.50')).toBe(-550)
        expect(dollarsToCents(-10.25)).toBe(-1025)
      })
    })
  })

  // ========================================
  // Arithmetic Tests
  // ========================================
  describe('Arithmetic', () => {
    describe('addCents()', () => {
      it('should add two cents values', () => {
        expect(addCents(cents(100), cents(200))).toBe(300)
      })

      it('should add multiple cents values', () => {
        expect(addCents(cents(100), cents(200), cents(300))).toBe(600)
      })

      it('should handle negative values', () => {
        expect(addCents(cents(100), cents(-50))).toBe(50)
      })

      it('should return 0 for empty sum', () => {
        expect(addCents()).toBe(0)
      })

      it('should throw OverflowError for unsafe results', () => {
        expect(() => addCents(cents(Number.MAX_SAFE_INTEGER), cents(1))).toThrow(OverflowError)
      })
    })

    describe('subtractCents()', () => {
      it('should subtract cents values', () => {
        expect(subtractCents(cents(500), cents(200))).toBe(300)
      })

      it('should subtract multiple values', () => {
        expect(subtractCents(cents(500), cents(100), cents(100))).toBe(300)
      })

      it('should handle negative results', () => {
        expect(subtractCents(cents(100), cents(500))).toBe(-400)
      })
    })

    describe('multiplyCents()', () => {
      it('should multiply by integer', () => {
        expect(multiplyCents(cents(100), 2)).toBe(200)
      })

      it('should multiply by decimal with rounding', () => {
        expect(multiplyCents(cents(100), 1.5)).toBe(150)
        expect(multiplyCents(cents(333), 0.1)).toBe(33)
      })

      it('should respect rounding modes', () => {
        expect(multiplyCents(cents(100), 0.115, RoundingMode.ROUND_DOWN)).toBe(11)
        expect(multiplyCents(cents(100), 0.115, RoundingMode.ROUND_UP)).toBe(12)
      })

      it('should handle zero multiplier', () => {
        expect(multiplyCents(cents(100), 0)).toBe(0)
      })

      it('should handle negative multiplier', () => {
        expect(multiplyCents(cents(100), -2)).toBe(-200)
      })

      it('should throw for non-finite multiplier', () => {
        expect(() => multiplyCents(cents(100), Infinity)).toThrow(InvalidCentsError)
      })
    })

    describe('divideCents()', () => {
      it('should divide evenly', () => {
        const result = divideCents(cents(100), 4)
        expect(result.quotientCents).toBe(25)
        expect(result.remainderCents).toBe(0)
      })

      it('should return quotient and remainder', () => {
        const result = divideCents(cents(100), 3)
        expect(result.quotientCents).toBe(33)
        expect(result.remainderCents).toBe(1)
      })

      it('should throw DivisionByZeroError for zero divisor', () => {
        expect(() => divideCents(cents(100), 0)).toThrow(DivisionByZeroError)
      })

      it('should handle decimal divisors', () => {
        const result = divideCents(cents(100), 2.5)
        expect(result.quotientCents).toBe(40)
      })

      it('should throw for non-finite divisor', () => {
        expect(() => divideCents(cents(100), Infinity)).toThrow(InvalidCentsError)
      })
    })

    describe('divideCentsSimple()', () => {
      it('should return just the quotient', () => {
        expect(divideCentsSimple(cents(100), 3)).toBe(33)
      })

      it('should use ROUND_HALF_UP by default', () => {
        expect(divideCentsSimple(cents(100), 6)).toBe(17)
      })

      it('should throw DivisionByZeroError for zero divisor', () => {
        expect(() => divideCentsSimple(cents(100), 0)).toThrow(DivisionByZeroError)
      })
    })
  })

  // ========================================
  // Percentage Tests
  // ========================================
  describe('Percentage Operations', () => {
    describe('calculatePercentage()', () => {
      it('should calculate percentage with result and remainder', () => {
        const result = calculatePercentage(cents(10000), 15)
        expect(result.amountCents).toBe(1500)
      })

      it('should handle fractional percentages', () => {
        const result = calculatePercentage(cents(1000), 33.33)
        expect(result.amountCents).toBe(333)
      })

      it('should handle 100%', () => {
        const result = calculatePercentage(cents(5000), 100)
        expect(result.amountCents).toBe(5000)
      })

      it('should handle 0%', () => {
        const result = calculatePercentage(cents(5000), 0)
        expect(result.amountCents).toBe(0)
      })

      it('should handle percentages over 100%', () => {
        const result = calculatePercentage(cents(1000), 150)
        expect(result.amountCents).toBe(1500)
      })

      it('should throw for non-finite percentage', () => {
        expect(() => calculatePercentage(cents(1000), Infinity)).toThrow()
      })
    })

    describe('percentageOf()', () => {
      it('should return simple percentage', () => {
        expect(percentageOf(cents(10000), 10)).toBe(1000)
        expect(percentageOf(cents(5000), 50)).toBe(2500)
      })
    })

    describe('addPercentage()', () => {
      it('should add percentage (tax example)', () => {
        expect(addPercentage(cents(10000), 8.25)).toBe(10825)
      })

      it('should handle 0%', () => {
        expect(addPercentage(cents(10000), 0)).toBe(10000)
      })
    })

    describe('subtractPercentage()', () => {
      it('should subtract percentage (discount example)', () => {
        expect(subtractPercentage(cents(10000), 20)).toBe(8000)
      })

      it('should handle 100% discount', () => {
        expect(subtractPercentage(cents(10000), 100)).toBe(0)
      })
    })
  })

  // ========================================
  // Allocation Tests
  // ========================================
  describe('Allocation', () => {
    describe('allocateCents()', () => {
      it('should allocate evenly when divisible', () => {
        const result = allocateCents(cents(100), 4)
        expect(result).toEqual([25, 25, 25, 25])
        expect(result.reduce((a, b) => a + b, 0)).toBe(100)
      })

      it('should distribute remainder fairly', () => {
        const result = allocateCents(cents(100), 3)
        expect(result).toEqual([34, 33, 33])
        expect(result.reduce((a, b) => a + b, 0)).toBe(100)
      })

      it('should handle small amounts', () => {
        const result = allocateCents(cents(10), 3)
        expect(result).toEqual([4, 3, 3])
        expect(result.reduce((a, b) => a + b, 0)).toBe(10)
      })

      it('should handle single recipient', () => {
        expect(allocateCents(cents(100), 1)).toEqual([100])
      })

      it('should throw for invalid parts', () => {
        expect(() => allocateCents(cents(100), 0)).toThrow(InvalidCentsError)
        expect(() => allocateCents(cents(100), -1)).toThrow(InvalidCentsError)
        expect(() => allocateCents(cents(100), 1.5)).toThrow(InvalidCentsError)
      })
    })

    describe('allocateCentsByRatio()', () => {
      it('should allocate by equal ratios', () => {
        const result = allocateCentsByRatio(cents(100), [1, 1, 1])
        expect(result.reduce((a, b) => a + b, 0)).toBe(100)
      })

      it('should allocate by unequal ratios', () => {
        const result = allocateCentsByRatio(cents(100), [1, 2, 2])
        expect(result).toEqual([20, 40, 40])
      })

      it('should handle complex ratios', () => {
        const result = allocateCentsByRatio(cents(1000), [50, 30, 20])
        expect(result).toEqual([500, 300, 200])
      })

      it('should preserve total with remainders', () => {
        const result = allocateCentsByRatio(cents(100), [1, 1, 1])
        expect(result.reduce((a, b) => a + b, 0)).toBe(100)
      })

      it('should throw for empty ratios', () => {
        expect(() => allocateCentsByRatio(cents(100), [])).toThrow()
      })

      it('should throw for all-zero ratios', () => {
        expect(() => allocateCentsByRatio(cents(100), [0, 0, 0])).toThrow(DivisionByZeroError)
      })
    })
  })

  // ========================================
  // Comparison Tests
  // ========================================
  describe('Comparison', () => {
    describe('compareCents()', () => {
      it('should return -1 when a < b', () => {
        expect(compareCents(cents(100), cents(200))).toBe(-1)
      })

      it('should return 0 when a === b', () => {
        expect(compareCents(cents(100), cents(100))).toBe(0)
      })

      it('should return 1 when a > b', () => {
        expect(compareCents(cents(200), cents(100))).toBe(1)
      })
    })

    describe('maxCents()', () => {
      it('should return maximum value', () => {
        expect(maxCents(cents(100), cents(200), cents(150))).toBe(200)
      })

      it('should handle negative values', () => {
        expect(maxCents(cents(-100), cents(-200), cents(-50))).toBe(-50)
      })

      it('should throw for empty array', () => {
        expect(() => maxCents()).toThrow()
      })
    })

    describe('minCents()', () => {
      it('should return minimum value', () => {
        expect(minCents(cents(100), cents(200), cents(150))).toBe(100)
      })

      it('should handle negative values', () => {
        expect(minCents(cents(-100), cents(-200), cents(-50))).toBe(-200)
      })

      it('should throw for empty array', () => {
        expect(() => minCents()).toThrow()
      })
    })

    describe('absCents()', () => {
      it('should return absolute value', () => {
        expect(absCents(cents(-100))).toBe(100)
        expect(absCents(cents(100))).toBe(100)
        expect(absCents(cents(0))).toBe(0)
      })
    })

    describe('negateCents()', () => {
      it('should negate value', () => {
        expect(negateCents(cents(100))).toBe(-100)
        expect(negateCents(cents(-100))).toBe(100)
        expect(negateCents(cents(0))).toBe(0)
      })
    })

    describe('boolean checks', () => {
      it('isZeroCents should detect zero', () => {
        expect(isZeroCents(cents(0))).toBe(true)
        expect(isZeroCents(cents(1))).toBe(false)
        expect(isZeroCents(cents(-1))).toBe(false)
      })

      it('isPositiveCents should detect positive', () => {
        expect(isPositiveCents(cents(1))).toBe(true)
        expect(isPositiveCents(cents(0))).toBe(false)
        expect(isPositiveCents(cents(-1))).toBe(false)
      })

      it('isNegativeCents should detect negative', () => {
        expect(isNegativeCents(cents(-1))).toBe(true)
        expect(isNegativeCents(cents(0))).toBe(false)
        expect(isNegativeCents(cents(1))).toBe(false)
      })
    })
  })

  // ========================================
  // Formatting Tests
  // ========================================
  describe('Formatting', () => {
    describe('formatCentsAsCurrency()', () => {
      it('should format positive amounts', () => {
        expect(formatCentsAsCurrency(cents(12345))).toBe('$123.45')
        expect(formatCentsAsCurrency(cents(100))).toBe('$1.00')
      })

      it('should format negative amounts', () => {
        expect(formatCentsAsCurrency(cents(-5000))).toBe('-$50.00')
      })

      it('should format zero', () => {
        expect(formatCentsAsCurrency(cents(0))).toBe('$0.00')
      })

      it('should use custom currency symbol', () => {
        expect(formatCentsAsCurrency(cents(1000), '€')).toBe('€10.00')
        expect(formatCentsAsCurrency(cents(1000), '£')).toBe('£10.00')
      })

      it('should format large numbers with separators', () => {
        expect(formatCentsAsCurrency(cents(123456789))).toBe('$1,234,567.89')
      })
    })
  })

  // ========================================
  // Edge Cases and Integration
  // ========================================
  describe('Edge Cases', () => {
    it('should handle maximum safe integer cents', () => {
      const maxCentsValue = cents(Number.MAX_SAFE_INTEGER)
      expect(centsToDollars(maxCentsValue)).toBeDefined()
    })

    it('should maintain precision through operations chain', () => {
      let value = cents(10000)
      value = addPercentage(value, 10)
      value = subtractPercentage(value, 5)
      expect(value).toBe(10450)
    })

    it('should handle typical financial workflow', () => {
      const price = dollarsToCents('19.99')
      expect(price).toBe(1999)

      const withTax = addPercentage(price, 8)
      expect(withTax).toBe(2159)

      const shares = allocateCents(withTax, 3)
      expect(shares.reduce((a, b) => a + b, 0)).toBe(2159)
      expect(shares).toEqual([720, 720, 719])

      expect(formatCentsAsCurrency(shares[0]!)).toBe('$7.20')
    })
  })

  // ========================================
  // Floating Point Prevention Tests
  // ========================================
  describe('Floating Point Prevention', () => {
    it('should reject floating point inputs at cents()', () => {
      expect(() => cents(0.1 + 0.2)).toThrow(InvalidCentsError)
    })

    it('should handle classic floating point problematic values', () => {
      // 0.7 * 3 = 2.0999999999999996 in JavaScript
      expect(() => cents(0.7 * 3)).toThrow(InvalidCentsError)
    })

    it('should require integer cents throughout operations', () => {
      expect(() => addCents(cents(100), 50.5 as Cents)).toThrow(InvalidCentsError)
    })
  })
})
