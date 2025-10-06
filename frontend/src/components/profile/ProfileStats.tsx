import React from 'react'
import { MessageCircle, MapPin, Camera, Award } from 'lucide-react'
import { COPY } from '../../constants/copy'
import type { UserProfileStats } from '../../../../shared/types'

interface ProfileStatsProps {
  stats: UserProfileStats
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
  const statItems = [
    {
      icon: MessageCircle,
      label: COPY.profile.reviews,
      value: stats.totalReviews,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: MapPin,
      label: COPY.profile.checkins,
      value: stats.totalCheckins,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Camera,
      label: COPY.profile.photos,
      value: stats.totalPhotos,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Award,
      label: COPY.profile.passport,
      value: `${stats.passportCompletion}%`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className={`p-2 rounded-full ${item.bgColor} mb-2`}>
                  <Icon className={item.color} size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-600 mt-1">{item.label}</div>
              </div>
            )
          })}
        </div>

        {/* Reputation Score (if significant) */}
        {stats.reputationScore > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-matcha-50 to-matcha-100 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <Award className="text-matcha-700" size={18} />
              <span className="text-sm font-semibold text-matcha-800">
                {COPY.profile.reputation(stats.reputationScore)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
