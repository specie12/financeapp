'use client'

import { useState } from 'react'
import type { Goal, GoalType } from '@finance-app/shared-types'
import { createAuthenticatedApiClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { GoalModal } from './GoalModal'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

interface GoalListProps {
  goals: Goal[]
  onRefresh: () => void
  accessToken: string | null
}

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  net_worth_target: 'Net Worth Target',
  savings_target: 'Savings Target',
  debt_freedom: 'Debt Freedom',
}

export function GoalList({ goals, onRefresh, accessToken }: GoalListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Group goals by type
  const goalsByType = goals.reduce(
    (acc, goal) => {
      const type = goal.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(goal)
      return acc
    },
    {} as Record<GoalType, Goal[]>,
  )

  const activeGoals = goals.filter((g) => g.status === 'active')
  const achievedGoals = goals.filter((g) => g.status === 'achieved')

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingGoal(null)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingGoal || !accessToken) return

    setIsDeleting(true)
    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      await apiClient.goals.delete(deletingGoal.id)
      onRefresh()
      setDeletingGoal(null)
    } catch (err) {
      console.error('Failed to delete goal:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleModalSuccess = () => {
    onRefresh()
    setEditingGoal(null)
  }

  const calculateProgress = (goal: Goal): number => {
    if (goal.targetAmountCents <= 0) return 0
    return Math.min(100, Math.round((goal.currentAmountCents / goal.targetAmountCents) * 100))
  }

  const formatTargetDate = (date: Date | null): string => {
    if (!date) return 'No target date'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your Goals</h3>
          <p className="text-sm text-muted-foreground">
            {activeGoals.length} active, {achievedGoals.length} achieved
          </p>
        </div>
        <Button onClick={handleAdd}>Add Goal</Button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No goals set yet.</p>
          <p className="text-sm">Click &quot;Add Goal&quot; to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(goalsByType).map(([type, typeGoals]) => (
            <div key={type} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {GOAL_TYPE_LABELS[type as GoalType] || type}
              </h4>
              <div className="space-y-2">
                {typeGoals.map((goal) => {
                  const progress = calculateProgress(goal)
                  const isAchieved = goal.status === 'achieved'

                  return (
                    <div
                      key={goal.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{goal.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Target: {formatCurrency(goal.targetAmountCents)} by{' '}
                            {formatTargetDate(goal.targetDate)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(goal)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingGoal(goal)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>
                            {formatCurrency(goal.currentAmountCents)} of{' '}
                            {formatCurrency(goal.targetAmountCents)}
                          </span>
                          <span
                            className={
                              isAchieved
                                ? 'text-green-600 font-medium'
                                : progress >= 75
                                  ? 'text-blue-600'
                                  : 'text-muted-foreground'
                            }
                          >
                            {progress}%{isAchieved && ' - Achieved!'}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <GoalModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        goal={editingGoal}
        onSuccess={handleModalSuccess}
        accessToken={accessToken}
      />

      <DeleteConfirmDialog
        open={!!deletingGoal}
        onOpenChange={(open) => !open && setDeletingGoal(null)}
        title="Delete Goal"
        description={`Are you sure you want to delete "${deletingGoal?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
