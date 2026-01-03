'use client'

import { useState, useEffect } from 'react'
import type {
  CashFlowItem,
  CashFlowType,
  Frequency,
  CreateCashFlowItemDto,
} from '@finance-app/shared-types'
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

interface CashFlowModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: CashFlowItem | null
  type: CashFlowType
  onSuccess: () => void
  accessToken: string | null
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'one_time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
]

export function CashFlowModal({
  open,
  onOpenChange,
  item,
  type,
  onSuccess,
  accessToken,
}: CashFlowModalProps) {
  const isEditing = !!item
  const isIncome = type === 'income'
  const label = isIncome ? 'Income' : 'Expense'

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [growthRate, setGrowthRate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (item) {
      setName(item.name)
      setAmount((item.amountCents / 100).toString())
      setFrequency(item.frequency)
      setStartDate(item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : '')
      setEndDate(item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : '')
      setGrowthRate(
        item.annualGrowthRatePercent !== null ? String(item.annualGrowthRatePercent) : '',
      )
    } else {
      setName('')
      setAmount('')
      setFrequency('monthly')
      setStartDate('')
      setEndDate('')
      setGrowthRate('')
    }
    setError(null)
  }, [item, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) {
      setError('Not authenticated')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const data: CreateCashFlowItemDto = {
        name: name.trim(),
        type,
        amountCents: Math.round(amountNum * 100),
        frequency,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        annualGrowthRatePercent: growthRate ? parseFloat(growthRate) : null,
      }

      if (isEditing && item) {
        await apiClient.cashFlowItems.update(item.id, data)
      } else {
        await apiClient.cashFlowItems.create(data)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to save cash flow item:', err)
      setError(`Failed to save ${label.toLowerCase()}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? `Edit ${label}` : `Add ${label}`}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? `Update the details of this ${label.toLowerCase()}.`
                : `Add a new ${label.toLowerCase()} to track your cash flow.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isIncome ? 'e.g., Salary, Freelance' : 'e.g., Rent, Groceries'}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(value) => setFrequency(value as Frequency)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date (Optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="growthRate">Annual Growth Rate (%) - Optional</Label>
              <Input
                id="growthRate"
                type="number"
                step="0.1"
                value={growthRate}
                onChange={(e) => setGrowthRate(e.target.value)}
                placeholder={isIncome ? 'e.g., 3 for 3% annual raise' : 'e.g., 2 for 2% inflation'}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : `Add ${label}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
