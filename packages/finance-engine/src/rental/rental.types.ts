import type { Cents } from '../money/money.types'

/**
 * Input for computing rental-property investment metrics.
 *
 * All monetary fields are annualized where noted. `vacancyRatePercent` is a
 * whole-number percentage (e.g. 5 = 5%). `mortgagePaymentCents` is the MONTHLY
 * debt-service payment (principal + interest); `null` means the property is
 * owned free and clear.
 */
export interface RentalMetricsInput {
  /** Current market value of the property. */
  currentValueCents: Cents
  /** Cash invested up front (basis for cash-on-cash). */
  downPaymentCents: Cents
  /** Monthly gross rent at full occupancy. */
  monthlyRentCents: Cents
  /** Expected vacancy as a whole-number percentage (5 = 5%). */
  vacancyRatePercent: number
  /** Annual operating expenses excluding mortgage and property tax. */
  annualExpensesCents: Cents
  /** Annual property tax. */
  propertyTaxAnnualCents: Cents
  /** Monthly mortgage payment (P+I), or null if unmortgaged. */
  mortgagePaymentCents: Cents | null
}

/**
 * Computed rental-property investment metrics.
 *
 * Percentages are whole-number percentages rounded to two decimals
 * (e.g. 6.25 = 6.25%). `dscrRatio` and `grossRentMultiplier` are plain ratios
 * rounded to two decimals. `dscrRatio` is `null` when there is no mortgage.
 */
export interface RentalMetrics {
  /** Effective gross income (annual): rent × 12 × (1 − vacancy). */
  effectiveGrossIncomeCents: Cents
  /** Net operating income (annual): EGI − operating expenses − property tax. */
  noiCents: Cents
  /** Pre-tax annual cash flow: NOI − annual debt service. */
  cashFlowCents: Cents
  /** Capitalization rate (%): NOI / value. */
  capRatePercent: number
  /** Cash-on-cash return (%): annual cash flow / down payment. */
  cashOnCashReturnPercent: number
  /** Gross rent multiplier: value / annual gross rent. */
  grossRentMultiplier: number
  /** Debt-service coverage ratio: NOI / annual debt service; null if no mortgage. */
  dscrRatio: number | null
}
