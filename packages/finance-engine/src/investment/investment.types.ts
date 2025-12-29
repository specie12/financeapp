import type { Cents } from '../money/money.types'

/**
 * Represents a single investment holding in the portfolio.
 */
export interface Holding {
  /** Stock/fund symbol or identifier */
  symbol: string
  /** Number of shares (can be fractional, e.g., 10.5) */
  shares: number
  /** Total amount paid for all shares (cost basis) */
  costBasisCents: Cents
  /** Current price per share */
  currentPriceCents: Cents
}

/**
 * Transaction types for portfolio activity.
 */
export type TransactionType = 'contribution' | 'withdrawal' | 'dividend' | 'reinvestment'

/**
 * Represents a single transaction in the portfolio.
 */
export interface Transaction {
  /** Type of transaction */
  type: TransactionType
  /** Date of the transaction */
  date: Date
  /** Amount in cents */
  amountCents: Cents
  /** Symbol for the holding (optional for general contributions) */
  symbol?: string
  /** Number of shares for buy/sell transactions */
  shares?: number
}

/**
 * A point-in-time snapshot of portfolio state for time series analysis.
 */
export interface PortfolioSnapshot {
  /** Date of the snapshot */
  date: Date
  /** Total portfolio value at this date */
  totalValueCents: Cents
  /** Cumulative contributions up to this date */
  totalContributionsCents: Cents
  /** Cumulative dividends up to this date */
  totalDividendsCents: Cents
}

/**
 * Summary of an individual holding with calculated metrics.
 */
export interface HoldingSummary {
  /** Stock/fund symbol */
  symbol: string
  /** Number of shares held */
  shares: number
  /** Total cost basis */
  costBasisCents: Cents
  /** Current market value */
  currentValueCents: Cents
  /** Unrealized gain/loss (current value - cost basis) */
  gainLossCents: Cents
  /** Gain/loss as percentage of cost basis */
  gainLossPercent: number
  /** Percentage of total portfolio value */
  allocationPercent: number
}

/**
 * Complete portfolio summary with all aggregated metrics.
 */
export interface PortfolioSummary {
  /** Summary of each holding */
  holdings: HoldingSummary[]
  /** Total current value of all holdings */
  totalValueCents: Cents
  /** Total cost basis of all holdings */
  totalCostBasisCents: Cents
  /** Total contributions (money added) */
  totalContributionsCents: Cents
  /** Total withdrawals (money removed) */
  totalWithdrawalsCents: Cents
  /** Net contributions (contributions - withdrawals) */
  netContributionsCents: Cents
  /** Total dividend income received */
  totalDividendsCents: Cents
  /** Unrealized gain/loss (total value - total cost basis) */
  unrealizedGainCents: Cents
  /** Unrealized gain as percentage of cost basis */
  unrealizedGainPercent: number
  /** Total return (unrealized gain + dividends) */
  totalReturnCents: Cents
  /** Total return as percentage of net contributions */
  totalReturnPercent: number
}

/**
 * Time period for aggregation.
 */
export type AggregationPeriod = 'month' | 'quarter' | 'year'

/**
 * Aggregated data for a single period.
 */
export interface PeriodAggregate {
  /** Start date of the period */
  periodStart: Date
  /** End date of the period */
  periodEnd: Date
  /** Label for the period (e.g., "2024-01", "Q1 2024", "2024") */
  label: string
  /** Total contributions in this period */
  contributionsCents: Cents
  /** Total withdrawals in this period */
  withdrawalsCents: Cents
  /** Total dividends in this period */
  dividendsCents: Cents
  /** Number of transactions in this period */
  transactionCount: number
}

/**
 * Result of validating a holding.
 */
export interface HoldingValidationResult {
  valid: boolean
  error?: string
}

/**
 * Result of validating a transaction.
 */
export interface TransactionValidationResult {
  valid: boolean
  error?: string
}
