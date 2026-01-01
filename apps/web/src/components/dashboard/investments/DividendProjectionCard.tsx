'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import type { DividendProjection } from '@finance-app/shared-types'

interface DividendProjectionCardProps {
  projections: DividendProjection[]
  totalAnnualCents: number
  totalMonthlyCents: number
}

export function DividendProjectionCard({
  projections,
  totalAnnualCents,
  totalMonthlyCents,
}: DividendProjectionCardProps) {
  const hasProjections = projections.length > 0 && totalAnnualCents > 0

  const getAssetTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      investment: 'Investment',
      retirement_account: 'Retirement',
      real_estate: 'Real Estate',
      bank_account: 'Bank Account',
      crypto: 'Crypto',
      other: 'Other',
    }
    return labels[type] || type
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">Dividend Income</CardTitle>
        <p className="text-sm text-muted-foreground">
          Projected passive income from your investments
        </p>
      </CardHeader>
      <CardContent>
        {hasProjections ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4">
                <p className="text-sm text-muted-foreground">Monthly Income</p>
                <p className="text-2xl font-bold text-green-600">
                  <MoneyDisplay cents={totalMonthlyCents} />
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
                <p className="text-sm text-muted-foreground">Annual Income</p>
                <p className="text-2xl font-bold text-blue-600">
                  <MoneyDisplay cents={totalAnnualCents} />
                </p>
              </div>
            </div>

            {/* Breakdown by Asset */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground">By Asset</p>
              {projections
                .filter((p) => p.annualDividendCents > 0)
                .slice(0, 5)
                .map((projection) => (
                  <div
                    key={projection.assetId}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[150px]">{projection.assetName}</span>
                      <span className="text-xs text-muted-foreground">
                        ({getAssetTypeLabel(projection.assetType)})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {projection.yieldPercent.toFixed(1)}%
                      </span>
                      <span className="font-medium text-green-600">
                        <MoneyDisplay cents={projection.monthlyDividendCents} />
                        /mo
                      </span>
                    </div>
                  </div>
                ))}
              {projections.filter((p) => p.annualDividendCents > 0).length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{projections.filter((p) => p.annualDividendCents > 0).length - 5} more assets
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              No dividend-generating assets found. Add investments with dividend yields to see
              projections.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
