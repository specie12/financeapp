'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { Transaction } from '@finance-app/shared-types'

interface TransactionFilters {
  page?: number
  limit?: number
  accountId?: string
  categoryId?: string
  type?: 'income' | 'expense' | 'transfer'
  startDate?: Date
  endDate?: Date
}

interface UseTransactionsReturn {
  transactions: Transaction[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useTransactions(
  accessToken: string | null,
  filters?: TransactionFilters,
): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
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
      const response = await apiClient.transactions.list(filters)
      setTransactions(response.data)
      setTotal(response.pagination.total)
      setPage(response.pagination.page)
      setTotalPages(response.pagination.totalPages)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setError('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, JSON.stringify(filters)])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { transactions, total, page, totalPages, isLoading, error, refetch: fetchData }
}
