'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Pencil, Trash2 } from 'lucide-react'
import type { BudgetStatusItem } from '@finance-app/shared-types'

interface BudgetItemCardProps {
  budget: BudgetStatusItem
  onEdit: () => void
  onDelete: () => void
}

export function BudgetItemCard({ budget, onEdit, onDelete }: BudgetItemCardProps) {
  const progressValue = Math.min(budget.percentUsed, 100)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium">{budget.categoryName}</h3>
            <Badge variant="secondary" className="mt-1 text-xs">
              {budget.period}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Progress
            value={progressValue}
            className={budget.isOverBudget ? '[&>div]:bg-red-500' : ''}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(budget.spentAmountCents)} /{' '}
              {formatCurrency(budget.budgetedAmountCents)}
            </span>
            <span className={budget.isOverBudget ? 'text-red-600 font-medium' : 'text-green-600'}>
              {budget.isOverBudget
                ? `${formatCurrency(Math.abs(budget.remainingCents))} over`
                : `${formatCurrency(budget.remainingCents)} left`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{budget.percentUsed.toFixed(0)}% used</p>
        </div>
      </CardContent>
    </Card>
  )
}
