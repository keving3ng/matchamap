import React, { useState } from 'react'
import { useParams, Navigate } from 'react-router'
import { Loader2, AlertCircle } from 'lucide-react'
import { useUserProfile, useMyProfile } from '../../hooks/useUserProfile'
import { useAuthStore } from '../../stores/authStore'
import { ProfileHeader } from './ProfileHeader'
import { ProfileStats } from './ProfileStats'
import { EditProfileModal } from './EditProfileModal'
import { ContentContainer } from '../ContentContainer'
import { COPY } from '../../constants/copy'

export const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuthStore()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Determine if this is the current user's own profile
  const isOwnProfile = currentUser?.username === username

  // Use appropriate hook based on whether it's own profile
  const publicProfile = useUserProfile(username || '')
  const myProfile = useMyProfile()

  // Select the appropriate profile data
  const profile = isOwnProfile ? myProfile.profile : publicProfile.profile
  const isLoading = isOwnProfile ? myProfile.isLoading : publicProfile.isLoading
  const error = isOwnProfile ? myProfile.error : publicProfile.error

  if (!username) {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-matcha-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{COPY.profile.loadingProfile}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-cream-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{COPY.profile.profileNotFound}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  // Transform profile data for components
  const profileData = isOwnProfile && myProfile.profile
    ? {
        id: currentUser!.id,
        username: currentUser!.username,
        displayName: myProfile.profile.displayName,
        bio: myProfile.profile.bio,
        avatarUrl: myProfile.profile.avatarUrl,
        location: myProfile.profile.location,
        joinedAt: currentUser!.createdAt,
        stats: {
          totalReviews: myProfile.profile.totalReviews,
          totalCheckins: myProfile.profile.totalCheckins,
          totalPhotos: myProfile.profile.totalPhotos,
          passportCompletion: 0, // TODO: Calculate from actual data
          reputationScore: myProfile.profile.reputationScore,
        },
        badges: [],
        social: {
          instagram: myProfile.profile.instagram,
          tiktok: myProfile.profile.tiktok,
          website: myProfile.profile.website,
        },
      }
    : publicProfile.profile?.user

  if (!profileData) {
    return null
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-cream-50">
      {/* Profile Header */}
      <ProfileHeader
        profile={profileData}
        isOwnProfile={isOwnProfile}
        onEditClick={() => setIsEditModalOpen(true)}
      />

      {/* Profile Stats */}
      <ProfileStats stats={profileData.stats} />

      {/* Activity Section */}
      <ContentContainer maxWidth="lg">
        <div className="p-4">
          {/* Badges */}
          {profileData.badges && profileData.badges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{COPY.profile.badges}</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.badges.map((badge) => (
                  <div
                    key={badge.type}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg"
                  >
                    {badge.iconUrl && (
                      <img src={badge.iconUrl} alt={badge.name} className="w-5 h-5" />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{badge.name}</div>
                      <div className="text-xs text-gray-500">{badge.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity Placeholder */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              {isOwnProfile
                ? COPY.profile.ownActivityPlaceholder
                : COPY.profile.userActivityPlaceholder(profileData.username)
              }
            </p>
          </div>
        </div>
      </ContentContainer>

      {/* Edit Profile Modal */}
      {isOwnProfile && myProfile.profile && (
        <EditProfileModal
          profile={myProfile.profile}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={myProfile.updateProfile}
        />
      )}
    </div>
  )
}
