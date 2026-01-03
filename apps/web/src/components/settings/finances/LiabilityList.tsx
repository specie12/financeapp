'use client'

import { useState } from 'react'
import type { Liability } from '@finance-app/shared-types'
import { createAuthenticatedApiClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { LiabilityModal } from './LiabilityModal'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

interface LiabilityListProps {
  liabilities: Liability[]
  onRefresh: () => void
  accessToken: string | null
}

const LIABILITY_TYPE_LABELS: Record<string, string> = {
  mortgage: 'Mortgage',
  auto_loan: 'Auto Loan',
  student_loan: 'Student Loan',
  credit_card: 'Credit Card',
  personal_loan: 'Personal Loan',
  other: 'Other',
}

export function LiabilityList({ liabilities, onRefresh, accessToken }: LiabilityListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null)
  const [deletingLiability, setDeletingLiability] = useState<Liability | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Group liabilities by type
  const liabilitiesByType = liabilities.reduce(
    (acc, liability) => {
      const type = liability.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(liability)
      return acc
    },
    {} as Record<string, Liability[]>,
  )

  const totalBalance = liabilities.reduce(
    (sum, liability) => sum + liability.currentBalanceCents,
    0,
  )

  const handleEdit = (liability: Liability) => {
    setEditingLiability(liability)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingLiability(null)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingLiability || !accessToken) return

    setIsDeleting(true)
    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      await apiClient.liabilities.delete(deletingLiability.id)
      onRefresh()
      setDeletingLiability(null)
    } catch (err) {
      console.error('Failed to delete liability:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleModalSuccess = () => {
    onRefresh()
    setEditingLiability(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Total Debts</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalBalance)}</p>
        </div>
        <Button onClick={handleAdd}>Add Debt</Button>
      </div>

      {liabilities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No debts added yet.</p>
          <p className="text-sm">Click &quot;Add Debt&quot; to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(liabilitiesByType).map(([type, typeLiabilities]) => (
            <div key={type} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {LIABILITY_TYPE_LABELS[type] || type}
              </h4>
              <div className="space-y-2">
                {typeLiabilities.map((liability) => (
                  <div
                    key={liability.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{liability.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {liability.interestRatePercent}% APR
                        {liability.termMonths && ` • ${liability.termMonths} months`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-semibold">
                          {formatCurrency(liability.currentBalanceCents)}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(liability.minimumPaymentCents)}/mo min
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(liability)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingLiability(liability)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <LiabilityModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        liability={editingLiability}
        onSuccess={handleModalSuccess}
        accessToken={accessToken}
      />

      <DeleteConfirmDialog
        open={!!deletingLiability}
        onOpenChange={(open) => !open && setDeletingLiability(null)}
        title="Delete Debt"
        description={`Are you sure you want to delete "${deletingLiability?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
