'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CashFlowSummaryResponse } from '@finance-app/shared-types'

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

interface OverviewCashFlowProps {
  data: CashFlowSummaryResponse | null
  isLoading: boolean
  anomalyCount?: number
}

export function OverviewCashFlow({ data, isLoading, anomalyCount }: OverviewCashFlowProps) {
  return (
    <Link href="/dashboard/cash-flow">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-28 bg-muted rounded" />
            </div>
          ) : data ? (
            <>
              <p
                className={`text-2xl font-bold ${data.netMonthlyCashFlowCents >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCents(data.netMonthlyCashFlowCents)}
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-green-600">
                  In: {formatCents(data.totalMonthlyIncomeCents)}
                </span>
                <span className="text-red-600">
                  Out: {formatCents(data.totalMonthlyExpensesCents)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.savingsRatePercent}% savings rate
              </p>
              {anomalyCount != null && anomalyCount > 0 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {anomalyCount} spending anomal{anomalyCount !== 1 ? 'ies' : 'y'}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">No cash flow data</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
