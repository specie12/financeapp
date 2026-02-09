'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { AiInsight } from '@finance-app/shared-types'

interface AiInsightCardProps {
  insight: AiInsight
}

const severityStyles = {
  info: 'border-l-blue-500 bg-blue-50',
  warning: 'border-l-yellow-500 bg-yellow-50',
  success: 'border-l-green-500 bg-green-50',
  critical: 'border-l-red-500 bg-red-50',
}

const severityBadge = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  success: 'bg-green-100 text-green-800',
  critical: 'bg-red-100 text-red-800',
}

export function AiInsightCard({ insight }: AiInsightCardProps) {
  return (
    <Card className={`border-l-4 ${severityStyles[insight.severity]}`}>
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge[insight.severity]}`}
              >
                {insight.category}
              </span>
            </div>
            <p className="text-sm font-medium">{insight.message}</p>
            <p className="text-xs text-muted-foreground mt-1">{insight.action}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
