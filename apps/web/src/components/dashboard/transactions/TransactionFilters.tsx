'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Category } from '@finance-app/shared-types'

interface TransactionFiltersProps {
  selectedType: string | undefined
  selectedCategoryId: string | undefined
  categories: Category[]
  onTypeChange: (type: string | undefined) => void
  onCategoryChange: (categoryId: string | undefined) => void
  onReset: () => void
}

export function TransactionFilters({
  selectedType,
  selectedCategoryId,
  categories,
  onTypeChange,
  onCategoryChange,
  onReset,
}: TransactionFiltersProps) {
  const types = [
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'transfer', label: 'Transfer' },
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Type:</span>
          <div className="flex gap-1">
            {types.map((t) => (
              <Button
                key={t.value}
                variant={selectedType === t.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTypeChange(selectedType === t.value ? undefined : t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          <span className="text-sm font-medium text-muted-foreground ml-4">Category:</span>
          <select
            className="border rounded-md px-2 py-1 text-sm bg-background"
            value={selectedCategoryId ?? ''}
            onChange={(e) => onCategoryChange(e.target.value || undefined)}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <Button variant="ghost" size="sm" onClick={onReset} className="ml-auto">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
