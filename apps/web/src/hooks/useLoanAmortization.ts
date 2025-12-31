'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { LoanAmortizationResponse } from '@/lib/dashboard/types'

interface UseLoanAmortizationReturn {
  data: LoanAmortizationResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useLoanAmortization(
  accessToken: string | null,
  loanId: string,
): UseLoanAmortizationReturn {
  const [data, setData] = useState<LoanAmortizationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    if (!loanId) {
      setError('Loan ID required')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const response = await apiClient.dashboard.getLoanAmortization(loanId)
      setData(response.data)
    } catch (err) {
      console.error('Failed to fetch loan amortization:', err)
      setError('Failed to load amortization schedule')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, loanId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
