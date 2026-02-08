'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { BudgetStatusResponse } from '@finance-app/shared-types'

interface UseBudgetStatusReturn {
  data: BudgetStatusResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useBudgetStatus(
  accessToken: string | null,
  period?: string,
): UseBudgetStatusReturn {
  const [data, setData] = useState<BudgetStatusResponse | null>(null)
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
      const response = await apiClient.dashboard.getBudgetStatus(period)
      if (response.success) {
        setData(response.data)
      } else {
        setError('Failed to fetch budget status')
      }
    } catch (err) {
      console.error('Failed to fetch budget status:', err)
      setError('Failed to load budget status')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
