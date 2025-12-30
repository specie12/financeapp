import { cents } from '../money/money'
import type { Cents } from '../money/money.types'

/**
 * Default assumptions for Rent vs Buy calculations.
 *
 * These defaults are based on historical averages and common scenarios.
 * All can be overridden via the assumptions parameter.
 *
 * Sources:
 * - FHFA House Price Index (home appreciation)
 * - National Association of Realtors (closing costs)
 * - S&P 500 historical returns (investment returns)
 * - Bureau of Labor Statistics (inflation)
 * - Tax Foundation (property tax averages)
 */

/**
 * Assumptions interface for Rent vs Buy calculations.
 */
export interface RentVsBuyAssumptions {
  /**
   * Annual home price appreciation rate (percent).
   */
  propertyAppreciationRatePercent: number

  /**
   * Annual maintenance costs as percentage of home value.
   */
  maintenanceRatePercent: number

  /**
   * Annual property tax rate as percentage of assessed home value.
   */
  propertyTaxRatePercent: number

  /**
   * Marginal income tax rate for mortgage interest deduction.
   */
  marginalTaxRatePercent: number

  /**
   * Long-term capital gains tax rate.
   */
  capitalGainsTaxRatePercent: number

  /**
   * Capital gains exclusion for primary residence (in cents).
   * IRS Section 121: $250,000 single / $500,000 married filing jointly.
   */
  capitalGainsExclusionCents: Cents

  /**
   * Expected annual return on invested assets (percent).
   */
  investmentReturnRatePercent: number

  /**
   * Annual rent increase rate (percent).
   */
  rentIncreaseRatePercent: number

  /**
   * Annual inflation rate (percent).
   * Used for projecting insurance and HOA costs.
   */
  inflationRatePercent: number

  /**
   * Selling costs as percentage of home value when selling.
   * Typically includes agent fees (~5-6%) and other closing costs.
   */
  sellingCostPercent: number
}

/**
 * Default assumptions based on historical averages and common scenarios.
 */
export const DEFAULT_ASSUMPTIONS: RentVsBuyAssumptions = {
  /**
   * Annual home price appreciation rate.
   * Historical US average: ~3-4% (source: FHFA House Price Index)
   * Using 3% as a conservative estimate.
   */
  propertyAppreciationRatePercent: 3,

  /**
   * Annual maintenance costs as percentage of home value.
   * Industry rule of thumb: 1% of home value per year.
   * Covers repairs, upkeep, and replacement of systems/appliances.
   */
  maintenanceRatePercent: 1,

  /**
   * Annual property tax rate as percentage of home value.
   * US average: ~1.1% (varies significantly by state/county)
   * Range: 0.28% (Hawaii) to 2.49% (New Jersey)
   * Using 1.2% as a moderate estimate.
   */
  propertyTaxRatePercent: 1.2,

  /**
   * Marginal income tax rate for mortgage interest deduction.
   * Used to calculate tax benefit of mortgage interest.
   * 25% represents a middle-income bracket.
   * Note: Only applies if itemizing deductions exceeds standard deduction.
   */
  marginalTaxRatePercent: 25,

  /**
   * Long-term capital gains tax rate.
   * Applied when selling home (above exclusion) or investments held >1 year.
   * 15% is the rate for most taxpayers (income $44,626 - $492,300 in 2024).
   */
  capitalGainsTaxRatePercent: 15,

  /**
   * Capital gains exclusion for primary residence.
   * IRS Section 121: $250,000 single / $500,000 married filing jointly.
   * Must have owned and lived in home 2 of last 5 years.
   */
  capitalGainsExclusionCents: cents(25000000), // $250,000

  /**
   * Expected annual return on invested assets.
   * Historical S&P 500 average: ~7% inflation-adjusted, ~10% nominal.
   * Using 7% as a conservative inflation-adjusted return.
   */
  investmentReturnRatePercent: 7,

  /**
   * Annual rent increase rate.
   * Historical average: ~3% (varies by market).
   * Some markets see 5-10% increases in hot years.
   */
  rentIncreaseRatePercent: 3,

  /**
   * Annual inflation rate.
   * Used for projecting insurance and HOA costs.
   * Historical average: ~2-3%, recent years higher.
   */
  inflationRatePercent: 2.5,

  /**
   * Selling costs as percentage of home value.
   * Includes: agent fees (5-6%), title insurance, transfer taxes, etc.
   * Total typically 8-10% but using 6% for just agent fees.
   */
  sellingCostPercent: 6,
}

/**
 * Minimum projection horizon in years.
 */
export const MIN_PROJECTION_YEARS = 1

/**
 * Maximum projection horizon in years.
 */
export const MAX_PROJECTION_YEARS = 30

/**
 * Minimum down payment percentage (0% for VA/USDA loans).
 */
export const MIN_DOWN_PAYMENT_PERCENT = 0

/**
 * Maximum down payment percentage.
 */
export const MAX_DOWN_PAYMENT_PERCENT = 100

/**
 * Common mortgage term lengths in years.
 */
export const COMMON_MORTGAGE_TERMS = [15, 20, 30] as const
