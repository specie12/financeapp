'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MortgageVsInvestResult } from '@finance-app/shared-types'

interface ComparisonChartProps {
  result: MortgageVsInvestResult
}

export function ComparisonChart({ result }: ComparisonChartProps) {
  const chartData = result.yearlyComparisons.map((c) => ({
    year: `Year ${c.year}`,
    'Interest Saved': Math.round(c.payExtraInterestSavedCents / 100),
    'Portfolio (After Tax)': Math.round(
      (c.investCumulativeContributedCents +
        (c.investPortfolioValueCents - c.investCumulativeContributedCents) * 0.85) /
        100,
    ),
    'Net Advantage': Math.round(c.investAdvantageNetCents / 100),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Year-by-Year Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            <Legend />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="Interest Saved"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Portfolio (After Tax)"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Net Advantage"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
