'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { BudgetStatusResponse } from '@finance-app/shared-types'

interface BudgetOverviewProps {
  data: BudgetStatusResponse
}

export function BudgetOverview({ data }: BudgetOverviewProps) {
  const remainingCents = data.totalBudgetedCents - data.totalSpentCents
  const percentUsed =
    data.totalBudgetedCents > 0
      ? Math.round((data.totalSpentCents / data.totalBudgetedCents) * 100)
      : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Budgeted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(data.totalBudgetedCents)}</p>
          <p className="text-xs text-muted-foreground">
            {data.budgets.length} budget{data.budgets.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(data.totalSpentCents)}</p>
          <p className="text-xs text-muted-foreground">{percentUsed}% of budget used</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-2xl font-bold ${remainingCents < 0 ? 'text-red-600' : 'text-green-600'}`}
          >
            {formatCurrency(remainingCents)}
          </p>
          <p className="text-xs text-muted-foreground">
            {remainingCents >= 0 ? 'under budget' : 'over budget'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Over Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-2xl font-bold ${data.overBudgetCount > 0 ? 'text-red-600' : 'text-green-600'}`}
          >
            {data.overBudgetCount}
          </p>
          <p className="text-xs text-muted-foreground">
            categor{data.overBudgetCount !== 1 ? 'ies' : 'y'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
