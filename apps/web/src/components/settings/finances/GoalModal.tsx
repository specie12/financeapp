'use client'

import { useState, useEffect } from 'react'
import type { Goal, GoalType, CreateGoalDto, Liability } from '@finance-app/shared-types'
import { createAuthenticatedApiClient } from '@/lib/auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

interface GoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: Goal | null
  onSuccess: () => void
  accessToken: string | null
}

const GOAL_TYPES: { value: GoalType; label: string; description: string }[] = [
  {
    value: 'net_worth_target',
    label: 'Net Worth Target',
    description: 'Track progress toward a total net worth goal',
  },
  {
    value: 'savings_target',
    label: 'Savings Target',
    description: 'Track savings in bank accounts and investments',
  },
  {
    value: 'debt_freedom',
    label: 'Debt Freedom',
    description: 'Track progress paying off a specific debt',
  },
]

export function GoalModal({ open, onOpenChange, goal, onSuccess, accessToken }: GoalModalProps) {
  const isEditing = !!goal

  const [name, setName] = useState('')
  const [type, setType] = useState<GoalType>('savings_target')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [linkedLiabilityId, setLinkedLiabilityId] = useState<string | null>(null)
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch liabilities for debt freedom goals
  useEffect(() => {
    const fetchLiabilities = async () => {
      if (!accessToken) return
      try {
        const apiClient = createAuthenticatedApiClient(accessToken)
        const response = await apiClient.liabilities.list({ limit: 100 })
        setLiabilities(response.data)
      } catch (err) {
        console.error('Failed to fetch liabilities:', err)
      }
    }

    if (open) {
      fetchLiabilities()
    }
  }, [accessToken, open])

  useEffect(() => {
    if (goal) {
      setName(goal.name)
      setType(goal.type)
      setTargetAmount((goal.targetAmountCents / 100).toString())
      setTargetDate(goal.targetDate ? new Date(goal.targetDate).toISOString().slice(0, 10) : '')
      setLinkedLiabilityId(goal.linkedLiabilityId)
    } else {
      setName('')
      setType('savings_target')
      setTargetAmount('')
      setTargetDate('')
      setLinkedLiabilityId(null)
    }
    setError(null)
  }, [goal, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) {
      setError('Not authenticated')
      return
    }

    const amountNum = parseFloat(targetAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid target amount')
      return
    }

    if (type === 'debt_freedom' && !linkedLiabilityId) {
      setError('Please select a debt to track for debt freedom goals')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const data: CreateGoalDto = {
        name: name.trim(),
        type,
        targetAmountCents: Math.round(amountNum * 100),
        targetDate: targetDate ? new Date(targetDate) : null,
        linkedLiabilityId: type === 'debt_freedom' ? linkedLiabilityId : null,
      }

      if (isEditing && goal) {
        await apiClient.goals.update(goal.id, data)
      } else {
        await apiClient.goals.create(data)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to save goal:', err)
      setError('Failed to save goal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-populate target amount when selecting a debt for debt freedom
  const handleLiabilityChange = (liabilityId: string) => {
    setLinkedLiabilityId(liabilityId)
    const liability = liabilities.find((l) => l.id === liabilityId)
    if (liability && !targetAmount) {
      // Set target to principal amount (total debt to pay off)
      setTargetAmount((liability.principalCents / 100).toString())
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the details of your financial goal.'
                : 'Set a new financial goal to track your progress.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Goal Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as GoalType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div>
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {GOAL_TYPES.find((t) => t.value === type)?.description}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  type === 'net_worth_target'
                    ? 'e.g., Reach $1M Net Worth'
                    : type === 'savings_target'
                      ? 'e.g., Emergency Fund, House Down Payment'
                      : 'e.g., Pay Off Car Loan'
                }
                required
              />
            </div>

            {type === 'debt_freedom' && (
              <div className="grid gap-2">
                <Label htmlFor="liability">Select Debt to Track</Label>
                <Select value={linkedLiabilityId || ''} onValueChange={handleLiabilityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a debt" />
                  </SelectTrigger>
                  <SelectContent>
                    {liabilities.map((liability) => (
                      <SelectItem key={liability.id} value={liability.id}>
                        {liability.name} (${(liability.currentBalanceCents / 100).toLocaleString()}{' '}
                        remaining)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="targetAmount">Target Amount ($)</Label>
              <Input
                id="targetAmount"
                type="number"
                min="0"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="e.g., 50000"
                required
              />
              {type === 'debt_freedom' && (
                <p className="text-xs text-muted-foreground">
                  This is the total amount you want to pay off
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="targetDate">Target Date (Optional)</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Set a target date to track if you&apos;re on schedule
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
