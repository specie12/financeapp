'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TaxSummaryResponse } from '@finance-app/shared-types'

interface TaxSummaryCardProps {
  summary: TaxSummaryResponse
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const filingStatusLabels: Record<string, string> = {
  single: 'Single',
  married_filing_jointly: 'Married Filing Jointly',
  married_filing_separately: 'Married Filing Separately',
  head_of_household: 'Head of Household',
}

export function TaxSummaryCard({ summary }: TaxSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{summary.taxYear} Tax Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Filing Status</p>
              <p className="text-lg font-semibold">
                {filingStatusLabels[summary.filingStatus] || summary.filingStatus}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Gross Income</p>
              <p className="text-lg font-semibold">
                {formatDollars(summary.estimatedGrossIncomeCents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Standard Deduction</p>
              <p className="text-lg font-semibold">
                {formatDollars(summary.standardDeductionCents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxable Income</p>
              <p className="text-lg font-semibold">{formatDollars(summary.taxableIncomeCents)}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Estimated Tax</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatDollars(summary.estimatedTaxLiabilityCents)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Effective Rate</p>
                <p className="text-2xl font-bold">{summary.effectiveTaxRatePercent}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Marginal Rate</p>
                <p className="text-2xl font-bold">{summary.marginalTaxRatePercent}%</p>
              </div>
            </div>
          </div>

          {/* Deductions */}
          {(summary.deductions.mortgageInterestCents > 0 ||
            summary.deductions.propertyTaxCents > 0) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Potential Deductions</h4>
              <div className="space-y-1 text-sm">
                {summary.deductions.mortgageInterestCents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mortgage Interest</span>
                    <span>{formatDollars(summary.deductions.mortgageInterestCents)}</span>
                  </div>
                )}
                {summary.deductions.propertyTaxCents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property Tax</span>
                    <span>{formatDollars(summary.deductions.propertyTaxCents)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
