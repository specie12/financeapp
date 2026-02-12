'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { PlaidItem } from '@finance-app/shared-types'

interface UsePlaidReturn {
  items: PlaidItem[]
  isLoading: boolean
  error: string | null
  getLinkToken: () => Promise<string | null>
  exchangeToken: (
    publicToken: string,
    institutionId: string,
    institutionName: string,
  ) => Promise<void>
  syncItem: (itemId: string) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  refetch: () => void
}

export function usePlaid(accessToken: string | null): UsePlaidReturn {
  const [items, setItems] = useState<PlaidItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const response = await apiClient.plaid.getItems()
      setItems(response.data)
    } catch (err) {
      const axiosErr = err as { response?: { status: number } }
      if (axiosErr?.response?.status === 403) {
        setError('Bank connections require a Pro or Premium plan')
      } else {
        const message = err instanceof Error ? err.message : 'Failed to load connected accounts'
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getLinkToken = useCallback(async (): Promise<string | null> => {
    if (!accessToken) return null
    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const response = await apiClient.plaid.getLinkToken()
      return response.data.linkToken
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create link token'
      setError(message)
      return null
    }
  }, [accessToken])

  const exchangeToken = useCallback(
    async (publicToken: string, institutionId: string, institutionName: string) => {
      if (!accessToken) return
      const apiClient = createAuthenticatedApiClient(accessToken)
      await apiClient.plaid.exchangeToken(publicToken, institutionId, institutionName)
      fetchData()
    },
    [accessToken, fetchData],
  )

  const syncItem = useCallback(
    async (itemId: string) => {
      if (!accessToken) return
      const apiClient = createAuthenticatedApiClient(accessToken)
      await apiClient.plaid.sync(itemId)
      fetchData()
    },
    [accessToken, fetchData],
  )

  const deleteItem = useCallback(
    async (itemId: string) => {
      if (!accessToken) return
      const apiClient = createAuthenticatedApiClient(accessToken)
      await apiClient.plaid.deleteItem(itemId)
      setItems((prev) => prev.filter((i) => i.id !== itemId))
    },
    [accessToken],
  )

  return {
    items,
    isLoading,
    error,
    getLinkToken,
    exchangeToken,
    syncItem,
    deleteItem,
    refetch: fetchData,
  }
}
