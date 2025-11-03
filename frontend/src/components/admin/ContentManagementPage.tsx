import React, { useEffect, useState } from 'react'
import { Image, Search, ChevronRight, Loader, MessageSquare } from '@/components/icons'
import { useNavigate } from 'react-router'
import { useDataStore } from '../../stores/dataStore'
import { CITIES } from '../../stores/cityStore'
import type { Cafe } from '../../types'

interface CafeWithCounts extends Cafe {
  photoCount?: number
  photoCountVisible?: number
  photoCountHidden?: number
  reviewCount?: number
  reviewCountVisible?: number
  reviewCountHidden?: number
}

export const ContentManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { allCafes, fetchCafes, isLoading } = useDataStore()
  const [cafesWithCounts, setCafesWithCounts] = useState<CafeWithCounts[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCity, setFilterCity] = useState<string>('all')
  const [loadingCounts, setLoadingCounts] = useState(false)

  useEffect(() => {
    fetchCafes(undefined, true) // Bust cache on mount for admin
  }, [fetchCafes])

  // Fetch photo and review counts for all cafes
  useEffect(() => {
    const fetchCounts = async () => {
      if (allCafes.length === 0) return

      setLoadingCounts(true)
      try {
        // Fetch counts for all cafes in parallel
        const cafesWithCountsData = await Promise.all(
          allCafes.map(async (cafe) => {
            try {
              const [photosRes, reviewsRes] = await Promise.all([
                // Use admin photos endpoint to get ALL photos (including hidden)
                fetch(`${import.meta.env.VITE_API_URL}/api/admin/cafes/${cafe.id}/photos`, {
                  credentials: 'include'
                }).then(res => res.json()),
                // Use admin reviews endpoint to get ALL reviews (including hidden)
                fetch(`${import.meta.env.VITE_API_URL}/api/admin/cafes/${cafe.id}/reviews`, {
                  credentials: 'include'
                }).then(res => res.json())
              ])

              const photos = photosRes.photos || []
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const visiblePhotos = photos.filter((p: any) => p.moderationStatus === 'approved')
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const hiddenPhotos = photos.filter((p: any) => p.moderationStatus === 'rejected')

              const reviews = reviewsRes.reviews || []
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const visibleReviews = reviews.filter((r: any) => r.moderationStatus === 'approved')
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const hiddenReviews = reviews.filter((r: any) => r.moderationStatus === 'rejected')

              return {
                ...cafe,
                photoCount: photos.length,
                photoCountVisible: visiblePhotos.length,
                photoCountHidden: hiddenPhotos.length,
                reviewCount: reviews.length,
                reviewCountVisible: visibleReviews.length,
                reviewCountHidden: hiddenReviews.length
              }
            } catch (error) {
              console.error(`Failed to fetch counts for cafe ${cafe.id}:`, error)
              return {
                ...cafe,
                photoCount: 0,
                photoCountVisible: 0,
                photoCountHidden: 0,
                reviewCount: 0,
                reviewCountVisible: 0,
                reviewCountHidden: 0
              }
            }
          })
        )
        setCafesWithCounts(cafesWithCountsData)
      } catch (error) {
        console.error('Failed to fetch cafe counts:', error)
      } finally {
        setLoadingCounts(false)
      }
    }

    fetchCounts()
  }, [allCafes])

  // Filter cafes based on search and city filter
  const filteredCafes = cafesWithCounts.filter(cafe => {
    const matchesSearch = cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cafe.quickNote.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cafe.city.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCity = filterCity === 'all' || cafe.city === filterCity

    return matchesSearch && matchesCity
  })

  const handleManagePhotos = (cafe: CafeWithCounts) => {
    navigate(`/admin/content/cafes/${cafe.id}/photos`)
  }

  const handleManageReviews = (cafe: CafeWithCounts) => {
    navigate(`/admin/content/cafes/${cafe.id}/reviews`)
  }

  const getPhotoCountText = (cafe: CafeWithCounts) => {
    const total = cafe.photoCount || 0
    const hidden = cafe.photoCountHidden || 0
    const visible = cafe.photoCountVisible || 0

    if (total === 0) return '0 photos'
    if (hidden === 0) return `${total} ${total === 1 ? 'photo' : 'photos'}`
    return `${visible} ${visible === 1 ? 'photo' : 'photos'} (${total} total, ${hidden} hidden)`
  }

  const getReviewCountText = (cafe: CafeWithCounts) => {
    const total = cafe.reviewCount || 0
    const hidden = cafe.reviewCountHidden || 0
    const visible = cafe.reviewCountVisible || 0

    if (total === 0) return '0 reviews'
    if (hidden === 0) return `${total} ${total === 1 ? 'review' : 'reviews'}`
    return `${visible} ${visible === 1 ? 'review' : 'reviews'} (${total} total, ${hidden} hidden)`
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-green-800 mb-2 flex items-center gap-2">
              <Image size={28} />
              Content Management
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Manage photos and reviews for each cafe
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search cafes by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Cities</option>
              {Object.values(CITIES).map(city => (
                <option key={city.key} value={city.key}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {(isLoading || loadingCounts) && (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-green-500" size={48} />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !loadingCounts && filteredCafes.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Image size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No cafes found</h3>
            <p className="text-gray-600">
              {searchQuery || filterCity !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No cafes available'}
            </p>
          </div>
        )}

        {/* Cafe List */}
        {!isLoading && !loadingCounts && filteredCafes.length > 0 && (
          <div className="space-y-3">
            {filteredCafes.map((cafe) => (
              <div key={cafe.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-800">{cafe.name}</h3>
                      {cafe.displayScore && (
                        <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full font-bold text-sm">
                          {cafe.displayScore.toFixed(1)}
                        </span>
                      )}
                      <span className="text-sm text-gray-500 capitalize">{cafe.city}</span>
                    </div>

                    {/* Counts */}
                    <div className="flex flex-row gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Image size={16} className="text-blue-500" />
                        <span>{getPhotoCountText(cafe)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare size={16} className="text-purple-500" />
                        <span>{getReviewCountText(cafe)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleManagePhotos(cafe)}
                      disabled={(cafe.photoCount ?? 0) === 0}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Image size={16} />
                      <span>Manage Photos</span>
                      {(cafe.photoCount ?? 0) > 0 && <ChevronRight size={16} />}
                    </button>
                    <button
                      onClick={() => handleManageReviews(cafe)}
                      disabled={(cafe.reviewCount ?? 0) === 0}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MessageSquare size={16} />
                      <span>Manage Reviews</span>
                      {(cafe.reviewCount ?? 0) > 0 && <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {!isLoading && !loadingCounts && filteredCafes.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredCafes.length} of {cafesWithCounts.length} cafes
          </div>
        )}
      </div>
    </div>
  )
}

export default ContentManagementPage
