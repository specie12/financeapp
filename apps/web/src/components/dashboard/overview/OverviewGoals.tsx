'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { GoalProgressWithInsights } from '@finance-app/shared-types'

interface OverviewGoalsProps {
  goals: GoalProgressWithInsights[]
  isLoading: boolean
}

export function OverviewGoals({ goals, isLoading }: OverviewGoalsProps) {
  const activeGoals = goals.filter((g) => g.goal.status === 'active')
  const avgProgress =
    activeGoals.length > 0
      ? Math.round(activeGoals.reduce((sum, g) => sum + g.progressPercent, 0) / activeGoals.length)
      : 0

  return (
    <Link href="/dashboard/goals">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Goals</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
          ) : activeGoals.length > 0 ? (
            <>
              <p className="text-2xl font-bold">{activeGoals.length}</p>
              <p className="text-sm text-muted-foreground">
                active goal{activeGoals.length !== 1 ? 's' : ''}
              </p>
              <p className="text-sm mt-1">
                <span className="font-medium">{avgProgress}%</span>
                <span className="text-muted-foreground"> avg progress</span>
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">No active goals</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
