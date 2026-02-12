'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TaxBracketInfo } from '@finance-app/shared-types'

interface TaxBracketChartProps {
  brackets: TaxBracketInfo[]
  taxableIncomeCents: number
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function TaxBracketChart({ brackets, taxableIncomeCents }: TaxBracketChartProps) {
  const maxTax = Math.max(...brackets.map((b) => b.taxInBracket), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tax Bracket Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {brackets.map((bracket, index) => {
            const isActive = taxableIncomeCents > bracket.min
            const widthPercent = maxTax > 0 ? (bracket.taxInBracket / maxTax) * 100 : 0

            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={isActive ? 'font-medium' : 'text-muted-foreground'}>
                    {bracket.rate}% ({formatDollars(bracket.min)}
                    {bracket.max ? ` - ${formatDollars(bracket.max)}` : '+'})
                  </span>
                  <span className={isActive ? 'font-semibold' : 'text-muted-foreground'}>
                    {formatDollars(bracket.taxInBracket)}
                  </span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isActive ? 'bg-primary' : 'bg-muted-foreground/20'
                    }`}
                    style={{ width: `${Math.max(widthPercent, 0)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
