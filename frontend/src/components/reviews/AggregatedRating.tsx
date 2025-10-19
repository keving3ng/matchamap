import React from 'react'
import { Star, Users, Award } from '@/components/icons'
import { ScoreBadge } from '../ui'
import { COPY } from '../../constants/copy'

interface AggregatedRatingProps {
  /** Expert score (0-10 scale) - from cafe.displayScore */
  expertScore?: number
  /** User average rating (0-10 scale) */
  userScore?: number
  /** Number of user reviews */
  reviewCount: number
  /** Optional className for styling */
  className?: string
}

/**
 * AggregatedRating - Displays both expert and user ratings side by side
 * 
 * Mobile-first design with clear separation between expert and community scores.
 * Expert score shows the traditional MatchaMap expert rating, while user score
 * shows the aggregated community rating from user reviews.
 */
export const AggregatedRating: React.FC<AggregatedRatingProps> = ({
  expertScore,
  userScore,
  reviewCount,
  className = ''
}) => {
  const hasUserReviews = reviewCount > 0 && userScore !== undefined

  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 border-matcha-100 p-5 ${className}`}>
      <div className="flex flex-col gap-4">
        
        {/* Expert Score Section */}
        {expertScore && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-matcha-500 to-matcha-600 p-2 rounded-xl shadow-md">
                <Award size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-base">{COPY.reviews.expertScore}</h4>
                <p className="text-sm text-gray-600">{COPY.detail.ourReview}</p>
              </div>
            </div>
            <ScoreBadge score={expertScore} size="lg" />
          </div>
        )}

        {/* Divider - only show if we have both expert and user scores */}
        {expertScore && hasUserReviews && (
          <div className="border-t border-gray-200"></div>
        )}

        {/* Community Score Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-md">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-base">{COPY.reviews.communityRating}</h4>
              <p className="text-sm text-gray-600">
                {hasUserReviews 
                  ? COPY.reviews.basedOnReviews(reviewCount)
                  : COPY.reviews.noReviews
                }
              </p>
            </div>
          </div>
          
          {hasUserReviews ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-xl text-gray-800">{userScore.toFixed(1)}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm font-medium">
              {COPY.reviews.noReviews}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}