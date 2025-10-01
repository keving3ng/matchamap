import React, { useState, useMemo } from 'react'
import { Navigation, MapPin, ChevronDown, Crosshair, Filter, X, Search } from 'lucide-react'
import { useGeolocation } from '../hooks/useGeolocation'
import { getLocationRequestAdvice, getOptimalGeolocationOptions } from '../utils/deviceDetection'
import type { ListViewProps } from '../types'

type SortOption = 'rating' | 'distance' | 'area'

interface FilterState {
  priceRange: string[]
  minRating: number | null
  neighborhoods: string[]
}

export const ListView: React.FC<ListViewProps> = ({ cafes, expandedCard, onToggleExpand, onViewDetails }) => {
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [],
    minRating: null,
    neighborhoods: []
  })

  const {
    coordinates,
    error,
    loading,
    requestLocation,
    clearLocation,
    isSupported
  } = useGeolocation(getOptimalGeolocationOptions())

  const handleLocationClick = () => {
    // Always refresh location when clicked (cheap operation, useful for moving users)
    requestLocation()
  }

  // Auto-trigger location when distance filter is selected
  React.useEffect(() => {
    if (sortBy === 'distance' && !coordinates && !loading && !error) {
      requestLocation()
    }
  }, [sortBy, coordinates, loading, error, requestLocation])

  // Get unique neighborhoods for filter options
  const uniqueNeighborhoods = useMemo(() => {
    const neighborhoods = cafes.map(cafe => cafe.neighborhood)
    return Array.from(new Set(neighborhoods)).sort()
  }, [cafes])

  // Get unique price ranges for filter options
  const uniquePriceRanges = useMemo(() => {
    const priceRanges = cafes
      .map(cafe => cafe.priceRange)
      .filter((price): price is string => price !== undefined)
    return Array.from(new Set(priceRanges)).sort()
  }, [cafes])

  // Check if any filters or search are active
  const hasActiveFilters = filters.priceRange.length > 0 ||
                          filters.minRating !== null ||
                          filters.neighborhoods.length > 0

  const hasActiveSearch = searchQuery.trim().length > 0

  // Toggle filter helpers
  const togglePriceRange = (price: string) => {
    setFilters(prev => ({
      ...prev,
      priceRange: prev.priceRange.includes(price)
        ? prev.priceRange.filter(p => p !== price)
        : [...prev.priceRange, price]
    }))
  }

  const toggleNeighborhood = (neighborhood: string) => {
    setFilters(prev => ({
      ...prev,
      neighborhoods: prev.neighborhoods.includes(neighborhood)
        ? prev.neighborhoods.filter(n => n !== neighborhood)
        : [...prev.neighborhoods, neighborhood]
    }))
  }

  const setMinRating = (rating: number | null) => {
    setFilters(prev => ({ ...prev, minRating: rating }))
  }

  const clearFilters = () => {
    setFilters({
      priceRange: [],
      minRating: null,
      neighborhoods: []
    })
  }

  // Filter and sort cafes based on selected options
  const filteredAndSortedCafes = useMemo(() => {
    // First apply search
    let filtered = cafes.filter(cafe => {
      if (hasActiveSearch) {
        const query = searchQuery.toLowerCase().trim()

        // Search in cafe name
        if (cafe.name.toLowerCase().includes(query)) {
          return true
        }

        // Search in neighborhood
        if (cafe.neighborhood.toLowerCase().includes(query)) {
          return true
        }

        // Search in quick note (keywords/tags)
        if (cafe.quickNote && cafe.quickNote.toLowerCase().includes(query)) {
          return true
        }

        // Search in address
        if (cafe.address.toLowerCase().includes(query)) {
          return true
        }

        return false
      }
      return true
    })

    // Then apply filters
    filtered = filtered.filter(cafe => {
      // Price range filter
      if (filters.priceRange.length > 0) {
        if (!cafe.priceRange || !filters.priceRange.includes(cafe.priceRange)) {
          return false
        }
      }

      // Rating filter
      if (filters.minRating !== null) {
        if (cafe.score < filters.minRating) {
          return false
        }
      }

      // Neighborhood filter
      if (filters.neighborhoods.length > 0) {
        if (!filters.neighborhoods.includes(cafe.neighborhood)) {
          return false
        }
      }

      return true
    })

    // Then apply sorting
    const cafesCopy = [...filtered]

    switch (sortBy) {
      case 'rating':
        // Sort by score (highest first)
        return cafesCopy.sort((a, b) => b.score - a.score)

      case 'distance':
        // Sort by distance (nearest first)
        // Cafes without distance info go to the end
        return cafesCopy.sort((a, b) => {
          if (!a.distanceInfo && !b.distanceInfo) return 0
          if (!a.distanceInfo) return 1
          if (!b.distanceInfo) return -1
          return a.distanceInfo.kilometers - b.distanceInfo.kilometers
        })

      case 'area':
        // Sort alphabetically by neighborhood
        return cafesCopy.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood))

      default:
        return cafesCopy
    }
  }, [cafes, sortBy, filters, searchQuery, hasActiveSearch])

  return (
    <div className="flex-1 overflow-y-auto pb-24 relative">
      {/* Sort & Filter Header */}
      <div className="bg-white border-b-2 border-green-200 shadow-sm">
        {/* Sort & Action Buttons */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Sort By Dropdown */}
            <div className="relative max-w-xs">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-4 py-2 rounded-full text-sm font-semibold bg-green-600 text-white appearance-none cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <option value="rating">Sort: Rating</option>
                <option value="distance">Sort: Distance</option>
                <option value="area">Sort: Area</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>

            {/* Fixed action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Search Toggle Button */}
              <button
                onClick={() => {
                  setShowSearch(!showSearch)
                  if (!showSearch) setShowFilters(false) // Close filters when opening search
                }}
                className={`p-2 sm:px-3 sm:py-2 rounded-full text-sm font-semibold whitespace-nowrap transition flex items-center justify-center sm:justify-start gap-1.5 relative ${
                  hasActiveSearch || showSearch
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Search size={16} />
                <span className="hidden sm:inline">Search</span>
                {hasActiveSearch && !showSearch && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {/* Filter Toggle Button */}
              <button
                onClick={() => {
                  setShowFilters(!showFilters)
                  if (!showFilters) setShowSearch(false) // Close search when opening filters
                }}
                className={`p-2 sm:px-3 sm:py-2 rounded-full text-sm font-semibold whitespace-nowrap transition flex items-center justify-center sm:justify-start gap-1.5 relative ${
                  hasActiveFilters || showFilters
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Filter size={16} />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && !showFilters && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {/* Location Button */}
              <button
                onClick={handleLocationClick}
                disabled={!isSupported || (error !== null && error.code === 1)}
                className={`p-2 rounded-full transition relative flex items-center justify-center ${
                  coordinates
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                } ${!isSupported || (error && error.code === 1) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={coordinates ? 'Location found' : 'Find my location'}
              >
                {loading ? (
                  <Crosshair size={20} className="animate-pulse" />
                ) : (
                  <MapPin size={20} />
                )}
                {coordinates && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar (Collapsible) */}
        {showSearch && (
          <div className="px-4 py-3 border-t border-green-100 overflow-hidden transition-all duration-300 ease-in-out animate-slide-down">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cafes, neighborhoods, or keywords..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                autoFocus
              />
              {hasActiveSearch && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 pb-4 pt-3 border-t border-green-100 overflow-hidden transition-all duration-300 ease-in-out animate-slide-down">
            <div className="space-y-3">
              {/* Price Range Filter */}
              {uniquePriceRanges.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">Price Range</h4>
                  <div className="flex flex-wrap gap-2">
                    {uniquePriceRanges.map(price => (
                      <button
                        key={price}
                        onClick={() => togglePriceRange(price)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                          filters.priceRange.includes(price)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {price}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating Filter */}
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-2">Minimum Rating</h4>
                <div className="flex flex-wrap gap-2">
                  {[7, 8, 9].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(filters.minRating === rating ? null : rating)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        filters.minRating === rating
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {rating}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Neighborhood Filter */}
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-2">Neighborhood</h4>
                <div className="flex flex-wrap gap-2">
                  {uniqueNeighborhoods.map(neighborhood => (
                    <button
                      key={neighborhood}
                      onClick={() => toggleNeighborhood(neighborhood)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        filters.neighborhoods.includes(neighborhood)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {neighborhood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="pt-2">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <X size={16} />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Location Permission Dialog */}
      {error && error.code === 1 && ( // PERMISSION_DENIED
        <div className="absolute inset-x-4 top-4 bg-white rounded-xl shadow-xl p-4 z-[9999] border border-red-200 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin size={20} className="text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">Location Access Needed</h3>
              <p className="text-sm text-gray-600 mb-3">
                {getLocationRequestAdvice()}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                We need location access to calculate distances to cafes. Your location is never stored or shared.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={requestLocation}
                  className="px-4 py-2 bg-matcha-500 text-white rounded-lg text-sm font-medium hover:bg-matcha-600 transition focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:ring-offset-2"
                >
                  Try Again
                </button>
                <button
                  onClick={clearLocation}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Loading Dialog */}
      {loading && !error && !coordinates && (
        <div className="absolute inset-x-4 top-4 bg-white rounded-xl shadow-xl p-4 z-[9999] border border-matcha-200 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-matcha-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Crosshair size={20} className="text-matcha-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">Finding Your Location</h3>
              <p className="text-sm text-gray-600 mb-3">
                Please allow location access when prompted. This may take a few seconds...
              </p>
              <button
                onClick={clearLocation}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Error Dialog */}
      {error && error.code !== 1 && (
        <div className="absolute inset-x-4 top-4 bg-white rounded-xl shadow-xl p-4 z-[9999] border border-yellow-200 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Crosshair size={20} className="text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">Location Unavailable</h3>
              <p className="text-sm text-gray-600 mb-3">
                {error.code === 2 ? 'Unable to determine your location. Try moving to an open area with better GPS signal, or make sure location services are enabled for your browser.' :
                 error.code === 3 ? 'Location request timed out. This often happens indoors or in areas with poor GPS signal. Try again when you have better signal or are outdoors.' :
                 error.code === 0 ? 'Geolocation is not supported by your browser. Try using a modern browser like Chrome, Safari, or Firefox.' :
                 'Location services are not available. Make sure you\'re on a secure (HTTPS) connection and location services are enabled.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={requestLocation}
                  className="px-4 py-2 bg-matcha-500 text-white rounded-lg text-sm font-medium hover:bg-matcha-600 transition focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:ring-offset-2"
                >
                  Try Again
                </button>
                <button
                  onClick={clearLocation}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cafe List */}
      <div className="px-4 py-4 space-y-3">
        {filteredAndSortedCafes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">No cafes match your filters</p>
            <button
              onClick={clearFilters}
              className="text-green-600 font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredAndSortedCafes.map((cafe) => (
          <div key={cafe.id} className="bg-white rounded-2xl shadow-md border-2 border-green-100 overflow-hidden">
            <button
              onClick={() => onToggleExpand(expandedCard === cafe.id ? null : cafe.id)}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg text-gray-800">{cafe.name}</h3>
                  <div className="bg-green-500 text-white px-2.5 py-0.5 rounded-full font-bold text-sm">
                    {cafe.score}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-medium">{cafe.neighborhood}</span>
                  <span>•</span>
                  {cafe.distanceInfo ? (
                    <span className="flex items-center gap-1">
                      <Navigation size={14} />
                      {cafe.distanceInfo.formattedKm}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400 cursor-pointer hover:text-gray-600 transition" title="Click map location button to enable">
                      <MapPin size={14} />
                      Tap location button for distance
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown
                size={24}
                className={`text-green-600 transition-transform ${
                  expandedCard === cafe.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedCard === cafe.id && (
              <div className="px-4 pb-4 border-t-2 border-green-100 pt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{cafe.address}</p>
                      {cafe.distanceInfo ? (
                        <p className="text-xs text-gray-500">{cafe.distanceInfo.walkTime} walk</p>
                      ) : (
                        <p className="text-xs text-gray-400">Tap map location button for walk time</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-sm text-gray-700 italic">"{cafe.quickNote}"</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onViewDetails(cafe)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-2.5 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition shadow-md text-sm"
                    >
                      View Full Details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ListView