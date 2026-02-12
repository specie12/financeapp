'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { GoalProgressWithInsights } from '@finance-app/shared-types'

interface AiGoalCoachingProps {
  goals: GoalProgressWithInsights[]
}

function formatDollars(cents: number): string {
  return `$${(Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function AiGoalCoaching({ goals }: AiGoalCoachingProps) {
  if (!goals || goals.length === 0) return null

  const activeGoals = goals.filter((g) => g.goal.status === 'active')
  if (activeGoals.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Goal Coaching</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeGoals.slice(0, 3).map((goal) => {
            const suggestions: string[] = []

            if (!goal.onTrack && goal.insights.monthlySavingsNeededCents > 0) {
              suggestions.push(
                `Increase monthly savings to ${formatDollars(goal.insights.monthlySavingsNeededCents)} to get back on track.`,
              )
            }

            if (goal.insights.isAheadOfSchedule) {
              suggestions.push("Great progress! You're ahead of schedule.")
            }

            if (goal.insights.monthsToGoal && goal.insights.monthsToGoal > 0) {
              const years = Math.floor(goal.insights.monthsToGoal / 12)
              const months = goal.insights.monthsToGoal % 12
              const timeStr = years > 0 ? `${years}y ${months}m` : `${months}m`
              suggestions.push(`At your current rate, you'll reach this goal in ~${timeStr}.`)
            }

            return (
              <div key={goal.goal.id} className="border-b last:border-b-0 pb-2 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{goal.goal.name}</p>
                  <span className="text-xs text-muted-foreground">{goal.progressPercent}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full ${
                      goal.onTrack ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(100, goal.progressPercent)}%` }}
                  />
                </div>
                {suggestions.map((s, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {s}
                  </p>
                ))}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
