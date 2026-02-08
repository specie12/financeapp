import { type UpdateBudgetInput } from '@finance-app/validation'

export class UpdateBudgetDto implements UpdateBudgetInput {
  categoryId?: string
  amount?: number
  period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  startDate?: Date
  endDate?: Date | null
}
