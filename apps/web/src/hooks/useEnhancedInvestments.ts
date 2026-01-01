'use client'

import { useCallback, useEffect, useState } from 'react'
import { createApiClient } from '@finance-app/api-client'
import type { EnhancedInvestmentsResponse } from '@finance-app/shared-types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function useEnhancedInvestments(accessToken: string | null) {
  const [data, setData] = useState<EnhancedInvestmentsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setError('Not authenticated')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const client = createApiClient({
        baseURL: API_URL,
      })

      client.setAccessToken(accessToken)

      const response = await client.dashboard.getEnhancedInvestments()

      if (response.success) {
        setData(response.data)
      } else {
        setError('Failed to fetch enhanced investments data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      fetchData()
    }
  }, [accessToken, fetchData])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}
