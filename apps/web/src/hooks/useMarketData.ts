import { useState, useEffect, useCallback } from 'react'
import { createApiClient } from '@finance-app/api-client'
import { useAuth } from './useAuth'
import type { TickerData } from '@finance-app/shared-types'

function useApiClient() {
  const { accessToken } = useAuth()

  const getClient = useCallback(() => {
    const client = createApiClient({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
      timeout: 30000,
    })
    if (accessToken) {
      client.setAccessToken(accessToken)
    }
    return client
  }, [accessToken])

  return { getClient, accessToken }
}

/**
 * Hook to search for ticker symbols
 */
export function useTickerSearch(query: string, enabled: boolean = true) {
  const { getClient, accessToken } = useApiClient()
  const [data, setData] = useState<TickerData[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !accessToken || !query.trim()) {
      setData(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const client = getClient()
    client.marketData
      .searchTickers(query)
      .then((response) => {
        if (!cancelled) setData(response.data)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [query, enabled, accessToken, getClient])

  return { data, isLoading }
}

/**
 * Hook to get data for a specific ticker symbol
 */
export function useTickerData(symbol: string, enabled: boolean = true) {
  const { getClient, accessToken } = useApiClient()
  const [data, setData] = useState<TickerData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !accessToken || !symbol) {
      setData(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const client = getClient()
    client.marketData
      .getTicker(symbol)
      .then((response) => {
        if (!cancelled) setData(response.data)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [symbol, enabled, accessToken, getClient])

  return { data, isLoading }
}

/**
 * Hook to validate a ticker symbol
 */
export function useTickerValidation(symbol: string, enabled: boolean = true) {
  const { getClient, accessToken } = useApiClient()
  const [data, setData] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !accessToken || !symbol) {
      setData(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const client = getClient()
    client.marketData
      .validateTicker(symbol)
      .then((response) => {
        if (!cancelled) setData(response.data)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [symbol, enabled, accessToken, getClient])

  return { data, isLoading }
}

/**
 * Hook to get all available ticker symbols
 */
export function useAvailableTickers(enabled: boolean = true) {
  const { getClient, accessToken } = useApiClient()
  const [data, setData] = useState<string[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !accessToken) {
      setData(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const client = getClient()
    client.marketData
      .getAvailableTickers()
      .then((response) => {
        if (!cancelled) setData(response.data)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, accessToken, getClient])

  return { data, isLoading }
}

/**
 * Hook to get tickers by sector
 */
export function useTickersBySector(sector: string, enabled: boolean = true) {
  const { getClient, accessToken } = useApiClient()
  const [data, setData] = useState<TickerData[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !accessToken || !sector) {
      setData(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const client = getClient()
    client.marketData
      .getTickersBySector(sector)
      .then((response) => {
        if (!cancelled) setData(response.data)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [sector, enabled, accessToken, getClient])

  return { data, isLoading }
}

/**
 * Hook to get market summary (gainers/losers/most active)
 */
export function useMarketSummary(enabled: boolean = true) {
  const { getClient, accessToken } = useApiClient()
  const [data, setData] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !accessToken) {
      setData(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const client = getClient()
    client.marketData
      .getMarketSummary()
      .then((response) => {
        if (!cancelled) setData(response.data)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, accessToken, getClient])

  return { data, isLoading }
}

/**
 * Hook to get enhanced investments with ticker data
 */
export function useEnhancedInvestmentsWithTickers(enabled: boolean = true) {
  const { getClient, accessToken } = useApiClient()
  const [data, setData] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !accessToken) {
      setData(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const client = getClient()
    client.dashboard
      .getEnhancedInvestmentsWithTickers()
      .then((response) => {
        if (!cancelled) setData(response.data)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, accessToken, getClient])

  return { data, isLoading }
}

/**
 * Debounced ticker search hook for input fields
 */
export function useDebouncedTickerSearch(query: string, delayMs: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [query, delayMs])

  return useTickerSearch(debouncedQuery, debouncedQuery.trim().length > 1)
}
