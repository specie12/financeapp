import { type CreateTransactionInput } from '@finance-app/validation'

export class CreateTransactionDto implements CreateTransactionInput {
  accountId!: string
  categoryId?: string | null
  type!: 'income' | 'expense' | 'transfer'
  amount!: number
  description!: string
  date!: Date
}
