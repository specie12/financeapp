import Decimal from 'decimal.js'
import { type Cents, RoundingMode } from '../money/money.types'
import { cents, addCents, subtractCents } from '../money/money'
import { InvalidHoldingError, InvalidTransactionError } from './investment.errors'
import type {
  Holding,
  Transaction,
  HoldingSummary,
  PortfolioSummary,
  PortfolioSnapshot,
  AggregationPeriod,
  PeriodAggregate,
  HoldingValidationResult,
  TransactionValidationResult,
} from './investment.types'

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
})

// ============================================
// Validation Functions
// ============================================

/**
 * Validates a holding object.
 * Returns a validation result without throwing.
 */
export function validateHolding(holding: Holding): HoldingValidationResult {
  if (!holding.symbol || typeof holding.symbol !== 'string') {
    return { valid: false, error: 'Symbol must be a non-empty string' }
  }
  if (typeof holding.shares !== 'number' || !Number.isFinite(holding.shares)) {
    return { valid: false, error: 'Shares must be a finite number' }
  }
  if (holding.shares < 0) {
    return { valid: false, error: 'Shares cannot be negative' }
  }
  if (typeof holding.costBasisCents !== 'number' || !Number.isInteger(holding.costBasisCents)) {
    return { valid: false, error: 'Cost basis must be an integer (cents)' }
  }
  if (holding.costBasisCents < 0) {
    return { valid: false, error: 'Cost basis cannot be negative' }
  }
  if (
    typeof holding.currentPriceCents !== 'number' ||
    !Number.isInteger(holding.currentPriceCents)
  ) {
    return { valid: false, error: 'Current price must be an integer (cents)' }
  }
  if (holding.currentPriceCents < 0) {
    return { valid: false, error: 'Current price cannot be negative' }
  }
  return { valid: true }
}

/**
 * Asserts that a holding is valid, throwing if not.
 */
function assertValidHolding(holding: Holding): void {
  const result = validateHolding(holding)
  if (!result.valid) {
    throw new InvalidHoldingError(result.error!)
  }
}

/**
 * Validates a transaction object.
 * Returns a validation result without throwing.
 */
export function validateTransaction(transaction: Transaction): TransactionValidationResult {
  const validTypes = ['contribution', 'withdrawal', 'dividend', 'reinvestment']
  if (!validTypes.includes(transaction.type)) {
    return { valid: false, error: `Type must be one of: ${validTypes.join(', ')}` }
  }
  if (!(transaction.date instanceof Date) || isNaN(transaction.date.getTime())) {
    return { valid: false, error: 'Date must be a valid Date object' }
  }
  if (typeof transaction.amountCents !== 'number' || !Number.isInteger(transaction.amountCents)) {
    return { valid: false, error: 'Amount must be an integer (cents)' }
  }
  if (transaction.amountCents < 0) {
    return { valid: false, error: 'Amount cannot be negative' }
  }
  if (transaction.symbol !== undefined && typeof transaction.symbol !== 'string') {
    return { valid: false, error: 'Symbol must be a string if provided' }
  }
  if (transaction.shares !== undefined) {
    if (typeof transaction.shares !== 'number' || !Number.isFinite(transaction.shares)) {
      return { valid: false, error: 'Shares must be a finite number if provided' }
    }
    if (transaction.shares < 0) {
      return { valid: false, error: 'Shares cannot be negative' }
    }
  }
  return { valid: true }
}

/**
 * Asserts that a transaction is valid, throwing if not.
 */
function assertValidTransaction(transaction: Transaction): void {
  const result = validateTransaction(transaction)
  if (!result.valid) {
    throw new InvalidTransactionError(result.error!)
  }
}

// ============================================
// Core Calculation Functions
// ============================================

/**
 * Calculates the current market value of a holding.
 * Value = shares × currentPriceCents
 */
export function calculateHoldingValue(holding: Holding): Cents {
  assertValidHolding(holding)

  if (holding.shares === 0) {
    return cents(0)
  }

  const value = new Decimal(holding.shares)
    .times(holding.currentPriceCents)
    .toDecimalPlaces(0, RoundingMode.ROUND_HALF_UP)
    .toNumber()

  return cents(value)
}

/**
 * Calculates the total portfolio value from all holdings.
 */
export function calculatePortfolioValue(holdings: Holding[]): Cents {
  if (holdings.length === 0) {
    return cents(0)
  }

  let total = cents(0)
  for (const holding of holdings) {
    const value = calculateHoldingValue(holding)
    total = addCents(total, value)
  }

  return total
}

/**
 * Calculates the total cost basis of all holdings.
 */
export function calculateTotalCostBasis(holdings: Holding[]): Cents {
  if (holdings.length === 0) {
    return cents(0)
  }

  let total = cents(0)
  for (const holding of holdings) {
    assertValidHolding(holding)
    total = addCents(total, holding.costBasisCents)
  }

  return total
}

