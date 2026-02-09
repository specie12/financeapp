import type { CreateRentalPropertyDto } from '@finance-app/shared-types'

export class CreateRentalPropertyDtoClass implements CreateRentalPropertyDto {
  name!: string
  address?: string | null
  purchasePriceCents!: number
  currentValueCents!: number
  downPaymentCents!: number
  monthlyRentCents!: number
  vacancyRatePercent?: number
  annualExpensesCents!: number
  propertyTaxAnnualCents!: number
  mortgagePaymentCents?: number | null
  mortgageRatePercent?: number | null
  linkedAssetId?: string | null
  linkedLiabilityId?: string | null
}
