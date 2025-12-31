import type { RentVsBuyRequest } from '@finance-app/shared-types'

export class RentVsBuyDto implements RentVsBuyRequest {
  startDate!: Date
  projectionYears!: number
  buy!: {
    homePriceCents: number
    downPaymentPercent: number
    mortgageInterestRatePercent: number
    mortgageTermYears: number
    closingCostPercent: number
    homeownersInsuranceAnnualCents: number
    hoaMonthlyDuesCents: number
    propertyTaxRateOverride?: number
    maintenanceRateOverride?: number
  }
  rent!: {
    monthlyRentCents: number
    securityDepositMonths: number
    rentersInsuranceAnnualCents: number
    rentIncreaseRateOverride?: number
  }
  assumptions?: {
    homeAppreciationRatePercent?: number
    investmentReturnRatePercent?: number
    inflationRatePercent?: number
    propertyTaxRatePercent?: number
    maintenanceRatePercent?: number
    rentIncreaseRatePercent?: number
    marginalTaxRatePercent?: number
    sellingCostPercent?: number
  }
}
