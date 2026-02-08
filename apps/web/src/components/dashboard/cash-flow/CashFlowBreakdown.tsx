'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CashFlowItemSummary } from '@finance-app/shared-types'

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function formatFrequency(frequency: string): string {
  const labels: Record<string, string> = {
    one_time: 'One-time',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annually: 'Annually',
  }
  return labels[frequency] ?? frequency
}

interface CashFlowBreakdownProps {
  items: CashFlowItemSummary[]
}

export function CashFlowBreakdown({ items }: CashFlowBreakdownProps) {
  const incomeItems = items.filter((i) => i.type === 'income')
  const expenseItems = items.filter((i) => i.type === 'expense')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Income Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {incomeItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No income sources recorded.</p>
          ) : (
            <div className="space-y-3">
              {incomeItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCents(item.originalAmountCents)} {formatFrequency(item.frequency)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-green-600">
                    {formatCents(item.monthlyAmountCents)}/mo
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenseItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No expenses recorded.</p>
          ) : (
            <div className="space-y-3">
              {expenseItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCents(item.originalAmountCents)} {formatFrequency(item.frequency)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-red-600">
                    {formatCents(item.monthlyAmountCents)}/mo
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
