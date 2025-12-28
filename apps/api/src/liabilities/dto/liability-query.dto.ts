import { type LiabilityType } from '@finance-app/validation'

export class LiabilityQueryDto {
  page?: number
  limit?: number
  type?: LiabilityType
}
