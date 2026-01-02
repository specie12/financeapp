'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { RentVsBuyResultWithAffordability } from '@finance-app/shared-types'

interface YearlyComparisonTableProps {
  result: RentVsBuyResultWithAffordability
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function YearlyComparisonTable({ result }: YearlyComparisonTableProps) {
  const [showAll, setShowAll] = useState(false)
  const { yearlyComparisons } = result.calculation

  const displayedYears = showAll ? yearlyComparisons : yearlyComparisons.slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Year-by-Year Breakdown</CardTitle>
        <CardDescription>Detailed comparison for each year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-2 text-left font-medium">Year</th>
                <th className="py-3 px-2 text-right font-medium text-green-600">Buy Net Worth</th>
                <th className="py-3 px-2 text-right font-medium text-blue-600">Rent Net Worth</th>
                <th className="py-3 px-2 text-right font-medium">Buy Annual Cost</th>
                <th className="py-3 px-2 text-right font-medium">Rent Annual Cost</th>
                <th className="py-3 px-2 text-center font-medium">Better</th>
              </tr>
            </thead>
            <tbody>
              {displayedYears.map((comparison) => (
                <tr key={comparison.year} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-2">Year {comparison.year}</td>
                  <td className="py-3 px-2 text-right font-mono text-green-600">
                    {formatCurrency(comparison.buyNetWorthCents)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-blue-600">
                    {formatCurrency(comparison.rentNetWorthCents)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono">
                    {formatCurrency(comparison.buyAnnualCostCents)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono">
                    {formatCurrency(comparison.rentAnnualCostCents)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        comparison.buyIsBetterThisYear
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      }`}
                    >
                      {comparison.buyIsBetterThisYear ? 'Buy' : 'Rent'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {yearlyComparisons.length > 6 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show Less' : `Show All ${yearlyComparisons.length} Years`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
