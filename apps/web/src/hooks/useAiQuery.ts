import { useState, useCallback } from 'react'
import { createApiClient } from '@finance-app/api-client'
import type { AiQueryResponse } from '@finance-app/shared-types'

interface UseAiQueryReturn {
  answer: string | null
  dataUsed: string[]
  isLoading: boolean
  error: string | null
  submitQuery: (question: string) => Promise<void>
  reset: () => void
}

export function useAiQuery(accessToken: string | null): UseAiQueryReturn {
  const [answer, setAnswer] = useState<string | null>(null)
  const [dataUsed, setDataUsed] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitQuery = useCallback(
    async (question: string) => {
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

        const response = await client.ai.query(question)

        if (response.success && response.data) {
          const data = response.data as AiQueryResponse
          setAnswer(data.answer)
          setDataUsed(data.dataUsed)
        } else {
          setError('Failed to get AI response')
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
    setAnswer(null)
    setDataUsed([])
    setError(null)
  }, [])

  return { answer, dataUsed, isLoading, error, submitQuery, reset }
}
