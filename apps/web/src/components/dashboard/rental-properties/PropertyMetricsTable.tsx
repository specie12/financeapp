'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RentalPropertyMetrics } from '@finance-app/shared-types'

interface PropertyMetricsTableProps {
  properties: RentalPropertyMetrics[]
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function PropertyMetricsTable({ properties }: PropertyMetricsTableProps) {
  if (properties.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Property Metrics Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Property</th>
                <th className="text-right py-2 px-2">Value</th>
                <th className="text-right py-2 px-2">Monthly Rent</th>
                <th className="text-right py-2 px-2">NOI</th>
                <th className="text-right py-2 px-2">Cap Rate</th>
                <th className="text-right py-2 px-2">Cash-on-Cash</th>
                <th className="text-right py-2 px-2">GRM</th>
                <th className="text-right py-2 pl-2">DSCR</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((m) => (
                <tr key={m.property.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{m.property.name}</td>
                  <td className="text-right py-2 px-2">
                    {formatDollars(m.property.currentValueCents)}
                  </td>
                  <td className="text-right py-2 px-2">
                    {formatDollars(m.property.monthlyRentCents)}
                  </td>
                  <td className="text-right py-2 px-2">{formatDollars(m.noiCents)}</td>
                  <td className="text-right py-2 px-2">{m.capRatePercent}%</td>
                  <td className="text-right py-2 px-2">{m.cashOnCashReturnPercent}%</td>
                  <td className="text-right py-2 px-2">{m.grossRentMultiplier}x</td>
                  <td className="text-right py-2 pl-2">
                    {m.dscrRatio !== null ? `${m.dscrRatio}x` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
