import type { Cents } from '../money/money.types'
import type { RentVsBuyAssumptions } from './rent-vs-buy.constants'

// Re-export for convenience
export type { RentVsBuyAssumptions } from './rent-vs-buy.constants'

/**
 * Buy scenario input parameters.
 */
export interface BuyScenarioInput {
  /** Purchase price of the home in cents */
  homePriceCents: Cents

  /** Down payment as a percentage of home price (0-100) */
  downPaymentPercent: number

  /** Annual mortgage interest rate as a percentage */
  mortgageInterestRatePercent: number

  /** Mortgage term in years (typically 15 or 30) */
  mortgageTermYears: number

  /** Closing costs as a percentage of home price (typically 2-5%) */
  closingCostPercent: number

  /** Annual homeowners insurance premium in cents */
  homeownersInsuranceAnnualCents: Cents

  /** Monthly HOA dues in cents (0 if none) */
  hoaMonthlyDuesCents: Cents

  /** Optional: Override property tax rate from assumptions */
  propertyTaxRateOverride?: number

  /** Optional: Override maintenance rate from assumptions */
  maintenanceRateOverride?: number
}

/**
 * Rent scenario input parameters.
 */
export interface RentScenarioInput {
  /** Monthly rent amount in cents */
  monthlyRentCents: Cents

  /** Security deposit in months of rent (typically 1-2) */
  securityDepositMonths: number

  /** Annual renters insurance premium in cents */
  rentersInsuranceAnnualCents: Cents

  /** Optional: Override rent increase rate from assumptions */
  rentIncreaseRateOverride?: number
}

/**
 * Main input for the rent vs buy calculator.
 */
export interface RentVsBuyInput {
  /** Start date for the projection (for determinism) */
  startDate: Date

  /** Number of years to project (1-30) */
  projectionYears: number

  /** Buy scenario parameters */
  buy: BuyScenarioInput

  /** Rent scenario parameters */
  rent: RentScenarioInput

  /** Optional assumption overrides (merged with defaults) */
  assumptions?: Partial<RentVsBuyAssumptions>
}

/**
 * Yearly metrics for the buy scenario.
 */
export interface YearlyBuyMetrics {
  /** Year number (0 = purchase year, 1 = after 1 year, etc.) */
  year: number

  // ========================================
  // Home Value and Equity
  // ========================================

  /** Appreciated home value at end of year */
  homeValueCents: Cents

  /** Remaining mortgage principal balance */
  mortgageBalanceCents: Cents

  /** Home equity (home value - mortgage balance) */
  homeEquityCents: Cents

  // ========================================
  // Annual Costs
  // ========================================

  /** Total mortgage payments (P+I) for the year */
  mortgagePaymentsCents: Cents

  /** Principal portion of mortgage payments */
  principalPaidCents: Cents

  /** Interest portion of mortgage payments */
  interestPaidCents: Cents

  /** Property taxes for the year */
  propertyTaxesCents: Cents

  /** Homeowners insurance for the year */
  insuranceCents: Cents

  /** Maintenance costs for the year */
  maintenanceCents: Cents

  /** HOA dues for the year */
  hoaDuesCents: Cents

  // ========================================
  // Tax Benefits
  // ========================================

  /** Tax savings from mortgage interest deduction */
  mortgageInterestDeductionCents: Cents

  // ========================================
  // Totals
  // ========================================

  /** Total out-of-pocket costs for the year (all costs - tax benefit) */
  totalOutOfPocketCents: Cents

  /** Cumulative out-of-pocket costs from year 0 to this year */
  cumulativeCostsCents: Cents
}

/**
 * Yearly metrics for the rent scenario.
 */
export interface YearlyRentMetrics {
  /** Year number (0 = first year, 1 = after 1 year, etc.) */
  year: number

  // ========================================
  // Rent Costs
  // ========================================

  /** Monthly rent for this year (after increases) */
  monthlyRentCents: Cents

  /** Total rent paid for the year */
  annualRentCents: Cents

  /** Renters insurance for the year */
  insuranceCents: Cents

  // ========================================
  // Opportunity Cost (Investment)
  // ========================================

  /** Investment balance (down payment + closing costs invested) */
  investmentBalanceCents: Cents

