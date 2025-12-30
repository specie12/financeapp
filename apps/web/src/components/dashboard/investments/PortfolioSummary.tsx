'use client'

import { StatCard } from '../shared/StatCard'
import { formatCents, formatPercent } from '@/lib/dashboard/formatters'
import type { InvestmentPortfolioSummary } from '@/lib/dashboard/types'

interface PortfolioSummaryProps {
  summary: InvestmentPortfolioSummary
  holdingCount: number
}

export function PortfolioSummary({ summary, holdingCount }: PortfolioSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Value"
        value={formatCents(summary.totalValueCents)}
        subtitle={`${holdingCount} ${holdingCount === 1 ? 'holding' : 'holdings'}`}
      />
      <StatCard
        title="Cost Basis"
        value={formatCents(summary.totalCostBasisCents)}
        subtitle="Total invested"
      />
      <StatCard
        title="Unrealized Gain"
        value={formatCents(summary.unrealizedGainCents)}
        trend={{
          value: formatPercent(summary.unrealizedGainPercent),
          isPositive: summary.unrealizedGainCents >= 0,
        }}
      />
      <StatCard
        title="Total Return"
        value={formatCents(summary.totalReturnCents)}
        trend={{
          value: formatPercent(summary.totalReturnPercent),
          isPositive: summary.totalReturnCents >= 0,
        }}
      />
    </div>
  )
}
