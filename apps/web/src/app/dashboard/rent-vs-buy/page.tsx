'use client'

import { useEffect, useState } from 'react'
import { useRentVsBuy } from '@/hooks/useRentVsBuy'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import {
  RentVsBuyForm,
  RentVsBuySummary,
  RentVsBuyChart,
  YearlyComparisonTable,
} from '@/components/dashboard/rent-vs-buy'

export default function RentVsBuyPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { result, isLoading, error, calculate } = useRentVsBuy(accessToken)

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Rent vs Buy Calculator</h1>
        <ErrorState
          title="Not Authenticated"
          message="Please log in to use the rent vs buy calculator."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rent vs Buy Calculator</h1>
        <p className="text-muted-foreground mt-2">
          Compare the long-term financial impact of buying a home vs renting
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <RentVsBuyForm onCalculate={calculate} isLoading={isLoading} />

      {result && (
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold mb-6">Results</h2>
            <RentVsBuySummary result={result} />
          </div>

          <RentVsBuyChart result={result} />

          <YearlyComparisonTable result={result} />
        </div>
      )}
    </div>
  )
}
