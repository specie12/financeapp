'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { ScenarioProjectionResponse } from '@finance-app/shared-types'

interface UseScenarioProjectionReturn {
  projection: ScenarioProjectionResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useScenarioProjection(
  accessToken: string | null,
  scenarioId: string | null,
  horizonYears = 5,
): UseScenarioProjectionReturn {
  const [projection, setProjection] = useState<ScenarioProjectionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjection = useCallback(async () => {
    if (!accessToken || !scenarioId) {
      setProjection(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const response = await apiClient.scenarios.getProjection(scenarioId, horizonYears)
      setProjection(response.data)
    } catch (err) {
      console.error('Failed to fetch scenario projection:', err)
      setError('Failed to load projection')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, scenarioId, horizonYears])

  useEffect(() => {
    fetchProjection()
  }, [fetchProjection])

  return {
    projection,
    isLoading,
    error,
    refetch: fetchProjection,
  }
}
