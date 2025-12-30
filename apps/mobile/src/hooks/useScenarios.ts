import { useState, useEffect, useCallback } from 'react'
import type { Scenario } from '@finance-app/shared-types'
import { getApiClient } from '../lib/api'

interface UseScenariosReturn {
  scenarios: Scenario[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useScenarios(): UseScenariosReturn {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const apiClient = await getApiClient()
      const response = await apiClient.scenarios.list()
      setScenarios(response.data)
    } catch (err) {
      console.error('Failed to fetch scenarios:', err)
      setError('Failed to load scenarios')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    scenarios,
    isLoading,
    error,
    refetch: fetchData,
  }
}
