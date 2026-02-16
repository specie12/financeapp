'use client'

import { useState, type FormEvent } from 'react'
import { useAiQuery } from '@/hooks/useAiQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AiQueryBarProps {
  accessToken: string | null
}

export function AiQueryBar({ accessToken }: AiQueryBarProps) {
  const [question, setQuestion] = useState('')
  const { answer, dataUsed, isLoading, error, submitQuery, reset } = useAiQuery(accessToken)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isLoading) return
    await submitQuery(question.trim())
  }

  const handleReset = () => {
    setQuestion('')
    reset()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Ask About Your Finances</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your finances..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={isLoading || !question.trim()}>
            {isLoading ? 'Analyzing...' : 'Ask'}
          </Button>
        </form>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {answer && (
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm whitespace-pre-wrap">{answer}</p>
            {dataUsed.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Sources:</span>
                {dataUsed.map((source) => (
                  <span
                    key={source}
                    className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {source}
                  </span>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
