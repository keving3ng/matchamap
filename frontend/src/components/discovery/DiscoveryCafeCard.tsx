import React from 'react'
import { MapPin, Star } from '@/components/icons'
import { COPY } from '../../constants/copy'
import type { Cafe } from '../../../../shared/types'

interface DiscoveryCafeCardProps {
  cafe: Cafe
  score?: number
  reasons?: string[]
  badge?: string
  onViewDetails: (cafe: Cafe) => void
}

/**
 * Cafe card for discovery sections
 * Horizontal scroll optimized, mobile-first design
 */
export const DiscoveryCafeCard: React.FC<DiscoveryCafeCardProps> = ({
  cafe,
  score,
  reasons,
  badge,
  onViewDetails,
}) => {
  const handleClick = () => {
    onViewDetails(cafe)
  }

  return (
    <button
      onClick={handleClick}
      className="flex-shrink-0 w-64 bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden active:scale-[0.98] transition-transform"
    >
      {/* Cafe Image Placeholder */}
      <div className="h-32 bg-gradient-to-br from-green-100 to-green-50 relative">
        {badge && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            {badge}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <Star className="w-12 h-12 text-green-300" />
        </div>
      </div>

      {/* Cafe Info */}
      <div className="p-3 text-left">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
          {cafe.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
          <MapPin className="w-3 h-3" />
          <span className="line-clamp-1">{cafe.neighborhood || cafe.city}</span>
        </div>

        {/* Score Badge */}
        {cafe.matchaScore !== null && cafe.matchaScore !== undefined && (
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-green-100 text-green-800 text-sm font-bold px-2 py-1 rounded">
              {cafe.matchaScore.toFixed(1)}
            </div>
            {score !== undefined && (
              <span className="text-xs text-gray-500">
                {COPY.discovery.matchScore(Math.round(score * 100))}
              </span>
            )}
          </div>
        )}

        {/* Reasons */}
        {reasons && reasons.length > 0 && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {reasons[0]}
          </p>
        )}
      </div>
    </button>
  )
}
