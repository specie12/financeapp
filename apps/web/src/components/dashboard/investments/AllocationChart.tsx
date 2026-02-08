'use client'

import { DashboardCard } from '../shared/DashboardCard'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import { getAssetTypeLabel } from '@/lib/dashboard/formatters'
import type { InvestmentHoldingSummary } from '@/lib/dashboard/types'

interface AllocationChartProps {
  holdings: InvestmentHoldingSummary[]
}

const COLORS = [
  'bg-emerald-600',
  'bg-green-500',
  'bg-teal-500',
  'bg-lime-500',
  'bg-cyan-500',
  'bg-emerald-400',
  'bg-green-700',
  'bg-teal-700',
]

export function AllocationChart({ holdings }: AllocationChartProps) {
  if (holdings.length === 0) {
    return null
  }

  // Group by type for allocation
  const byType = holdings.reduce(
    (acc, holding) => {
      const key = holding.type
      if (!acc[key]) {
        acc[key] = { type: key, valueCents: 0, allocationPercent: 0 }
      }
      acc[key].valueCents += holding.valueCents
      acc[key].allocationPercent += holding.allocationPercent
      return acc
    },
    {} as Record<string, { type: string; valueCents: number; allocationPercent: number }>,
  )

  const groups = Object.values(byType).sort((a, b) => b.valueCents - a.valueCents)

  return (
    <DashboardCard title="Allocation by Type">
      <div className="space-y-4">
        {/* Visual bar */}
        <div className="flex h-8 rounded-lg overflow-hidden">
          {groups.map((group, index) => (
            <div
              key={group.type}
              className={`${COLORS[index % COLORS.length]} transition-all`}
              style={{ width: `${group.allocationPercent}%` }}
              title={`${getAssetTypeLabel(group.type)}: ${group.allocationPercent.toFixed(1)}%`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {groups.map((group, index) => (
            <div key={group.type} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-sm ${COLORS[index % COLORS.length]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{getAssetTypeLabel(group.type)}</p>
                <p className="text-xs text-muted-foreground">
                  {group.allocationPercent.toFixed(1)}% -{' '}
                  <MoneyDisplay cents={group.valueCents} compact />
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  )
}
