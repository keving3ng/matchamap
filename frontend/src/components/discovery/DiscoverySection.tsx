import React from 'react'
import { ChevronRight } from '@/components/icons'
import { DiscoveryCafeCard } from './DiscoveryCafeCard'
import { Skeleton } from '../ui/Skeleton'
import { COPY } from '../../constants/copy'
import type { Cafe } from '../../../../shared/types'

interface DiscoverySectionProps {
  title: string
  subtitle?: string
  cafes: Array<{
    cafe: Cafe
    score?: number
    reasons?: string[]
  }>
  loading?: boolean
  error?: string
  emptyMessage?: string
  badge?: string
  onViewDetails: (cafe: Cafe) => void
  onSeeAll?: () => void
}

/**
 * Horizontal scrollable section for discovery page
 * Mobile-first with touch-optimized scrolling
 */
export const DiscoverySection: React.FC<DiscoverySectionProps> = ({
  title,
  subtitle,
  cafes,
  loading,
  error,
  emptyMessage,
  badge,
  onViewDetails,
  onSeeAll,
}) => {
  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        {onSeeAll && cafes.length > 0 && (
          <button
            onClick={onSeeAll}
            className="flex items-center gap-1 text-sm font-medium text-green-600 active:scale-95 transition-transform"
          >
            {COPY.discovery.seeAll}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-64">
              <Skeleton variant="rectangular" height={192} className="rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && cafes.length === 0 && (
        <div className="px-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600">
              {emptyMessage || COPY.discovery.noRecommendations}
            </p>
          </div>
        </div>
      )}

      {/* Cafe Cards - Horizontal Scroll */}
      {!loading && !error && cafes.length > 0 && (
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory">
          {cafes.map(({ cafe, score, reasons }) => (
            <div key={cafe.id} className="snap-start">
              <DiscoveryCafeCard
                cafe={cafe}
                score={score}
                reasons={reasons}
                badge={badge}
                onViewDetails={onViewDetails}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
