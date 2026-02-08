export class AccountQueryDto {
  page?: number
  limit?: number
  type?: 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan' | 'cash'
}
