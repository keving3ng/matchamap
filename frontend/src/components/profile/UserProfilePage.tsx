import React, { useState, useEffect } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router'
import { Loader2, AlertCircle, Sparkles, MapPin, Star } from '@/components/icons'
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
  const navigate = useNavigate()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false)

  // Determine if this is the current user's own profile
  const isOwnProfile = currentUser?.username === username

  // Use appropriate hook based on whether it's own profile
  const publicProfile = useUserProfile(username || '')
  const myProfile = useMyProfile()

  // Check if this is a new user (no check-ins yet) and show welcome banner
  useEffect(() => {
    if (isOwnProfile && myProfile.profile && myProfile.profile.totalCheckins === 0) {
      const hasSeenWelcome = localStorage.getItem(`welcome_shown_${currentUser?.id}`)
      if (!hasSeenWelcome) {
        setShowWelcomeBanner(true)
      }
    }
  }, [isOwnProfile, myProfile.profile, currentUser?.id])

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
          totalFavorites: myProfile.profile.totalFavorites || 0,
          passportCompletion: myProfile.profile.passportCompletion,
          reputationScore: myProfile.profile.reputationScore,
          followerCount: myProfile.profile.followerCount || 0,
          followingCount: myProfile.profile.followingCount || 0,
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
        onFollowChange={() => {
          // Refresh profile data when follow status changes to update counts
          if (!isOwnProfile) {
            publicProfile.refetch?.()
          }
        }}
      />

      {/* Profile Stats */}
      <ProfileStats stats={profileData.stats} />

      {/* Welcome Banner for New Users */}
      {showWelcomeBanner && isOwnProfile && (
        <ContentContainer maxWidth="lg">
          <div className="p-4">
            <div className="bg-gradient-to-br from-matcha-50 to-green-50 border-2 border-matcha-200 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-matcha-100 rounded-full -mr-16 -mt-16 opacity-50" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-100 rounded-full -ml-12 -mb-12 opacity-50" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-6 h-6 text-matcha-600" />
                  <h2 className="text-2xl font-bold text-gray-900">{COPY.profile.welcomeTitle}</h2>
                </div>

                <p className="text-gray-700 mb-4">
                  {COPY.profile.welcomeSubtitle}
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-matcha-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{COPY.profile.exploreCafes}</h3>
                      <p className="text-sm text-gray-600">
                        {COPY.profile.exploreCafesDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-matcha-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{COPY.profile.buildPassport}</h3>
                      <p className="text-sm text-gray-600">
                        {COPY.profile.buildPassportDescription}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      navigate('/')
                      localStorage.setItem(`welcome_shown_${currentUser?.id}`, 'true')
                      setShowWelcomeBanner(false)
                    }}
                    className="flex-1 bg-gradient-to-r from-matcha-500 to-matcha-600 hover:from-matcha-600 hover:to-matcha-700 text-white font-semibold py-3 px-6 rounded-lg transition active:scale-[0.98]"
                  >
                    {COPY.profile.startExploringButton}
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem(`welcome_shown_${currentUser?.id}`, 'true')
                      setShowWelcomeBanner(false)
                    }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition"
                  >
                    {COPY.profile.dismissButton}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ContentContainer>
      )}

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
