import React from 'react'
import { Award, Lock } from '@/components/icons'
import { COPY } from '../../constants/copy'
import type { UserBadge } from '../../../../shared/types'

interface ProfileBadgesProps {
  /** Array of earned badges */
  badges?: UserBadge[]
  /** Whether this is the current user's profile */
  isOwnProfile?: boolean
  /** Optional className for styling */
  className?: string
}

/**
 * ProfileBadges - Display user's earned badges
 *
 * Shows earned badges with icons, names, and earned dates.
 * Mobile-first grid layout with responsive columns.
 * Supports locked badges for own profile (coming soon).
 */
export const ProfileBadges: React.FC<ProfileBadgesProps> = ({
  badges = [],
  isOwnProfile = false,
  className = ''
}) => {
  // If no badges earned
  if (badges.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-8 text-center ${className}`}>
        <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">
          {isOwnProfile
            ? COPY.badges.noBadges
            : 'No badges earned yet'
          }
        </p>
        {isOwnProfile && (
          <p className="text-sm text-gray-400 mt-2">
            {COPY.badges.earnBadges}
          </p>
        )}
      </div>
    )
  }

  // Format earned date
  const formatEarnedDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get badge icon or default
  const getBadgeIcon = (badge: UserBadge): string => {
    if (badge.iconUrl) return badge.iconUrl

    // Default icons based on badge type
    const typeIcons: Record<string, string> = {
      passport: '🗺️',
      reviews: '⭐',
      photos: '📸',
      special: '✨'
    }

    // Extract category from badge type (e.g., "passport_5" -> "passport")
    const category = badge.type.split('_')[0]
    return typeIcons[category] || '🏆'
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">{COPY.profile.badges}</h3>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {badges.map((badge) => (
          <div
            key={`${badge.type}-${badge.earnedAt}`}
            className="bg-white rounded-xl border-2 border-matcha-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              {/* Badge Icon */}
              <div className="w-12 h-12 bg-matcha-50 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                {badge.iconUrl ? (
                  <img
                    src={badge.iconUrl}
                    alt={badge.name}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <span>{getBadgeIcon(badge)}</span>
                )}
              </div>

              {/* Badge Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-1">{badge.name}</h4>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {badge.description}
                </p>
                <div className="text-xs text-gray-500">
                  {COPY.badges.earnedOn} {formatEarnedDate(badge.earnedAt)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Hint (Own Profile Only) */}
      {isOwnProfile && (
        <div className="mt-4 p-4 bg-matcha-50 rounded-lg border border-matcha-200">
          <div className="flex items-center gap-2 text-sm text-matcha-700">
            <Award className="w-5 h-5" />
            <span className="font-medium">{COPY.badges.keepExploring}</span>
          </div>
        </div>
      )}
    </div>
  )
}
