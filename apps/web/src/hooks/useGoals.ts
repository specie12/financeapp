'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { GoalProgressWithInsights } from '@finance-app/shared-types'

interface UseGoalsReturn {
  goals: GoalProgressWithInsights[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useGoals(accessToken: string | null): UseGoalsReturn {
  const [goals, setGoals] = useState<GoalProgressWithInsights[]>([])
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
      const response = await apiClient.goals.getAllInsights()
      setGoals(response.data)
    } catch (err) {
      console.error('Failed to fetch goals:', err)
      setError('Failed to load goals data')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { goals, isLoading, error, refetch: fetchData }
}
