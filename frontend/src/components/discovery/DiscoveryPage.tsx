import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ContentContainer } from '../ContentContainer'
import { DiscoverySection } from './DiscoverySection'
import { COPY } from '../../constants/copy'
import { api } from '../../utils/api'
import { useAuthStore } from '../../stores/authStore'
import { useGeolocation } from '../../hooks/useGeolocation'
import { getOptimalGeolocationOptions } from '../../utils/deviceDetection'
import type { Cafe } from '../../../../shared/types'

interface RecommendationItem {
  cafe: Cafe
  score: number
  reasons: string[]
}

/**
 * Discovery Page (Phase 2E)
 * Shows trending, new, underrated, and personalized recommendations
 */
export const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { coordinates } = useGeolocation(getOptimalGeolocationOptions())

  // State for each section
  const [trending, setTrending] = useState<RecommendationItem[]>([])
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [trendingError, setTrendingError] = useState<string | null>(null)

  const [newCafes, setNewCafes] = useState<Cafe[]>([])
  const [newLoading, setNewLoading] = useState(false)
  const [newError, setNewError] = useState<string | null>(null)

  const [underrated, setUnderrated] = useState<Cafe[]>([])
  const [underratedLoading, setUnderratedLoading] = useState(false)
  const [underratedError, setUnderratedError] = useState<string | null>(null)

  const [forYou, setForYou] = useState<RecommendationItem[]>([])
  const [forYouLoading, setForYouLoading] = useState(false)
  const [forYouError, setForYouError] = useState<string | null>(null)

  // Fetch trending cafes (public, no auth required)
  useEffect(() => {
    const fetchTrending = async () => {
      setTrendingLoading(true)
      setTrendingError(null)
      try {
        const response = await api.recommendations.getTrending({ limit: 10 })
        setTrending(response.trending)
      } catch (error) {
        console.error('Failed to fetch trending cafes:', error)
        setTrendingError(COPY.discovery.errorTrending)
      } finally {
        setTrendingLoading(false)
      }
    }

    fetchTrending()
  }, [])

  // Fetch new cafes (most recently added)
  useEffect(() => {
    const fetchNewCafes = async () => {
      setNewLoading(true)
      setNewError(null)
      try {
        // Get all cafes and sort by createdAt (most recent first)
        const response = await api.cafes.getAll({ limit: 10 })
        // Sort by ID descending (proxy for recency since we don't have createdAt in response)
        const sorted = response.cafes.sort((a, b) => b.id - a.id)
        setNewCafes(sorted.slice(0, 10))
      } catch (error) {
        console.error('Failed to fetch new cafes:', error)
        setNewError(COPY.discovery.errorNew)
      } finally {
        setNewLoading(false)
      }
    }

    fetchNewCafes()
  }, [])

  // Fetch underrated cafes (high rating, few reviews)
  useEffect(() => {
    const fetchUnderrated = async () => {
      setUnderratedLoading(true)
      setUnderratedError(null)
      try {
        // Get cafes with high scores
        const response = await api.cafes.getAll({ minScore: 8, limit: 50 })

        // Filter for cafes with few reviews/activity (underrated)
        // For now, we'll just show high-rated cafes
        // TODO: Add review count to cafe data to better filter underrated cafes
        setUnderrated(response.cafes.slice(0, 10))
      } catch (error) {
        console.error('Failed to fetch underrated cafes:', error)
        setUnderratedError(COPY.discovery.errorUnderrated)
      } finally {
        setUnderratedLoading(false)
      }
    }

    fetchUnderrated()
  }, [])

  // Fetch personalized recommendations (requires auth)
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const fetchForYou = async () => {
      setForYouLoading(true)
      setForYouError(null)
      try {
        const params: { lat?: number; lng?: number; limit: number } = { limit: 10 }

        // Include location if available
        if (coordinates) {
          params.lat = coordinates.latitude
          params.lng = coordinates.longitude
        }

        const response = await api.recommendations.getForYou(params)
        setForYou(response.recommendations)
      } catch (error) {
        console.error('Failed to fetch personalized recommendations:', error)
        setForYouError(COPY.discovery.errorRecommendations)
      } finally {
        setForYouLoading(false)
      }
    }

    fetchForYou()
  }, [isAuthenticated, coordinates])

  // Navigate to cafe detail view
  const handleViewDetails = (cafe: Cafe) => {
    const slug = cafe.name.toLowerCase().replace(/\s+/g, '-')
    const cityShortcode = cafe.city.toLowerCase().substring(0, 3) // e.g., "tor" for Toronto
    navigate(`/${cityShortcode}/${slug}`)
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white border-b-2 border-green-200 px-4 py-4 shadow-xs sticky top-0 z-10">
        <ContentContainer>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {COPY.discovery.title}
          </h1>
          <p className="text-sm text-gray-600">
            {COPY.discovery.subtitle}
          </p>
        </ContentContainer>
      </div>

      {/* Content */}
      <div className="py-4">
        <ContentContainer>
          {/* Personalized Recommendations (if authenticated) */}
          {isAuthenticated && (
            <DiscoverySection
              title={COPY.discovery.forYou}
              subtitle={COPY.discovery.forYouSubtitle}
              cafes={forYou}
              loading={forYouLoading}
              error={forYouError || undefined}
              emptyMessage={COPY.discovery.noRecommendationsDescription}
              onViewDetails={handleViewDetails}
            />
          )}

          {/* Trending Cafes */}
          <DiscoverySection
            title={COPY.discovery.trending}
            subtitle={COPY.discovery.trendingSubtitle}
            cafes={trending}
            loading={trendingLoading}
            error={trendingError || undefined}
            emptyMessage={COPY.discovery.noTrending}
            badge="🔥"
            onViewDetails={handleViewDetails}
          />

          {/* New Cafes */}
          <DiscoverySection
            title={COPY.discovery.newCafes}
            subtitle={COPY.discovery.newCafesSubtitle}
            cafes={newCafes.map(cafe => ({ cafe, score: undefined, reasons: [] }))}
            loading={newLoading}
            error={newError || undefined}
            emptyMessage={COPY.discovery.noNewCafes}
            badge={COPY.discovery.recentlyAdded}
            onViewDetails={handleViewDetails}
          />

          {/* Hidden Gems */}
          <DiscoverySection
            title={COPY.discovery.underrated}
            subtitle={COPY.discovery.underratedSubtitle}
            cafes={underrated.map(cafe => ({ cafe, score: undefined, reasons: [] }))}
            loading={underratedLoading}
            error={underratedError || undefined}
            emptyMessage={COPY.discovery.noUnderrated}
            badge={COPY.discovery.highlyRated}
            onViewDetails={handleViewDetails}
          />
        </ContentContainer>
      </div>
    </div>
  )
}
