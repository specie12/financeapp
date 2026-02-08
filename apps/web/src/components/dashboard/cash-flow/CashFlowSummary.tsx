'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CashFlowSummaryResponse } from '@finance-app/shared-types'

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

interface CashFlowSummaryProps {
  data: CashFlowSummaryResponse
}

export function CashFlowSummaryCards({ data }: CashFlowSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            {formatCents(data.totalMonthlyIncomeCents)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">
            {formatCents(data.totalMonthlyExpensesCents)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Net Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-2xl font-bold ${data.netMonthlyCashFlowCents >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatCents(data.netMonthlyCashFlowCents)}
          </p>
          <p className="text-xs text-muted-foreground">per month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Savings Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-2xl font-bold ${data.savingsRatePercent >= 20 ? 'text-green-600' : data.savingsRatePercent >= 0 ? 'text-yellow-600' : 'text-red-600'}`}
          >
            {data.savingsRatePercent}%
          </p>
          <p className="text-xs text-muted-foreground">of income saved</p>
        </CardContent>
      </Card>
    </div>
  )
}
