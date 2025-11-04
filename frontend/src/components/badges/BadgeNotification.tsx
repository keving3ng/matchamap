/**
 * BadgeNotification component for displaying badge achievements
 * Shows a celebration modal when users earn new badges
 */

import React, { useEffect, useState } from 'react'
import { COPY } from '../../constants/copy'
import { PrimaryButton, SecondaryButton } from '../ui'
import type { UserBadge } from '../../../../shared/types'

interface BadgeNotificationProps {
  badges: UserBadge[]
  isOpen: boolean
  onClose: () => void
  onViewAllBadges?: () => void
}

export const BadgeNotification: React.FC<BadgeNotificationProps> = ({
  badges,
  isOpen,
  onClose,
  onViewAllBadges,
}) => {
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0)

  // Derive visibility from props
  const isVisible = isOpen && badges.length > 0

  // Note: Badge index is automatically reset on remount (via key prop in parent)

  // Auto-advance through multiple badges
  useEffect(() => {
    if (!isOpen || badges.length <= 1) return

    const timer = setTimeout(() => {
      if (currentBadgeIndex < badges.length - 1) {
        setCurrentBadgeIndex(currentBadgeIndex + 1)
      }
    }, 3000) // Show each badge for 3 seconds

    return () => clearTimeout(timer)
  }, [isOpen, currentBadgeIndex, badges.length])

  if (!isOpen || badges.length === 0) {
    return null
  }

  const currentBadge = badges[currentBadgeIndex]
  if (!currentBadge?.definition) {
    return null
  }

  const isMultipleBadges = badges.length > 1
  const badgeCategory = currentBadge.definition.category
  const achievementMessage = COPY.badges.achievementMessage[badgeCategory] || ''

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`
          fixed inset-0 bg-black/50 z-50
          transition-opacity duration-300
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-300
        ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        <div 
          className="
            bg-white rounded-2xl shadow-xs 
            max-w-md w-full p-6 
            text-center space-y-6
            transform transition-all duration-300
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Celebration Header */}
          <div className="space-y-2">
            <div className="text-4xl animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900">
              {COPY.badges.congratulations}
            </h2>
            <p className="text-lg text-green-600 font-medium">
              {COPY.badges.newBadge}
            </p>
          </div>

          {/* Badge Display */}
          <div className="space-y-4">
            {/* Large Badge Icon */}
            <div className="flex justify-center">
              <div className="
                w-24 h-24 
                bg-gradient-to-br from-green-400 to-green-600 
                rounded-full 
                flex items-center justify-center 
                text-4xl
                shadow-xs shadow-green-200
                border-4 border-white
                animate-pulse
              ">
                {currentBadge.definition.icon}
              </div>
            </div>

            {/* Badge Details */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">
                {currentBadge.definition.name}
              </h3>
              <p className="text-gray-600">
                {currentBadge.definition.description}
              </p>
              {achievementMessage && (
                <p className="text-sm text-green-600 font-medium">
                  {achievementMessage}
                </p>
              )}
            </div>

            {/* Progress Display (if relevant) */}
            {currentBadge.progressValue && currentBadge.definition.threshold && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  {COPY.badges.currentProgress(
                    currentBadge.progressValue, 
                    currentBadge.definition.threshold
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Multiple Badge Indicator */}
          {isMultipleBadges && (
            <div className="space-y-2">
              <div className="flex justify-center space-x-2">
                {badges.map((_, index) => (
                  <div
                    key={index}
                    className={`
                      w-2 h-2 rounded-full transition-colors
                      ${index === currentBadgeIndex ? 'bg-green-500' : 'bg-gray-300'}
                    `}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">
                {currentBadgeIndex + 1} of {badges.length} new badges
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {onViewAllBadges ? (
              <div className="flex space-x-3">
                <SecondaryButton 
                  onClick={onClose}
                  className="flex-1"
                >
                  {COPY.badges.dismiss}
                </SecondaryButton>
                <PrimaryButton 
                  onClick={() => {
                    onViewAllBadges()
                    onClose()
                  }}
                  className="flex-1"
                >
                  {COPY.badges.viewAllBadges}
                </PrimaryButton>
              </div>
            ) : (
              <PrimaryButton 
                onClick={onClose}
                className="w-full"
              >
                {COPY.badges.dismiss}
              </PrimaryButton>
            )}

            {/* Next Badge Button (for multiple badges) */}
            {isMultipleBadges && currentBadgeIndex < badges.length - 1 && (
              <SecondaryButton
                onClick={() => setCurrentBadgeIndex(currentBadgeIndex + 1)}
                className="w-full text-sm"
              >
                Next Badge →
              </SecondaryButton>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

interface BadgeToastProps {
  badge: UserBadge
  isVisible: boolean
  onClose: () => void
  onClick?: () => void
}

export const BadgeToast: React.FC<BadgeToastProps> = ({
  badge,
  isVisible,
  onClose,
  onClick,
}) => {
  useEffect(() => {
    if (isVisible) {
      // Auto-hide after 5 seconds
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible || !badge.definition) {
    return null
  }

  return (
    <div className={`
      fixed top-4 right-4 z-50
      transform transition-all duration-300 ease-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div 
        className="
          bg-white rounded-lg shadow-xs border border-gray-200
          p-4 max-w-sm
          cursor-pointer hover:shadow-xs
          transition-shadow-xs duration-200
        "
        onClick={onClick}
      >
        <div className="flex items-start space-x-3">
          {/* Badge Icon */}
          <div className="
            w-10 h-10 
            bg-gradient-to-br from-green-400 to-green-600 
            rounded-full 
            flex items-center justify-center 
            text-lg
            flex-shrink-0
          ">
            {badge.definition.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {COPY.badges.newBadge}
            </p>
            <p className="text-sm text-gray-600 truncate">
              {badge.definition.name}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="
              text-gray-400 hover:text-gray-600 
              transition-colors duration-200
              flex-shrink-0
            "
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default BadgeNotification