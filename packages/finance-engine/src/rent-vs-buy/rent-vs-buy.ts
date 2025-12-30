import Decimal from 'decimal.js'
import { type Cents, RoundingMode } from '../money/money.types'
import { cents, addCents, subtractCents, multiplyCents } from '../money/money'
import { generateAmortizationSchedule } from '../amortization/amortization'
import { InvalidRentVsBuyInputError } from './rent-vs-buy.errors'
import {
  DEFAULT_ASSUMPTIONS,
  MIN_PROJECTION_YEARS,
  MAX_PROJECTION_YEARS,
  MIN_DOWN_PAYMENT_PERCENT,
  MAX_DOWN_PAYMENT_PERCENT,
  type RentVsBuyAssumptions,
} from './rent-vs-buy.constants'
import type {
  RentVsBuyInput,
  RentVsBuyResult,
  RentVsBuyValidationResult,
  YearlyBuyMetrics,
  YearlyRentMetrics,
  YearlyComparison,
  RentVsBuySummary,
  BuyScenarioInput,
  RentScenarioInput,
} from './rent-vs-buy.types'

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
})

// ============================================
// Validation Functions
// ============================================

/**
 * Validates rent vs buy input.
 */
export function validateRentVsBuyInput(input: RentVsBuyInput): RentVsBuyValidationResult {
  // Validate start date
  if (!input.startDate || !(input.startDate instanceof Date) || isNaN(input.startDate.getTime())) {
    return { valid: false, error: 'Start date must be a valid Date' }
  }

  // Validate projection years
  if (typeof input.projectionYears !== 'number' || !Number.isInteger(input.projectionYears)) {
    return { valid: false, error: 'Projection years must be an integer' }
  }

  if (
    input.projectionYears < MIN_PROJECTION_YEARS ||
    input.projectionYears > MAX_PROJECTION_YEARS
  ) {
    return {
      valid: false,
      error: `Projection years must be between ${MIN_PROJECTION_YEARS} and ${MAX_PROJECTION_YEARS}`,
    }
  }

  // Validate buy scenario
  const buyValidation = validateBuyScenario(input.buy)
  if (!buyValidation.valid) {
    return buyValidation
  }

  // Validate rent scenario
  const rentValidation = validateRentScenario(input.rent)
  if (!rentValidation.valid) {
    return rentValidation
  }

  return { valid: true }
}

/**
 * Validates buy scenario input.
 */
function validateBuyScenario(buy: BuyScenarioInput): RentVsBuyValidationResult {
  if (typeof buy.homePriceCents !== 'number' || buy.homePriceCents <= 0) {
    return { valid: false, error: 'Home price must be a positive number' }
  }

  if (
    typeof buy.downPaymentPercent !== 'number' ||
    buy.downPaymentPercent < MIN_DOWN_PAYMENT_PERCENT ||
    buy.downPaymentPercent > MAX_DOWN_PAYMENT_PERCENT
  ) {
    return {
      valid: false,
      error: `Down payment percent must be between ${MIN_DOWN_PAYMENT_PERCENT} and ${MAX_DOWN_PAYMENT_PERCENT}`,
    }
  }

  if (typeof buy.mortgageInterestRatePercent !== 'number' || buy.mortgageInterestRatePercent < 0) {
    return { valid: false, error: 'Mortgage interest rate must be non-negative' }
  }

  if (
    typeof buy.mortgageTermYears !== 'number' ||
    !Number.isInteger(buy.mortgageTermYears) ||
    buy.mortgageTermYears <= 0
  ) {
    return { valid: false, error: 'Mortgage term must be a positive integer' }
  }

  if (typeof buy.closingCostPercent !== 'number' || buy.closingCostPercent < 0) {
    return { valid: false, error: 'Closing cost percent must be non-negative' }
  }

  if (
    typeof buy.homeownersInsuranceAnnualCents !== 'number' ||
    buy.homeownersInsuranceAnnualCents < 0
  ) {
    return { valid: false, error: 'Homeowners insurance must be non-negative' }
  }

  if (typeof buy.hoaMonthlyDuesCents !== 'number' || buy.hoaMonthlyDuesCents < 0) {
    return { valid: false, error: 'HOA dues must be non-negative' }
  }

  return { valid: true }
}

