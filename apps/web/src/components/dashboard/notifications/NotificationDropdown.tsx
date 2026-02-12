'use client'

import type { Notification } from '@finance-app/shared-types'
import { NotificationItem } from './NotificationItem'

interface NotificationDropdownProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onDelete: (id: string) => void
  isLoading: boolean
}

export function NotificationDropdown({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  isLoading,
}: NotificationDropdownProps) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={onMarkAllRead} className="text-xs text-primary hover:underline">
            Mark all read
          </button>
        )}
      </div>
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}
