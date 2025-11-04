import React, { useState, useEffect } from 'react'
import { Filter, Clock, Star, TrendingUp, ChevronDown, type LucideIcon } from '@/components/icons'
import { FilterButton, SecondaryButton } from '../ui'
import { ReviewCard } from './ReviewCard'
import { COPY } from '../../constants/copy'
import { api } from '../../utils/api'
import type { UserReview } from '../../../../shared/types'

interface ReviewListProps {
  /** Cafe ID to fetch reviews for */
  cafeId: number
  /** Optional initial reviews to display */
  initialReviews?: UserReview[]
  /** Optional className for styling */
  className?: string
  /** Callback when reviews are loaded with total count */
  onReviewsLoaded?: (total: number) => void
}

type SortOption = 'recent' | 'rating' | 'helpful'
type FilterOption = 'all' | '4-5' | '3-4' | '2-3' | '1-2'

/**
 * ReviewList - Displays list of reviews with sorting and filtering
 * 
 * Mobile-first design with horizontal filter chips and pagination.
 * Supports sorting by recent, rating, and helpful votes.
 * Filtering by rating ranges with load more functionality.
 */
export const ReviewList: React.FC<ReviewListProps> = ({
  cafeId,
  initialReviews = [],
  className = '',
  onReviewsLoaded
}) => {
  const [reviews, setReviews] = useState<UserReview[]>(initialReviews)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Filter and sort state
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Load reviews from API
  const loadReviews = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      // Map sort options to API parameters
      const sortParam = sortBy === 'recent' ? 'createdAt' : 
                       sortBy === 'rating' ? 'overallRating' : 'helpfulCount'
      
      // Map filter options to API parameters
      let minRating: number | undefined
      let maxRating: number | undefined
      if (filterBy !== 'all') {
        const [min, max] = filterBy.split('-').map(n => parseInt(n))
        minRating = min * 2 // Convert to 0-10 scale
        maxRating = max * 2
      }

      const response = await api.reviews.getForCafe(cafeId, {
        page,
        limit: 10,
        sortBy: sortParam,
        sortOrder: 'desc',
        minRating,
        maxRating
      })

      if (append) {
        setReviews(prev => [...prev, ...response.reviews])
      } else {
        setReviews(response.reviews)
      }

      setTotal(response.total)
      setHasMore(response.hasMore)
      setCurrentPage(page)

      // Notify parent of total count
      if (onReviewsLoaded) {
        onReviewsLoaded(response.total)
      }
    } catch (error) {
      console.error('Failed to load reviews:', error)
      setError(COPY.reviews.loadError)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Retry loading reviews
  const handleRetry = () => {
    setError(null)
    loadReviews(1, false)
  }

  // Load initial reviews
  useEffect(() => {
    if (initialReviews.length === 0) {
      loadReviews(1, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeId, sortBy, filterBy])

  // Load more reviews
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadReviews(currentPage + 1, true)
    }
  }

  // Handle helpful vote
  const handleHelpfulVote = (reviewId: number, isHelpful: boolean) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, helpfulCount: review.helpfulCount + (isHelpful ? 1 : -1) }
        : review
    ))
  }

  // Filter options
  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: COPY.reviews.allRatings },
    { value: '4-5', label: COPY.reviews.ratingRange(4, 5) },
    { value: '3-4', label: COPY.reviews.ratingRange(3, 4) },
    { value: '2-3', label: COPY.reviews.ratingRange(2, 3) },
    { value: '1-2', label: COPY.reviews.ratingRange(1, 2) },
  ]

  // Sort options
  const sortOptions: { value: SortOption; label: string; icon: LucideIcon }[] = [
    { value: 'recent', label: COPY.reviews.sortRecent, icon: Clock },
    { value: 'rating', label: COPY.reviews.sortRating, icon: Star },
    { value: 'helpful', label: COPY.reviews.sortHelpful, icon: TrendingUp },
  ]

  if (loading && reviews.length === 0) {
    return (
      <div className={`animate-fade-in ${className}`}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state with retry
  if (error && reviews.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{COPY.reviews.loadError}</h3>
        <p className="text-gray-600 mb-6">{COPY.reviews.tryAgain}</p>
        <SecondaryButton onClick={handleRetry}>
          {COPY.reviews.retry}
        </SecondaryButton>
      </div>
    )
  }

  if (reviews.length === 0 && !loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">💭</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{COPY.reviews.noReviewsFound}</h3>
        <p className="text-gray-600">{COPY.reviews.noReviews}</p>
      </div>
    )
  }

  return (
    <div className={`animate-fade-in ${className}`}>
      
      {/* Sort and Filter Controls */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 mb-6">
        
        {/* Sort Options */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium text-gray-700 flex-shrink-0">
            {COPY.reviews.sortBy}:
          </span>
          <div className="flex gap-2 overflow-x-auto">
            {sortOptions.map((option) => (
              <FilterButton
                key={option.value}
                active={sortBy === option.value}
                onClick={() => setSortBy(option.value)}
                icon={option.icon}
                className="flex-shrink-0"
              >
                {option.label}
              </FilterButton>
            ))}
          </div>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium text-matcha-600 hover:text-matcha-700 min-h-[44px] py-2"
        >
          <Filter size={16} />
          <span>{COPY.reviews.filterBy}</span>
          <ChevronDown 
            size={16} 
            className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex gap-2 flex-wrap">
              {filterOptions.map((option) => (
                <FilterButton
                  key={option.value}
                  active={filterBy === option.value}
                  onClick={() => setFilterBy(option.value)}
                  className="text-xs"
                >
                  {option.label}
                </FilterButton>
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        {total > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
            {COPY.reviews.basedOnReviews(total)}
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onHelpfulVote={handleHelpfulVote}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-8">
          <SecondaryButton
            onClick={handleLoadMore}
            loading={loadingMore}
            className="min-w-[200px]"
          >
            {COPY.reviews.loadMore}
          </SecondaryButton>
        </div>
      )}
    </div>
  )
}