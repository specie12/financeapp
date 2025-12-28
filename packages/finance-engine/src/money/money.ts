import Decimal from 'decimal.js'
import {
  type Cents,
  type Dollars,
  RoundingMode,
  type PercentageResult,
  type DivisionResult,
  type CentsValidationResult,
} from './money.types'
import {
  InvalidCentsError,
  DivisionByZeroError,
  InvalidPercentageError,
  OverflowError,
} from './money.errors'
import {
  DEFAULT_MONEY_CONFIG,
  MAX_SAFE_CENTS,
  MIN_SAFE_CENTS,
  CENTS_PER_DOLLAR,
} from './money.constants'

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: DEFAULT_MONEY_CONFIG.precision,
  rounding: DEFAULT_MONEY_CONFIG.defaultRoundingMode,
  toExpNeg: -9,
  toExpPos: 21,
})

// ============================================
// Validation Functions
// ============================================

/**
 * Validates that a value is a valid cents integer.
 * Returns a result object instead of throwing for flexible error handling.
 */
export function validateCents(value: unknown): CentsValidationResult {
  if (typeof value !== 'number') {
    return { valid: false, error: `Expected number, got ${typeof value}` }
  }
  if (!Number.isFinite(value)) {
    return { valid: false, error: 'Value must be finite' }
  }
  if (!Number.isInteger(value)) {
    return { valid: false, error: `Value must be an integer, got ${value}` }
  }
  if (value > MAX_SAFE_CENTS || value < MIN_SAFE_CENTS) {
    return { valid: false, error: 'Value exceeds safe integer bounds' }
  }
  return { valid: true }
}

/**
 * Asserts that a value is valid cents, throwing if invalid.
 * Use this for strict validation at boundaries.
 */
export function assertCents(value: unknown): asserts value is Cents {
  const result = validateCents(value)
  if (!result.valid) {
    throw new InvalidCentsError(value)
  }
}

/**
 * Creates a branded Cents value from a number.
 * Throws InvalidCentsError if the value is not a valid integer.
 */
export function cents(value: number): Cents {
  assertCents(value)
  return value as Cents
}

/**
 * Type guard to check if a value is valid cents.
 */
export function isCents(value: unknown): value is Cents {
  return validateCents(value).valid
}

// ============================================
// Conversion Functions
// ============================================

/**
 * Converts cents to a dollar string for display.
 * Always returns exactly 2 decimal places.
 *
 * @example
 * centsToDollars(cents(1299)) // "12.99"
 * centsToDollars(cents(100))  // "1.00"
 * centsToDollars(cents(-500)) // "-5.00"
 */
export function centsToDollars(centsValue: Cents): Dollars {
  assertCents(centsValue)
  const decimal = new Decimal(centsValue).dividedBy(CENTS_PER_DOLLAR)
  return decimal.toFixed(2) as Dollars
}

/**
 * Converts a dollar string/number to cents.
 * Rounds using the specified mode (default: ROUND_HALF_UP).
 *
 * @example
 * dollarsToCents("12.99")   // 1299 as Cents
 * dollarsToCents(12.995)    // 1300 as Cents (rounded)
 * dollarsToCents("10.50")   // 1050 as Cents
 */
export function dollarsToCents(
  dollars: string | number,
  roundingMode: RoundingMode = RoundingMode.ROUND_HALF_UP,
): Cents {
  const decimal = new Decimal(dollars)
  const centsDecimal = decimal.times(CENTS_PER_DOLLAR)
  const rounded = centsDecimal.toDecimalPlaces(0, roundingMode).toNumber()

  if (rounded > MAX_SAFE_CENTS || rounded < MIN_SAFE_CENTS) {
    throw new OverflowError('dollarsToCents conversion')
  }

  return rounded as Cents
}

// ============================================
// Arithmetic Operations
// ============================================

/**
 * Adds two or more cents values together.
 * All inputs must be valid integer cents.
 *
 * @example
 * addCents(cents(100), cents(200))           // 300 as Cents
 * addCents(cents(100), cents(200), cents(50)) // 350 as Cents
 */
export function addCents(...values: Cents[]): Cents {
  if (values.length === 0) {
    return 0 as Cents
  }

  values.forEach(assertCents)

  let result = new Decimal(0)
  for (const value of values) {
    result = result.plus(value)
  }

  const finalValue = result.toNumber()
  if (finalValue > MAX_SAFE_CENTS || finalValue < MIN_SAFE_CENTS) {
    throw new OverflowError('addition')
  }

  return finalValue as Cents
}

/**
 * Subtracts cents values (first - rest).
 *
 * @example
 * subtractCents(cents(500), cents(200))        // 300 as Cents
 * subtractCents(cents(500), cents(200), cents(100)) // 200 as Cents
 */
