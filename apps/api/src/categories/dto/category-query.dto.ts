export class CategoryQueryDto {
  page?: number
  limit?: number
  type?: 'income' | 'expense' | 'transfer'
}
