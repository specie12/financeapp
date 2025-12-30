'use client'

import { useEffect, useState } from 'react'
import { useLoans } from '@/hooks/useLoans'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import { LoansSummary, LoanCard } from '@/components/dashboard/loans'

export default function LoansPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { data, isLoading, error, refetch } = useLoans(accessToken)

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Loans</h1>
        <ErrorState
          title="Not Authenticated"
          message="Please log in to view your loans dashboard."
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Loans</h1>
        <LoadingState message="Loading loans data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Loans</h1>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Loans</h1>
        <p className="text-muted-foreground">No data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Loans</h1>

      <LoansSummary summary={data.summary} />

      {data.loans.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No loans recorded yet. Add liabilities during onboarding to see them here.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      )}
    </div>
  )
}
