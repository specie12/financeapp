'use client'

import { useEffect, useState } from 'react'
import { useInvestments } from '@/hooks/useInvestments'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import { PortfolioSummary, HoldingsList, AllocationChart } from '@/components/dashboard/investments'

export default function InvestmentsPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { data, isLoading, error, refetch } = useInvestments(accessToken)

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Investments</h1>
        <ErrorState
          title="Not Authenticated"
          message="Please log in to view your investments dashboard."
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Investments</h1>
        <LoadingState message="Loading investments data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Investments</h1>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Investments</h1>
        <p className="text-muted-foreground">No data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Investments</h1>

      <PortfolioSummary summary={data.summary} holdingCount={data.holdings.length} />

      {data.holdings.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No investment holdings recorded yet. Add investment or retirement account assets during
          onboarding to see them here.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HoldingsList holdings={data.holdings} />
          <AllocationChart holdings={data.holdings} />
        </div>
      )}
    </div>
  )
}
