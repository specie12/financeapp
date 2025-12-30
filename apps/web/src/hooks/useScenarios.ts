'use client'

import { useState, useEffect, useCallback } from 'react'
import { createApiClient } from '@finance-app/api-client'
import type { Scenario, CreateScenarioDto, UpdateScenarioDto } from '@finance-app/shared-types'

interface UseScenariosReturn {
  scenarios: Scenario[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  createScenario: (data: CreateScenarioDto) => Promise<Scenario>
  updateScenario: (id: string, data: UpdateScenarioDto) => Promise<Scenario>
  deleteScenario: (id: string) => Promise<void>
}

export function useScenarios(accessToken: string | null): UseScenariosReturn {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getApiClient = useCallback(() => {
    const apiClient = createApiClient({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    })
    if (accessToken) {
      apiClient.setAccessToken(accessToken)
    }
    return apiClient
  }, [accessToken])

  const fetchScenarios = useCallback(async () => {
    if (!accessToken) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const apiClient = getApiClient()
      const response = await apiClient.scenarios.list()
      setScenarios(response.data)
    } catch (err) {
      console.error('Failed to fetch scenarios:', err)
      setError('Failed to load scenarios')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, getApiClient])

  useEffect(() => {
    fetchScenarios()
  }, [fetchScenarios])

  const createScenario = useCallback(
    async (data: CreateScenarioDto): Promise<Scenario> => {
      const apiClient = getApiClient()
      const response = await apiClient.scenarios.create(data)
      await fetchScenarios()
      return response.data
    },
    [getApiClient, fetchScenarios],
  )

  const updateScenario = useCallback(
    async (id: string, data: UpdateScenarioDto): Promise<Scenario> => {
      const apiClient = getApiClient()
      const response = await apiClient.scenarios.update(id, data)
      await fetchScenarios()
      return response.data
    },
    [getApiClient, fetchScenarios],
  )

  const deleteScenario = useCallback(
    async (id: string): Promise<void> => {
      const apiClient = getApiClient()
      await apiClient.scenarios.delete(id)
      await fetchScenarios()
    },
    [getApiClient, fetchScenarios],
  )

  return {
    scenarios,
    isLoading,
    error,
    refetch: fetchScenarios,
    createScenario,
    updateScenario,
    deleteScenario,
  }
}
