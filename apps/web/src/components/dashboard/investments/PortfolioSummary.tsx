'use client'

import { StatCard } from '../shared/StatCard'
import { formatCents, formatPercent } from '@/lib/dashboard/formatters'
import type { InvestmentPortfolioSummary } from '@/lib/dashboard/types'

interface PortfolioSummaryProps {
  summary: InvestmentPortfolioSummary
  holdingCount: number
}

export function PortfolioSummary({ summary, holdingCount }: PortfolioSummaryProps) {
  // Cost-basis-derived fields are `null` whenever any holding is missing a
  // cost basis. Render an explicit "Not set" rather than fabricating a number.
  const NOT_SET = 'Not set'

  const costBasisLabel =
    summary.totalCostBasisCents !== null ? formatCents(summary.totalCostBasisCents) : NOT_SET

  const unrealizedGainLabel =
    summary.unrealizedGainCents !== null ? formatCents(summary.unrealizedGainCents) : NOT_SET

  const unrealizedGainTrend =
    summary.unrealizedGainCents !== null && summary.unrealizedGainPercent !== null
      ? {
          value: formatPercent(summary.unrealizedGainPercent),
          isPositive: summary.unrealizedGainCents >= 0,
        }
      : undefined

  const totalReturnLabel =
    summary.totalReturnCents !== null ? formatCents(summary.totalReturnCents) : NOT_SET

  const totalReturnTrend =
    summary.totalReturnCents !== null && summary.totalReturnPercent !== null
      ? {
          value: formatPercent(summary.totalReturnPercent),
          isPositive: summary.totalReturnCents >= 0,
        }
      : undefined

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Value"
        value={formatCents(summary.totalValueCents)}
        subtitle={`${holdingCount} ${holdingCount === 1 ? 'holding' : 'holdings'}`}
      />
      <StatCard
        title="Cost Basis"
        value={costBasisLabel}
        subtitle={summary.totalCostBasisCents !== null ? 'Total invested' : 'Set on each asset'}
      />
      <StatCard title="Unrealized Gain" value={unrealizedGainLabel} trend={unrealizedGainTrend} />
      <StatCard title="Total Return" value={totalReturnLabel} trend={totalReturnTrend} />
    </div>
  )
}
