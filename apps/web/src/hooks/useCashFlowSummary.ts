'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { CashFlowSummaryResponse } from '@finance-app/shared-types'

interface UseCashFlowSummaryReturn {
  data: CashFlowSummaryResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useCashFlowSummary(accessToken: string | null): UseCashFlowSummaryReturn {
  const [data, setData] = useState<CashFlowSummaryResponse | null>(null)
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
      const response = await apiClient.dashboard.getCashFlow()
      if (response.success) {
        setData(response.data)
      } else {
        setError('Failed to fetch cash flow data')
      }
    } catch (err) {
      console.error('Failed to fetch cash flow:', err)
      setError('Failed to load cash flow data')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