/**
 * Calculates total contributions from transactions.
 */
export function calculateTotalContributions(transactions: Transaction[]): Cents {
  let total = cents(0)
  for (const tx of transactions) {
    assertValidTransaction(tx)
    if (tx.type === 'contribution') {
      total = addCents(total, tx.amountCents)
    }
  }
  return total
}

/**
 * Calculates total withdrawals from transactions.
 */
export function calculateTotalWithdrawals(transactions: Transaction[]): Cents {
  let total = cents(0)
  for (const tx of transactions) {
    assertValidTransaction(tx)
    if (tx.type === 'withdrawal') {
      total = addCents(total, tx.amountCents)
    }
  }
  return total
}

/**
 * Calculates total dividend income from transactions.
 */
export function calculateTotalDividends(transactions: Transaction[]): Cents {
  let total = cents(0)
  for (const tx of transactions) {
    assertValidTransaction(tx)
    if (tx.type === 'dividend') {
      total = addCents(total, tx.amountCents)
    }
  }
  return total
}

/**
 * Calculates unrealized gain/loss for all holdings.
 * Unrealized gain = total current value - total cost basis
 */
export function calculateUnrealizedGain(holdings: Holding[]): Cents {
  const totalValue = calculatePortfolioValue(holdings)
  const totalCostBasis = calculateTotalCostBasis(holdings)
  return subtractCents(totalValue, totalCostBasis)
}

// ============================================
// Holding Summary
// ============================================

/**
 * Creates a summary for a single holding including allocation percentage.
 */
export function summarizeHolding(
  holding: Holding,
  portfolioTotalValueCents: Cents,
): HoldingSummary {
  assertValidHolding(holding)

  const currentValueCents = calculateHoldingValue(holding)
  const gainLossCents = subtractCents(currentValueCents, holding.costBasisCents)

  // Calculate gain/loss percentage (relative to cost basis)
  let gainLossPercent = 0
  if (holding.costBasisCents > 0) {
    gainLossPercent = new Decimal(gainLossCents)
      .dividedBy(holding.costBasisCents)
      .times(100)
      .toDecimalPlaces(2, RoundingMode.ROUND_HALF_UP)
      .toNumber()
  }

  // Calculate allocation percentage (relative to portfolio total)
  let allocationPercent = 0
  if (portfolioTotalValueCents > 0) {
    allocationPercent = new Decimal(currentValueCents)
      .dividedBy(portfolioTotalValueCents)
      .times(100)
      .toDecimalPlaces(2, RoundingMode.ROUND_HALF_UP)
      .toNumber()
  } else if (currentValueCents > 0) {
    allocationPercent = 100 // Only holding with value
  }

  return {
    symbol: holding.symbol,
    shares: holding.shares,
    costBasisCents: holding.costBasisCents,
    currentValueCents,
    gainLossCents,
    gainLossPercent,
    allocationPercent,
  }
}

// ============================================
// Portfolio Aggregation
// ============================================

/**
 * Aggregates all portfolio data into a comprehensive summary.
 */
export function aggregatePortfolio(
  holdings: Holding[],
  transactions: Transaction[],
): PortfolioSummary {
  const totalValueCents = calculatePortfolioValue(holdings)
  const totalCostBasisCents = calculateTotalCostBasis(holdings)
  const totalContributionsCents = calculateTotalContributions(transactions)
  const totalWithdrawalsCents = calculateTotalWithdrawals(transactions)
  const totalDividendsCents = calculateTotalDividends(transactions)

  const netContributionsCents = subtractCents(totalContributionsCents, totalWithdrawalsCents)
  const unrealizedGainCents = subtractCents(totalValueCents, totalCostBasisCents)

  // Calculate unrealized gain percentage (relative to cost basis)
  let unrealizedGainPercent = 0
  if (totalCostBasisCents > 0) {
    unrealizedGainPercent = new Decimal(unrealizedGainCents)
      .dividedBy(totalCostBasisCents)
      .times(100)
      .toDecimalPlaces(2, RoundingMode.ROUND_HALF_UP)
      .toNumber()
  }

  // Total return = unrealized gain + dividends
  const totalReturnCents = addCents(unrealizedGainCents, totalDividendsCents)

  // Total return percentage (relative to net contributions)
  let totalReturnPercent = 0
  if (netContributionsCents > 0) {
    totalReturnPercent = new Decimal(totalReturnCents)
      .dividedBy(netContributionsCents)
      .times(100)
      .toDecimalPlaces(2, RoundingMode.ROUND_HALF_UP)
      .toNumber()
  }

  // Summarize each holding
  const holdingSummaries = holdings.map((h) => summarizeHolding(h, totalValueCents))

  return {
    holdings: holdingSummaries,
    totalValueCents,
    totalCostBasisCents,
    totalContributionsCents,
    totalWithdrawalsCents,
    netContributionsCents,
    totalDividendsCents,
    unrealizedGainCents,
    unrealizedGainPercent,
    totalReturnCents,
    totalReturnPercent,
  }
}

