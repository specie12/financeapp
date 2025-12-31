'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OnboardingGoal } from '@/lib/onboarding/types'
import type { GoalType } from '@finance-app/shared-types'

interface GoalsStepProps {
  goals: OnboardingGoal[]
  onAddGoal: (goal: OnboardingGoal) => void
  onRemoveGoal: (index: number) => void
  onNext: () => void
  onBack: () => void
}

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  net_worth_target: 'Net Worth Target',
  savings_target: 'Savings Target',
  debt_freedom: 'Debt Freedom',
}

const GOAL_TYPE_DESCRIPTIONS: Record<GoalType, string> = {
  net_worth_target: 'Reach a specific net worth amount',
  savings_target: 'Save a specific amount',
  debt_freedom: 'Pay off all or specific debts',
}

const GOAL_TYPE_ICONS: Record<GoalType, string> = {
  net_worth_target: '💰',
  savings_target: '🏦',
  debt_freedom: '🎯',
}

export function GoalsStep({ goals, onAddGoal, onRemoveGoal, onNext, onBack }: GoalsStepProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newGoal, setNewGoal] = useState<Partial<OnboardingGoal>>({
    type: 'net_worth_target',
    name: '',
    targetAmountCents: 0,
  })

  const handleAddGoal = () => {
    if (newGoal.name && newGoal.targetAmountCents && newGoal.type) {
      onAddGoal({
        type: newGoal.type,
        name: newGoal.name,
        targetAmountCents: newGoal.targetAmountCents,
        targetDate: newGoal.targetDate,
      })
      setNewGoal({
        type: 'net_worth_target',
        name: '',
        targetAmountCents: 0,
      })
      setIsAdding(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Set Your Financial Goals</CardTitle>
        <CardDescription>
          What are you working toward? Setting goals helps track your progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Goals */}
        {goals.length > 0 && (
          <div className="space-y-3">
            {goals.map((goal, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30"
              >
                <span className="text-2xl">{GOAL_TYPE_ICONS[goal.type]}</span>
                <div className="flex-1">
                  <div className="font-medium">{goal.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {GOAL_TYPE_LABELS[goal.type]} - {formatCurrency(goal.targetAmountCents)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveGoal(index)}
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Goal Form */}
        {isAdding ? (
          <div className="p-4 rounded-lg border space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select
                  value={newGoal.type}
                  onValueChange={(value) => setNewGoal({ ...newGoal, type: value as GoalType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <span>{GOAL_TYPE_ICONS[type]}</span>
                          <span>{GOAL_TYPE_LABELS[type]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newGoal.type && (
                  <p className="text-xs text-muted-foreground">
                    {GOAL_TYPE_DESCRIPTIONS[newGoal.type]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Goal Name</Label>
                <Input
                  placeholder="e.g., Emergency Fund, House Down Payment"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Target Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-7"
                    value={newGoal.targetAmountCents ? newGoal.targetAmountCents / 100 : ''}
                    onChange={(e) =>
                      setNewGoal({
                        ...newGoal,
                        targetAmountCents: Math.round(parseFloat(e.target.value || '0') * 100),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Date (Optional)</Label>
                <Input
                  type="date"
                  value={
                    newGoal.targetDate
                      ? new Date(newGoal.targetDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setNewGoal({
                      ...newGoal,
                      targetDate: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleAddGoal}
                disabled={!newGoal.name || !newGoal.targetAmountCents}
                className="flex-1"
              >
                Add Goal
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full border-dashed"
          >
            + Add a Goal
          </Button>
        )}

        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={onNext} className="flex-1">
            {goals.length > 0 ? 'Continue' : 'Skip for Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
