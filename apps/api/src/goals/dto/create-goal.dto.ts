import { type GoalType, type CreateGoalInput } from '@finance-app/validation'

export class CreateGoalDto implements CreateGoalInput {
  type!: GoalType
  name!: string
  targetAmountCents!: number
  targetDate?: Date | null
  linkedLiabilityId?: string | null
}
