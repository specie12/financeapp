'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AiChatMessage } from '@finance-app/shared-types'

interface AiChatWidgetProps {
  messages: AiChatMessage[]
  isLoading: boolean
  onSendMessage: (message: string) => Promise<void>
  onReset: () => void
}

export function AiChatWidget({ messages, isLoading, onSendMessage, onReset }: AiChatWidgetProps) {
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const message = input
    setInput('')
    await onSendMessage(message)
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">AI Financial Chat</CardTitle>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              New Chat
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ask anything about your finances
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                Thinking...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 flex-shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
