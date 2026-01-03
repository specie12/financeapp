'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { useGoals } from '@/hooks/useGoals'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { GoalProgressCard, MilestoneCelebration } from '@/components/dashboard/goals'
import type { GoalType } from '@finance-app/shared-types'

const GOAL_TYPES: { value: GoalType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Goals' },
  { value: 'net_worth_target', label: 'Net Worth' },
  { value: 'savings_target', label: 'Savings' },
  { value: 'debt_freedom', label: 'Debt Freedom' },
]

export default function GoalsPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<GoalType | 'all'>('all')

  useEffect(() => {
    const token = getAccessToken()
    setAccessToken(token)
  }, [])

  const { goals, isLoading, error } = useGoals(accessToken)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Goals</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading goals...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Goals</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">{error}</div>
        </div>
      </div>
    )
  }

  // Filter goals by type
  const filteredGoals = activeTab === 'all' ? goals : goals.filter((g) => g.goal.type === activeTab)

  // Calculate summary stats
  const activeGoals = goals.filter((g) => g.goal.status === 'active')
  const onTrackGoals = activeGoals.filter((g) => g.onTrack)
  const achievedGoals = goals.filter((g) => g.progressPercent >= 100)

  const averageProgress =
    activeGoals.length > 0
      ? Math.round(activeGoals.reduce((sum, g) => sum + g.progressPercent, 0) / activeGoals.length)
      : 0

  // Count goals by type for tab badges
  const goalCounts = goals.reduce(
    (acc, g) => {
      acc[g.goal.type] = (acc[g.goal.type] || 0) + 1
      return acc
    },
    {} as Record<GoalType, number>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Goals</h1>
        <Link href="/dashboard/settings?tab=goals">
          <Button>Manage Goals</Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Goals</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{activeGoals.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>On Track</CardDescription>
            <CardTitle className="text-3xl text-green-600">{onTrackGoals.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Achieved</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{achievedGoals.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Progress</CardDescription>
            <CardTitle className="text-3xl">{averageProgress}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Goals Grid with Tabs */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">You haven&apos;t set any goals yet.</p>
            <p className="text-sm text-muted-foreground mb-6">
              Goals help you track progress toward your financial milestones.
            </p>
            <Link href="/dashboard/settings?tab=goals">
              <Button>Add Your First Goal</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GoalType | 'all')}>
          <TabsList>
            {GOAL_TYPES.map((type) => (
              <TabsTrigger key={type.value} value={type.value}>
                {type.label}
                {type.value !== 'all' && goalCounts[type.value as GoalType] > 0 && (
                  <span className="ml-1 text-xs">({goalCounts[type.value as GoalType]})</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredGoals.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No{' '}
                    {activeTab !== 'all'
                      ? GOAL_TYPES.find((t) => t.value === activeTab)?.label.toLowerCase()
                      : ''}{' '}
                    goals found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGoals.map((goal) => (
                  <GoalProgressCard key={goal.goal.id} goal={goal} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Milestone Celebration Dialog */}
      <MilestoneCelebration goals={goals} />
    </div>
  )
}
