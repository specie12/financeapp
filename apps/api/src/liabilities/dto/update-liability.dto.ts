import {
  type Frequency,
  type LiabilityType,
  type UpdateLiabilityInput,
} from '@finance-app/validation'

export class UpdateLiabilityDto implements UpdateLiabilityInput {
  name?: string
  type?: LiabilityType
  principalCents?: number
  currentBalanceCents?: number
  interestRatePercent?: number
  minimumPaymentCents?: number
  paymentFrequency?: Frequency
  termMonths?: number | null
  startDate?: Date
}
