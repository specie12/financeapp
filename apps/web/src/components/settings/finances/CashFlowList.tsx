'use client'

import { useState } from 'react'
import type { CashFlowItem, CashFlowType } from '@finance-app/shared-types'
import { createAuthenticatedApiClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { CashFlowModal } from './CashFlowModal'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

interface CashFlowListProps {
  items: CashFlowItem[]
  type: CashFlowType
  onRefresh: () => void
  accessToken: string | null
}

const FREQUENCY_LABELS: Record<string, string> = {
  one_time: 'One-time',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
}

export function CashFlowList({ items, type, onRefresh, accessToken }: CashFlowListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CashFlowItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<CashFlowItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const isIncome = type === 'income'
  const label = isIncome ? 'Income' : 'Expense'

  // Calculate monthly equivalent for display
  const getMonthlyEquivalent = (item: CashFlowItem): number => {
    const amount = item.amountCents
    switch (item.frequency) {
      case 'weekly':
        return (amount * 52) / 12
      case 'biweekly':
        return (amount * 26) / 12
      case 'monthly':
        return amount
      case 'quarterly':
        return amount / 3
      case 'annually':
        return amount / 12
      case 'one_time':
        return 0
      default:
        return amount
    }
  }

  const totalMonthly = items.reduce((sum, item) => sum + getMonthlyEquivalent(item), 0)

  const handleEdit = (item: CashFlowItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem || !accessToken) return

    setIsDeleting(true)
    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      await apiClient.cashFlowItems.delete(deletingItem.id)
      onRefresh()
      setDeletingItem(null)
    } catch (err) {
      console.error('Failed to delete cash flow item:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleModalSuccess = () => {
    onRefresh()
    setEditingItem(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Total {label}</h3>
          <p className={`text-2xl font-bold ${isIncome ? 'text-green-600' : 'text-orange-600'}`}>
            {formatCurrency(totalMonthly)}/mo
          </p>
        </div>
        <Button onClick={handleAdd}>Add {label}</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No {label.toLowerCase()} items added yet.</p>
          <p className="text-sm">Click &quot;Add {label}&quot; to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {FREQUENCY_LABELS[item.frequency] || item.frequency}
                  {item.annualGrowthRatePercent !== null &&
                    ` • ${item.annualGrowthRatePercent}% annual growth`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="font-semibold">{formatCurrency(item.amountCents)}</span>
                  {item.frequency !== 'monthly' && item.frequency !== 'one_time' && (
                    <p className="text-xs text-muted-foreground">
                      ~{formatCurrency(getMonthlyEquivalent(item))}/mo
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingItem(item)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CashFlowModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        item={editingItem}
        type={type}
        onSuccess={handleModalSuccess}
        accessToken={accessToken}
      />

      <DeleteConfirmDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title={`Delete ${label}`}
        description={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
