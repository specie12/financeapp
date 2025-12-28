import {
  type CashFlowType,
  type CreateCashFlowItemInput,
  type Frequency,
} from '@finance-app/validation'

export class CreateCashFlowItemDto implements CreateCashFlowItemInput {
  name!: string
  type!: CashFlowType
  amountCents!: number
  frequency!: Frequency
  startDate?: Date | null
  endDate?: Date | null
  annualGrowthRatePercent?: number | null
}
