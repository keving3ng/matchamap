/**
 * BadgesPage component for displaying user badges and progress
 * Shows earned badges, progress toward unearned badges, and badge categories
 */

import React, { useState } from 'react';
import { COPY } from '../constants/copy'
import { PrimaryButton, SecondaryButton, Skeleton } from './ui'
import { BadgeGrid, BadgeNotification } from './badges'
import { useBadges } from '../hooks/useBadges'
import type { BadgeCategory } from '../../../shared/types'

interface BadgesPageProps {
  className?: string
}

export const BadgesPage: React.FC<BadgesPageProps> = ({
  className = '',
}) => {
  const {
    badges,
    progress,
    isLoading,
    isChecking,
    error,
    newBadges,
    hasNewBadges,
    checkForNewBadges,
    dismissNewBadges,
    refresh,
  } = useBadges()

  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all')

  // Derive notification visibility from hasNewBadges
  const showNotification = hasNewBadges

  // Handle notification close
  const handleNotificationClose = () => {
    dismissNewBadges()
  }

  // Filter badges by category
  const filteredBadges = selectedCategory === 'all'
    ? badges
    : badges.filter(badge => badge.badgeCategory === selectedCategory)

  if (error) {
    return (
      <div className={`${className} text-center py-8 space-y-4`}>
        <p className="text-red-600">{COPY.badges.loadError}</p>
        <SecondaryButton onClick={refresh}>
          {COPY.badges.retry}
        </SecondaryButton>
      </div>
    )
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {COPY.badges.title}
          </h1>
          <p className="text-gray-600 mt-1">
            {badges.length > 0
              ? `${badges.length} badge${badges.length !== 1 ? 's' : ''} earned`
              : COPY.badges.earnBadges
            }
          </p>
        </div>

        {/* Check Progress Button */}
        <PrimaryButton
          onClick={checkForNewBadges}
          disabled={isChecking}
          className="min-w-[120px]"
        >
          {isChecking ? COPY.badges.checkingProgress : COPY.badges.checkProgress}
        </PrimaryButton>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${selectedCategory === 'all'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {COPY.badges.allBadges}
        </button>
        {Object.entries(COPY.badges.categories).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key as BadgeCategory)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${selectedCategory === key
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-3 border border-gray-200 rounded-lg">
                <Skeleton className="w-12 h-12 rounded-full mx-auto mb-2" />
                <Skeleton className="h-4 w-3/4 mx-auto mb-1" />
                <Skeleton className="h-3 w-full mx-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earned Badges */}
      {!isLoading && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {COPY.badges.earnedBadges}
          </h2>
          <BadgeGrid
            badges={filteredBadges}
            emptyMessage={
              selectedCategory === 'all'
                ? COPY.badges.noBadges
                : `No ${COPY.badges.categories[selectedCategory as BadgeCategory]?.toLowerCase()} badges yet`
            }
          />
        </div>
      )}

      {/* Progress Section */}
      {!isLoading && progress.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {COPY.badges.badgeProgress}
          </h2>

          {/* Progress Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {progress
              .filter(item => selectedCategory === 'all' || item.badge.category === selectedCategory)
              .slice(0, 6) // Show only next 6 badges
              .map((item) => (
                <div
                  key={item.badge.key}
                  className="p-4 border border-gray-200 rounded-lg space-y-3"
                >
                  {/* Badge Icon & Name */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg opacity-50">
                      {item.badge.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {item.badge.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.badge.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {COPY.badges.currentProgress(item.currentValue, item.targetValue)}
                      </span>
                      <span className="text-gray-500">
                        {COPY.badges.progressPercent(item.progress)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress * 100}%` }}
                      />
                    </div>
                    {item.progress > 0.8 && (
                      <p className="text-xs text-green-600 font-medium">
                        {COPY.badges.almostThere}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Badge Notification Modal */}
      <BadgeNotification
        key={showNotification ? 'open' : 'closed'} // Force remount on open to reset state
        badges={newBadges}
        isOpen={showNotification}
        onClose={handleNotificationClose}
      />
    </div>
  )
}

export default BadgesPage