  /** Investment gains for this year */
  investmentGainsCents: Cents

  // ========================================
  // Totals
  // ========================================

  /** Total out-of-pocket costs for the year */
  totalOutOfPocketCents: Cents

  /** Cumulative out-of-pocket costs from year 0 to this year */
  cumulativeCostsCents: Cents
}

/**
 * Year-by-year comparison of buy vs rent scenarios.
 */
export interface YearlyComparison {
  /** Year number */
  year: number

  /** Date at the start of this year */
  date: Date

  /** Buy scenario metrics for this year */
  buy: YearlyBuyMetrics

  /** Rent scenario metrics for this year */
  rent: YearlyRentMetrics

  // ========================================
  // Net Worth Comparison (THE KEY METRIC)
  // ========================================

  /** Buy scenario net worth (home equity) */
  buyNetWorthCents: Cents

  /** Rent scenario net worth (investment balance) */
  rentNetWorthCents: Cents

  /** Difference in net worth (positive = buy is better) */
  netWorthDifferenceCents: Cents

  // ========================================
  // Cash Flow Comparison
  // ========================================

  /** Buy scenario annual cost */
  buyAnnualCostCents: Cents

  /** Rent scenario annual cost */
  rentAnnualCostCents: Cents

  /** Difference in annual cost (positive = rent is cheaper) */
  annualCostDifferenceCents: Cents

  /** Whether buying results in higher net worth this year */
  buyIsBetterThisYear: boolean
}

/**
 * Summary statistics for the rent vs buy comparison.
 */
export interface RentVsBuySummary {
  // ========================================
  // Initial Costs
  // ========================================

  /** Initial cash required to buy (down payment + closing costs) */
  initialBuyCostsCents: Cents

  /** Initial cash required to rent (security deposit) */
  initialRentCostsCents: Cents

  // ========================================
  // Total Costs Over Period
  // ========================================

  /** Total out-of-pocket costs for buying over entire period */
  totalBuyCostsCents: Cents

  /** Total out-of-pocket costs for renting over entire period */
  totalRentCostsCents: Cents

  // ========================================
  // Final Positions
  // ========================================

  /** Home equity at end of projection */
  finalHomeEquityCents: Cents

  /** Investment balance at end of projection */
  finalInvestmentBalanceCents: Cents

  // ========================================
  // Net Worth Comparison
  // ========================================

  /** Final net worth if buying (equity - selling costs) */
  finalBuyNetWorthCents: Cents

  /** Final net worth if renting (investment balance) */
  finalRentNetWorthCents: Cents

  /** Net worth advantage (positive = buy wins) */
  netWorthAdvantageCents: Cents

  // ========================================
  // Break-even Analysis
  // ========================================

  /** Year when buying becomes better than renting (null if never) */
  breakEvenYear: number | null

  /** Recommendation based on projection period */
  recommendation: 'buy' | 'rent' | 'neutral'

  // ========================================
  // Sensitivity Metrics
  // ========================================

  /** Number of years where buying has higher net worth */
  yearsBuyingIsBetter: number

  /** Number of years where renting has higher net worth */
  yearsRentingIsBetter: number

  // ========================================
  // Totals Breakdown
  // ========================================

  /** Total mortgage interest paid over period */
  totalMortgageInterestPaidCents: Cents

  /** Total property taxes paid over period */
  totalPropertyTaxesPaidCents: Cents

  /** Total maintenance paid over period */
  totalMaintenancePaidCents: Cents

  /** Total tax savings from mortgage interest deduction */
  totalTaxSavingsCents: Cents

  /** Total rent paid over period */
  totalRentPaidCents: Cents

  /** Total investment gains if renting */
  totalInvestmentGainsCents: Cents
}

/**
 * Complete result from the rent vs buy calculator.
 */
export interface RentVsBuyResult {
  /** Original input */
  input: RentVsBuyInput

  /** Effective assumptions (defaults merged with overrides) */
  effectiveAssumptions: RentVsBuyAssumptions

  /** Year-by-year comparisons */
  yearlyComparisons: YearlyComparison[]

  /** Summary statistics */
  summary: RentVsBuySummary
}

/**
 * Validation result for rent vs buy input.
 */
export interface RentVsBuyValidationResult {
  valid: boolean
  error?: string
}
