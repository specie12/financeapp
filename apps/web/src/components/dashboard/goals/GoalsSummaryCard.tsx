'use client'

import Link from 'next/link'
import type { GoalProgressWithInsights, GoalType } from '@finance-app/shared-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

interface GoalsSummaryCardProps {
  goals: GoalProgressWithInsights[]
  title?: string
  filterType?: GoalType
  showViewAll?: boolean
}

export function GoalsSummaryCard({
  goals,
  title = 'Goals Progress',
  filterType,
  showViewAll = true,
}: GoalsSummaryCardProps) {
  // Filter goals by type if specified
  const filteredGoals = filterType ? goals.filter((g) => g.goal.type === filterType) : goals

  if (filteredGoals.length === 0) {
    return null
  }

  const activeGoals = filteredGoals.filter((g) => g.goal.status === 'active')
  const onTrackGoals = activeGoals.filter((g) => g.onTrack)
  const achievedGoals = filteredGoals.filter((g) => g.progressPercent >= 100)

  // Calculate average progress
  const averageProgress =
    activeGoals.length > 0
      ? Math.round(activeGoals.reduce((sum, g) => sum + g.progressPercent, 0) / activeGoals.length)
      : 0

  // Get top 3 goals to display
  const topGoals = filteredGoals
    .sort((a, b) => {
      // Sort by: active first, then by progress descending
      if (a.goal.status !== b.goal.status) {
        return a.goal.status === 'active' ? -1 : 1
      }
      return b.progressPercent - a.progressPercent
    })
    .slice(0, 3)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {showViewAll && (
            <Link href="/dashboard/goals">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{activeGoals.length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{onTrackGoals.length}</p>
            <p className="text-xs text-muted-foreground">On Track</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{achievedGoals.length}</p>
            <p className="text-xs text-muted-foreground">Achieved</p>
          </div>
        </div>

        {/* Average Progress */}
        {activeGoals.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Progress</span>
              <span className="font-medium">{averageProgress}%</span>
            </div>
            <Progress value={averageProgress} className="h-2" />
          </div>
        )}

        {/* Top Goals Preview */}
        <div className="space-y-2">
          {topGoals.map((goal) => (
            <div key={goal.goal.id} className="flex items-center justify-between text-sm">
              <span className="truncate flex-1 mr-2">{goal.goal.name}</span>
              <div className="flex items-center gap-2">
                <Progress value={goal.progressPercent} className="w-16 h-1.5" />
                <span
                  className={`text-xs font-medium w-10 text-right ${
                    goal.progressPercent >= 100
                      ? 'text-green-600'
                      : goal.onTrack
                        ? 'text-blue-600'
                        : 'text-amber-600'
                  }`}
                >
                  {goal.progressPercent}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA for empty state */}
        {activeGoals.length === 0 && achievedGoals.length === 0 && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-2">No goals set yet</p>
            <Link href="/dashboard/settings?tab=goals">
              <Button variant="outline" size="sm">
                Add Goal
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
