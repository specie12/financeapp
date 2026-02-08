import { type CreateBudgetInput } from '@finance-app/validation'

export class CreateBudgetDto implements CreateBudgetInput {
  categoryId!: string
  amount!: number
  period!: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  startDate!: Date
  endDate?: Date | null
}
