'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { Budget, CreateBudgetDto } from '@finance-app/shared-types'

interface UseBudgetsReturn {
  budgets: Budget[]
  isLoading: boolean
  error: string | null
  isMutating: boolean
  createBudget: (data: CreateBudgetDto) => Promise<void>
  updateBudget: (id: string, data: Partial<CreateBudgetDto>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  refetch: () => void
}

export function useBudgets(accessToken: string | null): UseBudgetsReturn {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)

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

  const createBudget = useCallback(
    async (data: CreateBudgetDto) => {
      if (!accessToken) return
      setIsMutating(true)
      try {
        const apiClient = createAuthenticatedApiClient(accessToken)
        await apiClient.budgets.create(data)
        await fetchData()
      } catch (err) {
        console.error('Failed to create budget:', err)
        throw err
      } finally {
        setIsMutating(false)
      }
    },
    [accessToken, fetchData],
  )

  const updateBudget = useCallback(
    async (id: string, data: Partial<CreateBudgetDto>) => {
      if (!accessToken) return
      setIsMutating(true)
      try {
        const apiClient = createAuthenticatedApiClient(accessToken)
        await apiClient.budgets.update(id, data)
        await fetchData()
      } catch (err) {
        console.error('Failed to update budget:', err)
        throw err
      } finally {
        setIsMutating(false)
      }
    },
    [accessToken, fetchData],
  )

  const deleteBudget = useCallback(
    async (id: string) => {
      if (!accessToken) return
      setIsMutating(true)
      try {
        const apiClient = createAuthenticatedApiClient(accessToken)
        await apiClient.budgets.delete(id)
        await fetchData()
      } catch (err) {
        console.error('Failed to delete budget:', err)
        throw err
      } finally {
        setIsMutating(false)
      }
    },
    [accessToken, fetchData],
  )

  return {
    budgets,
    isLoading,
    error,
    isMutating,
    createBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchData,
  }
}
