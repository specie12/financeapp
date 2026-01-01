'use client'

import { useCallback, useState } from 'react'
import { createApiClient } from '@finance-app/api-client'
import type { LoanSimulationRequest, LoanSimulationResponse } from '@finance-app/shared-types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function useLoanOptimization(accessToken: string | null) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const simulate = useCallback(
    async (loanId: string, request: LoanSimulationRequest): Promise<LoanSimulationResponse> => {
      if (!accessToken) {
        throw new Error('Not authenticated')
      }

      setIsLoading(true)
      setError(null)

      try {
        const client = createApiClient({
          baseURL: API_URL,
        })

        // Set token
        client.setAccessToken(accessToken)

        const response = await client.dashboard.simulateLoanPayoff(loanId, request)

        if (!response.success) {
          throw new Error('Simulation failed')
        }

        return response.data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to simulate payoff'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [accessToken],
  )

  return {
    simulate,
    isLoading,
    error,
  }
}
