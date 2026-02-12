'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { TaxSummaryResponse, TaxProfile, CreateTaxProfileDto } from '@finance-app/shared-types'

interface UseTaxProfileReturn {
  summary: TaxSummaryResponse | null
  profile: TaxProfile | null
  isLoading: boolean
  error: string | null
  upsertProfile: (data: CreateTaxProfileDto) => Promise<void>
  refetch: () => void
}

export function useTaxProfile(accessToken: string | null, taxYear?: number): UseTaxProfileReturn {
  const [summary, setSummary] = useState<TaxSummaryResponse | null>(null)
  const [profile, setProfile] = useState<TaxProfile | null>(null)
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

      const [summaryRes, profileRes] = await Promise.allSettled([
        apiClient.tax.getSummary(taxYear),
        apiClient.tax.getProfile(taxYear),
      ])

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data)
      }
      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data)
      }
      if (summaryRes.status === 'rejected' && profileRes.status === 'rejected') {
        // Check if it's a plan restriction
        const err = summaryRes.reason as { response?: { status: number } }
        if (err?.response?.status === 403) {
          setError('Tax features require a Premium plan')
        } else {
          setError('Failed to load tax data')
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tax data'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, taxYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const upsertProfile = useCallback(
    async (data: CreateTaxProfileDto) => {
      if (!accessToken) return
      const apiClient = createAuthenticatedApiClient(accessToken)
      const response = await apiClient.tax.upsertProfile(data)
      setProfile(response.data)
      // Refetch summary after profile change
      fetchData()
    },
    [accessToken, fetchData],
  )

  return {
    summary,
    profile,
    isLoading,
    error,
    upsertProfile,
    refetch: fetchData,
  }
}
