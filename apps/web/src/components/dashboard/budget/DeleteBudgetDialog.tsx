'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryName: string
  isMutating: boolean
  onConfirm: () => void
}

export function DeleteBudgetDialog({
  open,
  onOpenChange,
  categoryName,
  isMutating,
  onConfirm,
}: DeleteBudgetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Budget</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the budget for <strong>{categoryName}</strong>? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isMutating}>
            {isMutating ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
