'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { Account } from '@finance-app/shared-types'

interface UseAccountsReturn {
  accounts: Account[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useAccounts(accessToken: string | null): UseAccountsReturn {
  const [accounts, setAccounts] = useState<Account[]>([])
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
      const response = await apiClient.accounts.list({ limit: 100 })
      setAccounts(response.data)
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
      setError('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { accounts, isLoading, error, refetch: fetchData }
}