// ============================================
// Time Series Functions
// ============================================

/**
 * Gets the period key for a date based on aggregation period.
 */
function getPeriodKey(date: Date, period: AggregationPeriod): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 0-indexed to 1-indexed

  switch (period) {
    case 'month':
      return `${year}-${month.toString().padStart(2, '0')}`
    case 'quarter': {
      const quarter = Math.ceil(month / 3)
      return `${year}-Q${quarter}`
    }
    case 'year':
      return `${year}`
  }
}

/**
 * Gets the start and end dates for a period key.
 */
function getPeriodDates(periodKey: string, period: AggregationPeriod): { start: Date; end: Date } {
  switch (period) {
    case 'month': {
      const [year, month] = periodKey.split('-').map(Number)
      const start = new Date(year!, month! - 1, 1)
      const end = new Date(year!, month!, 0) // Last day of month
      return { start, end }
    }
    case 'quarter': {
      const [yearStr, quarterStr] = periodKey.split('-Q')
      const year = Number(yearStr)
      const quarter = Number(quarterStr)
      const startMonth = (quarter - 1) * 3
      const start = new Date(year, startMonth, 1)
      const end = new Date(year, startMonth + 3, 0)
      return { start, end }
    }
    case 'year': {
      const year = Number(periodKey)
      const start = new Date(year, 0, 1)
      const end = new Date(year, 11, 31)
      return { start, end }
    }
  }
}

/**
 * Aggregates transactions by time period.
 */
export function aggregateByPeriod(
  transactions: Transaction[],
  period: AggregationPeriod,
): PeriodAggregate[] {
  // Validate all transactions first
  for (const tx of transactions) {
    assertValidTransaction(tx)
  }

  // Group by period
  const periodMap = new Map<
    string,
    { contributions: Cents; withdrawals: Cents; dividends: Cents; count: number }
  >()

  for (const tx of transactions) {
    const key = getPeriodKey(tx.date, period)
    const existing = periodMap.get(key) || {
      contributions: cents(0),
      withdrawals: cents(0),
      dividends: cents(0),
      count: 0,
    }

    if (tx.type === 'contribution') {
      existing.contributions = addCents(existing.contributions, tx.amountCents)
    } else if (tx.type === 'withdrawal') {
      existing.withdrawals = addCents(existing.withdrawals, tx.amountCents)
    } else if (tx.type === 'dividend') {
      existing.dividends = addCents(existing.dividends, tx.amountCents)
    }
    existing.count++

    periodMap.set(key, existing)
  }

  // Convert to array and sort by period
  const result: PeriodAggregate[] = []
  for (const [key, data] of periodMap) {
    const { start, end } = getPeriodDates(key, period)
    result.push({
      periodStart: start,
      periodEnd: end,
      label: key,
      contributionsCents: data.contributions,
      withdrawalsCents: data.withdrawals,
      dividendsCents: data.dividends,
      transactionCount: data.count,
    })
  }

  // Sort by period start date
  result.sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime())

  return result
}

/**
 * Calculates dividend income aggregated by period.
 */
export function calculateDividendsByPeriod(
  transactions: Transaction[],
  period: AggregationPeriod,
): PeriodAggregate[] {
  // Filter to only dividend transactions
  const dividendTxs = transactions.filter((tx) => tx.type === 'dividend')
  return aggregateByPeriod(dividendTxs, period)
}

/**
 * Validates and sorts portfolio snapshots by date.
 * Returns a sorted array of snapshots.
 */
export function buildPortfolioTimeSeries(snapshots: PortfolioSnapshot[]): PortfolioSnapshot[] {
  // Validate each snapshot
  for (const snapshot of snapshots) {
    if (!(snapshot.date instanceof Date) || isNaN(snapshot.date.getTime())) {
      throw new InvalidTransactionError('Snapshot date must be a valid Date')
    }
    if (!Number.isInteger(snapshot.totalValueCents)) {
      throw new InvalidTransactionError('Snapshot totalValueCents must be an integer')
    }
    if (!Number.isInteger(snapshot.totalContributionsCents)) {
      throw new InvalidTransactionError('Snapshot totalContributionsCents must be an integer')
    }
    if (!Number.isInteger(snapshot.totalDividendsCents)) {
      throw new InvalidTransactionError('Snapshot totalDividendsCents must be an integer')
    }
  }

  // Sort by date
  return [...snapshots].sort((a, b) => a.date.getTime() - b.date.getTime())
}
