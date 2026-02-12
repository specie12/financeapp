'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AiForecastResponse } from '@finance-app/shared-types'

interface AiCashFlowForecastProps {
  accessToken: string | null
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const confidenceColors = {
  low: 'text-yellow-600',
  medium: 'text-blue-600',
  high: 'text-green-600',
}

export function AiCashFlowForecast({ accessToken }: AiCashFlowForecastProps) {
  const [forecast, setForecast] = useState<AiForecastResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchForecast = useCallback(async () => {
    if (!accessToken) return
    setIsLoading(true)
    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const response = await apiClient.ai.forecast()
      setForecast(response.data)
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchForecast()
  }, [fetchForecast])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Month-End Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading forecast...</p>
        </CardContent>
      </Card>
    )
  }

  if (!forecast) return null

  const isNegative = forecast.predictedEndOfMonthBalanceCents < 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Month-End Forecast</CardTitle>
          <span className={`text-xs font-medium ${confidenceColors[forecast.confidenceLevel]}`}>
            {forecast.confidenceLevel} confidence
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Predicted End-of-Month Balance</p>
            <p className={`text-2xl font-bold ${isNegative ? 'text-destructive' : ''}`}>
              {formatDollars(forecast.predictedEndOfMonthBalanceCents)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Projected Income</p>
              <p className="font-medium text-green-600">
                {formatDollars(forecast.projectedIncomeCents)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Projected Expenses</p>
              <p className="font-medium text-red-600">
                {formatDollars(forecast.projectedExpensesCents)}
              </p>
            </div>
          </div>

          {forecast.insights.length > 0 && (
            <div className="border-t pt-2">
              {forecast.insights.map((insight, i) => (
                <p key={i} className="text-xs text-muted-foreground mt-1">
                  {insight}
                </p>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
