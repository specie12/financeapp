import { useState, useEffect, useCallback } from 'react'
import type { ScenarioProjectionResponse } from '@finance-app/shared-types'
import { getApiClient } from '../lib/api'

interface UseScenarioProjectionReturn {
  projection: ScenarioProjectionResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useScenarioProjection(
  scenarioId: string | null,
  horizonYears = 5,
): UseScenarioProjectionReturn {
  const [projection, setProjection] = useState<ScenarioProjectionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!scenarioId) {
      setProjection(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const apiClient = await getApiClient()
      const response = await apiClient.scenarios.getProjection(scenarioId, horizonYears)
      setProjection(response.data)
    } catch (err) {
      console.error('Failed to fetch scenario projection:', err)
      setError('Failed to load projection')
    } finally {
      setIsLoading(false)
    }
  }, [scenarioId, horizonYears])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    projection,
    isLoading,
    error,
    refetch: fetchData,
  }
}
