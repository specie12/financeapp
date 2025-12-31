'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { LoansResponse } from '@/lib/dashboard/types'

interface UseLoansReturn {
  data: LoansResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useLoans(accessToken: string | null): UseLoansReturn {
  const [data, setData] = useState<LoansResponse | null>(null)
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
      const response = await apiClient.dashboard.getLoans()
      setData(response.data)
    } catch (err) {
      console.error('Failed to fetch loans:', err)
      setError('Failed to load loans data')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
