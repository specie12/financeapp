'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import type { LoanSimulationSavings, LoanSimulationSummary } from '@finance-app/shared-types'

interface InterestSavingsCardProps {
  savings: LoanSimulationSavings
  original: LoanSimulationSummary
  modified: LoanSimulationSummary
}

export function InterestSavingsCard({ savings, original, modified }: InterestSavingsCardProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const yearsAndMonths = (months: number) => {
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (years === 0) return `${remainingMonths} months`
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`
    return `${years}y ${remainingMonths}m`
  }

  const hasSavings = savings.interestSavedCents > 0 || savings.monthsSaved > 0

  return (
    <Card className={hasSavings ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {hasSavings ? (
            <>
              <span className="text-green-600">Your Savings</span>
            </>
          ) : (
            'Payoff Summary'
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasSavings ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Interest Saved</p>
                <p className="text-2xl font-bold text-green-600">
                  <MoneyDisplay cents={savings.interestSavedCents} />
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Saved</p>
                <p className="text-2xl font-bold text-green-600">
                  {yearsAndMonths(savings.monthsSaved)}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Original Payoff</span>
                <span>{formatDate(original.payoffDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Payoff</span>
                <span className="font-medium text-green-600">
                  {formatDate(modified.payoffDate)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Interest (Original)</span>
                <span>
                  <MoneyDisplay cents={original.totalInterestCents} />
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Interest (New)</span>
                <span className="font-medium text-green-600">
                  <MoneyDisplay cents={modified.totalInterestCents} />
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payoff Date</span>
              <span>{formatDate(original.payoffDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Interest</span>
              <span>
                <MoneyDisplay cents={original.totalInterestCents} />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Payments</span>
              <span>
                <MoneyDisplay cents={original.totalPaymentsCents} />
              </span>
            </div>
            <p className="text-muted-foreground pt-2 text-xs">
              Adjust the extra payment options above to see potential savings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
