'use client'

import { useState, useCallback } from 'react'
import { createApiClient } from '@finance-app/api-client'
import type { ScenarioComparisonResponse } from '@finance-app/shared-types'

interface UseScenarioComparisonReturn {
  comparison: ScenarioComparisonResponse | null
  isLoading: boolean
  error: string | null
  compare: (scenarioIds: string[], horizonYears?: number) => Promise<void>
  clear: () => void
}

export function useScenarioComparison(accessToken: string | null): UseScenarioComparisonReturn {
  const [comparison, setComparison] = useState<ScenarioComparisonResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compare = useCallback(
    async (scenarioIds: string[], horizonYears = 5): Promise<void> => {
      if (!accessToken) {
        setError('Not authenticated')
        return
      }

      if (scenarioIds.length === 0) {
        setError('Please select at least one scenario')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const apiClient = createApiClient({
          baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        })
        apiClient.setAccessToken(accessToken)

        const response = await apiClient.scenarios.compare(scenarioIds, horizonYears)
        setComparison(response.data)
      } catch (err) {
        console.error('Failed to compare scenarios:', err)
        setError('Failed to compare scenarios')
      } finally {
        setIsLoading(false)
      }
    },
    [accessToken],
  )

  const clear = useCallback(() => {
    setComparison(null)
    setError(null)
  }, [])

  return {
    comparison,
    isLoading,
    error,
    compare,
    clear,
  }
}
