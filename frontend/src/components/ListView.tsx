import React, { useState, useMemo } from 'react'
import { Navigation, MapPin, ChevronDown, Crosshair, Filter, X, Search, Coffee, Star, Building2, Instagram, Clock } from 'lucide-react'
import { TikTokIcon } from './TikTokIcon'
import { useGeolocation } from '../hooks/useGeolocation'
import { useUIStore } from '../stores/uiStore'
import { getLocationRequestAdvice, getOptimalGeolocationOptions } from '../utils/deviceDetection'
import { getMapsUrl } from '../utils/mapsUrl'
import { isCurrentlyOpen, formatHoursCompact } from '../utils/hoursFormatter'
import { ContentContainer } from './ContentContainer'
import { useCityStore, type CityKey } from '../stores/cityStore'
import { COPY } from '../constants/copy'
import type { ListViewProps } from '../types'

type SortOption = 'rating' | 'distance'

interface FilterState {
  minRating: number | null
  maxDistance: number | null // in kilometers
  selectedCities: CityKey[] // multi-select cities
  openNow: boolean
}

export const ListView: React.FC<ListViewProps> = ({ cafes, expandedCard, onToggleExpand, onViewDetails }) => {
  const { getAvailableCities, loadAvailableCities, availableCitiesLoaded } = useCityStore()
  const availableCities = getAvailableCities()
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    minRating: null,
    maxDistance: null,
    selectedCities: [],
    openNow: false
  })
  const { selectedDrinkType, setSelectedDrinkType } = useUIStore()

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

  // Load available cities on mount
  React.useEffect(() => {
    if (!availableCitiesLoaded) {
      loadAvailableCities()
    }
  }, [availableCitiesLoaded, loadAvailableCities])

  // Auto-trigger location when distance filter is selected
  React.useEffect(() => {
    if ((sortBy === 'distance' || filters.maxDistance !== null) && !coordinates && !loading && !error) {
      requestLocation()
    }
  }, [sortBy, filters.maxDistance, coordinates, loading, error, requestLocation])

  // Get unique drink types from all cafes
  const availableDrinkTypes = React.useMemo(() => {
    const drinkTypes = new Set<string>()
    cafes.forEach(cafe => {
      cafe.drinks?.forEach(drink => {
        const drinkName = drink.name || 'Iced Matcha Latte'
        drinkTypes.add(drinkName)
      })
    })
    return Array.from(drinkTypes).sort()
  }, [cafes])

  // Check if any filters or search are active
  const hasActiveFilters = filters.minRating !== null || filters.maxDistance !== null || filters.selectedCities.length > 0 || filters.openNow || selectedDrinkType !== null

  const hasActiveSearch = searchQuery.trim().length > 0

  // Toggle filter helpers
  const setMinRating = (rating: number | null) => {
    setFilters(prev => ({ ...prev, minRating: rating }))
  }

  const setMaxDistance = (distance: number | null) => {
    setFilters(prev => ({ ...prev, maxDistance: distance }))
  }

  const toggleCity = (city: CityKey) => {
    setFilters(prev => ({
      ...prev,
      selectedCities: prev.selectedCities.includes(city)
        ? prev.selectedCities.filter(c => c !== city)
        : [...prev.selectedCities, city]
    }))
  }

  const clearFilters = () => {
    setFilters({
      minRating: null,
      maxDistance: null,
      selectedCities: [],
      openNow: false
    })
    setSelectedDrinkType(null)
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

        // Search in quick note (keywords/tags)
        if (cafe.quickNote && cafe.quickNote.toLowerCase().includes(query)) {
          return true
        }

        // Search in address
        if (cafe.address && cafe.address.toLowerCase().includes(query)) {
          return true
        }

        // Search in drink names
        if (cafe.drinks && cafe.drinks.some(drink => drink.name?.toLowerCase().includes(query))) {
          return true
        }

        return false
      }
      return true
    })

    // Then apply filters
    filtered = filtered.filter(cafe => {
      // Rating filter
      if (filters.minRating !== null) {
        const cafeScore = cafe.displayScore ?? 0
        if (cafeScore < filters.minRating) {
          return false
        }
      }

      // Distance filter (only if we have location and distance info)
      if (filters.maxDistance !== null && cafe.distanceInfo) {
        if (cafe.distanceInfo.kilometers > filters.maxDistance) {
          return false
        }
      }

      // City filter (multi-select)
      // City keys are already normalized in database, no need to toLowerCase
      if (filters.selectedCities.length > 0) {
        if (!cafe.city || !filters.selectedCities.includes(cafe.city as CityKey)) {
          return false
        }
      }

      // Drink type filter
      if (selectedDrinkType !== null && cafe.drinks && cafe.drinks.length > 0) {
        const hasDrink = cafe.drinks.some(drink => {
          const drinkName = drink.name || 'Iced Matcha Latte'
          return drinkName === selectedDrinkType
        })
        if (!hasDrink) {
          return false
        }
      }

      // Open now filter
      if (filters.openNow) {
        const cafeIsOpen = isCurrentlyOpen(cafe.hours)
        // Only filter out if we know it's closed (false)
        // If null (can't determine), include it in results
        if (cafeIsOpen === false) {
          return false
        }
      }

      return true
    })

    // Then apply sorting
    const cafesCopy = [...filtered]

    switch (sortBy) {
      case 'rating':
        // Sort by displayScore (highest first)
        return cafesCopy.sort((a, b) => {
          const scoreA = a.displayScore ?? 0
          const scoreB = b.displayScore ?? 0
          return scoreB - scoreA
        })

      case 'distance':
        // Sort by distance (nearest first)
        // Cafes without distance info go to the end
        return cafesCopy.sort((a, b) => {
          if (!a.distanceInfo && !b.distanceInfo) return 0
          if (!a.distanceInfo) return 1
          if (!b.distanceInfo) return -1
          return a.distanceInfo.kilometers - b.distanceInfo.kilometers
        })

      default:
        return cafesCopy
    }
  }, [cafes, sortBy, filters.minRating, filters.maxDistance, filters.selectedCities, filters.openNow, selectedDrinkType, searchQuery, hasActiveSearch])

  return (
    <div className="flex-1 overflow-y-auto pb-24 relative">
      {/* Sort & Filter Header */}
      <div className="bg-gradient-to-b from-white to-cream-50 border-b-2 border-matcha-200 shadow-md">
        {/* Sort & Action Buttons */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Sort By Dropdown */}
            <div className="relative max-w-xs">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-4 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-matcha-600 to-matcha-500 text-white appearance-none cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:ring-offset-2 shadow-md hover:from-matcha-700 hover:to-matcha-600 transition-all"
              >
                <option value="rating">{COPY.list.sortByRating}</option>
                <option value="distance">{COPY.list.sortByDistance}</option>
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
                className={`p-2 sm:px-3 sm:py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center justify-center sm:justify-start gap-1.5 relative shadow-md ${
                  hasActiveSearch || showSearch
                    ? 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white scale-105'
                    : 'bg-matcha-100 text-matcha-700 hover:bg-matcha-200'
                }`}
              >
                <Search size={16} />
                <span className="hidden sm:inline">{COPY.list.search}</span>
                {hasActiveSearch && !showSearch && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Filter Toggle Button */}
              <button
                onClick={() => {
                  setShowFilters(!showFilters)
                  if (!showFilters) setShowSearch(false) // Close search when opening filters
                }}
                className={`p-2 sm:px-3 sm:py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center justify-center sm:justify-start gap-1.5 relative shadow-md ${
                  hasActiveFilters || showFilters
                    ? 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white scale-105'
                    : 'bg-matcha-100 text-matcha-700 hover:bg-matcha-200'
                }`}
              >
                <Filter size={16} />
                <span className="hidden sm:inline">{COPY.list.filter}</span>
                {hasActiveFilters && !showFilters && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </button>

              {/* City Filter Button (desktop only) */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  className={`px-3 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 relative shadow-md ${
                    filters.selectedCities.length > 0
                      ? 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white scale-105'
                      : 'bg-matcha-100 text-matcha-700 hover:bg-matcha-200'
                  }`}
                >
                  <Building2 size={16} />
                  <span>{COPY.list.city}</span>
                  {filters.selectedCities.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                  )}
                </button>

                {/* Desktop City Dropdown */}
                {showCityDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)} />
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 min-w-[160px]">
                      <div className="px-3 py-2 border-b border-gray-200">
                        <h3 className="text-xs font-bold text-gray-500 uppercase">{COPY.list.filterByCity}</h3>
                      </div>
                      <button
                        onClick={() => {
                          setFilters(prev => ({ ...prev, selectedCities: [] }))
                          setShowCityDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-matcha-50 transition-colors ${
                          filters.selectedCities.length === 0 ? 'bg-matcha-50 text-matcha-700 font-bold' : 'text-gray-700'
                        }`}
                      >
                        {COPY.list.allCities}
                      </button>
                      {availableCities.map(city => (
                        <button
                          key={city.key}
                          onClick={() => {
                            toggleCity(city.key)
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-matcha-50 transition-colors flex items-center justify-between ${
                            filters.selectedCities.includes(city.key) ? 'bg-matcha-50 text-matcha-700 font-bold' : 'text-gray-700'
                          }`}
                        >
                          <span>{city.name}</span>
                          {filters.selectedCities.includes(city.key) && (
                            <span className="text-matcha-600">✓</span>
                          )}
                        </button>
                      ))}
                      {filters.selectedCities.length > 0 && (
                        <div className="border-t border-gray-200 mt-1 pt-1">
                          <button
                            onClick={() => {
                              setFilters(prev => ({ ...prev, selectedCities: [] }))
                              setShowCityDropdown(false)
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                          >
                            {COPY.list.clearAll}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Location Button */}
              <button
                onClick={handleLocationClick}
                disabled={!isSupported || (error !== null && error.code === 1)}
                className={`p-2 rounded-full transition-all relative flex items-center justify-center shadow-md ${
                  coordinates
                    ? 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white hover:from-matcha-700 hover:to-matcha-600 scale-105'
                    : 'bg-matcha-100 text-matcha-700 hover:bg-matcha-200'
                } ${!isSupported || (error && error.code === 1) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={coordinates ? 'Location found' : 'Find my location'}
              >
                {loading ? (
                  <Crosshair size={20} className="animate-pulse" />
                ) : (
                  <MapPin size={20} />
                )}
                {coordinates && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-matcha-400 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar (Collapsible) */}
        {showSearch && (
          <div className="px-4 py-3 border-t-2 border-matcha-100 bg-gradient-to-b from-cream-50 to-white overflow-hidden transition-all duration-300 ease-in-out animate-slide-down">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-matcha-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={COPY.list.searchPlaceholder}
                className="w-full pl-10 pr-10 py-3 bg-white border-2 border-matcha-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-matcha-500 transition-all shadow-md"
                autoFocus
              />
              {hasActiveSearch && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-matcha-600 transition-colors"
                  aria-label={COPY.list.clearSearch}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 pb-4 pt-3 border-t-2 border-matcha-100 bg-gradient-to-b from-cream-50 to-white overflow-hidden transition-all duration-300 ease-in-out animate-slide-down">
            <div className="space-y-4">
              {/* Drink Type Filter */}
              <div>
                <h4 className="text-sm font-bold text-charcoal-900 mb-3">{COPY.list.drinkType}</h4>
                <div className="relative">
                  <select
                    value={selectedDrinkType || ''}
                    onChange={(e) => setSelectedDrinkType(e.target.value || null)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-white border-2 border-matcha-200 focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-matcha-500 transition-all shadow-md appearance-none pr-10"
                  >
                    <option value="">{COPY.list.allDrinks}</option>
                    {availableDrinkTypes.map(drinkType => (
                      <option key={drinkType} value={drinkType}>
                        {drinkType}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-matcha-600 pointer-events-none" />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h4 className="text-sm font-bold text-charcoal-900 mb-3">{COPY.list.minimumRating}</h4>
                <div className="flex flex-wrap gap-2">
                  {[7, 8, 9].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(filters.minRating === rating ? null : rating)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-md ${
                        filters.minRating === rating
                          ? 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                      }`}
                    >
                      {rating}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance Filter */}
              <div>
                <h4 className="text-sm font-bold text-charcoal-900 mb-3">
                  {coordinates ? COPY.list.maxDistance : COPY.list.maxDistanceRequiresLocation}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 5, 10].map(distance => (
                    <button
                      key={distance}
                      onClick={() => setMaxDistance(filters.maxDistance === distance ? null : distance)}
                      disabled={!coordinates}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-md ${
                        filters.maxDistance === distance
                          ? 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white scale-105'
                          : coordinates
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {COPY.list.kmDistance(distance)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open Now Filter */}
              <div>
                <h4 className="text-sm font-bold text-charcoal-900 mb-3">{COPY.list.availability}</h4>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, openNow: !prev.openNow }))}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-md ${
                    filters.openNow
                      ? 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  {COPY.map.openNow}
                </button>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="pt-2">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <X size={16} />
                    {COPY.list.clearAllFilters}
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
              <h3 className="font-semibold text-gray-800 mb-1">{COPY.location.permissionDenied.title}</h3>
              <p className="text-sm text-gray-600 mb-3">
                {getLocationRequestAdvice()}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                {COPY.location.permissionDenied.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={requestLocation}
                  className="px-4 py-2 bg-matcha-500 text-white rounded-lg text-sm font-medium hover:bg-matcha-600 transition focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:ring-offset-2"
                >
                  {COPY.location.permissionDenied.tryAgain}
                </button>
                <button
                  onClick={clearLocation}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {COPY.location.permissionDenied.skip}
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
              <h3 className="font-semibold text-gray-800 mb-1">{COPY.location.loading.title}</h3>
              <p className="text-sm text-gray-600 mb-3">
                {COPY.location.loading.description}
              </p>
              <button
                onClick={clearLocation}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                {COPY.location.loading.cancel}
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
              <h3 className="font-semibold text-gray-800 mb-1">{COPY.location.unavailable.title}</h3>
              <p className="text-sm text-gray-600 mb-3">
                {error.code === 2 ? COPY.location.unavailable.errorMessages.positionUnavailable :
                 error.code === 3 ? COPY.location.unavailable.errorMessages.timeout :
                 error.code === 0 ? COPY.location.unavailable.errorMessages.notSupported :
                 COPY.location.unavailable.errorMessages.generic}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={requestLocation}
                  className="px-4 py-2 bg-matcha-500 text-white rounded-lg text-sm font-medium hover:bg-matcha-600 transition focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:ring-offset-2"
                >
                  {COPY.location.unavailable.tryAgain}
                </button>
                <button
                  onClick={clearLocation}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {COPY.location.unavailable.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cafe List */}
      <ContentContainer maxWidth="lg">
        <div className="px-4 py-4 space-y-3">
          {filteredAndSortedCafes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">{COPY.list.noResults}</p>
              <button
                onClick={clearFilters}
                className="text-green-600 font-semibold hover:underline"
              >
                {COPY.list.clearFilters}
              </button>
            </div>
          ) : (
            filteredAndSortedCafes.map((cafe) => (
            <div
              key={cafe.id}
              className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all duration-200 hover:shadow-xl ${
                expandedCard === cafe.id ? 'border-matcha-400' : 'border-matcha-100'
              }`}
            >
            <div className="p-4">
              {/* Clickable header to expand/collapse */}
              <button
                onClick={() => onToggleExpand(expandedCard === cafe.id ? null : cafe.id)}
                className="w-full text-left group"
              >
                <div className="flex items-start gap-3">
                  {/* Score Badge - Large and prominent */}
                  {cafe.displayScore && (
                    <div className="flex-shrink-0 bg-gradient-to-br from-matcha-500 to-matcha-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                      {cafe.displayScore.toFixed(1)}
                    </div>
                  )}

                  {/* Main content area */}
                  <div className="flex-1 min-w-0">
                    {/* Cafe name and city */}
                    <h3 className="font-bold text-lg text-charcoal-900 mb-1 line-clamp-1">{cafe.name}</h3>

                    {/* Metadata row */}
                    <div className="flex items-center gap-2 text-sm mb-2 flex-wrap">
                      {cafe.city && (
                        <span className="text-gray-600 text-xs px-2 py-0.5 bg-gray-100 rounded-full font-medium capitalize">
                          {cafe.city}
                        </span>
                      )}
                      {cafe.distanceInfo ? (
                        <span className="flex items-center gap-1 text-matcha-700 font-medium text-xs">
                          <Navigation size={14} className="text-matcha-600" />
                          {cafe.distanceInfo.kilometers > 5
                            ? cafe.distanceInfo.formattedKm
                            : `${cafe.distanceInfo.formattedKm} • ${cafe.distanceInfo.walkTime}`
                          }
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                          <MapPin size={14} />
                          {COPY.list.tapLocationForDistance}
                        </span>
                      )}
                    </div>

                    {/* Quick note preview */}
                    {cafe.quickNote && (
                      <p className="text-sm text-gray-600 italic line-clamp-2 mb-3">"{cafe.quickNote}"</p>
                    )}
                  </div>

                  {/* Chevron indicator */}
                  <ChevronDown
                    size={20}
                    className={`text-matcha-600 transition-all flex-shrink-0 ${
                      expandedCard === cafe.id ? 'rotate-180' : 'group-hover:translate-y-0.5'
                    }`}
                  />
                </div>
              </button>

              {/* Action buttons - outside clickable area */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                {/* Primary actions */}
                <button
                  onClick={() => onViewDetails(cafe)}
                  className="flex-1 min-w-[120px] bg-gradient-to-r from-matcha-600 to-matcha-500 text-white py-2.5 px-4 rounded-xl font-semibold hover:from-matcha-700 hover:to-matcha-600 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] text-sm flex items-center justify-center gap-1.5"
                >
                  <span>{COPY.map.viewDetails}</span>
                  <ChevronDown size={14} className="-rotate-90" />
                </button>

                <a
                  href={getMapsUrl(cafe.address || '', cafe.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[120px] bg-white border-2 border-blue-300 text-blue-600 py-2.5 px-4 rounded-xl font-semibold hover:bg-blue-50 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-1.5"
                >
                  <Navigation size={14} />
                  <span>Directions</span>
                </a>

                {/* Cafe's Instagram - icon button */}
                {cafe.instagram && (
                  <a
                    href={`https://instagram.com/${cafe.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg active:scale-95"
                    aria-label={`Follow ${cafe.name} on Instagram`}
                    title={cafe.instagram.startsWith('@') ? cafe.instagram : `@${cafe.instagram}`}
                  >
                    <Instagram size={18} />
                  </a>
                )}
              </div>

            </div>

            {expandedCard === cafe.id && (
              <div className="px-5 pb-5 border-t-2 border-matcha-100 pt-4 bg-gradient-to-b from-cream-50 to-white animate-slide-down">
                <div className="space-y-4">{/* Address Section */}
                  {cafe.address && (
                    <div className="bg-gradient-to-r from-matcha-50 to-cream-100 rounded-xl p-3">
                      <div className="flex items-start gap-2.5">
                        <MapPin size={18} className="text-matcha-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-800">{cafe.address}</p>
                      </div>
                    </div>
                  )}

                  {/* Hours */}
                  {cafe.hours && (() => {
                    const hoursData = formatHoursCompact(cafe.hours)

                    if (hoursData?.todayHours) {
                      // Extract just the time portion after the colon
                      const timeMatch = hoursData.todayHours.match(/:\s*(.+)/)
                      const hoursText = timeMatch ? timeMatch[1] : hoursData.todayHours

                      return (
                        <div className="bg-gradient-to-r from-matcha-50 to-cream-100 rounded-xl p-3">
                          <div className="flex items-start gap-2.5">
                            <Clock size={18} className="text-matcha-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-sm font-bold text-charcoal-900 block mb-1">{COPY.map.today}</span>
                              <p className="text-sm font-medium text-gray-700">{hoursText}</p>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}

                  {/* Drinks List */}
                  {cafe.drinks && cafe.drinks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-gradient-to-br from-matcha-500 to-matcha-600 p-1.5 rounded-lg">
                          <Coffee size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-bold text-charcoal-900">{COPY.map.drinks}</span>
                      </div>
                      <div className="space-y-2">
                        {cafe.drinks
                          .filter(d => d.isDefault)
                          .concat(cafe.drinks.filter(d => !d.isDefault).sort((a, b) => b.score - a.score))
                          .slice(0, 3)
                          .map(drink => (
                            <div
                              key={drink.id}
                              className={`flex items-center justify-between text-sm rounded-xl p-3 border transition-colors hover:border-matcha-300 ${
                                drink.isDefault
                                  ? 'bg-gradient-to-r from-matcha-50 to-cream-100 border-matcha-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-gray-800 font-semibold">{drink.name || 'Iced Matcha Latte'}</span>
                                {drink.isDefault && (
                                  <span className="text-xs px-1.5 py-0.5 bg-matcha-500 text-white rounded-full">★</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {drink.priceAmount !== null && drink.priceAmount !== undefined && (
                                  <span className="text-gray-600 font-medium">${drink.priceAmount.toFixed(2)}</span>
                                )}
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg">
                                  <Star size={14} className="text-matcha-600 fill-matcha-600" />
                                  <span className="font-bold text-matcha-600">{drink.score.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Review Links - Expanded view only */}
                  {(cafe.instagramPostLink || cafe.tiktokPostLink) && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-gradient-to-br from-matcha-500 to-matcha-600 p-1.5 rounded-lg">
                          <Star size={14} className="text-white fill-white" />
                        </div>
                        <span className="text-sm font-bold text-charcoal-900">Our Reviews</span>
                      </div>
                      <div className="flex gap-2">
                        {cafe.instagramPostLink && (
                          <a
                            href={cafe.instagramPostLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-white border-2 border-purple-300 text-purple-600 py-2.5 px-3 rounded-xl font-semibold hover:bg-purple-50 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2"
                          >
                            <Instagram size={16} />
                            <span>Instagram</span>
                          </a>
                        )}
                        {cafe.tiktokPostLink && (
                          <a
                            href={cafe.tiktokPostLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-2.5 px-3 rounded-xl font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2"
                          >
                            <TikTokIcon size={16} />
                            <span>TikTok</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          ))
        )}
        </div>
      </ContentContainer>

      {/* Floating City Filter Button (mobile only) */}
      <div className="fixed bottom-24 right-4 z-50 md:hidden">
        <button
          onClick={() => setShowCityDropdown(!showCityDropdown)}
          className={`w-14 h-14 rounded-full shadow-2xl transition-all flex items-center justify-center relative ${
            filters.selectedCities.length > 0
              ? 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white hover:from-matcha-700 hover:to-matcha-600 scale-105'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title={filters.selectedCities.length === 0 ? COPY.list.filterByCity : COPY.list.citiesSelected(filters.selectedCities.length)}
        >
          <Building2 size={24} />
          {filters.selectedCities.length > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold border-2 border-white rounded-full flex items-center justify-center">
              {filters.selectedCities.length}
            </span>
          )}
        </button>

        {/* Mobile City Dropdown Menu */}
        {showCityDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)} />
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 min-w-[160px]">
              <div className="px-3 py-2 border-b border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase">{COPY.list.filterByCity}</h3>
              </div>
              <button
                onClick={() => {
                  setFilters(prev => ({ ...prev, selectedCities: [] }))
                  setShowCityDropdown(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-matcha-50 transition-colors ${
                  filters.selectedCities.length === 0 ? 'bg-matcha-50 text-matcha-700 font-bold' : 'text-gray-700'
                }`}
              >
                {COPY.list.allCities}
              </button>
              {availableCities.map(city => (
                <button
                  key={city.key}
                  onClick={() => {
                    toggleCity(city.key)
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-matcha-50 transition-colors flex items-center justify-between ${
                    filters.selectedCities.includes(city.key) ? 'bg-matcha-50 text-matcha-700 font-bold' : 'text-gray-700'
                  }`}
                >
                  <span>{city.name}</span>
                  {filters.selectedCities.includes(city.key) && (
                    <span className="text-matcha-600">✓</span>
                  )}
                </button>
              ))}
              {filters.selectedCities.length > 0 && (
                <div className="border-t border-gray-200 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, selectedCities: [] }))
                      setShowCityDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    {COPY.list.clearAll}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ListView