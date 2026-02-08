'use client'

import { useEffect, useState } from 'react'
import { useBudgetStatus } from '@/hooks/useBudgetStatus'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import {
  BudgetOverview,
  BudgetCategoryCard,
  SpendingByCategoryChart,
} from '@/components/dashboard/budget'

export default function BudgetPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { data, isLoading, error, refetch } = useBudgetStatus(accessToken)

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Budget</h1>
        <ErrorState
          title="Not Authenticated"
          message="Please log in to view your budget dashboard."
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Budget</h1>
        <LoadingState message="Loading budget data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Budget</h1>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Budget</h1>
        <p className="text-muted-foreground">No data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Budget</h1>

      <BudgetOverview data={data} />

      {data.budgets.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No budgets set up yet. Create categories and budgets to start tracking your spending.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetCategoryCard budgets={data.budgets} />
          <SpendingByCategoryChart budgets={data.budgets} />
        </div>
      )}
    </div>
  )
}
