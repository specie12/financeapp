'use client'

import { useState, useEffect, useCallback } from 'react'
import { createApiClient } from '@finance-app/api-client'
import type { NetWorthResponse } from '@/lib/dashboard/types'

interface UseNetWorthReturn {
  data: NetWorthResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useNetWorth(accessToken: string | null, horizonYears = 5): UseNetWorthReturn {
  const [data, setData] = useState<NetWorthResponse | null>(null)
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
      const apiClient = createApiClient({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      })
      apiClient.setAccessToken(accessToken)

      const response = await apiClient.dashboard.getNetWorth(horizonYears)
      setData(response.data)
    } catch (err) {
      console.error('Failed to fetch net worth:', err)
      setError('Failed to load net worth data')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, horizonYears])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
