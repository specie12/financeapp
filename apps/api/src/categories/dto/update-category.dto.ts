import { type UpdateCategoryInput } from '@finance-app/validation'

export class UpdateCategoryDto implements UpdateCategoryInput {
  name?: string
  type?: 'income' | 'expense' | 'transfer'
  icon?: string | null
  color?: string | null
  parentId?: string | null
}
