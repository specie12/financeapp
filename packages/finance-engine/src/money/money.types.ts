/**
 * Branded type for cents to prevent accidental mixing with dollars.
 * At runtime, this is just a number, but TypeScript enforces the brand.
 */
export type Cents = number & { readonly __brand: 'Cents' }

/**
 * Branded type for dollar amounts (for display purposes only).
 */
export type Dollars = string & { readonly __brand: 'Dollars' }

/**
 * Rounding mode enumeration matching Decimal.js rounding modes.
 */
export enum RoundingMode {
  /** Rounds away from zero (1.5 -> 2, -1.5 -> -2) */
  ROUND_UP = 0,
  /** Rounds towards zero (1.9 -> 1, -1.9 -> -1) */
  ROUND_DOWN = 1,
  /** Rounds towards positive infinity */
  ROUND_CEIL = 2,
  /** Rounds towards negative infinity */
  ROUND_FLOOR = 3,
  /** Rounds to nearest, ties away from zero (1.5 -> 2, -1.5 -> -2) */
  ROUND_HALF_UP = 4,
  /** Rounds to nearest, ties towards zero (1.5 -> 1, -1.5 -> -1) */
  ROUND_HALF_DOWN = 5,
  /** Rounds to nearest, ties to even (banker's rounding) */
  ROUND_HALF_EVEN = 6,
}

/**
 * Configuration options for money operations.
 */
export interface MoneyConfig {
  /** Default rounding mode for division and percentage calculations */
  defaultRoundingMode: RoundingMode
  /** Decimal precision for intermediate calculations */
  precision: number
}

/**
 * Result of percentage calculation including remainder for allocation.
 */
export interface PercentageResult {
  /** The calculated amount in cents */
  amountCents: Cents
  /** Any remainder from rounding (useful for allocation) */
  remainderCents: Cents
}

/**
 * Result of division with remainder for fair allocation.
 */
export interface DivisionResult {
  /** The quotient in cents */
  quotientCents: Cents
  /** Remainder that couldn't be evenly divided */
  remainderCents: Cents
}

/**
 * Type guard input for cents validation.
 */
export interface CentsValidationResult {
  valid: boolean
  error?: string
}
