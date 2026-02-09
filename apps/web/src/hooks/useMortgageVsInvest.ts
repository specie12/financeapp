import { useState, useCallback } from 'react'
import { createApiClient } from '@finance-app/api-client'
import type { MortgageVsInvestRequest, MortgageVsInvestResult } from '@finance-app/shared-types'

interface UseMortgageVsInvestReturn {
  result: MortgageVsInvestResult | null
  isLoading: boolean
  error: string | null
  calculate: (request: MortgageVsInvestRequest) => Promise<void>
  reset: () => void
}

export function useMortgageVsInvest(accessToken: string | null): UseMortgageVsInvestReturn {
  const [result, setResult] = useState<MortgageVsInvestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(
    async (request: MortgageVsInvestRequest) => {
      if (!accessToken) {
        setError('Not authenticated')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const client = createApiClient({
          baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        })
        client.setAccessToken(accessToken)

        const response = await client.calculators.mortgageVsInvest(request)

        if (response.success && response.data) {
          setResult(response.data)
        } else {
          setError('Failed to calculate mortgage vs invest comparison')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [accessToken],
  )

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, isLoading, error, calculate, reset }
}
