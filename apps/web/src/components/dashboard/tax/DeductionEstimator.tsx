'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TaxSummaryResponse } from '@finance-app/shared-types'

interface DeductionEstimatorProps {
  summary: TaxSummaryResponse
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function DeductionEstimator({ summary }: DeductionEstimatorProps) {
  const totalItemized =
    summary.deductions.mortgageInterestCents + summary.deductions.propertyTaxCents
  const shouldItemize = totalItemized > summary.standardDeductionCents
  const savings = shouldItemize ? totalItemized - summary.standardDeductionCents : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Deduction Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground uppercase">Standard Deduction</p>
              <p className="text-lg font-bold">{formatDollars(summary.standardDeductionCents)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground uppercase">Itemized Total</p>
              <p className="text-lg font-bold">{formatDollars(totalItemized)}</p>
            </div>
          </div>

          <div
            className={`p-3 rounded-lg border-2 ${
              shouldItemize ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-muted'
            }`}
          >
            {shouldItemize ? (
              <>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Itemizing could save you {formatDollars(savings)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your itemized deductions exceed the standard deduction. Consider itemizing to
                  reduce your tax liability.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold">Standard deduction is better</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your standard deduction is higher than your itemized deductions. Take the standard
                  deduction for maximum tax benefit.
                </p>
              </>
            )}
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Itemizable Deductions from Your Data</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mortgage Interest</span>
                <span>{formatDollars(summary.deductions.mortgageInterestCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property Taxes</span>
                <span>{formatDollars(summary.deductions.propertyTaxCents)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
