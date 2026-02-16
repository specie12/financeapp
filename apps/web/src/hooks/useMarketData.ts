import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createApiClient } from '@finance-app/api-client'
import { useAuth } from './useAuth'

// Initialize API client
const useApiClient = () => {
  const { accessToken } = useAuth()

  return useMemo(
    () =>
      createApiClient({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
        timeout: 30000,
      }),
    [accessToken],
  )
}

/**
 * Hook to search for ticker symbols
 */
export function useTickerSearch(query: string, enabled: boolean = true) {
  const apiClient = useApiClient()
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['ticker-search', query],
    queryFn: async () => {
      if (!query.trim()) return []
      apiClient.setAccessToken(accessToken!)
      const response = await apiClient.marketData.searchTickers(query)
      return response.data
    },
    enabled: enabled && !!accessToken && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry search requests
  })
}

/**
 * Hook to get data for a specific ticker symbol
 */
export function useTickerData(symbol: string, enabled: boolean = true) {
  const apiClient = useApiClient()
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['ticker-data', symbol],
    queryFn: async () => {
      apiClient.setAccessToken(accessToken!)
      const response = await apiClient.marketData.getTicker(symbol)
      return response.data
    },
    enabled: enabled && !!accessToken && !!symbol,
    staleTime: 30 * 1000, // 30 seconds for real-time data
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  })
}

/**
 * Hook to validate a ticker symbol
 */
export function useTickerValidation(symbol: string, enabled: boolean = true) {
  const apiClient = useApiClient()
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['ticker-validation', symbol],
    queryFn: async () => {
      apiClient.setAccessToken(accessToken!)
      const response = await apiClient.marketData.validateTicker(symbol)
      return response.data
    },
    enabled: enabled && !!accessToken && !!symbol,
    staleTime: 10 * 60 * 1000, // 10 minutes for validation
    retry: false,
  })
}

/**
 * Hook to get all available ticker symbols
 */
export function useAvailableTickers(enabled: boolean = true) {
  const apiClient = useApiClient()
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['available-tickers'],
    queryFn: async () => {
      apiClient.setAccessToken(accessToken!)
      const response = await apiClient.marketData.getAvailableTickers()
      return response.data
    },
    enabled: enabled && !!accessToken,
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook to get tickers by sector
 */
export function useTickersBySector(sector: string, enabled: boolean = true) {
  const apiClient = useApiClient()
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['tickers-by-sector', sector],
    queryFn: async () => {
      apiClient.setAccessToken(accessToken!)
      const response = await apiClient.marketData.getTickersBySector(sector)
      return response.data
    },
    enabled: enabled && !!accessToken && !!sector,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get market summary (gainers/losers/most active)
 */
export function useMarketSummary(enabled: boolean = true) {
  const apiClient = useApiClient()
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['market-summary'],
    queryFn: async () => {
      apiClient.setAccessToken(accessToken!)
      const response = await apiClient.marketData.getMarketSummary()
      return response.data
    },
    enabled: enabled && !!accessToken,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  })
}

/**
 * Hook to get enhanced investments with ticker data
 */
export function useEnhancedInvestmentsWithTickers(enabled: boolean = true) {
  const apiClient = useApiClient()
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['enhanced-investments-with-tickers'],
    queryFn: async () => {
      apiClient.setAccessToken(accessToken!)
      const response = await apiClient.dashboard.getEnhancedInvestmentsWithTickers()
      return response.data
    },
    enabled: enabled && !!accessToken,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds for portfolio data
  })
}

/**
 * Debounced ticker search hook for input fields
 */
export function useDebouncedTickerSearch(query: string, delayMs: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = React.useState('')

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [query, delayMs])

  return useTickerSearch(debouncedQuery, debouncedQuery.trim().length > 1)
}
