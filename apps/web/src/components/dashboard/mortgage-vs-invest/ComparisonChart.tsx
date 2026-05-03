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
import { DisclosureBadge } from '@/components/dashboard/shared'
import type { MortgageVsInvestResult } from '@finance-app/shared-types'

interface ComparisonChartProps {
  result: MortgageVsInvestResult
}

export function ComparisonChart({ result }: ComparisonChartProps) {
  // Plot the values the engine returned. The "Net Advantage" series already
  // accounts for capital-gains tax (engine: subTax(gain, capitalGainsTaxPercent))
  // and any lost mortgage-interest deduction. Earlier code re-applied a hardcoded
  // 0.85 factor here — that double-counted tax for users at any rate other than
  // 15% and duplicated engine logic in the UI. Removed.
  const chartData = result.yearlyComparisons.map((c) => ({
    year: `Year ${c.year}`,
    'Interest Saved (after tax)': Math.round(c.payExtraInterestSavedCents / 100),
    'Portfolio Value': Math.round(c.investPortfolioValueCents / 100),
    'Net Advantage (after tax)': Math.round(c.investAdvantageNetCents / 100),
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Projected Year-by-Year Comparison</CardTitle>
          <DisclosureBadge kind="projection" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Lines compound the assumptions you entered. Real-world returns vary year to year — this
          chart smooths them.
        </p>
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
              dataKey="Interest Saved (after tax)"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Portfolio Value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Net Advantage (after tax)"
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
