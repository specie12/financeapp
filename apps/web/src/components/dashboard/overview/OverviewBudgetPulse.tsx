'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { BudgetStatusResponse } from '@finance-app/shared-types'

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

interface OverviewBudgetPulseProps {
  data: BudgetStatusResponse | null
  isLoading: boolean
  hasAnomalies?: boolean
}

export function OverviewBudgetPulse({ data, isLoading, hasAnomalies }: OverviewBudgetPulseProps) {
  const topBudgets = data?.budgets.slice(0, 3) ?? []

  return (
    <Link href="/dashboard/budget">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Budget Pulse</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          ) : data && topBudgets.length > 0 ? (
            <div className="space-y-3">
              {topBudgets.map((budget) => (
                <div key={budget.budgetId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{budget.categoryName}</span>
                    <span className="text-muted-foreground">
                      {formatCents(budget.spentAmountCents)} /{' '}
                      {formatCents(budget.budgetedAmountCents)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(budget.percentUsed, 100)}
                    className={`h-2 ${budget.isOverBudget ? '[&>div]:bg-red-500' : ''}`}
                  />
                </div>
              ))}
              {data.overBudgetCount > 0 && (
                <p className="text-xs text-red-600">
                  {data.overBudgetCount} categor{data.overBudgetCount !== 1 ? 'ies' : 'y'} over
                  budget
                </p>
              )}
              {hasAnomalies && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Unusual spending detected
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No budgets set up yet</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
