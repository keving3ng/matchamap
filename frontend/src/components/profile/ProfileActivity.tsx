import React, { useState, useEffect } from 'react'
import { Clock, MapPin, Star, Image, Loader2 } from '@/components/icons'
import { COPY } from '../../constants/copy'
import { api } from '../../utils/api'
import type { UserReview } from '../../../../shared/types'

interface ProfileActivityProps {
  /** Username of the profile being viewed */
  username: string
  /** Whether this is the current user's profile */
  isOwnProfile?: boolean
  /** Whether to show activity based on privacy settings */
  showActivity?: boolean
}

type ActivityItem = {
  id: string
  type: 'review' | 'checkin' | 'photo'
  timestamp: string
  data: UserReview | unknown
}

/**
 * ProfileActivity - Timeline of user's recent activity
 *
 * Shows recent reviews, check-ins, and photos.
 * Respects privacy settings for public profiles.
 * Mobile-first design with card-based layout.
 */
export const ProfileActivity: React.FC<ProfileActivityProps> = ({
  username,
  isOwnProfile = false,
  showActivity = true
}) => {
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadActivity = async () => {
      // If privacy settings don't allow showing activity, skip loading
      if (!showActivity && !isOwnProfile) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // For now, just load reviews (most important activity)
        // Future: Add check-ins and photos
        if (isOwnProfile) {
          const response = await api.reviews.getMyReviews({ limit: 5 })
          setReviews(response.reviews)
        } else {
          // TODO: Add public reviews endpoint for other users
          // For now, just show empty state
          setReviews([])
        }
      } catch (err) {
        console.error('Failed to load activity:', err)
        setError('Failed to load activity')
      } finally {
        setLoading(false)
      }
    }

    loadActivity()
  }, [username, isOwnProfile, showActivity])

  // If privacy settings hide activity for public profiles
  if (!showActivity && !isOwnProfile) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">
          This user's activity is private
        </p>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Loader2 className="w-8 h-8 text-matcha-600 animate-spin mx-auto mb-2" />
        <p className="text-gray-500">Loading activity...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">
          {isOwnProfile
            ? COPY.profile.ownActivityPlaceholder
            : COPY.profile.userActivityPlaceholder(username)
          }
        </p>
      </div>
    )
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:border-matcha-200 transition-colors"
        >
          {/* Activity Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-matcha-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-matcha-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Reviewed a cafe</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Clock className="w-4 h-4" />
                <span>{formatTimestamp(review.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              <span className="font-semibold text-gray-900">
                {(review.overallRating / 2).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Review Content */}
          {review.title && (
            <h4 className="font-semibold text-gray-900 mb-1">{review.title}</h4>
          )}
          {review.content && (
            <p className="text-gray-700 text-sm line-clamp-3 mb-2">
              {review.content}
            </p>
          )}

          {/* Review Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {review.helpfulCount > 0 && (
              <div className="flex items-center gap-1">
                <span>👍</span>
                <span>{review.helpfulCount} helpful</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
