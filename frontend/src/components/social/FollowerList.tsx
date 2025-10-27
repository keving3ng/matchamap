import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Users, Loader2, AlertCircle, UserPlus } from '@/components/icons'
import { api } from '../../utils/api'
import { useAuthStore } from '../../stores/authStore'
import { COPY } from '../../constants/copy'
import { FollowButton } from './FollowButton'
import type { FollowUser, FollowersResponse, FollowingResponse } from '../../../../shared/types'

interface FollowerListProps {
  username: string
  type: 'followers' | 'following'
  onClose: () => void
}

export const FollowerList: React.FC<FollowerListProps> = ({
  username,
  type,
  onClose,
}) => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<FollowUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (type === 'followers') {
          const response: FollowersResponse = await api.following.getFollowers(username)
          setUsers(response.followers)
        } else {
          const response: FollowingResponse = await api.following.getFollowing(username)
          setUsers(response.following)
        }
      } catch (err) {
        console.error(`Failed to load ${type}:`, err)
        setError(err instanceof Error ? err.message : `Failed to load ${type}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [username, type])

  const handleUserClick = (clickedUsername: string) => {
    navigate(`/users/${clickedUsername}`)
    onClose()
  }

  const handleFollowChange = (userUsername: string, isFollowing: boolean) => {
    // If we're viewing someone's following list and they unfollowed a user,
    // remove that user from the list
    if (type === 'following' && !isFollowing && username === currentUser?.username) {
      setUsers(prevUsers => prevUsers.filter(user => user.username !== userUsername))
    }
  }

  const title = type === 'followers' 
    ? COPY.social.followersTitle(username)
    : COPY.social.followingTitle(username)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-matcha-600" />
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
            aria-label={COPY.common.close}
          >
            <span className="text-gray-600 text-lg">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-matcha-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">{COPY.social.loadingUsers}</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center max-w-xs">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{COPY.common.error}</h3>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center max-w-xs">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  {type === 'followers' 
                    ? COPY.social.noFollowers 
                    : COPY.social.noFollowing
                  }
                </h3>
                <p className="text-sm text-gray-600">
                  {type === 'followers' 
                    ? COPY.social.noFollowersDescription 
                    : COPY.social.noFollowingDescription
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <div key={user.id} className="p-4 flex items-center gap-3">
                  {/* Avatar */}
                  <button
                    onClick={() => handleUserClick(user.username)}
                    className="flex-shrink-0"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-matcha-100 to-green-100 flex items-center justify-center">
                        <span className="text-matcha-700 font-semibold text-lg">
                          {user.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleUserClick(user.username)}
                      className="text-left w-full"
                    >
                      <p className="font-semibold text-gray-900 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        @{user.username}
                      </p>
                    </button>
                  </div>

                  {/* Follow Button */}
                  {currentUser && user.username !== currentUser.username && (
                    <FollowButton
                      username={user.username}
                      onFollowChange={(isFollowing) => handleFollowChange(user.username, isFollowing)}
                      className="text-xs px-3 py-1.5"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {users.length > 0 && (
          <div className="p-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              {type === 'followers' 
                ? COPY.social.followersCount(users.length)
                : COPY.social.followingCount(users.length)
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}