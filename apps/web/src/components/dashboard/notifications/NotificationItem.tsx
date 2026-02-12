'use client'

import type { Notification } from '@finance-app/shared-types'

const typeIcons: Record<string, string> = {
  budget_exceeded: '💰',
  goal_milestone: '🎯',
  bill_due: '📋',
  large_transaction: '💳',
  net_worth_milestone: '📈',
  ai_insight: '🤖',
}

interface NotificationItemProps {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}

export function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
  const icon = typeIcons[notification.type] || '🔔'
  const timeAgo = getTimeAgo(new Date(notification.createdAt))

  return (
    <div
      className={`flex items-start gap-3 p-3 border-b last:border-b-0 cursor-pointer transition-colors ${
        notification.isRead ? 'bg-background' : 'bg-muted/50'
      } hover:bg-muted/30`}
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm truncate ${notification.isRead ? 'font-normal' : 'font-semibold'}`}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(notification.id)
        }}
        className="text-muted-foreground hover:text-foreground text-xs flex-shrink-0"
        title="Dismiss"
      >
        &times;
      </button>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
