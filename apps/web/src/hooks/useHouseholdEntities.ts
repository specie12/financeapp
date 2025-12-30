'use client'

import { useState, useEffect, useCallback } from 'react'
import { createApiClient } from '@finance-app/api-client'
import type { Asset, Liability, CashFlowItem } from '@finance-app/shared-types'

interface UseHouseholdEntitiesReturn {
  assets: Asset[]
  liabilities: Liability[]
  cashFlowItems: CashFlowItem[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useHouseholdEntities(accessToken: string | null): UseHouseholdEntitiesReturn {
  const [assets, setAssets] = useState<Asset[]>([])
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [cashFlowItems, setCashFlowItems] = useState<CashFlowItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntities = useCallback(async () => {
    if (!accessToken) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const apiClient = createApiClient({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      })
      apiClient.setAccessToken(accessToken)

      const [assetsRes, liabilitiesRes, cashFlowItemsRes] = await Promise.all([
        apiClient.assets.list(),
        apiClient.liabilities.list(),
        apiClient.cashFlowItems.list(),
      ])

      setAssets(assetsRes.data)
      setLiabilities(liabilitiesRes.data)
      setCashFlowItems(cashFlowItemsRes.data)
    } catch (err) {
      console.error('Failed to fetch household entities:', err)
      setError('Failed to load financial data')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchEntities()
  }, [fetchEntities])

  return {
    assets,
    liabilities,
    cashFlowItems,
    isLoading,
    error,
    refetch: fetchEntities,
  }
}
