import { type GoalType, type GoalStatus, type UpdateGoalInput } from '@finance-app/validation'

export class UpdateGoalDto implements UpdateGoalInput {
  type?: GoalType
  name?: string
  targetAmountCents?: number
  currentAmountCents?: number
  targetDate?: Date | null
  status?: GoalStatus
  linkedLiabilityId?: string | null
  linkedAssetIds?: string[]
}
