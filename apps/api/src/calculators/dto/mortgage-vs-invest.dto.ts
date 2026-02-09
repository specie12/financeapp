import type { MortgageVsInvestRequest } from '@finance-app/shared-types'

export class MortgageVsInvestDto implements MortgageVsInvestRequest {
  currentBalanceCents!: number
  mortgageRatePercent!: number
  remainingTermMonths!: number
  extraMonthlyPaymentCents!: number
  expectedReturnPercent!: number
  capitalGainsTaxPercent!: number
  horizonYears!: number
  mortgageInterestDeductible!: boolean
  marginalTaxRatePercent!: number
}
