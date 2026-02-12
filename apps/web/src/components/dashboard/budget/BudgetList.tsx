'use client'

import { BudgetItemCard } from './BudgetItemCard'
import type { BudgetStatusItem } from '@finance-app/shared-types'

interface BudgetListProps {
  budgets: BudgetStatusItem[]
  onEdit: (budget: BudgetStatusItem) => void
  onDelete: (budget: BudgetStatusItem) => void
}

export function BudgetList({ budgets, onEdit, onDelete }: BudgetListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {budgets.map((budget) => (
        <BudgetItemCard
          key={budget.budgetId}
          budget={budget}
          onEdit={() => onEdit(budget)}
          onDelete={() => onDelete(budget)}
        />
      ))}
    </div>
  )
}
