'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import type { DividendProjection } from '@finance-app/shared-types'

interface DividendProjectionCardProps {
  projections: DividendProjection[]
  /** Sum of configured monthly dividends. `null` = no asset has a yield configured. */
  totalMonthlyCents: number | null
  /** Sum of configured annual dividends. `null` = no asset has a yield configured. */
  totalAnnualCents: number | null
  /** True when at least one asset is missing dividend yield — totals are partial. */
  partial?: boolean
}

export function DividendProjectionCard({
  projections,
  totalAnnualCents,
  totalMonthlyCents,
  partial,
}: DividendProjectionCardProps) {
  const hasProjections =
    totalAnnualCents !== null &&
    totalMonthlyCents !== null &&
    projections.some((p) => p.annualDividendCents !== null && p.annualDividendCents > 0)

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

  const configured = projections.filter(
    (p) => p.annualDividendCents !== null && p.annualDividendCents > 0,
  )

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
                  <MoneyDisplay cents={totalMonthlyCents as number} />
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-4">
                <p className="text-sm text-muted-foreground">Annual Income</p>
                <p className="text-2xl font-bold text-emerald-600">
                  <MoneyDisplay cents={totalAnnualCents as number} />
                </p>
              </div>
            </div>

            {partial && (
              <p className="text-xs text-muted-foreground">
                Partial total — some assets have no dividend yield configured.
              </p>
            )}

            {/* Breakdown by Asset */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground">By Asset</p>
              {configured.slice(0, 5).map((projection) => (
                <div key={projection.assetId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[150px]">{projection.assetName}</span>
                    <span className="text-xs text-muted-foreground">
                      ({getAssetTypeLabel(projection.assetType)})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {(projection.yieldPercent as number).toFixed(1)}%
                    </span>
                    <span className="font-medium text-green-600">
                      <MoneyDisplay cents={projection.monthlyDividendCents as number} />
                      /mo
                    </span>
                  </div>
                </div>
              ))}
              {configured.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{configured.length - 5} more assets
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Dividend yield not configured for any of your investments. Add a yield to an asset to
              see dividend projections.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
