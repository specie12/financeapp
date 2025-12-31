'use client'

import { DashboardCard } from '../shared/DashboardCard'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import type { ScenarioComparisonItem } from '@/lib/dashboard/types'

interface ComparisonSummaryProps {
  comparisons: ScenarioComparisonItem[]
}

export function ComparisonSummary({ comparisons }: ComparisonSummaryProps) {
  if (comparisons.length === 0) {
    return null
  }

  // Find the best/worst for each metric
  const bestEndingNetWorth = Math.max(
    ...comparisons.map((c) => c.projection.summary.endingNetWorthCents),
  )
  const bestChange = Math.max(...comparisons.map((c) => c.projection.summary.netWorthChangeCents))

  return (
    <DashboardCard title="Summary Comparison" description="Key metrics across all scenarios">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 pr-4 font-medium">Scenario</th>
              <th className="text-right py-3 px-4 font-medium">Starting Net Worth</th>
              <th className="text-right py-3 px-4 font-medium">Ending Net Worth</th>
              <th className="text-right py-3 px-4 font-medium">Change</th>
              <th className="text-right py-3 px-4 font-medium">Change %</th>
              <th className="text-right py-3 px-4 font-medium">Total Income</th>
              <th className="text-right py-3 pl-4 font-medium">Total Expenses</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comparison) => {
              const { scenario, projection } = comparison
              const { summary } = projection

              const isBestEnding = summary.endingNetWorthCents === bestEndingNetWorth
              const isBestChange = summary.netWorthChangeCents === bestChange

              return (
                <tr key={scenario.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <span className="font-medium">{scenario.name}</span>
                    {scenario.isBaseline && (
                      <span className="text-xs text-muted-foreground ml-2">(baseline)</span>
                    )}
                  </td>
                  <td className="text-right py-3 px-4">
                    <MoneyDisplay cents={summary.startingNetWorthCents} compact />
                  </td>
                  <td
                    className={`text-right py-3 px-4 ${isBestEnding ? 'font-bold text-green-600' : ''}`}
                  >
                    <MoneyDisplay cents={summary.endingNetWorthCents} compact />
                  </td>
                  <td className={`text-right py-3 px-4 ${isBestChange ? 'font-bold' : ''}`}>
                    <MoneyDisplay cents={summary.netWorthChangeCents} compact showSign colorCode />
                  </td>
                  <td className="text-right py-3 px-4">
                    <span
                      className={
                        summary.netWorthChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {summary.netWorthChangePercent >= 0 ? '+' : ''}
                      {summary.netWorthChangePercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <MoneyDisplay cents={summary.totalIncomeOverPeriodCents} compact />
                  </td>
                  <td className="text-right py-3 pl-4">
                    <MoneyDisplay cents={summary.totalExpensesOverPeriodCents} compact />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Key Insights */}
      {comparisons.length > 1 && (
        <div className="mt-4 pt-4 border-t space-y-2">
          <p className="text-sm font-medium">Key Insights</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {comparisons.length > 0 && (
              <li>
                Best ending net worth:{' '}
                <span className="font-medium text-foreground">
                  {
                    comparisons.find(
                      (c) => c.projection.summary.endingNetWorthCents === bestEndingNetWorth,
                    )?.scenario.name
                  }
                </span>
                {' with '}
                <MoneyDisplay
                  cents={bestEndingNetWorth}
                  compact
                  className="font-medium text-foreground"
                />
              </li>
            )}
            {comparisons.length > 0 && (
              <li>
                Largest improvement:{' '}
                <span className="font-medium text-foreground">
                  {
                    comparisons.find((c) => c.projection.summary.netWorthChangeCents === bestChange)
                      ?.scenario.name
                  }
                </span>
                {' with '}
                <MoneyDisplay
                  cents={bestChange}
                  compact
                  showSign
                  colorCode
                  className="font-medium"
                />
              </li>
            )}
          </ul>
        </div>
      )}
    </DashboardCard>
  )
}
