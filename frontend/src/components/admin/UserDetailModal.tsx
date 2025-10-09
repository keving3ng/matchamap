import React, { useState, useEffect } from 'react'
import { X, Mail, Calendar, Shield, CheckCircle, XCircle, MapPin, Instagram, Globe, Clock, Star } from 'lucide-react'
import { api } from '../../utils/api'
import type { User, UserProfile } from '../../../../shared/types'
import { formatDate, formatRelativeTime } from '../../utils/dateFormatter'

interface UserDetailModalProps {
  userId: number
  onClose: () => void
}

interface UserDetails {
  user: User
  profile: UserProfile | null
  stats: {
    totalCheckins: number
  }
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ userId, onClose }) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  const fetchUserDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.userAdmin.getUser(userId)
      setUserDetails(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user details')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">User Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 text-center">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && userDetails && (
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                  {userDetails.profile?.displayName
                    ? userDetails.profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
                    : userDetails.user.username.substring(0, 2).toUpperCase()
                  }
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {userDetails.profile?.displayName || userDetails.user.username}
                    </h3>
                    {userDetails.user.isEmailVerified ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <XCircle className="text-gray-400" size={20} />
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">@{userDetails.user.username}</p>
                  {userDetails.profile?.bio && (
                    <p className="text-gray-700 mt-3 italic">{userDetails.profile.bio}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  userDetails.user.role === 'admin'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {userDetails.user.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>

              {/* Account Information */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield size={20} className="text-green-600" />
                  Account Information
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{userDetails.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Joined</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(userDetails.user.createdAt, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Last Active</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatRelativeTime(userDetails.user.lastActiveAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {userDetails.user.isEmailVerified ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <XCircle size={18} className="text-gray-400" />
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Email Verification</p>
                      <p className="text-sm font-medium text-gray-900">
                        {userDetails.user.isEmailVerified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              {userDetails.profile && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Star size={20} className="text-green-600" />
                    Profile Details
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {userDetails.profile.location && (
                      <div className="flex items-center gap-3">
                        <MapPin size={18} className="text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.profile.location}</p>
                        </div>
                      </div>
                    )}

                    {/* Social Links */}
                    {(userDetails.profile.instagram || userDetails.profile.tiktok || userDetails.profile.website) && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Social Links</p>
                        <div className="flex flex-wrap gap-2">
                          {userDetails.profile.instagram && (
                            <a
                              href={`https://instagram.com/${userDetails.profile.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                              <Instagram size={16} className="text-pink-600" />
                              <span className="text-sm">@{userDetails.profile.instagram}</span>
                            </a>
                          )}
                          {userDetails.profile.website && (
                            <a
                              href={userDetails.profile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                              <Globe size={16} className="text-blue-600" />
                              <span className="text-sm">Website</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Privacy Settings */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Privacy Settings</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          userDetails.profile.isPublic
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {userDetails.profile.isPublic ? 'Public Profile' : 'Private Profile'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          userDetails.profile.showActivity
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {userDetails.profile.showActivity ? 'Activity Visible' : 'Activity Hidden'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Stats */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Activity Stats</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {userDetails.profile?.totalCheckins || userDetails.stats.totalCheckins}
                    </p>
                    <p className="text-sm text-gray-600">Check-ins</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {userDetails.profile?.totalReviews || 0}
                    </p>
                    <p className="text-sm text-gray-600">Reviews</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {userDetails.profile?.totalPhotos || 0}
                    </p>
                    <p className="text-sm text-gray-600">Photos</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {userDetails.profile?.reputationScore || 0}
                    </p>
                    <p className="text-sm text-gray-600">Reputation</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserDetailModal
