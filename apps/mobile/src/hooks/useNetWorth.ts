import { useState, useEffect, useCallback } from 'react'
import type { NetWorthResponse } from '@finance-app/shared-types'
import { getApiClient } from '../lib/api'

interface UseNetWorthReturn {
  data: NetWorthResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useNetWorth(horizonYears = 5): UseNetWorthReturn {
  const [data, setData] = useState<NetWorthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const apiClient = await getApiClient()
      const response = await apiClient.dashboard.getNetWorth(horizonYears)
      setData(response.data)
    } catch (err) {
      console.error('Failed to fetch net worth:', err)
      setError('Failed to load net worth data')
    } finally {
      setIsLoading(false)
    }
  }, [horizonYears])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}
