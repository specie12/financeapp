'use client'

import { useEffect, useState } from 'react'
import { useCashFlowSummary } from '@/hooks/useCashFlowSummary'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import {
  CashFlowSummaryCards,
  CashFlowBreakdown,
  CashFlowChart,
} from '@/components/dashboard/cash-flow'

export default function CashFlowPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { data, isLoading, error, refetch } = useCashFlowSummary(accessToken)

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Cash Flow</h1>
        <ErrorState title="Not Authenticated" message="Please log in to view your cash flow." />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Cash Flow</h1>
        <LoadingState message="Loading cash flow data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Cash Flow</h1>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Cash Flow</h1>
        <p className="text-muted-foreground">No data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Cash Flow</h1>

      <CashFlowSummaryCards data={data} />

      {data.items.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No cash flow items recorded yet. Add income and expense items to see your cash flow
          analysis.
        </p>
      ) : (
        <>
          <CashFlowChart data={data} />
          <CashFlowBreakdown items={data.items} />
        </>
      )}
    </div>
  )
}
