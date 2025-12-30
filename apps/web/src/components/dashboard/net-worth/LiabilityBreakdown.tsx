'use client'

import { DashboardCard } from '../shared/DashboardCard'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import { Progress } from '@/components/ui/progress'
import { getLiabilityTypeLabel, formatPercentPlain } from '@/lib/dashboard/formatters'
import type { LiabilitiesByType } from '@/lib/dashboard/types'

interface LiabilityBreakdownProps {
  liabilitiesByType: LiabilitiesByType[]
  totalLiabilitiesCents: number
}

export function LiabilityBreakdown({
  liabilitiesByType,
  totalLiabilitiesCents,
}: LiabilityBreakdownProps) {
  if (liabilitiesByType.length === 0) {
    return (
      <DashboardCard title="Liabilities Breakdown">
        <p className="text-muted-foreground text-center py-8">No liabilities recorded yet</p>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title="Liabilities Breakdown">
      <div className="space-y-4">
        {liabilitiesByType.map((category) => {
          const percentage =
            totalLiabilitiesCents > 0
              ? (category.totalBalanceCents / totalLiabilitiesCents) * 100
              : 0

          return (
            <div key={category.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getLiabilityTypeLabel(category.type)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({category.count} {category.count === 1 ? 'item' : 'items'})
                  </span>
                </div>
                <MoneyDisplay cents={category.totalBalanceCents} />
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="pl-4 space-y-1">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name}{' '}
                      <span className="text-xs">
                        ({formatPercentPlain(item.interestRatePercent)} APR)
                      </span>
                    </span>
                    <MoneyDisplay cents={item.balanceCents} className="text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </DashboardCard>
  )
}
