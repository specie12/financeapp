'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { RentVsBuyResultWithAffordability } from '@finance-app/shared-types'

interface RentVsBuyChartProps {
  result: RentVsBuyResultWithAffordability
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

const COLORS = {
  buy: { line: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.1)' }, // Green
  rent: { line: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' }, // Blue
}

export function RentVsBuyChart({ result }: RentVsBuyChartProps) {
  const { yearlyComparisons, summary } = result.calculation

  if (yearlyComparisons.length === 0) {
    return null
  }

  // Get all values to find min/max
  const allValues = yearlyComparisons.flatMap((c) => [c.buyNetWorthCents, c.rentNetWorthCents])
  const minValue = Math.min(...allValues, 0)
  const maxValue = Math.max(...allValues)
  const valueRange = maxValue - minValue || 1

  // Get years
  const years = yearlyComparisons.map((c) => c.year)
  const maxYear = years[years.length - 1] ?? 1

  // Chart dimensions
  const width = 800
  const height = 350
  const padding = { top: 30, right: 30, bottom: 50, left: 80 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Scale functions
  const xScale = (year: number) => (year / maxYear) * chartWidth + padding.left
  const yScale = (value: number) =>
    chartHeight - ((value - minValue) / valueRange) * chartHeight + padding.top

  // Generate path for a series
  const generatePath = (getY: (c: (typeof yearlyComparisons)[0]) => number) => {
    return yearlyComparisons
      .map((c, i) => {
        const x = xScale(c.year)
        const y = yScale(getY(c))
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  const buyPath = generatePath((c) => c.buyNetWorthCents)
  const rentPath = generatePath((c) => c.rentNetWorthCents)

  // Y-axis labels
  const yAxisLabels = Array.from({ length: 6 }, (_, i) => {
    const value = minValue + (valueRange * (5 - i)) / 5
    return {
      value,
      y: yScale(value),
      label: formatCurrency(value),
    }
  })

  // X-axis labels - show every few years
  const xAxisLabels = years.filter(
    (_, i) => i % Math.ceil(years.length / 8) === 0 || i === years.length - 1,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Over Time</CardTitle>
        <CardDescription>
          Comparison of your net worth if you buy vs rent over{' '}
          {result.calculation.input.projectionYears} years
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeDasharray="4"
              />
            ))}

            {/* Zero line if applicable */}
            {minValue < 0 && maxValue > 0 && (
              <line
                x1={padding.left}
                y1={yScale(0)}
                x2={width - padding.right}
                y2={yScale(0)}
                stroke="currentColor"
                strokeOpacity={0.3}
              />
            )}

            {/* Break-even line */}
            {summary.breakEvenYear && (
              <>
                <line
                  x1={xScale(summary.breakEvenYear)}
                  y1={padding.top}
                  x2={xScale(summary.breakEvenYear)}
                  y2={height - padding.bottom}
                  stroke="#888"
                  strokeDasharray="5 5"
                />
                <text
                  x={xScale(summary.breakEvenYear)}
                  y={padding.top - 10}
                  textAnchor="middle"
                  className="text-xs fill-muted-foreground"
                >
                  Break-even
                </text>
              </>
            )}

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
                y={height - padding.bottom + 25}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {year === 0 ? 'Now' : `Year ${year}`}
              </text>
            ))}

            {/* Area fills */}
            <path
              d={`${buyPath} L ${xScale(maxYear)} ${yScale(minValue)} L ${xScale(0)} ${yScale(minValue)} Z`}
              fill={COLORS.buy.bg}
            />
            <path
              d={`${rentPath} L ${xScale(maxYear)} ${yScale(minValue)} L ${xScale(0)} ${yScale(minValue)} Z`}
              fill={COLORS.rent.bg}
            />

            {/* Lines */}
            <path d={buyPath} fill="none" stroke={COLORS.buy.line} strokeWidth={2.5} />
            <path d={rentPath} fill="none" stroke={COLORS.rent.line} strokeWidth={2.5} />

            {/* Data points at start and end */}
            <circle
              cx={xScale(0)}
              cy={yScale(yearlyComparisons[0]?.buyNetWorthCents ?? 0)}
              r={4}
              fill={COLORS.buy.line}
            />
            <circle
              cx={xScale(maxYear)}
              cy={yScale(yearlyComparisons[yearlyComparisons.length - 1]?.buyNetWorthCents ?? 0)}
              r={4}
              fill={COLORS.buy.line}
            />
            <circle
              cx={xScale(0)}
              cy={yScale(yearlyComparisons[0]?.rentNetWorthCents ?? 0)}
              r={4}
              fill={COLORS.rent.line}
            />
            <circle
              cx={xScale(maxYear)}
              cy={yScale(yearlyComparisons[yearlyComparisons.length - 1]?.rentNetWorthCents ?? 0)}
              r={4}
              fill={COLORS.rent.line}
            />

            {/* Axes */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={height - padding.bottom}
              stroke="currentColor"
              strokeOpacity={0.3}
            />
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="currentColor"
              strokeOpacity={0.3}
            />
          </svg>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-8 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 rounded" style={{ backgroundColor: COLORS.buy.line }} />
            <span className="text-sm font-medium">Buy Net Worth</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 rounded" style={{ backgroundColor: COLORS.rent.line }} />
            <span className="text-sm font-medium">Rent Net Worth</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
