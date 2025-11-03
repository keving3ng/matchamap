import React, { useState, useEffect } from 'react'
import { MessageCircle, Heart, User } from '@/components/icons'
import { SecondaryButton, TertiaryButton } from '../ui'
import { COPY } from '../../constants/copy'
import { api } from '../../utils/api'
import { useAuthStore } from '../../stores/authStore'
import type { ReviewComment } from '../../../../shared/types'

interface ReviewCommentsProps {
  /** Review ID to load comments for */
  reviewId: number
  /** Optional className for styling */
  className?: string
}

interface CommentFormData {
  content: string
  parentCommentId?: number
}

/**
 * ReviewComments - Displays comments section for a review
 *
 * Features:
 * - Nested comments (1 level deep)
 * - Like/unlike comments
 * - Add, edit, delete own comments
 * - Reply to comments
 * - Mobile-first responsive design
 *
 * Performance: Uses React.memo to prevent unnecessary re-renders
 */
export const ReviewComments: React.FC<ReviewCommentsProps> = React.memo(({
  reviewId,
  className = ''
}) => {
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [replyingToComment, setReplyingToComment] = useState<number | null>(null)
  const [editingComment, setEditingComment] = useState<number | null>(null)
  const [formData, setFormData] = useState<CommentFormData>({ content: '' })
  const [submitting, setSubmitting] = useState(false)

  const { user } = useAuthStore()
  const isLoggedIn = !!user

  // Load comments on mount
  useEffect(() => {
    loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId])

  const loadComments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.comments.getForReview(reviewId, {
        sortBy: 'recent',
        sortOrder: 'asc',
        limit: 100
      })
      setComments(response.comments)
    } catch (err) {
      console.error('Failed to load comments:', err)
      setError(COPY.reviews.loadCommentsError)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoggedIn || !formData.content.trim()) return

    try {
      setSubmitting(true)
      setError(null)

      if (editingComment) {
        // Update existing comment
        await api.comments.update(editingComment, { content: formData.content.trim() })
        setEditingComment(null)
        await loadComments() // Reload to get updated comment
      } else {
        // Create new comment
        const response = await api.comments.create(reviewId, {
          content: formData.content.trim(),
          parentCommentId: replyingToComment || undefined
        })
        
        // Add new comment to state
        setComments(prev => [...prev, response.comment])
        setReplyingToComment(null)
        setShowCommentForm(false)
      }

      setFormData({ content: '' })
    } catch (err) {
      console.error('Failed to submit comment:', err)
      setError(COPY.reviews.commentError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: number, isLiked: boolean) => {
    if (!isLoggedIn) return

    try {
      if (isLiked) {
        await api.comments.unlike(commentId)
      } else {
        await api.comments.like(commentId)
      }

      // Update local state
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, likeCount: comment.likeCount + (isLiked ? -1 : 1) }
          : comment
      ))
    } catch (err) {
      console.error('Failed to like/unlike comment:', err)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm(COPY.reviews.deleteConfirm)) return

    try {
      await api.comments.delete(commentId)
      setComments(prev => prev.filter(comment => comment.id !== commentId))
    } catch (err) {
      console.error('Failed to delete comment:', err)
      setError(COPY.reviews.commentError)
    }
  }

  const startEdit = (comment: ReviewComment) => {
    setEditingComment(comment.id)
    setFormData({ content: comment.content })
    setShowCommentForm(true)
    setReplyingToComment(null)
  }

  const startReply = (commentId: number) => {
    setReplyingToComment(commentId)
    setShowCommentForm(true)
    setEditingComment(null)
    setFormData({ content: '' })
  }

  const cancelForm = () => {
    setShowCommentForm(false)
    setReplyingToComment(null)
    setEditingComment(null)
    setFormData({ content: '' })
    setError(null)
  }

  // Group comments by parent/child relationship
  const topLevelComments = comments.filter(comment => !comment.parentCommentId)
  const repliesByParent = comments
    .filter(comment => comment.parentCommentId)
    .reduce((acc, reply) => {
      const parentId = reply.parentCommentId!
      if (!acc[parentId]) acc[parentId] = []
      acc[parentId].push(reply)
      return acc
    }, {} as Record<number, ReviewComment[]>)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const CommentItem: React.FC<{ comment: ReviewComment; isReply?: boolean }> = ({ comment, isReply = false }) => {
    const isOwn = user?.id === comment.userId
    const replies = repliesByParent[comment.id] || []

    return (
      <div className={`${isReply ? 'ml-12 mt-3' : 'mt-4'} first:mt-0`}>
        <div className="flex space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {comment.user?.avatarUrl ? (
              <img
                src={comment.user.avatarUrl}
                alt={comment.user.displayName || comment.user.username}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </div>

          {/* Comment content */}
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-sm text-gray-900">
                  {comment.user?.displayName || comment.user?.username || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-800">{comment.content}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4 mt-1 ml-3">
              {/* Like button */}
              {isLoggedIn && (
                <button
                  onClick={() => handleLikeComment(comment.id, false)} // TODO: track liked state
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Heart className="w-3 h-3" />
                  <span>{COPY.reviews.like}</span>
                  {comment.likeCount > 0 && (
                    <span className="font-medium">({comment.likeCount})</span>
                  )}
                </button>
              )}

              {/* Reply button */}
              {isLoggedIn && !isReply && (
                <button
                  onClick={() => startReply(comment.id)}
                  className="text-xs text-gray-500 hover:text-blue-500 transition-colors"
                >
                  {COPY.reviews.reply}
                </button>
              )}

              {/* Edit/Delete for own comments */}
              {isOwn && (
                <>
                  <button
                    onClick={() => startEdit(comment)}
                    className="text-xs text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    {COPY.reviews.edit}
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    {COPY.reviews.delete}
                  </button>
                </>
              )}
            </div>

            {/* Replies */}
            {replies.length > 0 && (
              <div className="mt-2">
                {replies.map(reply => (
                  <CommentItem key={reply.id} comment={reply} isReply />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <MessageCircle className="w-5 h-5" />
          <span>{COPY.reviews.comments}</span>
          {comments.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({comments.length})
            </span>
          )}
        </h3>

        {/* Add comment button */}
        {isLoggedIn && !showCommentForm && (
          <SecondaryButton
            onClick={() => setShowCommentForm(true)}
            className="text-sm"
          >
            {COPY.reviews.addComment}
          </SecondaryButton>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Comment form */}
      {showCommentForm && isLoggedIn && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="mb-3">
            {replyingToComment && (
              <p className="text-sm text-gray-600 mb-2">
                {COPY.reviews.replyTo(
                  comments.find(c => c.id === replyingToComment)?.user?.displayName ||
                  comments.find(c => c.id === replyingToComment)?.user?.username ||
                  'comment'
                )}
              </p>
            )}
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder={editingComment ? 'Edit your comment...' : COPY.reviews.writeComment}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              rows={3}
              maxLength={1000}
              disabled={submitting}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {formData.content.length}/1000 characters
              </span>
              {formData.content.length > 1000 && (
                <span className="text-xs text-red-500">
                  {COPY.reviews.commentTooLong(1000)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <SecondaryButton
              type="submit"
              disabled={submitting || !formData.content.trim() || formData.content.length > 1000}
            >
              {submitting ? COPY.reviews.commenting : 
               editingComment ? COPY.reviews.save : COPY.reviews.postComment}
            </SecondaryButton>
            <TertiaryButton onClick={cancelForm} disabled={submitting}>
              {COPY.reviews.cancel}
            </TertiaryButton>
          </div>
        </form>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">{COPY.reviews.noComments}</p>
          {isLoggedIn && (
            <p className="text-sm text-gray-400">{COPY.reviews.beFirstToComment}</p>
          )}
        </div>
      ) : (
        <div className="space-y-0">
          {topLevelComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  )
})

ReviewComments.displayName = 'ReviewComments'