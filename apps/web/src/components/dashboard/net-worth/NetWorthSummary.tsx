'use client'

import { StatCard } from '../shared/StatCard'
import { formatCents, formatPercent } from '@/lib/dashboard/formatters'
import type { NetWorthResponse } from '@/lib/dashboard/types'

interface NetWorthSummaryProps {
  data: NetWorthResponse
}

export function NetWorthSummary({ data }: NetWorthSummaryProps) {
  const { totalAssetsCents, totalLiabilitiesCents, netWorthCents, projection } = data

  // Calculate change from year 0 to last year in projection
  let netWorthChange = 0
  let netWorthChangePercent = 0
  const firstProjection = projection[0]
  const lastProjection = projection[projection.length - 1]
  if (projection.length >= 2 && firstProjection && lastProjection) {
    const startValue = firstProjection.netWorthCents
    const endValue = lastProjection.netWorthCents
    netWorthChange = endValue - startValue
    if (startValue !== 0) {
      netWorthChangePercent = ((endValue - startValue) / Math.abs(startValue)) * 100
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Net Worth"
        value={formatCents(netWorthCents)}
        trend={
          projection.length >= 2
            ? {
                value: `${formatPercent(netWorthChangePercent)} projected (${projection.length - 1}yr)`,
                isPositive: netWorthChange >= 0,
              }
            : undefined
        }
      />
      <StatCard
        title="Total Assets"
        value={formatCents(totalAssetsCents)}
        subtitle={`${data.assetsByType.length} categories`}
      />
      <StatCard
        title="Total Liabilities"
        value={formatCents(totalLiabilitiesCents)}
        subtitle={`${data.liabilitiesByType.length} categories`}
      />
    </div>
  )
}
