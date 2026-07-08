'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { MonteCarloNetWorthResponse } from '@/lib/dashboard/types'

interface UseNetWorthMonteCarloReturn {
  data: MonteCarloNetWorthResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useNetWorthMonteCarlo(
  accessToken: string | null,
  horizonYears = 5,
): UseNetWorthMonteCarloReturn {
  const [data, setData] = useState<MonteCarloNetWorthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const response = await apiClient.dashboard.getNetWorthMonteCarlo({ horizonYears })
      setData(response.data)
    } catch (err) {
      console.error('Failed to fetch Monte Carlo projection:', err)
      setError('Failed to load Monte Carlo projection')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, horizonYears])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
