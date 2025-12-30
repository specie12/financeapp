'use client'

import { StatCard } from '../shared/StatCard'
import { formatCents, formatPercentPlain } from '@/lib/dashboard/formatters'
import type { LoanSummary } from '@/lib/dashboard/types'

interface LoansSummaryProps {
  summary: LoanSummary
}

export function LoansSummary({ summary }: LoansSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Outstanding"
        value={formatCents(summary.totalOutstandingCents)}
        subtitle={`${summary.loanCount} ${summary.loanCount === 1 ? 'loan' : 'loans'}`}
      />
      <StatCard
        title="Monthly Payment"
        value={formatCents(summary.totalMonthlyPaymentCents)}
        subtitle="Combined minimum"
      />
      <StatCard
        title="Average Rate"
        value={formatPercentPlain(summary.averageInterestRatePercent)}
        subtitle="Weighted average"
      />
      <StatCard title="Loans" value={summary.loanCount.toString()} subtitle="Active accounts" />
    </div>
  )
}
