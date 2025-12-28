import { type CashFlowType } from '@finance-app/validation'

export class CashFlowItemQueryDto {
  page?: number
  limit?: number
  type?: CashFlowType
}
