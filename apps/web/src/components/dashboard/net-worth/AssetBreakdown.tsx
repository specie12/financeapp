'use client'

import { DashboardCard } from '../shared/DashboardCard'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import { Progress } from '@/components/ui/progress'
import { getAssetTypeLabel } from '@/lib/dashboard/formatters'
import type { AssetsByType } from '@/lib/dashboard/types'

interface AssetBreakdownProps {
  assetsByType: AssetsByType[]
  totalAssetsCents: number
}

export function AssetBreakdown({ assetsByType, totalAssetsCents }: AssetBreakdownProps) {
  if (assetsByType.length === 0) {
    return (
      <DashboardCard title="Assets Breakdown">
        <p className="text-muted-foreground text-center py-8">No assets recorded yet</p>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title="Assets Breakdown">
      <div className="space-y-4">
        {assetsByType.map((category) => {
          const percentage =
            totalAssetsCents > 0 ? (category.totalValueCents / totalAssetsCents) * 100 : 0

          return (
            <div key={category.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getAssetTypeLabel(category.type)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({category.count} {category.count === 1 ? 'item' : 'items'})
                  </span>
                </div>
                <MoneyDisplay cents={category.totalValueCents} />
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="pl-4 space-y-1">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <MoneyDisplay cents={item.valueCents} className="text-muted-foreground" />
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
