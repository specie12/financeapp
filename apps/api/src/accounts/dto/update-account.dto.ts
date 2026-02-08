import { type UpdateAccountInput } from '@finance-app/validation'

export class UpdateAccountDto implements UpdateAccountInput {
  name?: string
  type?: 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan' | 'cash'
  currency?: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'INR' | 'NGN'
  initialBalance?: number
}