export function subtractCents(minuend: Cents, ...subtrahends: Cents[]): Cents {
  assertCents(minuend)
  subtrahends.forEach(assertCents)

  let result = new Decimal(minuend)
  for (const subtrahend of subtrahends) {
    result = result.minus(subtrahend)
  }

  const finalValue = result.toNumber()
  if (finalValue > MAX_SAFE_CENTS || finalValue < MIN_SAFE_CENTS) {
    throw new OverflowError('subtraction')
  }

  return finalValue as Cents
}

/**
 * Multiplies cents by a scalar value.
 * Result is rounded according to the specified mode.
 *
 * @example
 * multiplyCents(cents(100), 2)     // 200 as Cents
 * multiplyCents(cents(100), 1.5)   // 150 as Cents
 * multiplyCents(cents(333), 0.1)   // 33 as Cents (rounded)
 */
export function multiplyCents(
  centsValue: Cents,
  multiplier: number,
  roundingMode: RoundingMode = RoundingMode.ROUND_HALF_UP,
): Cents {
  assertCents(centsValue)

  if (!Number.isFinite(multiplier)) {
    throw new InvalidCentsError(multiplier)
  }

  const result = new Decimal(centsValue)
    .times(multiplier)
    .toDecimalPlaces(0, roundingMode)
    .toNumber()

  if (result > MAX_SAFE_CENTS || result < MIN_SAFE_CENTS) {
    throw new OverflowError('multiplication')
  }

  return result as Cents
}

/**
 * Divides cents by a divisor, returning quotient and remainder.
 * Useful for fair allocation of money.
 *
 * @example
 * divideCents(cents(100), 3)
 * // { quotientCents: 33, remainderCents: 1 }
 */
export function divideCents(
  centsValue: Cents,
  divisor: number,
  roundingMode: RoundingMode = RoundingMode.ROUND_DOWN,
): DivisionResult {
  assertCents(centsValue)

  if (divisor === 0) {
    throw new DivisionByZeroError()
  }

  if (!Number.isFinite(divisor)) {
    throw new InvalidCentsError(divisor)
  }

  const decimal = new Decimal(centsValue)
  const quotient = decimal.dividedBy(divisor).toDecimalPlaces(0, roundingMode).toNumber()
  const remainder = centsValue - quotient * divisor

  return {
    quotientCents: quotient as Cents,
    remainderCents: Math.round(remainder) as Cents,
  }
}

/**
 * Simple division returning just the quotient.
 * For cases where remainder tracking isn't needed.
 */
export function divideCentsSimple(
  centsValue: Cents,
  divisor: number,
  roundingMode: RoundingMode = RoundingMode.ROUND_HALF_UP,
): Cents {
  assertCents(centsValue)

  if (divisor === 0) {
    throw new DivisionByZeroError()
  }

  if (!Number.isFinite(divisor)) {
    throw new InvalidCentsError(divisor)
  }

  const result = new Decimal(centsValue)
    .dividedBy(divisor)
    .toDecimalPlaces(0, roundingMode)
    .toNumber()

  return result as Cents
}

// ============================================
// Percentage Operations
// ============================================

/**
 * Calculates a percentage of a cents amount.
 * Returns both the result and remainder for allocation purposes.
 *
 * @example
 * calculatePercentage(cents(10000), 15)
 * // { amountCents: 1500, remainderCents: 0 }
 *
 * calculatePercentage(cents(1000), 33.33)
 * // { amountCents: 333, remainderCents: 0 } (rounded from 333.3)
 */
export function calculatePercentage(
  centsValue: Cents,
  percentage: number,
  roundingMode: RoundingMode = RoundingMode.ROUND_HALF_UP,
): PercentageResult {
  assertCents(centsValue)

  if (!Number.isFinite(percentage)) {
    throw new InvalidPercentageError(percentage, 'percentage must be finite')
  }

  const decimal = new Decimal(centsValue)
  const exactResult = decimal.times(percentage).dividedBy(100)
  const roundedResult = exactResult.toDecimalPlaces(0, roundingMode).toNumber()
  const remainder = Math.abs(exactResult.minus(roundedResult).toNumber())

  return {
    amountCents: roundedResult as Cents,
    remainderCents: Math.round(remainder * 100) as Cents,
  }
}

/**
 * Simple percentage calculation returning just the amount.
 */
export function percentageOf(
  centsValue: Cents,
  percentage: number,
  roundingMode: RoundingMode = RoundingMode.ROUND_HALF_UP,
): Cents {
  return calculatePercentage(centsValue, percentage, roundingMode).amountCents
}

/**
 * Adds a percentage to a cents amount (e.g., tax calculation).
 *
 * @example
 * addPercentage(cents(10000), 8.25) // 10825 as Cents (adding 8.25% tax)
 */
export function addPercentage(
  centsValue: Cents,
  percentage: number,
  roundingMode: RoundingMode = RoundingMode.ROUND_HALF_UP,
): Cents {
  const increase = percentageOf(centsValue, percentage, roundingMode)
  return addCents(centsValue, increase)
}

/**
 * Subtracts a percentage from a cents amount (e.g., discount).
 *
 * @example
 * subtractPercentage(cents(10000), 20) // 8000 as Cents (20% discount)
 */
