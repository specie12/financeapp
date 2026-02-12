'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import type { AiAnomalyResponse } from '@finance-app/shared-types'

const severityColors = {
  low: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950',
  medium: 'border-orange-400 bg-orange-50 dark:bg-orange-950',
  high: 'border-red-500 bg-red-50 dark:bg-red-950',
}

interface AiAnomalyAlertProps {
  accessToken: string | null
}

export function AiAnomalyAlert({ accessToken }: AiAnomalyAlertProps) {
  const [data, setData] = useState<AiAnomalyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAnomalies = useCallback(async () => {
    if (!accessToken) return
    setIsLoading(true)
    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const response = await apiClient.ai.getAnomalies()
      setData(response.data)
    } catch {
      // Silently fail - this is a non-critical feature
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchAnomalies()
  }, [fetchAnomalies])

  if (isLoading || !data?.hasAnomalies) return null

  return (
    <div className="space-y-2">
      {data.anomalies.slice(0, 3).map((anomaly, index) => (
        <Card key={index} className={`border-l-4 ${severityColors[anomaly.severity]}`}>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {anomaly.severity === 'high' ? '!!' : anomaly.severity === 'medium' ? '!' : 'i'}
              </span>
              <p className="text-sm">{anomaly.message}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
