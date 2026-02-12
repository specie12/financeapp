'use client'

import type { PlaidItem } from '@finance-app/shared-types'

interface PlaidSyncStatusProps {
  items: PlaidItem[]
}

export function PlaidSyncStatus({ items }: PlaidSyncStatusProps) {
  const activeCount = items.filter((i) => i.status === 'active').length
  const errorCount = items.filter((i) => i.status === 'error').length

  const lastSync = items
    .filter((i) => i.lastSyncedAt)
    .sort((a, b) => new Date(b.lastSyncedAt!).getTime() - new Date(a.lastSyncedAt!).getTime())[0]

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <span>{activeCount} connected</span>
      {errorCount > 0 && <span className="text-red-600">{errorCount} with errors</span>}
      {lastSync?.lastSyncedAt && (
        <span>Last sync: {new Date(lastSync.lastSyncedAt).toLocaleString()}</span>
      )}
    </div>
  )
}
