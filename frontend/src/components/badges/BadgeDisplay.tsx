/**
 * BadgeDisplay component for showing user badges
 * Displays earned badges with their icons, names, and progress
 */

import React from 'react'
import { COPY } from '../../constants/copy'
import type { UserBadge, BadgeDefinition } from '../../../../shared/types'

interface BadgeDisplayProps {
  badge: UserBadge
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
  onClick?: () => void
  className?: string
}

interface BadgeIconProps {
  badge: BadgeDefinition
  size: 'sm' | 'md' | 'lg'
  isEarned: boolean
}

const BadgeIcon: React.FC<BadgeIconProps> = ({ badge, size, isEarned }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        rounded-full
        ${isEarned 
          ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-200' 
          : 'bg-gray-200 grayscale opacity-50'
        }
        border-2 border-white
        transition-all duration-200
      `}
    >
      <span className={`${isEarned ? 'filter-none' : 'grayscale'}`}>
        {badge.icon}
      </span>
    </div>
  )
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  size = 'md',
  showProgress = false,
  onClick,
  className = '',
}) => {
  if (!badge.definition) {
    return null
  }

  const isClickable = !!onClick
  const earnedDate = new Date(badge.earnedAt).toLocaleDateString()

  return (
    <div
      className={`
        ${className}
        ${isClickable ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
        transition-transform duration-200
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      } : undefined}
    >
      <div className="text-center space-y-2">
        {/* Badge Icon */}
        <div className="flex justify-center">
          <BadgeIcon
            badge={badge.definition}
            size={size}
            isEarned={true}
          />
        </div>

        {/* Badge Name */}
        <div className="space-y-1">
          <h3 className={`
            font-semibold text-gray-900
            ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}
          `}>
            {badge.definition.name}
          </h3>
          
          {/* Badge Description */}
          <p className={`
            text-gray-600
            ${size === 'sm' ? 'text-xs' : 'text-sm'}
          `}>
            {badge.definition.description}
          </p>
        </div>

        {/* Earned Date */}
        <p className={`
          text-gray-500
          ${size === 'sm' ? 'text-xs' : 'text-xs'}
        `}>
          {COPY.badges.earnedOn} {earnedDate}
        </p>

        {/* Progress Value (if available) */}
        {showProgress && badge.progressValue && badge.definition.threshold && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {COPY.badges.currentProgress(badge.progressValue, badge.definition.threshold)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

interface BadgeGridProps {
  badges: UserBadge[]
  onBadgeClick?: (badge: UserBadge) => void
  emptyMessage?: string
  className?: string
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  badges,
  onBadgeClick,
  emptyMessage = COPY.badges.noBadges,
  className = '',
}) => {
  if (badges.length === 0) {
    return (
      <div className={`text-center py-8 space-y-2 ${className}`}>
        <p className="text-gray-600">{emptyMessage}</p>
        <p className="text-sm text-gray-500">{COPY.badges.earnBadges}</p>
      </div>
    )
  }

  return (
    <div className={`
      grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4
      ${className}
    `}>
      {badges.map((badge) => (
        <BadgeDisplay
          key={badge.id}
          badge={badge}
          size="md"
          onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
          className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
        />
      ))}
    </div>
  )
}

export default BadgeDisplay