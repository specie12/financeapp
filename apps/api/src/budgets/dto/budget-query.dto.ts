export class BudgetQueryDto {
  page?: number
  limit?: number
  period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
}
