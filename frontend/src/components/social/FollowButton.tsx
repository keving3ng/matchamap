import React, { useState, useEffect } from 'react'
import { UserPlus, UserMinus, Loader2 } from '@/components/icons'
import { api } from '../../utils/api'
import { useAuthStore } from '../../stores/authStore'
import { COPY } from '../../constants/copy'
import type { FollowStatusResponse, FollowActionResponse } from '../../../../shared/types'

interface FollowButtonProps {
  username: string
  onFollowChange?: (isFollowing: boolean) => void
  className?: string
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  username,
  onFollowChange,
  className = '',
}) => {
  const { user: currentUser } = useAuthStore()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [canFollow, setCanFollow] = useState(false)

  // Load initial follow status
  useEffect(() => {
    const loadFollowStatus = async () => {
      if (!currentUser || !username) {
        setIsLoadingStatus(false)
        return
      }

      try {
        const response: FollowStatusResponse = await api.following.getFollowStatus(username)
        setIsFollowing(response.isFollowing)
        setCanFollow(response.canFollow)
      } catch (error) {
        console.error('Failed to load follow status:', error)
        setCanFollow(false)
      } finally {
        setIsLoadingStatus(false)
      }
    }

    loadFollowStatus()
  }, [currentUser, username])

  const handleFollow = async () => {
    if (!currentUser || !canFollow || isLoading) return

    setIsLoading(true)
    try {
      if (isFollowing) {
        await api.following.unfollowUser(username)
        setIsFollowing(false)
        onFollowChange?.(false)
      } else {
        await api.following.followUser(username)
        setIsFollowing(true)
        onFollowChange?.(true)
      }
    } catch (error) {
      console.error('Follow action failed:', error)
      // TODO: Show error toast/notification
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show button if not authenticated or can't follow
  if (!currentUser || !canFollow || isLoadingStatus) {
    return null
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        min-h-[44px] min-w-[44px] active:scale-[0.98]
        ${
          isFollowing
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
            : 'bg-gradient-to-r from-matcha-500 to-matcha-600 hover:from-matcha-600 hover:to-matcha-700 text-white'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      aria-label={
        isFollowing 
          ? COPY.social.unfollowUser(username)
          : COPY.social.followUser(username)
      }
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      
      <span className="text-sm">
        {isFollowing ? COPY.social.following : COPY.social.follow}
      </span>
    </button>
  )
}