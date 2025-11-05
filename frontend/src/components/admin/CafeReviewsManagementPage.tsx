import React, { useEffect, useState } from 'react'
import { ArrowLeft, MessageSquare, EyeOff, Eye, Loader, Calendar, User, Star } from '@/components/icons'
import { useNavigate, useParams } from 'react-router'
import { api } from '../../utils/api'
import type { UserReview } from '../../../../shared/types'

interface CafeInfo {
  id: number
  name: string
  city: string
}

export const CafeReviewsManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { cafeId } = useParams<{ cafeId: string }>()
  const [cafe, setCafe] = useState<CafeInfo | null>(null)
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningReview, setActioningReview] = useState<number | null>(null)
  const [confirmingReviewId, setConfirmingReviewId] = useState<number | null>(null)

  useEffect(() => {
    if (!cafeId) return

    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch cafe info
        const cafeData = await api.cafes.getById(parseInt(cafeId))
        setCafe({
          id: cafeData.cafe.id,
          name: cafeData.cafe.name,
          city: cafeData.cafe.city
        })

        // Fetch all reviews including hidden ones (admin view)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/cafes/${cafeId}/reviews`,
          { credentials: 'include' }
        )
        const data = await response.json()
        setReviews(data.reviews || [])
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [cafeId])

  const handleToggleVisibility = async (review: UserReview) => {
    // Double-click pattern: first click sets confirming state, second click executes
    if (confirmingReviewId !== review.id) {
      setConfirmingReviewId(review.id)
      // Reset after 3 seconds if not confirmed
      setTimeout(() => setConfirmingReviewId(null), 3000)
      return
    }

    try {
      setConfirmingReviewId(null)
      setActioningReview(review.id)

      const newStatus = review.moderationStatus === 'approved' ? 'rejected' : 'approved'

      await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/reviews/${review.id}/moderate`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: newStatus,
            notes: `${newStatus === 'rejected' ? 'Hidden' : 'Shown'} by admin`
          })
        }
      )

      // Update local state
      setReviews(reviews.map(r =>
        r.id === review.id ? { ...r, moderationStatus: newStatus as 'approved' | 'rejected' | 'pending' | 'flagged' } : r
      ))
    } catch (error) {
      alert(`Failed to update review: ${(error as Error).message}`)
    } finally {
      setActioningReview(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const visibleReviews = reviews.filter(r => r.moderationStatus === 'approved')
  const hiddenReviews = reviews.filter(r => r.moderationStatus === 'rejected')

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-xs p-4 md:p-6 mb-6">
          <button
            onClick={() => navigate('/admin/content')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition"
          >
            <ArrowLeft size={20} />
            <span>Back to Content Management</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={28} className="text-purple-500" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {cafe ? `Manage Reviews - ${cafe.name}` : 'Manage Reviews'}
            </h1>
          </div>
          {cafe && (
            <p className="text-sm text-gray-600 capitalize">{cafe.city}</p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-purple-500" size={48} />
          </div>
        )}

        {/* Empty State */}
        {!loading && reviews.length === 0 && (
          <div className="bg-white rounded-lg shadow-xs p-12 text-center">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No reviews found</h3>
            <p className="text-gray-600">This cafe doesn&apos;t have any reviews yet</p>
          </div>
        )}

        {/* Reviews List */}
        {!loading && reviews.length > 0 && (
          <div className="space-y-6">

            {/* Visible Reviews */}
            {visibleReviews.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Eye size={20} className="text-green-500" />
                  Visible Reviews ({visibleReviews.length})
                </h2>
                <div className="space-y-4">
                  {visibleReviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-lg shadow-xs p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Star size={18} className="text-yellow-500 fill-yellow-500" />
                            <span className="font-bold text-lg">{review.overallRating.toFixed(1)}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span>User #{review.userId}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {review.title && (
                        <h3 className="font-semibold text-gray-800 mb-2">{review.title}</h3>
                      )}

                      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.content}</p>

                      {/* Additional ratings */}
                      {(review.matchaQualityRating || review.ambianceRating || review.serviceRating || review.valueRating) && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                          {review.matchaQualityRating && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">Matcha:</span>
                              <span className="font-semibold">{review.matchaQualityRating.toFixed(1)}</span>
                            </div>
                          )}
                          {review.ambianceRating && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">Ambiance:</span>
                              <span className="font-semibold">{review.ambianceRating.toFixed(1)}</span>
                            </div>
                          )}
                          {review.serviceRating && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">Service:</span>
                              <span className="font-semibold">{review.serviceRating.toFixed(1)}</span>
                            </div>
                          )}
                          {review.valueRating && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">Value:</span>
                              <span className="font-semibold">{review.valueRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => handleToggleVisibility(review)}
                        disabled={actioningReview === review.id}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                      >
                        {actioningReview === review.id ? (
                          <Loader className="animate-spin" size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                        <span>{confirmingReviewId === review.id ? 'Confirm Hide' : 'Hide Review'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden Reviews */}
            {hiddenReviews.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <EyeOff size={20} className="text-gray-500" />
                  Hidden Reviews ({hiddenReviews.length})
                </h2>
                <div className="space-y-4">
                  {hiddenReviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-lg shadow-xs p-5 opacity-60 border-2 border-red-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Star size={18} className="text-yellow-500 fill-yellow-500" />
                            <span className="font-bold text-lg">{review.overallRating.toFixed(1)}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span>User #{review.userId}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          HIDDEN
                        </span>
                      </div>

                      {review.title && (
                        <h3 className="font-semibold text-gray-800 mb-2">{review.title}</h3>
                      )}

                      <p className="text-gray-700 mb-4 whitespace-pre-wrap line-clamp-3">{review.content}</p>

                      <button
                        onClick={() => handleToggleVisibility(review)}
                        disabled={actioningReview === review.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                      >
                        {actioningReview === review.id ? (
                          <Loader className="animate-spin" size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                        <span>{confirmingReviewId === review.id ? 'Confirm Show' : 'Show Review'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CafeReviewsManagementPage
