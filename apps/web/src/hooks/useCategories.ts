'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { Category } from '@finance-app/shared-types'

interface UseCategoriesReturn {
  categories: Category[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useCategories(accessToken: string | null): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
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
      const response = await apiClient.categories.list({ limit: 100 })
      setCategories(response.data)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setError('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { categories, isLoading, error, refetch: fetchData }
}
