'use client'

import { DashboardCard } from '../shared/DashboardCard'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import { Progress } from '@/components/ui/progress'
import { formatPercent, getAssetTypeLabel } from '@/lib/dashboard/formatters'
import { cn } from '@/lib/utils'
import type { InvestmentHoldingSummary } from '@/lib/dashboard/types'

interface HoldingsListProps {
  holdings: InvestmentHoldingSummary[]
}

export function HoldingsList({ holdings }: HoldingsListProps) {
  if (holdings.length === 0) {
    return (
      <DashboardCard title="Holdings">
        <p className="text-muted-foreground text-center py-8">
          No investment holdings recorded yet
        </p>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title="Holdings" description={`${holdings.length} positions`}>
      <div className="space-y-4">
        {holdings.map((holding) => (
          <div key={holding.id} className="space-y-2 pb-4 border-b last:border-b-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{holding.name}</h4>
                <p className="text-sm text-muted-foreground">{getAssetTypeLabel(holding.type)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  <MoneyDisplay cents={holding.valueCents} />
                </p>
                <p
                  className={cn(
                    'text-sm',
                    holding.gainLossCents >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  <MoneyDisplay cents={holding.gainLossCents} showSign /> (
                  {formatPercent(holding.gainLossPercent)})
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Allocation</span>
                <span className="font-medium">{holding.allocationPercent.toFixed(1)}%</span>
              </div>
              <Progress value={holding.allocationPercent} className="h-2" />
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Cost Basis</span>
              <MoneyDisplay cents={holding.costBasisCents} />
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}
