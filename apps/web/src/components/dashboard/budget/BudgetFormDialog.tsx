'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SpendingSuggestionRow } from './SpendingSuggestionRow'
import { formatCurrency } from '@/lib/utils'
import type {
  Category,
  Budget,
  BudgetPeriod,
  BudgetStatusItem,
  CreateBudgetDto,
} from '@finance-app/shared-types'
import type { CategorySpendingAverage } from '@/hooks/useSpendingAverages'

type TabValue = 'manual' | 'spending' | 'template'

interface BudgetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: TabValue
  editBudget?: BudgetStatusItem | null
  existingBudget?: Budget | null
  expenseCategories: Category[]
  budgets: Budget[]
  spendingAverages: CategorySpendingAverage[]
  isMutating: boolean
  onCreateBudget: (data: CreateBudgetDto) => Promise<void>
  onUpdateBudget: (id: string, data: Partial<CreateBudgetDto>) => Promise<void>
}

const TEMPLATES = [
  {
    label: '50/30/20 (Needs/Wants/Savings)',
    value: '50-30-20',
    groups: [
      { name: 'Needs', percent: 50 },
      { name: 'Wants', percent: 30 },
      { name: 'Savings', percent: 20 },
    ],
  },
  {
    label: '70/20/10',
    value: '70-20-10',
    groups: [
      { name: 'Essentials', percent: 70 },
      { name: 'Savings', percent: 20 },
      { name: 'Discretionary', percent: 10 },
    ],
  },
  {
    label: '80/20',
    value: '80-20',
    groups: [
      { name: 'Spending', percent: 80 },
      { name: 'Savings', percent: 20 },
    ],
  },
]

const BUFFER_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '10%', value: 10 },
  { label: '15%', value: 15 },
  { label: '20%', value: 20 },
]

