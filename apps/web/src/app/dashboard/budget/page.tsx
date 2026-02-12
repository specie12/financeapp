'use client'

import { useEffect, useState } from 'react'
import { useBudgetPage } from '@/hooks/useBudgetPage'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import {
  BudgetOverview,
  SpendingByCategoryChart,
  BudgetPageHeader,
  BudgetList,
  BudgetEmptyState,
  BudgetFormDialog,
  DeleteBudgetDialog,
} from '@/components/dashboard/budget'
import type { BudgetPeriod, BudgetStatusItem } from '@finance-app/shared-types'

type TabValue = 'manual' | 'spending' | 'template'

export default function BudgetPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [period, setPeriod] = useState<BudgetPeriod>('monthly')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [initialTab, setInitialTab] = useState<TabValue>('manual')
  const [editingBudget, setEditingBudget] = useState<BudgetStatusItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingBudget, setDeletingBudget] = useState<BudgetStatusItem | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const {
    budgets,
    budgetStatus,
    expenseCategories,
    spendingAverages,
    isLoading,
    error,
    isMutating,
    createBudget,
    updateBudget,
    deleteBudget,
    refetchAll,
  } = useBudgetPage(accessToken, period)

  const openCreateDialog = (tab: TabValue) => {
    setEditingBudget(null)
    setInitialTab(tab)
    setDialogOpen(true)
  }

  const openEditDialog = (budget: BudgetStatusItem) => {
    setEditingBudget(budget)
    setInitialTab('manual')
    setDialogOpen(true)
  }

  const openDeleteDialog = (budget: BudgetStatusItem) => {
    setDeletingBudget(budget)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingBudget) return
    await deleteBudget(deletingBudget.budgetId)
    setDeleteDialogOpen(false)
    setDeletingBudget(null)
    refetchAll()
  }

  const handleCreateBudget = async (data: Parameters<typeof createBudget>[0]) => {
    await createBudget(data)
    refetchAll()
  }

  const handleUpdateBudget = async (id: string, data: Parameters<typeof updateBudget>[1]) => {
    await updateBudget(id, data)
    refetchAll()
  }

  // Find the full Budget object for editing
  const existingBudgetForEdit = editingBudget
    ? budgets.find((b) => b.id === editingBudget.budgetId) || null
    : null

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Budget</h1>
        <ErrorState
          title="Not Authenticated"
          message="Please log in to view your budget dashboard."
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Budget</h1>
        <LoadingState message="Loading budget data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Budget</h1>
        <ErrorState message={error} onRetry={refetchAll} />
      </div>
    )
  }

  const hasBudgets = budgetStatus && budgetStatus.budgets.length > 0

  return (
    <div className="space-y-6">
      <BudgetPageHeader
        period={period}
        onPeriodChange={setPeriod}
        onAddBudget={() => openCreateDialog('manual')}
      />

      {budgetStatus && <BudgetOverview data={budgetStatus} />}

      {hasBudgets ? (
        <>
          <BudgetList
            budgets={budgetStatus!.budgets}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
          />
          <SpendingByCategoryChart budgets={budgetStatus!.budgets} />
        </>
      ) : (
        <BudgetEmptyState
          onTemplate={() => openCreateDialog('template')}
          onSpending={() => openCreateDialog('spending')}
          onManual={() => openCreateDialog('manual')}
        />
      )}

      <BudgetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialTab={initialTab}
        editBudget={editingBudget}
        existingBudget={existingBudgetForEdit}
        expenseCategories={expenseCategories}
        budgets={budgets}
        spendingAverages={spendingAverages}
        isMutating={isMutating}
        onCreateBudget={handleCreateBudget}
        onUpdateBudget={handleUpdateBudget}
      />

      <DeleteBudgetDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        categoryName={deletingBudget?.categoryName || ''}
        isMutating={isMutating}
        onConfirm={handleDelete}
      />
    </div>
  )
}
