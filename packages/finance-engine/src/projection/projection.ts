import Decimal from 'decimal.js'
import { type Cents, RoundingMode } from '../money/money.types'
import { cents, addCents, subtractCents } from '../money/money'
import { generateAmortizationSchedule } from '../amortization/amortization'
import { applyScenarioToEntities } from '../scenario/scenario'
import { InvalidProjectionInputError } from './projection.errors'
import type {
  ProjectionInput,
  ProjectionResult,
  YearlySnapshot,
  ProjectionSummary,
  ProjectionAsset,
  ProjectionLiability,
  ProjectionCashFlowItem,
  LiabilityYearProjection,
  ProjectionValidationResult,
  Frequency,
  AssetValue,
  LiabilityBalance,
} from './projection.types'
import { FREQUENCY_MULTIPLIERS, MIN_HORIZON_YEARS, MAX_HORIZON_YEARS } from './projection.types'

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
})

// ============================================
// Validation Functions
// ============================================

/**
 * Validates projection input.
 */
export function validateProjectionInput(input: ProjectionInput): ProjectionValidationResult {
  if (!input.startDate || !(input.startDate instanceof Date) || isNaN(input.startDate.getTime())) {
    return { valid: false, error: 'Start date must be a valid Date' }
  }

  if (typeof input.horizonYears !== 'number' || !Number.isInteger(input.horizonYears)) {
    return { valid: false, error: 'Horizon years must be an integer' }
  }

  if (input.horizonYears < MIN_HORIZON_YEARS || input.horizonYears > MAX_HORIZON_YEARS) {
    return {
      valid: false,
      error: `Horizon must be between ${MIN_HORIZON_YEARS} and ${MAX_HORIZON_YEARS} years`,
    }
  }

  if (!Array.isArray(input.assets)) {
    return { valid: false, error: 'Assets must be an array' }
  }

  if (!Array.isArray(input.liabilities)) {
    return { valid: false, error: 'Liabilities must be an array' }
  }

  if (!Array.isArray(input.cashFlowItems)) {
    return { valid: false, error: 'Cash flow items must be an array' }
  }

  return { valid: true }
}

/**
 * Asserts that projection input is valid.
 */
function assertValidInput(input: ProjectionInput): void {
  const result = validateProjectionInput(input)
  if (!result.valid) {
    throw new InvalidProjectionInputError(result.error!)
  }
}

// ============================================
// Date Utilities (Deterministic)
// ============================================

/**
 * Adds years to a date (deterministic).
 */
function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

/**
 * Checks if a cash flow item is active during a specific year.
 */
function isCashFlowActiveInYear(
  item: ProjectionCashFlowItem,
  projectionStartDate: Date,
  year: number,
): boolean {
  const yearStart = addYears(projectionStartDate, year)
  const yearEnd = addYears(projectionStartDate, year + 1)

  // If item has a start date and it's after this year ends, not active
  if (item.startDate && item.startDate > yearEnd) return false

  // If item has an end date and it's before this year starts, not active
  if (item.endDate && item.endDate < yearStart) return false

  // One-time items only count in year 0
  if (item.frequency === 'one_time' && year > 0) return false

  return true
}

// ============================================
// Asset Projection
// ============================================

/**
 * Projects an asset's value to a future year using compound growth.
 *
 * Formula: FV = PV * (1 + r)^n
 *
 * DETERMINISTIC: Same inputs always produce same output.
 */
export function projectAssetValue(
  currentValueCents: Cents,
  annualGrowthRatePercent: number,
  years: number,
): Cents {
  if (years === 0) return currentValueCents
  if (currentValueCents === 0) return cents(0)

  const rate = new Decimal(annualGrowthRatePercent).dividedBy(100)
  const futureValue = new Decimal(currentValueCents)
    .times(rate.plus(1).pow(years))
    .toDecimalPlaces(0, RoundingMode.ROUND_HALF_UP)

  return cents(futureValue.toNumber())
}

/**
 * Projects all assets to a specific year.
 */
