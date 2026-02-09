import { useState, useEffect, useCallback } from 'react'
import { createApiClient } from '@finance-app/api-client'
import type {
  RentalProperty,
  CreateRentalPropertyDto,
  UpdateRentalPropertyDto,
  RentalPortfolioSummary,
} from '@finance-app/shared-types'

interface UseRentalPropertiesReturn {
  properties: RentalProperty[]
  summary: RentalPortfolioSummary | null
  isLoading: boolean
  error: string | null
  createProperty: (data: CreateRentalPropertyDto) => Promise<void>
  updateProperty: (id: string, data: UpdateRentalPropertyDto) => Promise<void>
  deleteProperty: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useRentalProperties(accessToken: string | null): UseRentalPropertiesReturn {
  const [properties, setProperties] = useState<RentalProperty[]>([])
  const [summary, setSummary] = useState<RentalPortfolioSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getClient = useCallback(() => {
    const client = createApiClient({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    })
    if (accessToken) client.setAccessToken(accessToken)
    return client
  }, [accessToken])

  const refresh = useCallback(async () => {
    if (!accessToken) return

    setIsLoading(true)
    setError(null)

    try {
      const client = getClient()
      const [listRes, summaryRes] = await Promise.all([
        client.rentalProperties.list(),
        client.rentalProperties.summary(),
      ])

      if (listRes.success) setProperties(listRes.data)
      if (summaryRes.success) setSummary(summaryRes.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, getClient])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createProperty = useCallback(
    async (data: CreateRentalPropertyDto) => {
      const client = getClient()
      await client.rentalProperties.create(data)
      await refresh()
    },
    [getClient, refresh],
  )

  const updateProperty = useCallback(
    async (id: string, data: UpdateRentalPropertyDto) => {
      const client = getClient()
      await client.rentalProperties.update(id, data)
      await refresh()
    },
    [getClient, refresh],
  )

  const deleteProperty = useCallback(
    async (id: string) => {
      const client = getClient()
      await client.rentalProperties.delete(id)
      await refresh()
    },
    [getClient, refresh],
  )

  return {
    properties,
    summary,
    isLoading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
    refresh,
  }
}
