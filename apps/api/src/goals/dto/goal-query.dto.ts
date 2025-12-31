import { type GoalType, type GoalStatus } from '@finance-app/validation'

export class GoalQueryDto {
  page?: number
  limit?: number
  type?: GoalType
  status?: GoalStatus
}