function projectAssets(assets: ProjectionAsset[], year: number): AssetValue[] {
  // Sort by ID for determinism
  const sorted = [...assets].sort((a, b) => a.id.localeCompare(b.id))

  return sorted.map((asset) => ({
    id: asset.id,
    valueCents: projectAssetValue(asset.currentValueCents, asset.annualGrowthRatePercent, year),
  }))
}

// ============================================
// Liability Projection
// ============================================

/**
 * Projects a liability to a specific year using amortization.
 *
 * DETERMINISTIC: Uses existing amortization engine.
 */
export function projectLiabilityToYear(
  liability: ProjectionLiability,
  projectionStartDate: Date,
  targetYear: number,
): LiabilityYearProjection {
  // If already paid off (balance is 0)
  if (liability.currentBalanceCents <= 0) {
    return {
      balanceCents: cents(0),
      yearlyPaymentCents: cents(0),
      yearlyInterestCents: cents(0),
      yearlyPrincipalCents: cents(0),
    }
  }

  // Generate amortization schedule
  const termMonths = liability.termMonths ?? 360 // Default to 30 years
  const schedule = generateAmortizationSchedule({
    principalCents: liability.currentBalanceCents,
    annualInterestRatePercent: liability.interestRatePercent,
    termMonths,
    startDate: projectionStartDate,
  })

  // Calculate year boundaries in months
  const yearStartMonth = targetYear * 12
  const yearEndMonth = Math.min((targetYear + 1) * 12, schedule.schedule.length)

  // If this year is beyond the loan term, balance is 0
  if (yearStartMonth >= schedule.schedule.length) {
    return {
      balanceCents: cents(0),
      yearlyPaymentCents: cents(0),
      yearlyInterestCents: cents(0),
      yearlyPrincipalCents: cents(0),
    }
  }

  // Get ending balance (last month of this year or end of schedule)
  const endMonth = Math.min(yearEndMonth, schedule.schedule.length)
  const endingEntry = schedule.schedule[endMonth - 1]
  const balanceCents = endingEntry ? endingEntry.endingBalanceCents : cents(0)

  // Sum payments for this year
  let yearlyPaymentCents = cents(0)
  let yearlyInterestCents = cents(0)
  let yearlyPrincipalCents = cents(0)

  for (let m = yearStartMonth; m < endMonth; m++) {
    const entry = schedule.schedule[m]
    if (entry) {
      yearlyPaymentCents = addCents(yearlyPaymentCents, entry.totalPaymentCents)
      yearlyInterestCents = addCents(yearlyInterestCents, entry.interestCents)
      yearlyPrincipalCents = addCents(yearlyPrincipalCents, entry.principalCents)
    }
  }

  return {
    balanceCents,
    yearlyPaymentCents,
    yearlyInterestCents,
    yearlyPrincipalCents,
  }
}

/**
 * Projects all liabilities to a specific year.
 */
function projectLiabilities(
  liabilities: ProjectionLiability[],
  projectionStartDate: Date,
  year: number,
): {
  balances: LiabilityBalance[]
  totalPayments: Cents
  totalInterest: Cents
  totalPrincipal: Cents
} {
  // Sort by ID for determinism
  const sorted = [...liabilities].sort((a, b) => a.id.localeCompare(b.id))

  let totalPayments = cents(0)
  let totalInterest = cents(0)
  let totalPrincipal = cents(0)

  const balances: LiabilityBalance[] = sorted.map((liability) => {
    const projection = projectLiabilityToYear(liability, projectionStartDate, year)
    totalPayments = addCents(totalPayments, projection.yearlyPaymentCents)
    totalInterest = addCents(totalInterest, projection.yearlyInterestCents)
    totalPrincipal = addCents(totalPrincipal, projection.yearlyPrincipalCents)

    return {
      id: liability.id,
      balanceCents: projection.balanceCents,
    }
  })

  return { balances, totalPayments, totalInterest, totalPrincipal }
}

// ============================================
// Cash Flow Projection
// ============================================

/**
 * Converts a cash flow amount to annual equivalent.
 */