export function BudgetFormDialog({
  open,
  onOpenChange,
  initialTab = 'manual',
  editBudget,
  existingBudget,
  expenseCategories,
  budgets,
  spendingAverages,
  isMutating,
  onCreateBudget,
  onUpdateBudget,
}: BudgetFormDialogProps) {
  const isEditing = !!editBudget

  // Manual tab state
  const [manualCategoryId, setManualCategoryId] = useState('')
  const [manualAmount, setManualAmount] = useState('')
  const [manualPeriod, setManualPeriod] = useState<BudgetPeriod>('monthly')

  // Spending tab state
  const [bufferPercent, setBufferPercent] = useState(10)
  const [spendingSelections, setSpendingSelections] = useState<Record<string, boolean>>({})
  const [spendingOverrides, setSpendingOverrides] = useState<Record<string, string>>({})

  // Template tab state
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('50-30-20')
  const [templateAssignments, setTemplateAssignments] = useState<Record<string, string[]>>({})

  const budgetedCategoryIds = useMemo(() => new Set(budgets.map((b) => b.categoryId)), [budgets])

  const availableCategories = useMemo(
    () => expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id)),
    [expenseCategories, budgetedCategoryIds],
  )

  // Reset form state when dialog opens/changes
  useEffect(() => {
    if (!open) return

    if (editBudget && existingBudget) {
      setManualCategoryId(editBudget.categoryId)
      setManualAmount(String(existingBudget.amount / 100))
      setManualPeriod(editBudget.period)
    } else {
      setManualCategoryId('')
      setManualAmount('')
      setManualPeriod('monthly')
    }

    setBufferPercent(10)
    setSpendingSelections({})
    setSpendingOverrides({})
    setMonthlyIncome('')
    setSelectedTemplate('50-30-20')
    setTemplateAssignments({})
  }, [open, editBudget, existingBudget])

  const handleManualSubmit = async () => {
    const amountCents = Math.round(parseFloat(manualAmount) * 100)
    if (!amountCents || amountCents <= 0) return

    if (isEditing && editBudget) {
      await onUpdateBudget(editBudget.budgetId, {
        amount: amountCents,
        period: manualPeriod,
      })
    } else {
      if (!manualCategoryId) return
      await onCreateBudget({
        categoryId: manualCategoryId,
        amount: amountCents,
        period: manualPeriod,
        startDate: new Date(),
      })
    }
    onOpenChange(false)
  }

  const handleSpendingSubmit = async () => {
    const selectedAverages = spendingAverages.filter(
      (a) => spendingSelections[a.categoryId] && !budgetedCategoryIds.has(a.categoryId),
    )

    for (const avg of selectedAverages) {
      const overrideDollars = spendingOverrides[avg.categoryId]
      let amountCents: number
      if (overrideDollars && parseFloat(overrideDollars) > 0) {
        amountCents = Math.round(parseFloat(overrideDollars) * 100)
      } else {
        amountCents = Math.round(avg.monthlyAverageCents * (1 + bufferPercent / 100))
      }

      await onCreateBudget({
        categoryId: avg.categoryId,
        amount: amountCents,
        period: 'monthly',
        startDate: new Date(),
      })
    }
    onOpenChange(false)
  }

  const handleTemplateSubmit = async () => {
    const incomeCents = Math.round(parseFloat(monthlyIncome) * 100)
    if (!incomeCents || incomeCents <= 0) return

    const template = TEMPLATES.find((t) => t.value === selectedTemplate)
    if (!template) return

    for (const group of template.groups) {
      const groupCents = Math.round((incomeCents * group.percent) / 100)
      const assignedCategoryIds = templateAssignments[group.name] || []
      if (assignedCategoryIds.length === 0) continue

      const perCategoryCents = Math.round(groupCents / assignedCategoryIds.length)

      for (const categoryId of assignedCategoryIds) {
        if (budgetedCategoryIds.has(categoryId)) continue
        await onCreateBudget({
          categoryId,
          amount: perCategoryCents,
          period: 'monthly',
          startDate: new Date(),
        })
      }
    }
    onOpenChange(false)
  }

  const currentTemplate = TEMPLATES.find((t) => t.value === selectedTemplate)
  const incomeCents = Math.round((parseFloat(monthlyIncome) || 0) * 100)

  const toggleTemplateCategory = (groupName: string, categoryId: string) => {
    setTemplateAssignments((prev) => {
      const current = prev[groupName] || []
      // Remove from any other group first
      const updated = { ...prev }
      for (const key of Object.keys(updated)) {
        if (key !== groupName) {
          updated[key] = (updated[key] || []).filter((id) => id !== categoryId)
        }
      }
      // Toggle in current group
      if (current.includes(categoryId)) {
        updated[groupName] = current.filter((id) => id !== categoryId)
      } else {
        updated[groupName] = [...current, categoryId]
      }
      return updated
    })
  }

  const allAssignedCategoryIds = useMemo(() => {
    const ids = new Set<string>()
    for (const cats of Object.values(templateAssignments)) {
      for (const id of cats) ids.add(id)
    }
    return ids
  }, [templateAssignments])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the budget amount and period.'
              : 'Choose how you want to set up your budget.'}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          // Edit mode — manual form only
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={editBudget?.categoryName || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount ($)</Label>
              <Input
                id="edit-amount"
                type="number"
                min="0"
                step="0.01"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select
                value={manualPeriod}
                onValueChange={(v) => setManualPeriod(v as BudgetPeriod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleManualSubmit} disabled={isMutating || !manualAmount}>
                {isMutating ? 'Saving...' : 'Update Budget'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Create mode — tabbed interface
          <Tabs defaultValue={initialTab}>
            <TabsList className="w-full">
              <TabsTrigger value="manual" className="flex-1">
                Manual
              </TabsTrigger>
              <TabsTrigger value="spending" className="flex-1">
                From Spending
              </TabsTrigger>
              <TabsTrigger value="template" className="flex-1">
                Template
              </TabsTrigger>
            </TabsList>

            {/* Manual Tab */}
            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={manualCategoryId} onValueChange={setManualCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-amount">Amount ($)</Label>
                <Input
                  id="manual-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select
                  value={manualPeriod}
                  onValueChange={(v) => setManualPeriod(v as BudgetPeriod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleManualSubmit}
                  disabled={isMutating || !manualCategoryId || !manualAmount}
                >
                  {isMutating ? 'Creating...' : 'Create Budget'}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Spending Tab */}
            <TabsContent value="spending" className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <Label>Buffer</Label>
                <Select
                  value={String(bufferPercent)}
                  onValueChange={(v) => setBufferPercent(Number(v))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUFFER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">above 3-month average</span>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-4 py-1 px-2 text-xs font-medium text-muted-foreground">
                  <span className="w-4" />
                  <span className="flex-1">Category</span>
                  <span className="w-24 text-right">Avg/mo</span>
                  <span className="w-24 text-right">Suggested</span>
                  <span className="w-24 text-right">Override</span>
                </div>
                {spendingAverages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No spending history found for the last 3 months.
                  </p>
                ) : (
                  spendingAverages.map((avg) => {
                    const alreadyBudgeted = budgetedCategoryIds.has(avg.categoryId)
                    const suggestedCents = Math.round(
                      avg.monthlyAverageCents * (1 + bufferPercent / 100),
                    )
                    return (
                      <SpendingSuggestionRow
                        key={avg.categoryId}
                        categoryName={avg.categoryName}
                        averageCents={avg.monthlyAverageCents}
                        suggestedCents={suggestedCents}
                        overrideDollars={spendingOverrides[avg.categoryId] || ''}
                        selected={!!spendingSelections[avg.categoryId]}
                        disabled={alreadyBudgeted}
                        onToggle={() =>
                          setSpendingSelections((prev) => ({
                            ...prev,
                            [avg.categoryId]: !prev[avg.categoryId],
                          }))
                        }
                        onOverrideChange={(val) =>
                          setSpendingOverrides((prev) => ({
                            ...prev,
                            [avg.categoryId]: val,
                          }))
                        }
                      />
                    )
                  })
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSpendingSubmit}
                  disabled={
                    isMutating || Object.values(spendingSelections).filter(Boolean).length === 0
                  }
                >
                  {isMutating
                    ? 'Creating...'
                    : `Create ${Object.values(spendingSelections).filter(Boolean).length} Budget(s)`}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Template Tab */}
            <TabsContent value="template" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="template-income">Monthly Income ($)</Label>
                <Input
                  id="template-income"
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentTemplate && incomeCents > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    {currentTemplate.groups.map((group) => {
                      const groupCents = Math.round((incomeCents * group.percent) / 100)
                      const assignedIds = templateAssignments[group.name] || []
                      return (
                        <div key={group.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {group.name} ({group.percent}%)
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(groupCents)}
                              {assignedIds.length > 0 && (
                                <>
                                  {' '}
                                  &middot;{' '}
                                  {formatCurrency(Math.round(groupCents / assignedIds.length))}/each
                                </>
                              )}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {availableCategories.map((cat) => {
                              const isAssignedHere = assignedIds.includes(cat.id)
                              const isAssignedElsewhere =
                                allAssignedCategoryIds.has(cat.id) && !isAssignedHere
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => toggleTemplateCategory(group.name, cat.id)}
                                  disabled={isAssignedElsewhere}
                                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                                    isAssignedHere
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : isAssignedElsewhere
                                        ? 'opacity-40 cursor-not-allowed border-muted'
                                        : 'hover:bg-muted border-border'
                                  }`}
                                >
                                  {cat.name}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleTemplateSubmit}
                  disabled={isMutating || !monthlyIncome || allAssignedCategoryIds.size === 0}
                >
                  {isMutating ? 'Creating...' : 'Create Budgets'}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
