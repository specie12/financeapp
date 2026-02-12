'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import type { BudgetPeriod } from '@finance-app/shared-types'

interface BudgetPageHeaderProps {
  period: BudgetPeriod
  onPeriodChange: (period: BudgetPeriod) => void
  onAddBudget: () => void
}

export function BudgetPageHeader({ period, onPeriodChange, onAddBudget }: BudgetPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Budget</h1>
      <div className="flex items-center gap-3">
        <Select value={period} onValueChange={(v) => onPeriodChange(v as BudgetPeriod)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onAddBudget}>
          <Plus className="h-4 w-4 mr-2" />
          Add Budget
        </Button>
      </div>
    </div>
  )
}