export function subtractPercentage(
  centsValue: Cents,
  percentage: number,
  roundingMode: RoundingMode = RoundingMode.ROUND_HALF_UP,
): Cents {
  const decrease = percentageOf(centsValue, percentage, roundingMode)
  return subtractCents(centsValue, decrease)
}

// ============================================
// Allocation Functions
// ============================================

/**
 * Allocates cents across n recipients fairly, distributing remainder.
 * Uses the "largest remainder" method for fair distribution.
 *
 * @example
 * allocateCents(cents(100), 3) // [34, 33, 33] as Cents[]
 * allocateCents(cents(10), 3)  // [4, 3, 3] as Cents[]
 */
export function allocateCents(centsValue: Cents, parts: number): Cents[] {
  assertCents(centsValue)

  if (!Number.isInteger(parts) || parts <= 0) {
    throw new InvalidCentsError(parts)
  }

  const { quotientCents, remainderCents } = divideCents(centsValue, parts, RoundingMode.ROUND_DOWN)

  const result: Cents[] = []
  for (let i = 0; i < parts; i++) {
    const extra = i < Math.abs(remainderCents) ? 1 : 0
    result.push(addCents(quotientCents, extra as Cents))
  }

  return result
}

/**
 * Allocates cents by ratio (e.g., splitting a bill proportionally).
 *
 * @example
 * allocateCentsByRatio(cents(100), [1, 2, 2])
 * // [20, 40, 40] as Cents[]
 */
export function allocateCentsByRatio(centsValue: Cents, ratios: number[]): Cents[] {
  assertCents(centsValue)

  if (ratios.length === 0) {
    throw new InvalidCentsError('empty ratios array')
  }

  const totalRatio = ratios.reduce((sum, r) => sum + r, 0)
  if (totalRatio === 0) {
    throw new DivisionByZeroError()
  }

  const allocations = ratios.map((ratio) => {
    const share = new Decimal(centsValue).times(ratio).dividedBy(totalRatio)
    return share.toDecimalPlaces(0, RoundingMode.ROUND_DOWN).toNumber()
  })

  // Distribute remainder
  const allocated = allocations.reduce((sum, a) => sum + a, 0)
  let remainder = centsValue - allocated

  // Give remainder to entries with highest fractional parts
  const fractionalParts = ratios.map((ratio, i) => ({
    index: i,
    fractional: new Decimal(centsValue).times(ratio).dividedBy(totalRatio).mod(1).toNumber(),
  }))
  fractionalParts.sort((a, b) => b.fractional - a.fractional)

  for (const { index } of fractionalParts) {
    if (remainder <= 0) break
    allocations[index]!++
    remainder--
  }

  return allocations.map((a) => a as Cents)
}

// ============================================
// Comparison Functions
// ============================================

/**
 * Compares two cents values.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 */
export function compareCents(a: Cents, b: Cents): -1 | 0 | 1 {
  assertCents(a)
  assertCents(b)

  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/**
 * Returns the maximum of the provided cents values.
 */
export function maxCents(...values: Cents[]): Cents {
  if (values.length === 0) {
    throw new InvalidCentsError('empty array')
  }
  values.forEach(assertCents)
  return Math.max(...values) as Cents
}

/**
 * Returns the minimum of the provided cents values.
 */
export function minCents(...values: Cents[]): Cents {
  if (values.length === 0) {
    throw new InvalidCentsError('empty array')
  }
  values.forEach(assertCents)
  return Math.min(...values) as Cents
}

/**
 * Returns the absolute value of cents.
 */
export function absCents(centsValue: Cents): Cents {
  assertCents(centsValue)
  return Math.abs(centsValue) as Cents
}

/**
 * Negates a cents value.
 */
export function negateCents(centsValue: Cents): Cents {
  assertCents(centsValue)
  // Handle -0 edge case
  const result = -centsValue
  return (result === 0 ? 0 : result) as Cents
}

/**
 * Checks if cents value is zero.
 */
export function isZeroCents(centsValue: Cents): boolean {
  assertCents(centsValue)
  return centsValue === 0
}

/**
 * Checks if cents value is positive (> 0).
 */
export function isPositiveCents(centsValue: Cents): boolean {
  assertCents(centsValue)
  return centsValue > 0
}

/**
 * Checks if cents value is negative (< 0).
 */
export function isNegativeCents(centsValue: Cents): boolean {
  assertCents(centsValue)
  return centsValue < 0
}

// ============================================
// Formatting Functions
// ============================================

/**
 * Formats cents as a currency string.
 */
export function formatCentsAsCurrency(
  centsValue: Cents,
  currencySymbol: string = '$',
  locale: string = 'en-US',
): string {
  assertCents(centsValue)
  const dollars = new Decimal(centsValue).dividedBy(CENTS_PER_DOLLAR).toNumber()
  const formatted = Math.abs(dollars).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return dollars < 0 ? `-${currencySymbol}${formatted}` : `${currencySymbol}${formatted}`
}
