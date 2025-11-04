/**
 * NotificationList component - Dropdown list of notifications
 * Displays recent notifications with mark as read functionality
 */

import React, { useState, useEffect } from 'react'
import { COPY } from '../../constants/copy'
import { api } from '../../utils/api'
import { SecondaryButton, TertiaryButton } from '../ui'

interface NotificationItem {
  id: number
  type: 'follower' | 'comment' | 'helpful' | 'badge' | 'comment_like'
  message: string
  resourceType?: 'review' | 'comment' | 'badge' | 'user'
  resourceId?: number
  isRead: boolean
  createdAt: string
  actorId?: number
  actorUsername?: string
  actorDisplayName?: string
  actorAvatarUrl?: string
}

interface NotificationListProps {
  onClose: () => void
}

export const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.notifications.getAll({ limit: 20 })
      setNotifications(response.notifications)
      setUnreadCount(response.unreadCount)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      setError(COPY.notifications.error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await api.notifications.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return COPY.notifications.justNow
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return COPY.notifications.minutesAgo(diffInMinutes)
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return COPY.notifications.hoursAgo(diffInHours)
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return COPY.notifications.daysAgo(diffInDays)
    }

    const diffInWeeks = Math.floor(diffInDays / 7)
    return COPY.notifications.weeksAgo(diffInWeeks)
  }

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'follower':
        return '👤'
      case 'comment':
        return '💬'
      case 'comment_like':
        return '❤️'
      case 'helpful':
        return '👍'
      case 'badge':
        return '🏆'
      default:
        return '🔔'
    }
  }

  return (
    <div className="w-96 max-h-[600px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {COPY.notifications.title}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              {COPY.notifications.markAllRead}
            </button>
          )}
        </div>
        {unreadCount > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {COPY.notifications.unreadCount(unreadCount)}
          </p>
        )}
      </div>

      {/* Notification List */}
      <div className="overflow-y-auto max-h-[500px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">{COPY.notifications.loading}</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-red-600 mb-4">{error}</p>
            <TertiaryButton onClick={fetchNotifications}>
              {COPY.notifications.retry}
            </TertiaryButton>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-gray-900 font-medium mb-1">
              {COPY.notifications.empty}
            </p>
            <p className="text-sm text-gray-600">
              {COPY.notifications.emptyDescription}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`
                  px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer
                  ${!notification.isRead ? 'bg-green-50' : ''}
                `}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.id)
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 text-2xl mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationList
