'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MortgageVsInvestResult } from '@finance-app/shared-types'

interface ComparisonSummaryProps {
  result: MortgageVsInvestResult
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function ComparisonSummary({ result }: ComparisonSummaryProps) {
  const { payExtraSummary, investSummary, recommendation, breakEvenReturnPercent } = result

  const recommendationText = {
    invest: 'Investing the extra money is projected to be more profitable',
    pay_extra: 'Paying down the mortgage saves more money overall',
    neutral: 'Both strategies produce similar outcomes',
  }

  const recommendationColor = {
    invest: 'text-blue-600',
    pay_extra: 'text-green-600',
    neutral: 'text-gray-600',
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recommendation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-lg font-semibold ${recommendationColor[recommendation]}`}>
            {recommendationText[recommendation]}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Breakeven investment return: {breakEvenReturnPercent}% — above this rate, investing
            wins.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pay Extra on Mortgage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Interest Saved</span>
              <span className="font-semibold text-green-600">
                {formatDollars(payExtraSummary.interestSavedCents)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Months Saved</span>
              <span className="font-semibold">{payExtraSummary.monthsSaved}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Original Payoff</span>
              <span className="text-sm">
                {Math.floor(payExtraSummary.originalPayoffMonths / 12)}y{' '}
                {payExtraSummary.originalPayoffMonths % 12}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">New Payoff</span>
              <span className="text-sm">
                {Math.floor(payExtraSummary.newPayoffMonths / 12)}y{' '}
                {payExtraSummary.newPayoffMonths % 12}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Interest (Original)</span>
              <span className="text-sm">
                {formatDollars(payExtraSummary.totalInterestWithoutExtraCents)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Interest (With Extra)</span>
              <span className="text-sm">
                {formatDollars(payExtraSummary.totalInterestWithExtraCents)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Invest the Difference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Contributed</span>
              <span className="font-semibold">
                {formatDollars(investSummary.totalContributedCents)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Portfolio Value</span>
              <span className="font-semibold text-blue-600">
                {formatDollars(investSummary.finalPortfolioValueCents)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Gain</span>
              <span className="text-sm">{formatDollars(investSummary.totalGainCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">After-Tax Gain</span>
              <span className="text-sm">{formatDollars(investSummary.afterTaxGainCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">After-Tax Portfolio</span>
              <span className="text-sm">
                {formatDollars(investSummary.afterTaxPortfolioValueCents)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
