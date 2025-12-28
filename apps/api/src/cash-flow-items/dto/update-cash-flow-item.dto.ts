import {
  type CashFlowType,
  type Frequency,
  type UpdateCashFlowItemInput,
} from '@finance-app/validation'

export class UpdateCashFlowItemDto implements UpdateCashFlowItemInput {
  name?: string
  type?: CashFlowType
  amountCents?: number
  frequency?: Frequency
  startDate?: Date | null
  endDate?: Date | null
  annualGrowthRatePercent?: number | null
}
