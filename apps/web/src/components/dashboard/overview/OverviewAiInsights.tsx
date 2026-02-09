'use client'

import { AiAdvicePanel } from '@/components/dashboard/ai'
import type { AiAdviceResponse } from '@finance-app/shared-types'

interface OverviewAiInsightsProps {
  advice: AiAdviceResponse | null
  isLoading: boolean
  onRefresh: () => void
}

export function OverviewAiInsights({ advice, isLoading, onRefresh }: OverviewAiInsightsProps) {
  return <AiAdvicePanel advice={advice} isLoading={isLoading} onRefresh={onRefresh} />
}
