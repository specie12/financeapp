'use client'

import { AiAdvicePanel } from '@/components/dashboard/ai'
import type { AiAdviceResponse } from '@finance-app/shared-types'

interface OverviewAiInsightsProps {
  advice: AiAdviceResponse | null
  isLoading: boolean
  error?: string | null
  onRefresh: () => void
}

export function OverviewAiInsights({
  advice,
  isLoading,
  error,
  onRefresh,
}: OverviewAiInsightsProps) {
  return <AiAdvicePanel advice={advice} isLoading={isLoading} error={error} onRefresh={onRefresh} />
}
