'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useLoanAmortization } from '@/hooks/useLoanAmortization'
import { useLoanOptimization } from '@/hooks/useLoanOptimization'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import { StatCard } from '@/components/dashboard/shared/StatCard'
import { AmortizationTable, LoanOptimizationPanel } from '@/components/dashboard/loans'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  formatCents,
  formatPercentPlain,
  formatDateMedium,
  getLiabilityTypeLabel,
} from '@/lib/dashboard/formatters'

export default function LoanDetailPage() {
  const params = useParams()
  const loanId = params.id as string
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { data, isLoading, error, refetch } = useLoanAmortization(accessToken, loanId)
  const { simulate } = useLoanOptimization(accessToken)

  const handleSimulate = useCallback(
    async (
      id: string,
      request: {
        extraMonthlyPaymentCents: number
        oneTimePaymentCents: number
        oneTimePaymentMonth: number
        useBiweekly: boolean
      },
    ) => {
      return simulate(id, request)
    },
    [simulate],
  )

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <ErrorState title="Not Authenticated" message="Please log in to view loan details." />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState message="Loading amortization schedule..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/loans">
          <Button variant="ghost" size="sm">
            &larr; Back to Loans
          </Button>
        </Link>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/loans">
          <Button variant="ghost" size="sm">
            &larr; Back to Loans
          </Button>
        </Link>
        <p className="text-muted-foreground">Loan not found.</p>
      </div>
    )
  }

  const {
    loan,
    schedule,
    monthlyPaymentCents,
    totalPaymentsCents,
    totalInterestCents,
    payoffDate,
  } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/loans">
          <Button variant="ghost" size="sm">
            &larr; Back to Loans
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{loan.name}</h1>
        <p className="text-muted-foreground">{getLiabilityTypeLabel(loan.type)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Balance"
          value={formatCents(loan.currentBalanceCents)}
          subtitle={`of ${formatCents(loan.principalCents)} principal`}
        />
        <StatCard
          title="Monthly Payment"
          value={formatCents(monthlyPaymentCents)}
          subtitle={`${formatPercentPlain(loan.interestRatePercent)} APR`}
        />
        <StatCard
          title="Total Interest"
          value={formatCents(totalInterestCents)}
          subtitle={`over ${schedule.length} payments`}
        />
        <StatCard
          title="Payoff Date"
          value={formatDateMedium(payoffDate)}
          subtitle={`${schedule.length} months remaining`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Total Payments"
          value={formatCents(totalPaymentsCents)}
          subtitle="Principal + Interest"
        />
        <StatCard
          title="Interest Cost"
          value={formatPercentPlain((totalInterestCents / loan.currentBalanceCents) * 100)}
          subtitle="of principal as interest"
        />
      </div>

      <Tabs defaultValue="optimize" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="optimize">Optimize Payoff</TabsTrigger>
          <TabsTrigger value="schedule">Full Schedule</TabsTrigger>
        </TabsList>
        <TabsContent value="optimize" className="mt-6">
          <LoanOptimizationPanel loan={loan} onSimulate={handleSimulate} />
        </TabsContent>
        <TabsContent value="schedule" className="mt-6">
          <AmortizationTable schedule={schedule} monthlyPaymentCents={monthlyPaymentCents} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
