'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AmortizationEntry } from '@finance-app/shared-types'

interface PayoffComparisonChartProps {
  originalSchedule: AmortizationEntry[]
  modifiedSchedule: AmortizationEntry[]
  monthsSaved: number
}

export function PayoffComparisonChart({
  originalSchedule,
  modifiedSchedule,
  monthsSaved,
}: PayoffComparisonChartProps) {
  const chartData = useMemo(() => {
    // Create data points for both schedules
    const maxPayments = originalSchedule.length
    const dataPoints: Array<{
      month: number
      originalBalance: number
      modifiedBalance: number
    }> = []

    // Sample every 6 months for larger loans, every month for smaller
    const step = maxPayments > 120 ? 6 : maxPayments > 60 ? 3 : 1

    for (let i = 0; i < maxPayments; i += step) {
      const originalEntry = originalSchedule[i]
      const modifiedEntry = modifiedSchedule[Math.min(i, modifiedSchedule.length - 1)]

      dataPoints.push({
        month: i + 1,
        originalBalance: originalEntry?.endingBalanceCents ?? 0,
        modifiedBalance: i < modifiedSchedule.length ? (modifiedEntry?.endingBalanceCents ?? 0) : 0,
      })
    }

    // Add final point for original
    if (dataPoints.length > 0 && dataPoints[dataPoints.length - 1]?.month !== maxPayments) {
      const lastOriginal = originalSchedule[originalSchedule.length - 1]
      dataPoints.push({
        month: maxPayments,
        originalBalance: lastOriginal?.endingBalanceCents ?? 0,
        modifiedBalance: 0,
      })
    }

    return dataPoints
  }, [originalSchedule, modifiedSchedule])

  // Chart dimensions
  const width = 600
  const height = 300
  const padding = { top: 20, right: 20, bottom: 40, left: 70 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate scales
  const maxBalance = Math.max(
    ...chartData.map((d) => Math.max(d.originalBalance, d.modifiedBalance)),
  )
  const maxMonth = Math.max(...chartData.map((d) => d.month))

  const xScale = (month: number) => (month / maxMonth) * chartWidth + padding.left
  const yScale = (balance: number) =>
    chartHeight - (balance / maxBalance) * chartHeight + padding.top

  // Generate path data
  const originalPath = chartData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.month)} ${yScale(d.originalBalance)}`)
    .join(' ')

  const modifiedPath = chartData
    .filter((d) => d.month <= modifiedSchedule.length)
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.month)} ${yScale(d.modifiedBalance)}`)
    .join(' ')

  // Format helpers
  const formatMoney = (cents: number) => {
    const dollars = cents / 100
    if (dollars >= 1000000) return `$${(dollars / 1000000).toFixed(1)}M`
    if (dollars >= 1000) return `$${(dollars / 1000).toFixed(0)}K`
    return `$${dollars.toFixed(0)}`
  }

  const formatMonth = (month: number) => {
    const years = Math.floor(month / 12)
    return years > 0 ? `${years}y` : `${month}m`
  }

  // Y-axis ticks
  const yTicks = Array.from({ length: 5 }, (_, i) => (maxBalance / 4) * (4 - i))

  // X-axis ticks (every 5 years or appropriate interval)
  const yearInterval = maxMonth > 240 ? 60 : maxMonth > 120 ? 24 : 12
  const xTicks = Array.from(
    { length: Math.floor(maxMonth / yearInterval) + 1 },
    (_, i) => i * yearInterval,
  ).filter((m) => m <= maxMonth)

  // Payoff month marker
  const newPayoffMonth = modifiedSchedule.length

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Balance Over Time</CardTitle>
        <p className="text-sm text-muted-foreground">
          See how extra payments accelerate your loan payoff
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[400px]">
            {/* Grid lines */}
            {yTicks.map((tick) => (
              <line
                key={tick}
                x1={padding.left}
                y1={yScale(tick)}
                x2={width - padding.right}
                y2={yScale(tick)}
                stroke="#e5e7eb"
                strokeDasharray="4,4"
              />
            ))}

            {/* Vertical line at new payoff date if different */}
            {monthsSaved > 0 && (
              <>
                <line
                  x1={xScale(newPayoffMonth)}
                  y1={padding.top}
                  x2={xScale(newPayoffMonth)}
                  y2={chartHeight + padding.top}
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                />
                <text
                  x={xScale(newPayoffMonth)}
                  y={padding.top - 5}
                  textAnchor="middle"
                  className="text-xs fill-green-600 font-medium"
                >
                  New Payoff
                </text>
              </>
            )}

            {/* Original path */}
            <path
              d={originalPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="6,4"
            />

            {/* Modified path */}
            <path d={modifiedPath} fill="none" stroke="#10b981" strokeWidth="3" />

            {/* Y-axis labels */}
            {yTicks.map((tick) => (
              <text
                key={tick}
                x={padding.left - 10}
                y={yScale(tick) + 4}
                textAnchor="end"
                className="text-xs fill-muted-foreground"
              >
                {formatMoney(tick)}
              </text>
            ))}

            {/* X-axis labels */}
            {xTicks.map((tick) => (
              <text
                key={tick}
                x={xScale(tick)}
                y={height - 10}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {formatMonth(tick)}
              </text>
            ))}

            {/* Axis lines */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={chartHeight + padding.top}
              stroke="#d1d5db"
            />
            <line
              x1={padding.left}
              y1={chartHeight + padding.top}
              x2={width - padding.right}
              y2={chartHeight + padding.top}
              stroke="#d1d5db"
            />
          </svg>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-slate-400" style={{ borderStyle: 'dashed' }} />
            <span className="text-sm text-muted-foreground">Original Schedule</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-emerald-500" />
            <span className="text-sm text-muted-foreground">With Extra Payments</span>
          </div>
          {monthsSaved > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500" style={{ borderStyle: 'dashed' }} />
              <span className="text-sm text-green-600">New Payoff Date</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
