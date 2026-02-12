'use client'

import { useEffect, useState } from 'react'
import { useTaxProfile } from '@/hooks/useTaxProfile'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import {
  TaxProfileForm,
  TaxSummaryCard,
  TaxBracketChart,
  DeductionEstimator,
} from '@/components/dashboard/tax'

export default function TaxPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { summary, profile, isLoading, error, upsertProfile } = useTaxProfile(accessToken)

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Tax Planning</h1>
        <ErrorState
          title="Not Authenticated"
          message="Please log in to view your tax information."
        />
      </div>
    )
  }

  if (error === 'Tax features require a Premium plan') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Tax Planning</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
          <p className="text-muted-foreground max-w-sm">
            Tax planning tools including bracket analysis, deduction estimator, and capital gains
            calculator are available on the Premium plan.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tax Planning</h1>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading tax data...</div>
      ) : error ? (
        <ErrorState title="Error" message={error} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaxProfileForm profile={profile} onSubmit={upsertProfile} />

          {summary && (
            <>
              <TaxSummaryCard summary={summary} />
              <TaxBracketChart
                brackets={summary.brackets}
                taxableIncomeCents={summary.taxableIncomeCents}
              />
              <DeductionEstimator summary={summary} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