/**
 * Validates rent scenario input.
 */
function validateRentScenario(rent: RentScenarioInput): RentVsBuyValidationResult {
  if (typeof rent.monthlyRentCents !== 'number' || rent.monthlyRentCents <= 0) {
    return { valid: false, error: 'Monthly rent must be a positive number' }
  }

  if (typeof rent.securityDepositMonths !== 'number' || rent.securityDepositMonths < 0) {
    return { valid: false, error: 'Security deposit months must be non-negative' }
  }

  if (
    typeof rent.rentersInsuranceAnnualCents !== 'number' ||
    rent.rentersInsuranceAnnualCents < 0
  ) {
    return { valid: false, error: 'Renters insurance must be non-negative' }
  }

  return { valid: true }
}

/**
 * Asserts that input is valid, throws if not.
 */
function assertValidInput(input: RentVsBuyInput): void {
  const result = validateRentVsBuyInput(input)
  if (!result.valid) {
    throw new InvalidRentVsBuyInputError(result.error!)
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Merges partial assumptions with defaults.
 */
export function mergeAssumptions(partial?: Partial<RentVsBuyAssumptions>): RentVsBuyAssumptions {
  if (!partial) {
    return { ...DEFAULT_ASSUMPTIONS }
  }

  return {
    ...DEFAULT_ASSUMPTIONS,
    ...partial,
  }
}

/**
 * Adds years to a date (deterministic).
 */
function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

/**
 * Projects a value with compound growth.
 * Formula: FV = PV * (1 + r)^n
 */
function projectValue(currentCents: Cents, annualRatePercent: number, years: number): Cents {
  if (years === 0) return currentCents
  if (currentCents === 0) return cents(0)

  const rate = new Decimal(annualRatePercent).dividedBy(100)
  const futureValue = new Decimal(currentCents)
    .times(rate.plus(1).pow(years))
    .toDecimalPlaces(0, RoundingMode.ROUND_HALF_UP)

  return cents(futureValue.toNumber())
}

/**
 * Calculates percentage of a value.
 */
function percentOf(valueCents: Cents, percent: number): Cents {
  const result = new Decimal(valueCents)
    .times(percent)
    .dividedBy(100)
    .toDecimalPlaces(0, RoundingMode.ROUND_HALF_UP)

  return cents(result.toNumber())
}

// ============================================
// Buy Scenario Calculations
// ============================================

/**
 * Calculates yearly buy metrics.
 */
function calculateBuyScenario(
  input: BuyScenarioInput,
  assumptions: RentVsBuyAssumptions,
  startDate: Date,
  projectionYears: number,
): YearlyBuyMetrics[] {
  const metrics: YearlyBuyMetrics[] = []

  // Calculate initial values
  const downPaymentCents = percentOf(input.homePriceCents, input.downPaymentPercent)
  const loanAmountCents = subtractCents(input.homePriceCents, downPaymentCents)
  const closingCostsCents = percentOf(input.homePriceCents, input.closingCostPercent)

  // Get property tax and maintenance rates (use overrides if provided)
  const propertyTaxRate = input.propertyTaxRateOverride ?? assumptions.propertyTaxRatePercent
  const maintenanceRate = input.maintenanceRateOverride ?? assumptions.maintenanceRatePercent

  // Generate amortization schedule (if there's a loan)
  let mortgageSchedule: ReturnType<typeof generateAmortizationSchedule> | null = null
  if (loanAmountCents > 0 && input.mortgageInterestRatePercent > 0) {
    mortgageSchedule = generateAmortizationSchedule({
      principalCents: loanAmountCents,
      annualInterestRatePercent: input.mortgageInterestRatePercent,
      termMonths: input.mortgageTermYears * 12,
      startDate,
    })
  }

  let cumulativeCosts = cents(0)

  for (let year = 0; year <= projectionYears; year++) {
    // Home value with appreciation
    const homeValueCents = projectValue(
      input.homePriceCents,
      assumptions.propertyAppreciationRatePercent,
      year,
    )

    // Calculate mortgage balance and payments for this year
    let mortgageBalanceCents = cents(0)
    let mortgagePaymentsCents = cents(0)
    let principalPaidCents = cents(0)
    let interestPaidCents = cents(0)

    if (mortgageSchedule) {
      const yearStartMonth = year * 12
      const yearEndMonth = Math.min((year + 1) * 12, mortgageSchedule.schedule.length)

      // Get ending balance
      if (yearEndMonth > 0 && yearEndMonth <= mortgageSchedule.schedule.length) {
        const endEntry = mortgageSchedule.schedule[yearEndMonth - 1]
        mortgageBalanceCents = endEntry ? endEntry.endingBalanceCents : cents(0)
      } else if (year === 0) {
        mortgageBalanceCents = loanAmountCents
      }

      // Sum payments for this year
      for (let m = yearStartMonth; m < yearEndMonth && m < mortgageSchedule.schedule.length; m++) {
        const entry = mortgageSchedule.schedule[m]
        if (entry) {
          mortgagePaymentsCents = addCents(mortgagePaymentsCents, entry.totalPaymentCents)
          principalPaidCents = addCents(principalPaidCents, entry.principalCents)
          interestPaidCents = addCents(interestPaidCents, entry.interestCents)
        }
      }
    } else if (loanAmountCents > 0) {
      // 0% interest loan - just divide by months
      const monthlyPayment = multiplyCents(
        loanAmountCents,
        new Decimal(1).dividedBy(input.mortgageTermYears * 12).toNumber(),
        RoundingMode.ROUND_HALF_UP,
      )
      const yearStartMonth = year * 12
      const yearEndMonth = Math.min((year + 1) * 12, input.mortgageTermYears * 12)
      const monthsInYear = yearEndMonth - yearStartMonth

      if (monthsInYear > 0) {
        mortgagePaymentsCents = multiplyCents(
          monthlyPayment,
          monthsInYear,
          RoundingMode.ROUND_HALF_UP,
        )
        principalPaidCents = mortgagePaymentsCents
        // Calculate remaining balance
        const paidMonths = yearEndMonth
        const remainingMonths = Math.max(0, input.mortgageTermYears * 12 - paidMonths)
        mortgageBalanceCents = multiplyCents(
          monthlyPayment,
          remainingMonths,
          RoundingMode.ROUND_HALF_UP,
        )
      }
    }

    // Home equity
    const homeEquityCents = subtractCents(homeValueCents, mortgageBalanceCents)

    // Property taxes (based on current home value)
    const propertyTaxesCents = percentOf(homeValueCents, propertyTaxRate)

    // Insurance (grows with inflation)
    const insuranceCents = projectValue(
      input.homeownersInsuranceAnnualCents,
      assumptions.inflationRatePercent,
      year,
    )

    // Maintenance (based on current home value)
    const maintenanceCents = percentOf(homeValueCents, maintenanceRate)

    // HOA dues (grow with inflation)
    const annualHoaCents = multiplyCents(input.hoaMonthlyDuesCents, 12, RoundingMode.ROUND_HALF_UP)
    const hoaDuesCents = projectValue(annualHoaCents, assumptions.inflationRatePercent, year)

    // Tax benefit from mortgage interest deduction
    const mortgageInterestDeductionCents = percentOf(
      interestPaidCents,
      assumptions.marginalTaxRatePercent,
    )

    // Total out-of-pocket for this year
    let totalOutOfPocketCents = addCents(
      mortgagePaymentsCents,
      propertyTaxesCents,
      insuranceCents,
      maintenanceCents,
      hoaDuesCents,
    )
    totalOutOfPocketCents = subtractCents(totalOutOfPocketCents, mortgageInterestDeductionCents)

    // Add closing costs in year 0
    if (year === 0) {
      totalOutOfPocketCents = addCents(totalOutOfPocketCents, closingCostsCents, downPaymentCents)
    }

    // Cumulative costs
    cumulativeCosts = addCents(cumulativeCosts, totalOutOfPocketCents)

    metrics.push({
      year,
      homeValueCents,
      mortgageBalanceCents,
      homeEquityCents,
      mortgagePaymentsCents,
      principalPaidCents,
      interestPaidCents,
      propertyTaxesCents,
      insuranceCents,
      maintenanceCents,
      hoaDuesCents,
      mortgageInterestDeductionCents,
      totalOutOfPocketCents,
      cumulativeCostsCents: cumulativeCosts,
    })
  }

  return metrics
}

// ============================================
// Rent Scenario Calculations
// ============================================

/**
 * Calculates yearly rent metrics with opportunity cost modeling.
 */
function calculateRentScenario(
  input: RentScenarioInput,
  assumptions: RentVsBuyAssumptions,
  buyInput: BuyScenarioInput,
  projectionYears: number,
): YearlyRentMetrics[] {
  const metrics: YearlyRentMetrics[] = []

  // Calculate initial investment (what would have been spent on down payment + closing)
  const downPaymentCents = percentOf(buyInput.homePriceCents, buyInput.downPaymentPercent)
  const closingCostsCents = percentOf(buyInput.homePriceCents, buyInput.closingCostPercent)
  const initialInvestmentCents = addCents(downPaymentCents, closingCostsCents)

  // Get rent increase rate (use override if provided)
  const rentIncreaseRate = input.rentIncreaseRateOverride ?? assumptions.rentIncreaseRatePercent

  // Security deposit (returned at end, so not a true cost - but opportunity cost)
  const securityDepositCents = multiplyCents(
    input.monthlyRentCents,
    input.securityDepositMonths,
    RoundingMode.ROUND_HALF_UP,
  )

  let cumulativeCosts = cents(0)
  let previousInvestmentBalance = initialInvestmentCents

  for (let year = 0; year <= projectionYears; year++) {
    // Monthly rent with annual increases
    const monthlyRentCents = projectValue(input.monthlyRentCents, rentIncreaseRate, year)
    const annualRentCents = multiplyCents(monthlyRentCents, 12, RoundingMode.ROUND_HALF_UP)

    // Insurance (grows with inflation)
    const insuranceCents = projectValue(
      input.rentersInsuranceAnnualCents,
      assumptions.inflationRatePercent,
      year,
    )

    // Investment balance (down payment + closing costs invested)
    const investmentBalanceCents = projectValue(
      initialInvestmentCents,
      assumptions.investmentReturnRatePercent,
      year,
    )

    // Investment gains for this year
    const investmentGainsCents =
      year === 0 ? cents(0) : subtractCents(investmentBalanceCents, previousInvestmentBalance)

    previousInvestmentBalance = investmentBalanceCents

    // Total out-of-pocket for this year
    let totalOutOfPocketCents = addCents(annualRentCents, insuranceCents)

    // Add security deposit in year 0 (we consider it a cost even though it's returned)
    if (year === 0) {
      totalOutOfPocketCents = addCents(totalOutOfPocketCents, securityDepositCents)
    }

    // Cumulative costs
    cumulativeCosts = addCents(cumulativeCosts, totalOutOfPocketCents)

    metrics.push({
      year,
      monthlyRentCents,
      annualRentCents,
      insuranceCents,
      investmentBalanceCents,
      investmentGainsCents,
      totalOutOfPocketCents,
      cumulativeCostsCents: cumulativeCosts,
    })
  }

  return metrics
}

// ============================================
// Comparison Functions
// ============================================

/**
 * Compares buy and rent scenarios year by year.
 */
function compareScenarios(
  buyMetrics: YearlyBuyMetrics[],
  rentMetrics: YearlyRentMetrics[],
  startDate: Date,
): YearlyComparison[] {
  const comparisons: YearlyComparison[] = []

  for (let i = 0; i < buyMetrics.length; i++) {
    const buy = buyMetrics[i]!
    const rent = rentMetrics[i]!

    // Net worth comparison
    // Buy: Home equity is your net worth from the property
    // Rent: Investment balance is your net worth
    const buyNetWorthCents = buy.homeEquityCents
    const rentNetWorthCents = rent.investmentBalanceCents
    const netWorthDifferenceCents = subtractCents(buyNetWorthCents, rentNetWorthCents)

    // Cash flow comparison
    const buyAnnualCostCents = buy.totalOutOfPocketCents
    const rentAnnualCostCents = rent.totalOutOfPocketCents
    const annualCostDifferenceCents = subtractCents(buyAnnualCostCents, rentAnnualCostCents)

    // Buying is better if net worth is higher
    const buyIsBetterThisYear = buyNetWorthCents > rentNetWorthCents

    comparisons.push({
      year: buy.year,
      date: addYears(startDate, buy.year),
      buy,
      rent,
      buyNetWorthCents,
      rentNetWorthCents,
      netWorthDifferenceCents,
      buyAnnualCostCents,
      rentAnnualCostCents,
      annualCostDifferenceCents,
      buyIsBetterThisYear,
    })
  }

  return comparisons
}

/**
 * Finds the break-even year (when buying becomes better than renting).
 */
function findBreakEvenYear(comparisons: YearlyComparison[]): number | null {
  for (const comparison of comparisons) {
    if (comparison.year > 0 && comparison.buyIsBetterThisYear) {
      return comparison.year
    }
  }
  return null
}

/**
 * Calculates summary statistics.
 */
function calculateSummary(
  comparisons: YearlyComparison[],
  buyInput: BuyScenarioInput,
  rentInput: RentScenarioInput,
  assumptions: RentVsBuyAssumptions,
): RentVsBuySummary {
  const lastComparison = comparisons[comparisons.length - 1]!

  // Initial costs
  const downPaymentCents = percentOf(buyInput.homePriceCents, buyInput.downPaymentPercent)
  const closingCostsCents = percentOf(buyInput.homePriceCents, buyInput.closingCostPercent)
  const initialBuyCostsCents = addCents(downPaymentCents, closingCostsCents)

  const securityDepositCents = multiplyCents(
    rentInput.monthlyRentCents,
    rentInput.securityDepositMonths,
    RoundingMode.ROUND_HALF_UP,
  )
  const initialRentCostsCents = securityDepositCents

  // Total costs
  const totalBuyCostsCents = lastComparison.buy.cumulativeCostsCents
  const totalRentCostsCents = lastComparison.rent.cumulativeCostsCents

  // Final positions
  const finalHomeEquityCents = lastComparison.buy.homeEquityCents
  const finalInvestmentBalanceCents = lastComparison.rent.investmentBalanceCents

  // Calculate selling costs for buy scenario
  const sellingCostsCents = percentOf(
    lastComparison.buy.homeValueCents,
    assumptions.sellingCostPercent,
  )

  // Final net worth (accounting for selling costs on home)
  const finalBuyNetWorthCents = subtractCents(finalHomeEquityCents, sellingCostsCents)
  const finalRentNetWorthCents = finalInvestmentBalanceCents
  const netWorthAdvantageCents = subtractCents(finalBuyNetWorthCents, finalRentNetWorthCents)

  // Break-even analysis
  const breakEvenYear = findBreakEvenYear(comparisons)

  // Recommendation
  let recommendation: 'buy' | 'rent' | 'neutral'
  if (netWorthAdvantageCents > 0) {
    recommendation = 'buy'
  } else if (netWorthAdvantageCents < 0) {
    recommendation = 'rent'
  } else {
    recommendation = 'neutral'
  }

  // Sensitivity metrics
  let yearsBuyingIsBetter = 0
  let yearsRentingIsBetter = 0
  for (const comparison of comparisons) {
    if (comparison.buyIsBetterThisYear) {
      yearsBuyingIsBetter++
    } else {
      yearsRentingIsBetter++
    }
  }

  // Totals breakdown
  let totalMortgageInterestPaidCents = cents(0)
  let totalPropertyTaxesPaidCents = cents(0)
  let totalMaintenancePaidCents = cents(0)
  let totalTaxSavingsCents = cents(0)
  let totalRentPaidCents = cents(0)
  let totalInvestmentGainsCents = cents(0)

  for (const comparison of comparisons) {
    totalMortgageInterestPaidCents = addCents(
      totalMortgageInterestPaidCents,
      comparison.buy.interestPaidCents,
    )
    totalPropertyTaxesPaidCents = addCents(
      totalPropertyTaxesPaidCents,
      comparison.buy.propertyTaxesCents,
    )
    totalMaintenancePaidCents = addCents(totalMaintenancePaidCents, comparison.buy.maintenanceCents)
    totalTaxSavingsCents = addCents(
      totalTaxSavingsCents,
      comparison.buy.mortgageInterestDeductionCents,
    )
    totalRentPaidCents = addCents(totalRentPaidCents, comparison.rent.annualRentCents)
    totalInvestmentGainsCents = addCents(
      totalInvestmentGainsCents,
      comparison.rent.investmentGainsCents,
    )
  }

  return {
    initialBuyCostsCents,
    initialRentCostsCents,
    totalBuyCostsCents,
    totalRentCostsCents,
    finalHomeEquityCents,
    finalInvestmentBalanceCents,
    finalBuyNetWorthCents,
    finalRentNetWorthCents,
    netWorthAdvantageCents,
    breakEvenYear,
    recommendation,
    yearsBuyingIsBetter,
    yearsRentingIsBetter,
    totalMortgageInterestPaidCents,
    totalPropertyTaxesPaidCents,
    totalMaintenancePaidCents,
    totalTaxSavingsCents,
    totalRentPaidCents,
    totalInvestmentGainsCents,
  }
}

// ============================================
// Main Calculator
// ============================================

/**
 * Calculates rent vs buy comparison over a projection period.
 *
 * DETERMINISM GUARANTEES:
 * - No Date.now() or Math.random()
 * - Consistent rounding with Decimal.js
 * - Same inputs always produce same outputs
 *
 * @param input - Calculator input with buy/rent scenarios and assumptions
 * @returns Complete comparison result with yearly metrics and summary
 */
export function calculateRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  assertValidInput(input)

  // Merge assumptions with defaults
  const effectiveAssumptions = mergeAssumptions(input.assumptions)

  // Calculate buy scenario
  const buyMetrics = calculateBuyScenario(
    input.buy,
    effectiveAssumptions,
    input.startDate,
    input.projectionYears,
  )

  // Calculate rent scenario
  const rentMetrics = calculateRentScenario(
    input.rent,
    effectiveAssumptions,
    input.buy,
    input.projectionYears,
  )

  // Compare scenarios
  const yearlyComparisons = compareScenarios(buyMetrics, rentMetrics, input.startDate)

  // Calculate summary
  const summary = calculateSummary(yearlyComparisons, input.buy, input.rent, effectiveAssumptions)

  return {
    input,
    effectiveAssumptions,
    yearlyComparisons,
    summary,
  }
}
