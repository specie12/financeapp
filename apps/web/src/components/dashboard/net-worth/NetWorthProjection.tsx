'use client'

import { DashboardCard } from '../shared/DashboardCard'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import type { NetWorthProjection as NetWorthProjectionType } from '@/lib/dashboard/types'

interface NetWorthProjectionProps {
  projection: NetWorthProjectionType[]
}

export function NetWorthProjection({ projection }: NetWorthProjectionProps) {
  if (projection.length === 0) {
    return null
  }

  // Find max value for scaling
  const maxAssets = Math.max(...projection.map((p) => p.totalAssetsCents))
  const maxLiabilities = Math.max(...projection.map((p) => p.totalLiabilitiesCents))
  const maxValue = Math.max(maxAssets, maxLiabilities)

  return (
    <DashboardCard title="Net Worth Projection" description="Year-over-year forecast">
      <div className="space-y-4">
        {/* Header */}
        <div className="grid grid-cols-4 text-sm font-medium text-muted-foreground border-b pb-2">
          <span>Year</span>
          <span className="text-right">Assets</span>
          <span className="text-right">Liabilities</span>
          <span className="text-right">Net Worth</span>
        </div>

        {/* Data rows */}
        <div className="space-y-2">
          {projection.map((point) => {
            const year = new Date(point.date).getFullYear()
            return (
              <div key={point.year} className="grid grid-cols-4 text-sm">
                <span className="font-medium">
                  {point.year === 0 ? 'Now' : `Year ${point.year}`}
                  <span className="text-xs text-muted-foreground ml-1">({year})</span>
                </span>
                <span className="text-right">
                  <MoneyDisplay cents={point.totalAssetsCents} compact />
                </span>
                <span className="text-right">
                  <MoneyDisplay cents={point.totalLiabilitiesCents} compact />
                </span>
                <span className="text-right font-medium">
                  <MoneyDisplay cents={point.netWorthCents} compact colorCode />
                </span>
              </div>
            )
          })}
        </div>

        {/* Visual bar chart */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Visual Projection</p>
          <div className="space-y-2">
            {projection.map((point) => {
              const assetsWidth = maxValue > 0 ? (point.totalAssetsCents / maxValue) * 100 : 0
              const liabilitiesWidth =
                maxValue > 0 ? (point.totalLiabilitiesCents / maxValue) * 100 : 0

              return (
                <div key={`bar-${point.year}`} className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    {point.year === 0 ? 'Now' : `Year ${point.year}`}
                  </span>
                  <div className="flex gap-1 h-4">
                    <div
                      className="bg-green-500 rounded-sm"
                      style={{ width: `${assetsWidth}%` }}
                      title={`Assets: ${point.totalAssetsCents / 100}`}
                    />
                    <div
                      className="bg-red-400 rounded-sm"
                      style={{ width: `${liabilitiesWidth}%` }}
                      title={`Liabilities: ${point.totalLiabilitiesCents / 100}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded-sm" /> Assets
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-400 rounded-sm" /> Liabilities
            </span>
          </div>
        </div>
      </div>
    </DashboardCard>
  )
}
