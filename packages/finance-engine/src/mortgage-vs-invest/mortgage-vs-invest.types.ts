export interface MortgageVsInvestInput {
  /** Current mortgage balance in cents */
  currentBalanceCents: number
  /** Annual mortgage interest rate (e.g. 3.5 for 3.5%) */
  mortgageRatePercent: number
  /** Remaining term in months */
  remainingTermMonths: number
  /** Extra monthly payment amount in cents */
  extraMonthlyPaymentCents: number
  /** Expected annual investment return rate (e.g. 8 for 8%) */
  expectedReturnPercent: number
  /** Marginal tax rate for investment gains (e.g. 25 for 25%) */
  capitalGainsTaxPercent: number
  /** Time horizon in years for comparison */
  horizonYears: number
  /** Whether mortgage interest is tax-deductible */
  mortgageInterestDeductible: boolean
  /** Marginal income tax rate (for mortgage interest deduction) */
  marginalTaxRatePercent: number
}

export interface MortgageVsInvestYearlyComparison {
  year: number
  /** Extra-payment strategy: cumulative extra principal paid */
  payExtraCumulativePaidCents: number
  /** Extra-payment strategy: interest saved so far vs no extra payments */
  payExtraInterestSavedCents: number
  /** Extra-payment strategy: remaining balance */
  payExtraRemainingBalanceCents: number
  /** Invest strategy: investment portfolio value */
  investPortfolioValueCents: number
  /** Invest strategy: cumulative amount invested */
  investCumulativeContributedCents: number
  /** Net advantage of investing (positive = investing wins) */
  investAdvantageNetCents: number
}

export interface MortgageVsInvestResult {
  input: MortgageVsInvestInput
  /** Year-by-year comparison */
  yearlyComparisons: MortgageVsInvestYearlyComparison[]
  /** Summary stats for pay-extra strategy */
  payExtraSummary: {
    totalInterestWithoutExtraCents: number
    totalInterestWithExtraCents: number
    interestSavedCents: number
    originalPayoffMonths: number
    newPayoffMonths: number
    monthsSaved: number
  }
  /** Summary stats for invest strategy */
  investSummary: {
    totalContributedCents: number
    finalPortfolioValueCents: number
    totalGainCents: number
    afterTaxGainCents: number
    afterTaxPortfolioValueCents: number
  }
  /** Overall recommendation */
  recommendation: 'pay_extra' | 'invest' | 'neutral'
  /** The investment return rate at which both strategies break even */
  breakEvenReturnPercent: number
}
