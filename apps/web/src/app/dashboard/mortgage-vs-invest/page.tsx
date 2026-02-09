'use client'

import { useEffect, useState } from 'react'
import { useMortgageVsInvest } from '@/hooks/useMortgageVsInvest'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import {
  MortgageVsInvestForm,
  ComparisonSummary,
  ComparisonChart,
} from '@/components/dashboard/mortgage-vs-invest'

export default function MortgageVsInvestPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { result, isLoading, error, calculate } = useMortgageVsInvest(accessToken)

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Mortgage vs Invest</h1>
        <ErrorState
          title="Not Authenticated"
          message="Please log in to use the mortgage vs invest calculator."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mortgage vs Invest</h1>
        <p className="text-muted-foreground mt-2">
          Compare paying extra on your mortgage vs investing the difference
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <MortgageVsInvestForm onCalculate={calculate} isLoading={isLoading} />

      {result && (
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold mb-6">Results</h2>
            <ComparisonSummary result={result} />
          </div>

          <ComparisonChart result={result} />
        </div>
      )}
    </div>
  )
}
