'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { Category } from '@finance-app/shared-types'

export interface CategorySpendingAverage {
  categoryId: string
  categoryName: string
  totalSpentCents: number
  monthlyAverageCents: number
  transactionCount: number
}

interface UseSpendingAveragesReturn {
  averages: CategorySpendingAverage[]
  totalMonthlySpendingCents: number
  isLoading: boolean
}

export function useSpendingAverages(
  accessToken: string | null,
  categories: Category[],
): UseSpendingAveragesReturn {
  const [averages, setAverages] = useState<CategorySpendingAverage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const response = await apiClient.transactions.list({
        type: 'expense',
        startDate: threeMonthsAgo,
        limit: 1000,
      })

      if (response.success) {
        const categoryMap = new Map<string, { totalCents: number; count: number }>()

        for (const tx of response.data) {
          if (!tx.categoryId) continue
          const existing = categoryMap.get(tx.categoryId)
          if (existing) {
            existing.totalCents += tx.amount
            existing.count += 1
          } else {
            categoryMap.set(tx.categoryId, {
              totalCents: tx.amount,
              count: 1,
            })
          }
        }

        const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]))

        const result: CategorySpendingAverage[] = Array.from(categoryMap.entries()).map(
          ([categoryId, data]) => ({
            categoryId,
            categoryName: categoryNameMap.get(categoryId) || 'Unknown',
            totalSpentCents: data.totalCents,
            monthlyAverageCents: Math.round(data.totalCents / 3),
            transactionCount: data.count,
          }),
        )

        result.sort((a, b) => b.monthlyAverageCents - a.monthlyAverageCents)
        setAverages(result)
      }
    } catch (err) {
      console.error('Failed to fetch spending averages:', err)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, categories])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalMonthlySpendingCents = averages.reduce((sum, a) => sum + a.monthlyAverageCents, 0)

  return { averages, totalMonthlySpendingCents, isLoading }
}
