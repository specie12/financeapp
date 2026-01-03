'use client'

import { useState, useEffect } from 'react'
import type {
  Liability,
  LiabilityType,
  CreateLiabilityDto,
  Frequency,
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

interface LiabilityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  liability?: Liability | null
  onSuccess: () => void
  accessToken: string | null
}

const LIABILITY_TYPES: { value: LiabilityType; label: string }[] = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'auto_loan', label: 'Auto Loan' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'other', label: 'Other' },
]

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
]

// Calculate monthly payment using PMT formula
function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0 || months === 0) return principal / Math.max(months, 1)
  const monthlyRate = annualRate / 100 / 12
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  )
}

export function LiabilityModal({
  open,
  onOpenChange,
  liability,
  onSuccess,
  accessToken,
}: LiabilityModalProps) {
  const isEditing = !!liability

  const [name, setName] = useState('')
  const [type, setType] = useState<LiabilityType>('other')
  const [principal, setPrincipal] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [minimumPayment, setMinimumPayment] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [termMonths, setTermMonths] = useState('')
  const [startDate, setStartDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (liability) {
      setName(liability.name)
      setType(liability.type)
      setPrincipal((liability.principalCents / 100).toString())
      setCurrentBalance((liability.currentBalanceCents / 100).toString())
      setInterestRate(liability.interestRatePercent.toString())
      setMinimumPayment((liability.minimumPaymentCents / 100).toString())
      setFrequency(liability.paymentFrequency)
      setTermMonths(liability.termMonths !== null ? String(liability.termMonths) : '')
      setStartDate(new Date(liability.startDate).toISOString().slice(0, 10))
    } else {
      setName('')
      setType('other')
      setPrincipal('')
      setCurrentBalance('')
      setInterestRate('')
      setMinimumPayment('')
      setFrequency('monthly')
      setTermMonths('')
      setStartDate(new Date().toISOString().slice(0, 10))
    }
    setError(null)
  }, [liability, open])

  // Auto-calculate minimum payment when relevant fields change
  useEffect(() => {
    if (type !== 'credit_card' && currentBalance && interestRate && termMonths) {
      const balance = parseFloat(currentBalance)
      const rate = parseFloat(interestRate)
      const months = parseInt(termMonths)
      if (!isNaN(balance) && !isNaN(rate) && !isNaN(months) && months > 0) {
        const payment = calculateMonthlyPayment(balance, rate, months)
        setMinimumPayment(payment.toFixed(2))
      }
    }
  }, [currentBalance, interestRate, termMonths, type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) {
      setError('Not authenticated')
      return
    }

    const principalNum = parseFloat(principal)
    const balanceNum = parseFloat(currentBalance)
    const rateNum = parseFloat(interestRate)
    const paymentNum = parseFloat(minimumPayment)

    if (isNaN(principalNum) || principalNum < 0) {
      setError('Please enter a valid principal amount')
      return
    }
    if (isNaN(balanceNum) || balanceNum < 0) {
      setError('Please enter a valid current balance')
      return
    }
    if (isNaN(rateNum) || rateNum < 0) {
      setError('Please enter a valid interest rate')
      return
    }
    if (isNaN(paymentNum) || paymentNum < 0) {
      setError('Please enter a valid minimum payment')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const data: CreateLiabilityDto = {
        name: name.trim(),
        type,
        principalCents: Math.round(principalNum * 100),
        currentBalanceCents: Math.round(balanceNum * 100),
        interestRatePercent: rateNum,
        minimumPaymentCents: Math.round(paymentNum * 100),
        paymentFrequency: frequency,
        termMonths: termMonths ? parseInt(termMonths) : null,
        startDate: new Date(startDate),
      }

      if (isEditing && liability) {
        await apiClient.liabilities.update(liability.id, data)
      } else {
        await apiClient.liabilities.create(data)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to save liability:', err)
      setError('Failed to save debt. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isCreditCard = type === 'credit_card'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Debt' : 'Add Debt'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the details of your debt.'
                : 'Add a new debt to track your liabilities.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Chase Mortgage, Auto Loan"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as LiabilityType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {LIABILITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="principal">Original Amount ($)</Label>
                <Input
                  id="principal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currentBalance">Current Balance ($)</Label>
                <Input
                  id="currentBalance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="e.g., 6.5"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minimumPayment">Min. Payment ($)</Label>
                <Input
                  id="minimumPayment"
                  type="number"
                  min="0"
                  step="0.01"
                  value={minimumPayment}
                  onChange={(e) => setMinimumPayment(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="frequency">Payment Frequency</Label>
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
              {!isCreditCard && (
                <div className="grid gap-2">
                  <Label htmlFor="termMonths">Term (months)</Label>
                  <Input
                    id="termMonths"
                    type="number"
                    min="1"
                    max="600"
                    value={termMonths}
                    onChange={(e) => setTermMonths(e.target.value)}
                    placeholder="e.g., 360"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Debt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
