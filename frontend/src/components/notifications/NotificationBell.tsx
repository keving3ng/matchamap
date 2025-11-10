/**
 * NotificationBell component - Bell icon with unread count badge
 * Displays in header and opens NotificationList dropdown on click
 */

import React, { useState, useEffect } from 'react'
import { COPY } from '../../constants/copy'
import { api } from '../../utils/api'
import { NotificationList } from './NotificationList'

// Polling interval for fetching unread count (30 seconds)
const NOTIFICATION_POLL_INTERVAL_MS = 30000

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount()

    // Poll for new notifications
    const interval = setInterval(fetchUnreadCount, NOTIFICATION_POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await api.notifications.getUnreadCount()
      setUnreadCount(response.unreadCount)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleClose = () => {
    setIsOpen(false)
    // Refresh unread count when closing
    fetchUnreadCount()
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="
          relative p-2 rounded-lg
          text-gray-700 hover:bg-gray-100
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-green-500
        "
        aria-label={COPY.notifications.title}
        aria-expanded={isOpen}
      >
        {/* Bell Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span
            className="
              absolute -top-1 -right-1
              min-w-[20px] h-5 px-1.5
              flex items-center justify-center
              text-xs font-bold text-white
              bg-red-500 rounded-full
              border-2 border-white
            "
            aria-label={COPY.notifications.unreadCount(unreadCount)}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification List Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 z-50">
            <NotificationList onClose={handleClose} />
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
