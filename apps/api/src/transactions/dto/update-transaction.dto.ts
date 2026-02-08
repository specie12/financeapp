import { type UpdateTransactionInput } from '@finance-app/validation'

export class UpdateTransactionDto implements UpdateTransactionInput {
  accountId?: string
  categoryId?: string | null
  type?: 'income' | 'expense' | 'transfer'
  amount?: number
  description?: string
  date?: Date
}
