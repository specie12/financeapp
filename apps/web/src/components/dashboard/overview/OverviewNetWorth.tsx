'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { NetWorthResponse } from '@finance-app/shared-types'

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

interface OverviewNetWorthProps {
  data: NetWorthResponse | null
  isLoading: boolean
}

export function OverviewNetWorth({ data, isLoading }: OverviewNetWorthProps) {
  return (
    <Link href="/dashboard/net-worth">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-32 bg-muted rounded" />
            </div>
          ) : data ? (
            <>
              <p className="text-3xl font-bold">{formatCents(data.netWorthCents)}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-green-600">Assets: {formatCents(data.totalAssetsCents)}</span>
                <span className="text-red-600">
                  Liabilities: {formatCents(data.totalLiabilitiesCents)}
                </span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No data available</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
