'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import type { GoalProgressSummary } from '@finance-app/shared-types'

interface InvestmentGoalsPanelProps {
  goals: GoalProgressSummary[]
}

export function InvestmentGoalsPanel({ goals }: InvestmentGoalsPanelProps) {
  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'No target date'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const getGoalTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      net_worth_target: 'Net Worth',
      savings_target: 'Savings',
      debt_freedom: 'Debt Freedom',
    }
    return labels[type] || type
  }

  const getStatusColor = (onTrack: boolean, progressPercent: number): string => {
    if (progressPercent >= 100) return 'text-green-600'
    if (onTrack) return 'text-blue-600'
    return 'text-amber-600'
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Investment Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              No active investment goals. Create savings or net worth goals to track your progress.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Investment Goals</CardTitle>
        <p className="text-sm text-muted-foreground">Track progress towards your financial goals</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.goalId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{goal.goalName}</p>
                <p className="text-xs text-muted-foreground">
                  {getGoalTypeLabel(goal.goalType)} &bull; Target:{' '}
                  {formatDate(goal.projectedCompletionDate)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${getStatusColor(goal.onTrack, goal.progressPercent)}`}
                >
                  {goal.progressPercent.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {goal.onTrack ? 'On Track' : 'Behind'}
                </p>
              </div>
            </div>

            <Progress value={Math.min(goal.progressPercent, 100)} className="h-2" />

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                <MoneyDisplay cents={goal.currentAmountCents} /> saved
              </span>
              <span>
                <MoneyDisplay cents={goal.remainingCents} /> to go
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
