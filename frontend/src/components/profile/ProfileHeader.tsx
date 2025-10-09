import React from 'react'
import { MapPin, Instagram, Globe, Edit2 } from 'lucide-react'
import { SecondaryButton } from '../ui'
import { COPY } from '../../constants/copy'
import type { PublicUserProfile } from '../../../../shared/types'

interface ProfileHeaderProps {
  profile: PublicUserProfile['user']
  isOwnProfile?: boolean
  onEditClick?: () => void
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwnProfile = false,
  onEditClick,
}) => {
  const displayName = profile.displayName || profile.username
  const avatarUrl = profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=200&background=7cb342&color=fff`

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="relative">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-matcha-100"
            />
          </div>

          {/* Name and Username */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              {displayName}
            </h1>
            {profile.displayName && (
              <p className="text-gray-600 text-sm sm:text-base">@{profile.username}</p>
            )}

            {/* Location */}
            {profile.location && (
              <div className="flex items-center gap-1 mt-2 text-gray-600">
                <MapPin size={16} />
                <span className="text-sm">{profile.location}</span>
              </div>
            )}
          </div>

          {/* Edit Button (Own Profile Only) */}
          {isOwnProfile && (
            <div className="flex-shrink-0">
              <SecondaryButton
                icon={Edit2}
                onClick={onEditClick}
                className="!p-2"
              >
                <span className="hidden sm:inline">{COPY.profile.edit}</span>
              </SecondaryButton>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-gray-700 text-sm sm:text-base mb-4 whitespace-pre-wrap">
            {profile.bio}
          </p>
        )}

        {/* Social Links */}
        {(profile.social?.instagram || profile.social?.website) && (
          <div className="flex items-center gap-3">
            {profile.social.instagram && (
              <a
                href={`https://instagram.com/${profile.social.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-gray-600 hover:text-matcha-600 transition-colors"
              >
                <Instagram size={18} />
                <span className="text-sm">{profile.social.instagram}</span>
              </a>
            )}
            {profile.social.website && (
              <a
                href={profile.social.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-gray-600 hover:text-matcha-600 transition-colors"
              >
                <Globe size={18} />
                <span className="text-sm">{COPY.profile.website}</span>
              </a>
            )}
          </div>
        )}

        {/* Join Date */}
        <div className="mt-3 text-xs text-gray-500">
          {COPY.profile.memberSince} {new Date(profile.joinedAt).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>
    </div>
  )
}
