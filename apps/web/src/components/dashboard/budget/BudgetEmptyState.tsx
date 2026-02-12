'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LayoutTemplate, TrendingUp, PenLine } from 'lucide-react'

interface BudgetEmptyStateProps {
  onTemplate: () => void
  onSpending: () => void
  onManual: () => void
}

export function BudgetEmptyState({ onTemplate, onSpending, onManual }: BudgetEmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-xl font-semibold">No budgets yet</h2>
            <p className="text-muted-foreground mt-1">
              Get started by creating your first budget using one of the options below.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" onClick={onTemplate} className="w-full sm:w-auto">
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Start with Template
            </Button>
            <Button variant="outline" onClick={onSpending} className="w-full sm:w-auto">
              <TrendingUp className="h-4 w-4 mr-2" />
              Create from Spending
            </Button>
            <Button variant="outline" onClick={onManual} className="w-full sm:w-auto">
              <PenLine className="h-4 w-4 mr-2" />
              Add Manually
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