export function annualizeCashFlow(amountCents: Cents, frequency: Frequency): Cents {
  const multiplier = FREQUENCY_MULTIPLIERS[frequency]
  const annualized = new Decimal(amountCents)
    .times(multiplier)
    .toDecimalPlaces(0, RoundingMode.ROUND_HALF_UP)

  return cents(annualized.toNumber())
}

/**
 * Projects a cash flow item to a specific year.
 */
export function projectCashFlowItem(
  item: ProjectionCashFlowItem,
  projectionStartDate: Date,
  year: number,
): Cents {
  // Check if item is active in this year
  if (!isCashFlowActiveInYear(item, projectionStartDate, year)) {
    return cents(0)
  }

  // Annualize the base amount
  const annualized = annualizeCashFlow(item.amountCents, item.frequency)

  // Apply growth rate for future years
  if (year === 0 || !item.annualGrowthRatePercent) {
    return annualized
  }

  const rate = new Decimal(item.annualGrowthRatePercent).dividedBy(100)
  const projected = new Decimal(annualized)
    .times(rate.plus(1).pow(year))
    .toDecimalPlaces(0, RoundingMode.ROUND_HALF_UP)

  return cents(projected.toNumber())
}

/**
 * Projects all cash flow items to a specific year.
 */
function projectCashFlows(
  items: ProjectionCashFlowItem[],
  projectionStartDate: Date,
  year: number,
): { income: Cents; expenses: Cents } {
  // Sort by ID for determinism
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id))

  let income = cents(0)
  let expenses = cents(0)

  for (const item of sorted) {
    const amount = projectCashFlowItem(item, projectionStartDate, year)
    if (item.type === 'income') {
      income = addCents(income, amount)
    } else {
      expenses = addCents(expenses, amount)
    }
  }

  return { income, expenses }
}

// ============================================
// Yearly Snapshot Calculation
// ============================================

/**
 * Calculates a yearly snapshot for a specific year.
 */
function calculateYearlySnapshot(
  assets: ProjectionAsset[],
  liabilities: ProjectionLiability[],
  cashFlowItems: ProjectionCashFlowItem[],
  projectionStartDate: Date,
  year: number,
): YearlySnapshot {
  const date = addYears(projectionStartDate, year)

  // Project assets
  const assetValues = projectAssets(assets, year)
  const totalAssetsCents = assetValues.reduce((sum, av) => addCents(sum, av.valueCents), cents(0))

  // Project liabilities
  const liabilityResult = projectLiabilities(liabilities, projectionStartDate, year)
  const totalLiabilitiesCents = liabilityResult.balances.reduce(
    (sum, lb) => addCents(sum, lb.balanceCents),
    cents(0),
  )

  // Calculate net worth
  const netWorthCents = subtractCents(totalAssetsCents, totalLiabilitiesCents)

  // Project cash flows
  const cashFlowResult = projectCashFlows(cashFlowItems, projectionStartDate, year)

  // Net cash flow = income - expenses - debt payments
  const netCashFlowCents = subtractCents(
    subtractCents(cashFlowResult.income, cashFlowResult.expenses),
    liabilityResult.totalPayments,
  )

  return {
    year,
    date,
    totalAssetsCents,
    totalLiabilitiesCents,
    netWorthCents,
    totalIncomeCents: cashFlowResult.income,
    totalExpensesCents: cashFlowResult.expenses,
    debtPaymentsCents: liabilityResult.totalPayments,
    netCashFlowCents,
    assetValues,
    liabilityBalances: liabilityResult.balances,
  }
}

// ============================================
// Summary Calculation
// ============================================

/**
 * Calculates projection summary from yearly snapshots.
 */
