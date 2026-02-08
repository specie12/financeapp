import { type CreateCategoryInput } from '@finance-app/validation'

export class CreateCategoryDto implements CreateCategoryInput {
  name!: string
  type!: 'income' | 'expense' | 'transfer'
  icon?: string | null
  color?: string | null
  parentId?: string | null
}
