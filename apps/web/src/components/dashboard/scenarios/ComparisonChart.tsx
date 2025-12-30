'use client'

import { DashboardCard } from '../shared/DashboardCard'
import type { ScenarioComparisonItem } from '@/lib/dashboard/types'

interface ComparisonChartProps {
  comparisons: ScenarioComparisonItem[]
}

const COLORS = [
  { line: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' }, // Blue
  { line: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.1)' }, // Green
  { line: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.1)' }, // Amber
  { line: 'rgb(139, 92, 246)', bg: 'rgba(139, 92, 246, 0.1)' }, // Purple
]

export function ComparisonChart({ comparisons }: ComparisonChartProps) {
  if (comparisons.length === 0) {
    return null
  }

  // Get all net worth values to find min/max
  const allNetWorthValues = comparisons.flatMap((c) =>
    c.projection.yearlySnapshots.map((s) => s.netWorthCents),
  )
  const minValue = Math.min(...allNetWorthValues)
  const maxValue = Math.max(...allNetWorthValues)
  const valueRange = maxValue - minValue || 1

  // Get years from first comparison (they should all be the same)
  const years = comparisons[0].projection.yearlySnapshots.map((s) => s.year)
  const horizonYears = years[years.length - 1]

  // Chart dimensions
  const width = 800
  const height = 300
  const padding = { top: 20, right: 20, bottom: 40, left: 80 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Scale functions
  const xScale = (year: number) => (year / horizonYears) * chartWidth + padding.left
  const yScale = (value: number) =>
    chartHeight - ((value - minValue) / valueRange) * chartHeight + padding.top

  // Generate path for each scenario
  const generatePath = (snapshots: ScenarioComparisonItem['projection']['yearlySnapshots']) => {
    return snapshots
      .map((s, i) => {
        const x = xScale(s.year)
        const y = yScale(s.netWorthCents)
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  // Y-axis labels
  const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
    const value = minValue + (valueRange * (4 - i)) / 4
    return {
      value,
      y: yScale(value),
      label: formatCurrency(value),
    }
  })

  // X-axis labels
  const xAxisLabels = years.filter(
    (_, i) => i % Math.ceil(years.length / 6) === 0 || i === years.length - 1,
  )

  return (
    <DashboardCard
      title="Net Worth Comparison"
      description="Side-by-side projection of all scenarios"
    >
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="min-w-[600px]">
          {/* Grid lines */}
          {yAxisLabels.map((label, i) => (
            <line
              key={`grid-${i}`}
              x1={padding.left}
              y1={label.y}
              x2={width - padding.right}
              y2={label.y}
              stroke="#e5e7eb"
              strokeDasharray="4"
            />
          ))}

          {/* Y-axis labels */}
          {yAxisLabels.map((label, i) => (
            <text
              key={`y-label-${i}`}
              x={padding.left - 10}
              y={label.y}
              textAnchor="end"
              alignmentBaseline="middle"
              className="text-xs fill-muted-foreground"
            >
              {label.label}
            </text>
          ))}

          {/* X-axis labels */}
          {xAxisLabels.map((year) => (
            <text
              key={`x-label-${year}`}
              x={xScale(year)}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-muted-foreground"
            >
              {year === 0 ? 'Now' : `Year ${year}`}
            </text>
          ))}

          {/* Lines for each scenario */}
          {comparisons.map((comparison, i) => (
            <path
              key={comparison.scenario.id}
              d={generatePath(comparison.projection.yearlySnapshots)}
              fill="none"
              stroke={COLORS[i % COLORS.length].line}
              strokeWidth={2}
            />
          ))}

          {/* Dots for each data point */}
          {comparisons.map((comparison, i) =>
            comparison.projection.yearlySnapshots.map((snapshot) => (
              <circle
                key={`${comparison.scenario.id}-${snapshot.year}`}
                cx={xScale(snapshot.year)}
                cy={yScale(snapshot.netWorthCents)}
                r={3}
                fill={COLORS[i % COLORS.length].line}
              />
            )),
          )}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#374151"
          />
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#374151"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
        {comparisons.map((comparison, i) => (
          <div key={comparison.scenario.id} className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS[i % COLORS.length].line }}
            />
            <span className="text-sm">
              {comparison.scenario.name}
              {comparison.scenario.isBaseline && (
                <span className="text-xs text-muted-foreground ml-1">(baseline)</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

function formatCurrency(cents: number): string {
  const dollars = cents / 100
  if (Math.abs(dollars) >= 1000000) {
    return `$${(dollars / 1000000).toFixed(1)}M`
  }
  if (Math.abs(dollars) >= 1000) {
    return `$${(dollars / 1000).toFixed(0)}K`
  }
  return `$${dollars.toFixed(0)}`
}
