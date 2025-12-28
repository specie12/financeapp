import {
  type CreateLiabilityInput,
  type Frequency,
  type LiabilityType,
} from '@finance-app/validation'

export class CreateLiabilityDto implements CreateLiabilityInput {
  name!: string
  type!: LiabilityType
  principalCents!: number
  currentBalanceCents!: number
  interestRatePercent!: number
  minimumPaymentCents!: number
  paymentFrequency!: Frequency
  termMonths?: number | null
  startDate!: Date
}
