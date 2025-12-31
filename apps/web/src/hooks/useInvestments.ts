'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { InvestmentsResponse } from '@/lib/dashboard/types'

interface UseInvestmentsReturn {
  data: InvestmentsResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useInvestments(accessToken: string | null): UseInvestmentsReturn {
  const [data, setData] = useState<InvestmentsResponse | null>(null)
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
      const response = await apiClient.dashboard.getInvestments()
      setData(response.data)
    } catch (err) {
      console.error('Failed to fetch investments:', err)
      setError('Failed to load investments data')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
