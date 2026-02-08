'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { BudgetStatusItem } from '@finance-app/shared-types'

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

interface BudgetCategoryCardProps {
  budgets: BudgetStatusItem[]
}

export function BudgetCategoryCard({ budgets }: BudgetCategoryCardProps) {
  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No budgets set up yet. Create budgets to track spending by category.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget by Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.map((budget) => (
          <div key={budget.budgetId} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{budget.categoryName}</span>
              <span className="text-sm text-muted-foreground">
                {formatCents(budget.spentAmountCents)} / {formatCents(budget.budgetedAmountCents)}
              </span>
            </div>
            <Progress
              value={Math.min(budget.percentUsed, 100)}
              className={budget.isOverBudget ? '[&>div]:bg-red-500' : ''}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{budget.percentUsed.toFixed(0)}% used</span>
              <span className={budget.isOverBudget ? 'text-red-600 font-medium' : 'text-green-600'}>
                {budget.isOverBudget
                  ? `${formatCents(Math.abs(budget.remainingCents))} over`
                  : `${formatCents(budget.remainingCents)} left`}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
