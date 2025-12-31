'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RentVsBuyResult } from '@finance-app/finance-engine'

interface RentVsBuySummaryProps {
  result: RentVsBuyResult
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function RentVsBuySummary({ result }: RentVsBuySummaryProps) {
  const { summary } = result
  const isBuyBetter = summary.recommendation === 'buy'
  const isRentBetter = summary.recommendation === 'rent'

  return (
    <div className="space-y-6">
      {/* Main Recommendation */}
      <Card
        className={
          isBuyBetter
            ? 'border-green-500 bg-green-50 dark:bg-green-950'
            : isRentBetter
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
        }
      >
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isBuyBetter
              ? 'Buying is better for you'
              : isRentBetter
                ? 'Renting is better for you'
                : 'It&apos;s a close call'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-lg text-muted-foreground">
            After {result.input.projectionYears} years, your net worth would be{' '}
            <span className="font-bold">
              {formatCurrency(Math.abs(summary.netWorthAdvantageCents))}
            </span>{' '}
            {isBuyBetter
              ? 'higher if you buy'
              : isRentBetter
                ? 'higher if you rent'
                : 'about the same'}
          </p>
          {summary.breakEvenYear && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Break-even point: Year {summary.breakEvenYear}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Buy Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.finalBuyNetWorthCents)}
            </p>
            <p className="text-xs text-muted-foreground">Home equity after selling costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rent Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.finalRentNetWorthCents)}
            </p>
            <p className="text-xs text-muted-foreground">Investment portfolio value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Buy Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalBuyCostsCents)}</p>
            <p className="text-xs text-muted-foreground">Including down payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Rent Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalRentCostsCents)}</p>
            <p className="text-xs text-muted-foreground">
              Over {result.input.projectionYears} years
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">If You Buy:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  Total mortgage interest paid:{' '}
                  {formatCurrency(summary.totalMortgageInterestPaidCents)}
                </li>
                <li>
                  Total property taxes paid: {formatCurrency(summary.totalPropertyTaxesPaidCents)}
                </li>
                <li>
                  Total maintenance costs: {formatCurrency(summary.totalMaintenancePaidCents)}
                </li>
                <li>
                  Tax savings from interest deduction:{' '}
                  {formatCurrency(summary.totalTaxSavingsCents)}
                </li>
                <li>Final home equity: {formatCurrency(summary.finalHomeEquityCents)}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">If You Rent:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Total rent paid: {formatCurrency(summary.totalRentPaidCents)}</li>
                <li>Investment gains: {formatCurrency(summary.totalInvestmentGainsCents)}</li>
                <li>
                  Final investment balance: {formatCurrency(summary.finalInvestmentBalanceCents)}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
