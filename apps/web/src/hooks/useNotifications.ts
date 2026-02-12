'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import type { Notification } from '@finance-app/shared-types'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refetch: () => void
}

export function useNotifications(accessToken: string | null): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const [notifResponse, countResponse] = await Promise.all([
        apiClient.notifications.list({ limit: 20 }),
        apiClient.notifications.getUnreadCount(),
      ])

      setNotifications(notifResponse.data)
      setUnreadCount(countResponse.data.count)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const markRead = useCallback(
    async (id: string) => {
      if (!accessToken) return
      const apiClient = createAuthenticatedApiClient(accessToken)
      await apiClient.notifications.markRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    },
    [accessToken],
  )

  const markAllRead = useCallback(async () => {
    if (!accessToken) return
    const apiClient = createAuthenticatedApiClient(accessToken)
    await apiClient.notifications.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }, [accessToken])

  const deleteNotification = useCallback(
    async (id: string) => {
      if (!accessToken) return
      const apiClient = createAuthenticatedApiClient(accessToken)
      await apiClient.notifications.delete(id)
      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === id)
        if (removed && !removed.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1))
        }
        return prev.filter((n) => n.id !== id)
      })
    },
    [accessToken],
  )

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markRead,
    markAllRead,
    deleteNotification,
    refetch: fetchData,
  }
}
