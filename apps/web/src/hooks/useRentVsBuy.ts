import { useState, useCallback } from 'react'
import { createApiClient } from '@finance-app/api-client'
import type { RentVsBuyRequest } from '@finance-app/shared-types'
import type { RentVsBuyResult } from '@finance-app/finance-engine'

interface UseRentVsBuyReturn {
  result: RentVsBuyResult | null
  isLoading: boolean
  error: string | null
  calculate: (request: RentVsBuyRequest) => Promise<void>
  reset: () => void
}

export function useRentVsBuy(accessToken: string | null): UseRentVsBuyReturn {
  const [result, setResult] = useState<RentVsBuyResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(
    async (request: RentVsBuyRequest) => {
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

        const response = await client.calculators.rentVsBuy(request)

        if (response.success && response.data) {
          setResult(response.data)
        } else {
          setError('Failed to calculate rent vs buy comparison')
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

  return {
    result,
    isLoading,
    error,
    calculate,
    reset,
  }
}
