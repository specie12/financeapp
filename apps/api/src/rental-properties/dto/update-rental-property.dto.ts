import type { UpdateRentalPropertyDto } from '@finance-app/shared-types'

export class UpdateRentalPropertyDtoClass implements UpdateRentalPropertyDto {
  name?: string
  address?: string | null
  purchasePriceCents?: number
  currentValueCents?: number
  downPaymentCents?: number
  monthlyRentCents?: number
  vacancyRatePercent?: number
  annualExpensesCents?: number
  propertyTaxAnnualCents?: number
  mortgagePaymentCents?: number | null
  mortgageRatePercent?: number | null
  linkedAssetId?: string | null
  linkedLiabilityId?: string | null
}
