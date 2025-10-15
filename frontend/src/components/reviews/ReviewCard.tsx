import React, { useState } from 'react'
import { Star, ThumbsUp, User, Calendar, Badge, Image, ChevronDown, ChevronUp } from 'lucide-react'
import { SecondaryButton, StatusBadge } from '../ui'
import { COPY } from '../../constants/copy'
import { api } from '../../utils/api'
import type { UserReview } from '../../../shared/types'

interface ReviewCardProps {
  /** Review data with optional user and photos */
  review: UserReview
  /** Callback when helpful vote is clicked */
  onHelpfulVote?: (reviewId: number, isHelpful: boolean) => void
  /** Optional className for styling */
  className?: string
}

/**
 * ReviewCard - Displays individual user review with ratings, content, and photos
 * 
 * Mobile-first design with collapsible photo gallery and helpful voting.
 * Shows all review ratings, user profile info, and engagement actions.
 */
export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onHelpfulVote,
  className = ''
}) => {
  const [showPhotos, setShowPhotos] = useState(false)
  const [isVotingHelpful, setIsVotingHelpful] = useState(false)

  // Format visit date
  const visitDate = review.visitDate 
    ? new Date(review.visitDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : null

  // Format creation date (relative time)
  const createdAt = new Date(review.createdAt)
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  
  let timeAgo: string
  if (diffDays === 0) {
    timeAgo = 'Today'
  } else if (diffDays === 1) {
    timeAgo = '1 day'
  } else if (diffDays < 7) {
    timeAgo = `${diffDays} days`
  } else if (diffWeeks === 1) {
    timeAgo = '1 week'
  } else if (diffWeeks < 4) {
    timeAgo = `${diffWeeks} weeks`
  } else if (diffMonths === 1) {
    timeAgo = '1 month'
  } else {
    timeAgo = `${diffMonths} months`
  }

  const handleHelpfulVote = async () => {
    if (isVotingHelpful || !onHelpfulVote) return
    
    setIsVotingHelpful(true)
    try {
      await api.reviews.vote(review.id, true)
      onHelpfulVote(review.id, true)
    } catch (error) {
      console.error('Failed to vote helpful:', error)
    } finally {
      setIsVotingHelpful(false)
    }
  }

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={14} 
            className={`${
              star <= Math.round(rating / 2) 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-gray-300'
            }`} 
          />
        ))}
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow ${className}`}>
      
      {/* Header with user info and overall rating */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* User Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-matcha-400 to-matcha-600 rounded-full flex items-center justify-center flex-shrink-0">
            {review.user?.avatarUrl ? (
              <img 
                src={review.user.avatarUrl} 
                alt={review.user.displayName || review.user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={20} className="text-white" />
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-gray-800 text-sm truncate">
                {review.user?.displayName || review.user?.username || 'Anonymous User'}
              </h4>
              {review.isFeatured && (
                <StatusBadge variant="success" className="text-xs">
                  <Badge size={10} className="mr-1" />
                  {COPY.reviews.featuredReview}
                </StatusBadge>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {COPY.reviews.ago(timeAgo)}
            </p>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {renderRatingStars(review.overallRating)}
          <span className="font-bold text-gray-800">{(review.overallRating / 2).toFixed(1)}</span>
        </div>
      </div>

      {/* Review Title */}
      {review.title && (
        <h3 className="font-bold text-gray-900 text-base mb-3 leading-tight">
          {review.title}
        </h3>
      )}

      {/* Review Content */}
      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        {review.content}
      </p>

      {/* Detailed Ratings */}
      {(review.matchaQualityRating || review.ambianceRating || review.serviceRating || review.valueRating) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {review.matchaQualityRating && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{COPY.reviews.matchaQuality}</span>
              <div className="flex items-center gap-1">
                {renderRatingStars(review.matchaQualityRating)}
                <span className="font-medium text-gray-700 ml-1">
                  {(review.matchaQualityRating / 2).toFixed(1)}
                </span>
              </div>
            </div>
          )}
          {review.ambianceRating && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{COPY.reviews.ambiance}</span>
              <div className="flex items-center gap-1">
                {renderRatingStars(review.ambianceRating)}
                <span className="font-medium text-gray-700 ml-1">
                  {(review.ambianceRating / 2).toFixed(1)}
                </span>
              </div>
            </div>
          )}
          {review.serviceRating && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{COPY.reviews.service}</span>
              <div className="flex items-center gap-1">
                {renderRatingStars(review.serviceRating)}
                <span className="font-medium text-gray-700 ml-1">
                  {(review.serviceRating / 2).toFixed(1)}
                </span>
              </div>
            </div>
          )}
          {review.valueRating && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{COPY.reviews.value}</span>
              <div className="flex items-center gap-1">
                {renderRatingStars(review.valueRating)}
                <span className="font-medium text-gray-700 ml-1">
                  {(review.valueRating / 2).toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {review.tags.map((tag, index) => (
            <StatusBadge key={index} variant="info" className="text-xs">
              {tag}
            </StatusBadge>
          ))}
        </div>
      )}

      {/* Visit Date */}
      {visitDate && (
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
          <Calendar size={12} className="text-matcha-600" />
          <span>{COPY.reviews.visitedOn} {visitDate}</span>
        </div>
      )}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowPhotos(!showPhotos)}
            className="flex items-center gap-2 text-sm text-matcha-600 hover:text-matcha-700 font-medium mb-3 min-h-[44px] py-2"
          >
            <Image size={16} />
            <span>
              {showPhotos ? COPY.reviews.hidePhotos : COPY.reviews.showPhotos} 
              ({review.photos.length})
            </span>
            {showPhotos ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {showPhotos && (
            <div className="grid grid-cols-2 gap-3">
              {review.photos.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-xl overflow-hidden">
                  <img
                    src={photo.imageUrl}
                    alt="Review photo"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer with helpful button */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <SecondaryButton
          onClick={handleHelpfulVote}
          disabled={isVotingHelpful}
          className="text-sm flex items-center gap-2"
        >
          <ThumbsUp size={14} />
          <span>{COPY.reviews.helpful}</span>
          {review.helpfulCount > 0 && (
            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {review.helpfulCount}
            </span>
          )}
        </SecondaryButton>

        {review.user && (
          <button className="text-xs text-matcha-600 hover:text-matcha-700 font-medium min-h-[44px] py-2 px-3">
            {COPY.reviews.viewProfile}
          </button>
        )}
      </div>
    </div>
  )
}