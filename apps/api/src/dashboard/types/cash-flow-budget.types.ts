import type { CashFlowType, Frequency, BudgetPeriod } from '@finance-app/shared-types'

export interface CashFlowItemSummary {
  id: string
  name: string
  type: CashFlowType
  frequency: Frequency
  originalAmountCents: number
  monthlyAmountCents: number
}

export interface CashFlowSummaryResponse {
  totalMonthlyIncomeCents: number
  totalMonthlyExpensesCents: number
  netMonthlyCashFlowCents: number
  savingsRatePercent: number
  items: CashFlowItemSummary[]
}

export interface BudgetStatusItem {
  budgetId: string
  categoryId: string
  categoryName: string
  budgetedAmountCents: number
  spentAmountCents: number
  remainingCents: number
  percentUsed: number
  isOverBudget: boolean
  period: BudgetPeriod
}

export interface BudgetStatusResponse {
  budgets: BudgetStatusItem[]
  totalBudgetedCents: number
  totalSpentCents: number
  overBudgetCount: number
}
