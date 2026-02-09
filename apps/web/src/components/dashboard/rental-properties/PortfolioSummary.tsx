'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RentalPortfolioSummary } from '@finance-app/shared-types'

interface PortfolioSummaryProps {
  summary: RentalPortfolioSummary
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function PortfolioSummary({ summary }: PortfolioSummaryProps) {
  const stats = [
    { label: 'Total Properties', value: summary.totalProperties.toString() },
    { label: 'Total Value', value: formatDollars(summary.totalValueCents) },
    { label: 'Total Equity', value: formatDollars(summary.totalEquityCents) },
    { label: 'Monthly Rent', value: formatDollars(summary.totalMonthlyRentCents) },
    { label: 'Total NOI', value: formatDollars(summary.totalNOICents) },
    { label: 'Avg Cap Rate', value: `${summary.averageCapRatePercent}%` },
    { label: 'Avg Cash-on-Cash', value: `${summary.averageCashOnCashPercent}%` },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <p className="text-lg font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
