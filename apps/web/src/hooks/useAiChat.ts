import { useState, useCallback } from 'react'
import { createApiClient } from '@finance-app/api-client'
import type { AiChatMessage } from '@finance-app/shared-types'

interface UseAiChatReturn {
  messages: AiChatMessage[]
  conversationId: string | null
  isLoading: boolean
  error: string | null
  sendMessage: (message: string) => Promise<void>
  reset: () => void
}

export function useAiChat(accessToken: string | null): UseAiChatReturn {
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (message: string) => {
      if (!accessToken) {
        setError('Not authenticated')
        return
      }

      setIsLoading(true)
      setError(null)

      // Add user message immediately
      setMessages((prev) => [...prev, { role: 'user', content: message }])

      try {
        const client = createApiClient({
          baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        })
        client.setAccessToken(accessToken)

        const response = await client.ai.chat(message, conversationId ?? undefined)

        if (response.success && response.data) {
          setConversationId(response.data.conversationId)
          setMessages((prev) => [...prev, { role: 'assistant', content: response.data.message }])
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
    [accessToken, conversationId],
  )

  const reset = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
  }, [])

  return { messages, conversationId, isLoading, error, sendMessage, reset }
}
