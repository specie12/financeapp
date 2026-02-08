'use client'

import type { GoalProgressWithInsights, GoalType } from '@finance-app/shared-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

interface GoalProgressCardProps {
  goal: GoalProgressWithInsights
  variant?: 'default' | 'compact'
}

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  net_worth_target: 'Net Worth',
  savings_target: 'Savings',
  debt_freedom: 'Debt Freedom',
}

const GOAL_TYPE_COLORS: Record<GoalType, string> = {
  net_worth_target: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  savings_target: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  debt_freedom: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
}

export function GoalProgressCard({ goal, variant = 'default' }: GoalProgressCardProps) {
  const { progressPercent, remainingAmountCents, onTrack, daysRemaining, insights } = goal
  const { monthlySavingsNeededCents, milestones, isAheadOfSchedule, monthsToGoal } = insights

  const isComplete = progressPercent >= 100
  const reachedMilestones = milestones.filter((m) => m.reached)

  const formatDate = (date: Date | null): string => {
    if (!date) return 'No target'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
  }

  if (variant === 'compact') {
    return (
      <div className="p-4 border rounded-lg space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{goal.goal.name}</p>
            <Badge variant="outline" className={GOAL_TYPE_COLORS[goal.goal.type]}>
              {GOAL_TYPE_LABELS[goal.goal.type]}
            </Badge>
          </div>
          <div className="text-right">
            <span
              className={`text-lg font-bold ${
                isComplete ? 'text-green-600' : onTrack ? 'text-primary' : 'text-amber-600'
              }`}
            >
              {progressPercent}%
            </span>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatCurrency(goal.goal.currentAmountCents)}</span>
          <span>{formatCurrency(goal.goal.targetAmountCents)}</span>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{goal.goal.name}</CardTitle>
            <Badge variant="outline" className={`mt-1 ${GOAL_TYPE_COLORS[goal.goal.type]}`}>
              {GOAL_TYPE_LABELS[goal.goal.type]}
            </Badge>
          </div>
          <div className="text-right">
            {isComplete ? (
              <Badge variant="default" className="bg-green-600">
                Achieved!
              </Badge>
            ) : onTrack ? (
              <Badge variant="default" className="bg-primary">
                On Track
              </Badge>
            ) : (
              <Badge variant="default" className="bg-amber-600">
                Behind
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              {formatCurrency(goal.goal.currentAmountCents)} of{' '}
              {formatCurrency(goal.goal.targetAmountCents)}
            </span>
            <span
              className={`font-bold ${
                isComplete ? 'text-green-600' : onTrack ? 'text-primary' : 'text-amber-600'
              }`}
            >
              {progressPercent}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Milestones */}
        <div className="flex gap-2">
          {milestones.map((milestone) => (
            <div
              key={milestone.percent}
              className={`flex-1 text-center py-1 rounded text-xs font-medium ${
                milestone.reached
                  ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {milestone.percent}%
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Remaining</p>
            <p className="font-semibold">{formatCurrency(remainingAmountCents)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Target Date</p>
            <p className="font-semibold">{formatDate(goal.goal.targetDate)}</p>
          </div>
          {daysRemaining !== null && !isComplete && (
            <div>
              <p className="text-muted-foreground">Days Left</p>
              <p className="font-semibold">{daysRemaining} days</p>
            </div>
          )}
          {monthlySavingsNeededCents > 0 && !isComplete && (
            <div>
              <p className="text-muted-foreground">Monthly Needed</p>
              <p
                className={`font-semibold ${
                  isAheadOfSchedule ? 'text-green-600' : 'text-amber-600'
                }`}
              >
                {formatCurrency(monthlySavingsNeededCents)}
              </p>
            </div>
          )}
          {monthsToGoal !== null && !isComplete && (
            <div>
              <p className="text-muted-foreground">Est. Completion</p>
              <p className="font-semibold">
                {monthsToGoal} month{monthsToGoal !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Progress Summary */}
        {reachedMilestones.length > 0 && reachedMilestones.length < 4 && (
          <p className="text-sm text-muted-foreground">
            You&apos;ve reached {reachedMilestones.length} of 4 milestones!
          </p>
        )}
      </CardContent>
    </Card>
  )
}
