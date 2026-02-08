'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { Budget } from '@finance-app/shared-types'

interface UseBudgetsReturn {
  budgets: Budget[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useBudgets(accessToken: string | null): UseBudgetsReturn {
  const [budgets, setBudgets] = useState<Budget[]>([])
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
      const response = await apiClient.budgets.list({ limit: 100 })
      setBudgets(response.data)
    } catch (err) {
      console.error('Failed to fetch budgets:', err)
      setError('Failed to load budgets')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { budgets, isLoading, error, refetch: fetchData }
}