function calculateProjectionSummary(
  snapshots: YearlySnapshot[],
  liabilities: ProjectionLiability[],
  projectionStartDate: Date,
  horizonYears: number,
): ProjectionSummary {
  const firstSnapshot = snapshots[0]!
  const lastSnapshot = snapshots[snapshots.length - 1]!

  const startingNetWorthCents = firstSnapshot.netWorthCents
  const endingNetWorthCents = lastSnapshot.netWorthCents
  const netWorthChangeCents = subtractCents(endingNetWorthCents, startingNetWorthCents)

  // Calculate percentage change
  let netWorthChangePercent = 0
  if (startingNetWorthCents !== 0) {
    netWorthChangePercent = new Decimal(netWorthChangeCents)
      .dividedBy(Math.abs(startingNetWorthCents))
      .times(100)
      .toDecimalPlaces(2, RoundingMode.ROUND_HALF_UP)
      .toNumber()
  }

  // Sum totals over all years (excluding year 0 for cash flows)
  let totalIncomeOverPeriodCents = cents(0)
  let totalExpensesOverPeriodCents = cents(0)
  let totalDebtPaidCents = cents(0)
  let totalInterestPaidCents = cents(0)

  for (let year = 0; year <= horizonYears; year++) {
    const snapshot = snapshots[year]!
    totalIncomeOverPeriodCents = addCents(totalIncomeOverPeriodCents, snapshot.totalIncomeCents)
    totalExpensesOverPeriodCents = addCents(
      totalExpensesOverPeriodCents,
      snapshot.totalExpensesCents,
    )
    totalDebtPaidCents = addCents(totalDebtPaidCents, snapshot.debtPaymentsCents)

    // Calculate interest for this year
    const liabilityResult = projectLiabilities(liabilities, projectionStartDate, year)
    totalInterestPaidCents = addCents(totalInterestPaidCents, liabilityResult.totalInterest)
  }

  return {
    startingNetWorthCents,
    endingNetWorthCents,
    netWorthChangeCents,
    netWorthChangePercent,
    totalIncomeOverPeriodCents,
    totalExpensesOverPeriodCents,
    totalDebtPaidCents,
    totalInterestPaidCents,
  }
}

// ============================================
// Main Projection Runner
// ============================================

/**
 * Runs a financial projection over the specified time horizon.
 *
 * DETERMINISM GUARANTEES:
 * - No Date.now() or Math.random()
 * - Sorted iteration over all entities by ID
 * - Consistent rounding with Decimal.js
 * - Same inputs always produce same outputs
 *
 * @param input - Projection input with entities, start date, and horizon
 * @returns Complete projection result with yearly snapshots and summary
 */
export function runProjection(input: ProjectionInput): ProjectionResult {
  assertValidInput(input)

  // Apply scenario overrides if provided (immutable operation)
  let assets = input.assets
  let liabilities = input.liabilities
  let cashFlowItems = input.cashFlowItems

  if (input.scenario && input.scenario.overrides.length > 0) {
    const assetResults = applyScenarioToEntities({
      entities: assets as (ProjectionAsset & { id: string })[],
      overrides: input.scenario.overrides,
    })
    assets = assetResults.map((r) => r.entity)

    const liabilityResults = applyScenarioToEntities({
      entities: liabilities as (ProjectionLiability & { id: string })[],
      overrides: input.scenario.overrides,
    })
    liabilities = liabilityResults.map((r) => r.entity)

    const cashFlowResults = applyScenarioToEntities({
      entities: cashFlowItems as (ProjectionCashFlowItem & { id: string })[],
      overrides: input.scenario.overrides,
    })
    cashFlowItems = cashFlowResults.map((r) => r.entity)
  }

  // Generate yearly snapshots
  const yearlySnapshots: YearlySnapshot[] = []
  for (let year = 0; year <= input.horizonYears; year++) {
    const snapshot = calculateYearlySnapshot(
      assets,
      liabilities,
      cashFlowItems,
      input.startDate,
      year,
    )
    yearlySnapshots.push(snapshot)
  }

  // Calculate summary
  const summary = calculateProjectionSummary(
    yearlySnapshots,
    liabilities,
    input.startDate,
    input.horizonYears,
  )

  return {
    startDate: input.startDate,
    horizonYears: input.horizonYears,
    yearlySnapshots,
    summary,
  }
}
