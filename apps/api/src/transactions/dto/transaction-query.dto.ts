export class TransactionQueryDto {
  page?: number
  limit?: number
  accountId?: string
  categoryId?: string
  type?: 'income' | 'expense' | 'transfer'
  startDate?: Date
  endDate?: Date
}
