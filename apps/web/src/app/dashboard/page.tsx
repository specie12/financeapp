'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useNetWorth } from '@/hooks/useNetWorth'
import { useGoals } from '@/hooks/useGoals'
import { useBudgetStatus } from '@/hooks/useBudgetStatus'
import { useCashFlowSummary } from '@/hooks/useCashFlowSummary'
import { useAiAdvice } from '@/hooks/useAiAdvice'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  OverviewNetWorth,
  OverviewBudgetPulse,
  OverviewCashFlow,
  OverviewGoals,
  OverviewAiInsights,
} from '@/components/dashboard/overview'
import { AiAnomalyAlert } from '@/components/dashboard/ai/AiAnomalyAlert'
import { AiCashFlowForecast } from '@/components/dashboard/ai/AiCashFlowForecast'
import { AiGoalCoaching } from '@/components/dashboard/ai/AiGoalCoaching'

const quickLinks = [
  { href: '/dashboard/net-worth', label: 'Net Worth', description: 'Track assets & liabilities' },
  { href: '/dashboard/budget', label: 'Budget', description: 'Monitor spending limits' },
  { href: '/dashboard/transactions', label: 'Transactions', description: 'View all transactions' },
  { href: '/dashboard/cash-flow', label: 'Cash Flow', description: 'Income vs expenses' },
  { href: '/dashboard/goals', label: 'Goals', description: 'Track financial goals' },
  { href: '/dashboard/loans', label: 'Loans', description: 'Manage debt & payoff' },
  { href: '/dashboard/investments', label: 'Investments', description: 'Portfolio & dividends' },
  { href: '/dashboard/scenarios', label: 'Scenarios', description: 'What-if projections' },
]

export default function DashboardPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { data: netWorthData, isLoading: netWorthLoading } = useNetWorth(accessToken)
  const { goals, isLoading: goalsLoading } = useGoals(accessToken)
  const { data: budgetData, isLoading: budgetLoading } = useBudgetStatus(accessToken)
  const { data: cashFlowData, isLoading: cashFlowLoading } = useCashFlowSummary(accessToken)
  const { advice, isLoading: aiLoading, error: aiError, getAdvice } = useAiAdvice(accessToken)

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <ErrorState title="Not Authenticated" message="Please log in to view your dashboard." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewNetWorth data={netWorthData} isLoading={netWorthLoading} />
        <OverviewBudgetPulse data={budgetData} isLoading={budgetLoading} />
        <OverviewCashFlow data={cashFlowData} isLoading={cashFlowLoading} />
        <OverviewGoals goals={goals} isLoading={goalsLoading} />
      </div>

      {/* AI Anomaly Alerts */}
      <AiAnomalyAlert accessToken={accessToken} />

      {/* AI Insights + Forecast + Goal Coaching */}
      <OverviewAiInsights
        advice={advice}
        isLoading={aiLoading}
        error={aiError}
        onRefresh={getAdvice}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AiCashFlowForecast accessToken={accessToken} />
        <AiGoalCoaching goals={goals} />
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm">{link.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
