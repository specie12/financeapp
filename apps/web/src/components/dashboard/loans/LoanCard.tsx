'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import {
  getLiabilityTypeLabel,
  formatPercentPlain,
  formatDateShort,
} from '@/lib/dashboard/formatters'
import type { LoanDetail } from '@/lib/dashboard/types'

interface LoanCardProps {
  loan: LoanDetail
}

export function LoanCard({ loan }: LoanCardProps) {
  // Calculate payoff progress
  const paidOffPercent =
    loan.principalCents > 0
      ? ((loan.principalCents - loan.currentBalanceCents) / loan.principalCents) * 100
      : 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{loan.name}</h3>
            <p className="text-sm text-muted-foreground">{getLiabilityTypeLabel(loan.type)}</p>
          </div>
          <Link href={`/dashboard/loans/${loan.id}`}>
            <Button variant="outline" size="sm">
              View Schedule
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-xl font-semibold">
                <MoneyDisplay cents={loan.currentBalanceCents} />
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Original Principal</p>
              <p className="text-xl font-semibold">
                <MoneyDisplay cents={loan.principalCents} />
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Progress</span>
              <span className="font-medium">{paidOffPercent.toFixed(1)}% paid</span>
            </div>
            <Progress value={paidOffPercent} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Interest Rate</p>
              <p className="font-medium">{formatPercentPlain(loan.interestRatePercent)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Min Payment</p>
              <p className="font-medium">
                <MoneyDisplay cents={loan.minimumPaymentCents} />
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. Payoff</p>
              <p className="font-medium">
                {loan.estimatedPayoffDate ? formatDateShort(loan.estimatedPayoffDate) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
