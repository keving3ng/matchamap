import React from 'react'
import { Star } from '@/components/icons'

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/**
 * ScoreBadge - Displays cafe/drink rating scores
 * Consistent sizing and styling for all score displays
 */
export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = 'md',
  className = ''
}) => {
  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-sm',
    md: 'px-3 py-1 text-base',
    lg: 'px-4 py-2 text-xl',
    xl: 'px-4 py-2 text-2xl'
  }

  return (
    <div
      className={`
        bg-gradient-to-br from-green-500 to-green-600
        text-white
        rounded-full
        font-bold
        shadow-md
        flex items-center justify-center
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {score.toFixed(1)}
    </div>
  )
}

interface DrinkScoreBadgeProps {
  score: number
  className?: string
}

/**
 * DrinkScoreBadge - Displays drink scores with star icon
 * Smaller, inline variant for drink lists
 */
export const DrinkScoreBadge: React.FC<DrinkScoreBadgeProps> = ({
  score,
  className = ''
}) => {
  return (
    <div
      className={`
        flex items-center gap-1
        ${className}
      `}
    >
      <Star size={12} className="text-green-600 fill-green-600" />
      <span className="font-semibold text-green-600">{score.toFixed(1)}</span>
    </div>
  )
}

interface StatusBadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  className?: string
}

/**
 * StatusBadge - General purpose badge for status indicators
 * Used for tags, labels, and status messages
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  variant = 'default',
  className = ''
}) => {
  const variantStyles = {
    success: 'bg-green-100 text-green-700 border-green-300',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    error: 'bg-red-100 text-red-700 border-red-300',
    info: 'bg-blue-100 text-blue-700 border-blue-300',
    default: 'bg-gray-100 text-gray-700 border-gray-300'
  }

  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        rounded-full
        text-xs font-medium
        border
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

interface FeatureBadgeProps {
  children: React.ReactNode
  className?: string
}

/**
 * FeatureBadge - Highlights featured/default items
 * Used for default drinks and highlighted menu items
 */
export const FeatureBadge: React.FC<FeatureBadgeProps> = ({
  children,
  className = ''
}) => {
  return (
    <span
      className={`
        px-2 py-0.5
        bg-green-500
        text-white
        text-xs
        rounded
        font-medium
        ${className}
      `}
    >
      {children}
    </span>
  )
}

interface NotificationBadgeProps {
  count?: number
  pulse?: boolean
  className?: string
}

/**
 * NotificationBadge - Small dot indicator for notifications
 * Can display count or just be a visual indicator
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  pulse = false,
  className = ''
}) => {
  return (
    <span
      className={`
        absolute -top-1 -right-1
        ${count ? 'px-1.5 py-0.5 min-w-[18px]' : 'w-3 h-3'}
        bg-red-500
        border-2 border-white
        rounded-full
        text-white text-xs font-bold
        flex items-center justify-center
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {count && count}
    </span>
  )
}
