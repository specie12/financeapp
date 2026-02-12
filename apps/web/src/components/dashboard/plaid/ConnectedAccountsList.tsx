'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { PlaidItem } from '@finance-app/shared-types'

interface ConnectedAccountsListProps {
  items: PlaidItem[]
  onSync: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isLoading: boolean
}

const statusColors: Record<string, string> = {
  active: 'text-green-600',
  error: 'text-red-600',
  disconnected: 'text-yellow-600',
}

export function ConnectedAccountsList({
  items,
  onSync,
  onDelete,
  isLoading,
}: ConnectedAccountsListProps) {
  if (isLoading) {
    return <div className="text-center py-4 text-muted-foreground">Loading accounts...</div>
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No bank accounts connected yet.</p>
        <p className="text-sm mt-1">Connect your first account to start syncing transactions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <h3 className="font-medium">{item.institutionName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${statusColors[item.status] || ''}`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
                {item.lastSyncedAt && (
                  <span className="text-xs text-muted-foreground">
                    Last synced: {new Date(item.lastSyncedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSync(item.id)}
                disabled={item.status === 'disconnected'}
              >
                Sync
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="text-destructive hover:text-destructive"
              >
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
