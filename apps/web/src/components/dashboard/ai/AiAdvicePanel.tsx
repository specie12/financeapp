'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AiInsightCard } from './AiInsightCard'
import type { AiAdviceResponse } from '@finance-app/shared-types'

interface AiAdvicePanelProps {
  advice: AiAdviceResponse | null
  isLoading: boolean
  onRefresh: () => void
}

export function AiAdvicePanel({ advice, isLoading, onRefresh }: AiAdvicePanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">AI Financial Insights</CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Get Insights'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!advice && !isLoading && (
          <p className="text-sm text-muted-foreground">
            Click &quot;Get Insights&quot; for AI-powered analysis of your finances.
          </p>
        )}

        {isLoading && (
          <p className="text-sm text-muted-foreground">Analyzing your financial data...</p>
        )}

        {advice && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{advice.summary}</p>
            <div className="space-y-2">
              {advice.insights.map((insight, i) => (
                <AiInsightCard key={i} insight={insight} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
