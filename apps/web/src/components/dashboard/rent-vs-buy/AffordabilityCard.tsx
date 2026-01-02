'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { AffordabilityAnalysis } from '@finance-app/shared-types'

interface AffordabilityCardProps {
  affordability: AffordabilityAnalysis | null
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatPercent(percent: number): string {
  return `${percent.toFixed(1)}%`
}

function getPercentColor(percent: number, threshold: number): string {
  if (percent <= threshold * 0.8) return 'text-green-600'
  if (percent <= threshold) return 'text-yellow-600'
  return 'text-red-600'
}

export function AffordabilityCard({ affordability }: AffordabilityCardProps) {
  if (!affordability) {
    return (
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <CardHeader>
          <CardTitle className="text-lg">Affordability Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No income data available. Add your income sources during onboarding to see personalized
            affordability analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { buy, rent, thresholds, grossMonthlyIncomeCents, existingDebtPaymentsCents } =
    affordability

  const buyAffordable = buy.isHousingAffordable && buy.isTotalDebtAffordable
  const rentAffordable = rent.isAffordable

  return (
    <Card
      className={
        buyAffordable && rentAffordable
          ? 'border-green-500'
          : !buyAffordable && !rentAffordable
            ? 'border-red-500'
            : 'border-yellow-500'
      }
    >
      <CardHeader>
        <CardTitle className="text-lg">Affordability Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on your gross monthly income of {formatCurrency(grossMonthlyIncomeCents)}
          {existingDebtPaymentsCents > 0 &&
            ` and existing debt payments of ${formatCurrency(existingDebtPaymentsCents)}/mo`}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Buy Affordability */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            Mortgage Affordability
            {buyAffordable ? (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                Affordable
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                May be stretched
              </span>
            )}
          </h4>

          {/* Housing Cost Ratio */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Housing Cost Ratio</span>
              <span
                className={getPercentColor(
                  buy.housingCostPercent,
                  thresholds.housingCostMaxPercent,
                )}
              >
                {formatPercent(buy.housingCostPercent)} of income
              </span>
            </div>
            <div className="relative">
              <Progress value={Math.min(buy.housingCostPercent, 100)} className="h-2" />
              <div
                className="absolute top-0 h-2 w-0.5 bg-gray-400"
                style={{ left: `${thresholds.housingCostMaxPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Monthly: {formatCurrency(buy.monthlyHousingCostCents)}</span>
              <span>Recommended max: {thresholds.housingCostMaxPercent}%</span>
            </div>
          </div>

          {/* Total Debt Ratio */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Total Debt-to-Income</span>
              <span
                className={getPercentColor(buy.totalDebtPercent, thresholds.totalDebtMaxPercent)}
              >
                {formatPercent(buy.totalDebtPercent)} of income
              </span>
            </div>
            <div className="relative">
              <Progress value={Math.min(buy.totalDebtPercent, 100)} className="h-2" />
              <div
                className="absolute top-0 h-2 w-0.5 bg-gray-400"
                style={{ left: `${thresholds.totalDebtMaxPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Housing + existing debts</span>
              <span>Recommended max: {thresholds.totalDebtMaxPercent}%</span>
            </div>
          </div>

          {/* Max Affordable Home Price */}
          <div className="text-sm bg-muted/50 p-3 rounded-lg">
            <p>
              Based on your income, you could afford a home up to{' '}
              <span className="font-semibold">
                {formatCurrency(buy.maxAffordableHomePriceCents)}
              </span>
            </p>
          </div>
        </div>

        {/* Rent Affordability */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium flex items-center gap-2">
            Rent Affordability
            {rentAffordable ? (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                Affordable
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                May be stretched
              </span>
            )}
          </h4>

          {/* Rent Ratio */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Rent-to-Income Ratio</span>
              <span className={getPercentColor(rent.rentPercent, thresholds.rentMaxPercent)}>
                {formatPercent(rent.rentPercent)} of income
              </span>
            </div>
            <div className="relative">
              <Progress value={Math.min(rent.rentPercent, 100)} className="h-2" />
              <div
                className="absolute top-0 h-2 w-0.5 bg-gray-400"
                style={{ left: `${thresholds.rentMaxPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Monthly: {formatCurrency(rent.monthlyRentCents)}</span>
              <span>Recommended max: {thresholds.rentMaxPercent}%</span>
            </div>
          </div>

          {/* Max Affordable Rent */}
          <div className="text-sm bg-muted/50 p-3 rounded-lg">
            <p>
              Based on your income, you could afford rent up to{' '}
              <span className="font-semibold">
                {formatCurrency(rent.maxAffordableRentCents)}/mo
              </span>
            </p>
          </div>
        </div>

        {/* Warnings */}
        {(!buyAffordable || !rentAffordable) && (
          <div className="pt-4 border-t">
            <h4 className="font-medium text-amber-600 mb-2">Recommendations</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {!buy.isHousingAffordable && (
                <li>
                  Consider a lower home price (max {formatCurrency(buy.maxAffordableHomePriceCents)}
                  ), larger down payment, or longer loan term to reduce monthly payments.
                </li>
              )}
              {!buy.isTotalDebtAffordable && buy.isHousingAffordable && (
                <li>
                  Your existing debts plus the mortgage may strain your budget. Consider paying down
                  some debts first.
                </li>
              )}
              {!rent.isAffordable && (
                <li>
                  Consider finding a rental under {formatCurrency(rent.maxAffordableRentCents)}/mo
                  to stay within the recommended 30% threshold.
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
