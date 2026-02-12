'use client'

import { useBudgets } from './useBudgets'
import { useCategories } from './useCategories'
import { useSpendingAverages } from './useSpendingAverages'
import { useBudgetStatus } from './useBudgetStatus'

export function useBudgetPage(accessToken: string | null, period?: string) {
  const budgets = useBudgets(accessToken)
  const categories = useCategories(accessToken)
  const spendingAverages = useSpendingAverages(accessToken, categories.categories)
  const budgetStatus = useBudgetStatus(accessToken, period)

  const isLoading =
    budgets.isLoading ||
    categories.isLoading ||
    spendingAverages.isLoading ||
    budgetStatus.isLoading

  const error = budgets.error || categories.error || budgetStatus.error

  const refetchAll = () => {
    budgets.refetch()
    budgetStatus.refetch()
  }

  return {
    budgets: budgets.budgets,
    budgetStatus: budgetStatus.data,
    categories: categories.categories,
    expenseCategories: categories.expenseCategories,
    spendingAverages: spendingAverages.averages,
    totalMonthlySpendingCents: spendingAverages.totalMonthlySpendingCents,
    isLoading,
    error,
    isMutating: budgets.isMutating,
    createBudget: budgets.createBudget,
    updateBudget: budgets.updateBudget,
    deleteBudget: budgets.deleteBudget,
    refetchAll,
  }
}
