'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DisclosureBadge, DisclosurePanel } from '@/components/dashboard/shared'
import { buildMortgageVsInvestDisclosure } from './disclosure'
import type { MortgageVsInvestRequest, MortgageVsInvestResult } from '@finance-app/shared-types'

interface ComparisonSummaryProps {
  result: MortgageVsInvestResult
  request: MortgageVsInvestRequest
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function ComparisonSummary({ result, request }: ComparisonSummaryProps) {
  const { payExtraSummary, investSummary, recommendation, breakEvenReturnPercent } = result

  const recommendationText = {
    invest: 'Under these assumptions, investing the extra money projects to a higher net result',
    pay_extra: 'Under these assumptions, paying down the mortgage projects to a higher net result',
    neutral: 'Under these assumptions, the two strategies produce similar projected outcomes',
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
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Projected Recommendation</CardTitle>
            <DisclosureBadge kind="projection" />
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-lg font-semibold ${recommendationColor[recommendation]}`}>
            {recommendationText[recommendation]}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Break-even investment return:{' '}
            <span className="font-mono">{breakEvenReturnPercent}%</span> — at this return rate the
            two strategies tie. Above it, investing wins; below, paying extra wins. (Calculated
            against the rest of your inputs.)
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

      <DisclosurePanel payload={buildMortgageVsInvestDisclosure(request, result)} />
    </div>
  )
}
