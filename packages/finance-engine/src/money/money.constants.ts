import { RoundingMode, type MoneyConfig } from './money.types'

/**
 * Default configuration for money operations.
 * Uses ROUND_HALF_UP as it's the most common for financial applications.
 */
export const DEFAULT_MONEY_CONFIG: MoneyConfig = {
  defaultRoundingMode: RoundingMode.ROUND_HALF_UP,
  precision: 20,
}

/**
 * Maximum safe integer for cents (prevents overflow issues).
 * Based on JavaScript's Number.MAX_SAFE_INTEGER.
 */
export const MAX_SAFE_CENTS = Number.MAX_SAFE_INTEGER

/**
 * Minimum safe integer for cents (for negative amounts).
 */
export const MIN_SAFE_CENTS = Number.MIN_SAFE_INTEGER

/**
 * Number of cents in one dollar.
 */
export const CENTS_PER_DOLLAR = 100
