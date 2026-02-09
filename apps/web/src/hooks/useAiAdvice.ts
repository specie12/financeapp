import { useState, useCallback } from 'react'
import { createApiClient } from '@finance-app/api-client'
import type { AiAdviceResponse } from '@finance-app/shared-types'

interface UseAiAdviceReturn {
  advice: AiAdviceResponse | null
  isLoading: boolean
  error: string | null
  getAdvice: (topic?: string) => Promise<void>
  reset: () => void
}

export function useAiAdvice(accessToken: string | null): UseAiAdviceReturn {
  const [advice, setAdvice] = useState<AiAdviceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAdvice = useCallback(
    async (topic?: string) => {
      if (!accessToken) {
        setError('Not authenticated')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const client = createApiClient({
          baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        })
        client.setAccessToken(accessToken)

        const response = await client.ai.getAdvice(topic)

        if (response.success && response.data) {
          setAdvice(response.data)
        } else {
          setError('Failed to get AI advice')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [accessToken],
  )

  const reset = useCallback(() => {
    setAdvice(null)
    setError(null)
  }, [])

  return { advice, isLoading, error, getAdvice, reset }
}
