'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { AiAnomalyResponse } from '@finance-app/shared-types'

const severityColors = {
  low: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950',
  medium: 'border-orange-400 bg-orange-50 dark:bg-orange-950',
  high: 'border-red-500 bg-red-50 dark:bg-red-950',
}

interface AiAnomalyAlertProps {
  data: AiAnomalyResponse | null
  isLoading: boolean
}

export function AiAnomalyAlert({ data, isLoading }: AiAnomalyAlertProps) {
  const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set())

  if (isLoading || !data?.hasAnomalies) return null

  const visibleAnomalies = data.anomalies
    .slice(0, 3)
    .map((anomaly, index) => ({ anomaly, index }))
    .filter(({ index }) => !dismissedIndices.has(index))

  if (visibleAnomalies.length === 0) return null

  return (
    <div className="space-y-2">
      {visibleAnomalies.map(({ anomaly, index }) => (
        <Card key={index} className={`border-l-4 ${severityColors[anomaly.severity]}`}>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {anomaly.severity === 'high' ? '!!' : anomaly.severity === 'medium' ? '!' : 'i'}
                </span>
                <p className="text-sm">{anomaly.message}</p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDismissedIndices((prev) => new Set([...prev, index]))
                }}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm px-1"
                aria-label="Dismiss anomaly"
              >
                ✕
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
