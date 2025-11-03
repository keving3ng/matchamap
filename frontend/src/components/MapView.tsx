import React from 'react'
import { MapPin, Navigation, Crosshair, Coffee, Star, Building2, ChevronDown, Route, Instagram } from '@/components/icons'
import { TikTokIcon } from './TikTokIcon'
import { useLeafletMap } from '../hooks/useLeafletMap'
import { useGeolocation } from '../hooks/useGeolocation'
import { useVisitedCafes } from '../hooks/useVisitedCafes'
import { useRouteVisualization } from '../hooks/useRouteVisualization'
import { useFeatureToggle } from '../hooks/useFeatureToggle'
import { useCityStore, CITIES } from '../stores/cityStore'
import { useUIStore } from '../stores/uiStore'
import { CircleButton } from './CircleButton'
import { getLocationRequestAdvice, getOptimalGeolocationOptions } from '../utils/deviceDetection'
import { getMapsUrl } from '../utils/mapsUrl'
import { formatHoursCompact, isCurrentlyOpen } from '../utils/hoursFormatter'
import { formatDuration } from '../utils/routing'
import { findClosestCity } from '../utils/cityDetection'
import { api } from '../utils/api'
import { COPY } from '../constants/copy'
import type { MapViewProps } from '../types'

export const MapView: React.FC<MapViewProps> = ({ cafes, showPopover, selectedCafe, onPinClick, onViewDetails, onClosePopover }) => {
  const mapsUrl = selectedCafe ? getMapsUrl(selectedCafe.address || '', selectedCafe.link) : ''
  const { visitedCafeIds } = useVisitedCafes()
  const { selectedCity, setCity, getCity, getAvailableCities, loadAvailableCities, availableCitiesLoaded } = useCityStore()
  const currentCity = getCity()
  const availableCities = getAvailableCities()
  const { selectedDrinkType, setSelectedDrinkType } = useUIStore()
  const routeDisplayEnabled = useFeatureToggle('ENABLE_ROUTE_DISPLAY')

  // State for exit animation
  const [isClosing, setIsClosing] = React.useState(false)

  // Quick filter state
  const [showCityDropdown, setShowCityDropdown] = React.useState(false)
  const [showDrinkDropdown, setShowDrinkDropdown] = React.useState(false)
  const [minRating, setMinRating] = React.useState<number | null>(null)
  const [maxPrice, setMaxPrice] = React.useState<number | null>(null)
  const [openNow, setOpenNow] = React.useState(false)

  // Event indicators state
  const [cafeIdsWithEvents, setCafeIdsWithEvents] = React.useState<number[]>([])

  // Fetch upcoming events to determine which cafes have events
  React.useEffect(() => {
    const fetchEventsForCafes = async () => {
      try {
        const response = await api.events.getAll({ upcoming: true })
        const cafeIds = response.events
          .filter(event => event.cafeId !== null)
          .map(event => event.cafeId!)
        // Remove duplicates
        const uniqueCafeIds = Array.from(new Set(cafeIds))
        setCafeIdsWithEvents(uniqueCafeIds)
      } catch (error) {
        console.error('Failed to fetch events for map indicators:', error)
      }
    }

    fetchEventsForCafes()
  }, [])

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

  // Filter cafes based on quick filters (no city filter - city is handled by map navigation)
  const filteredCafes = React.useMemo(() => {
    return cafes.filter(cafe => {
      // Rating filter
      if (minRating !== null) {
        const cafeScore = cafe.displayScore ?? 0
        if (cafeScore < minRating) {
          return false
        }
      }

      // Max price filter
      if (maxPrice !== null && cafe.drinks && cafe.drinks.length > 0) {
        const minDrinkPrice = Math.min(...cafe.drinks.map(d => d.priceAmount || Infinity))
        if (minDrinkPrice > maxPrice) {
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
      if (openNow) {
        const cafeIsOpen = isCurrentlyOpen(cafe.hours)
        // Only filter out if we know it's closed (false)
        // If null (can't determine), include it in results
        if (cafeIsOpen === false) {
          return false
        }
      }

      return true
    })
  }, [cafes, minRating, maxPrice, selectedDrinkType, openNow])

  // Handle map movement to update city selector
  const handleMapMove = React.useCallback((center: { lat: number; lng: number }) => {
    // Ignore if this is a programmatic change (user clicked city selector)
    if (isProgrammaticChangeRef.current) {
      isProgrammaticChangeRef.current = false
      return
    }

    const closestCity = findClosestCity(center.lat, center.lng)
    if (closestCity !== selectedCity) {
      setCity(closestCity)
    }
  }, [selectedCity, setCity])

  const {
    route,
    isLoadingRoute,
    showRoute,
    routeCafeId,
    toggleRoute,
    loadRoute,
    clearRoute: clearRouteData
  } = useRouteVisualization()

  const {
    containerRef,
    zoomIn,
    zoomOut,
    addUserLocationMarker,
    removeUserLocationMarker,
    centerOnLocation,
    drawRoute,
    clearRoute: clearRouteVisual,
    refreshTiles
  } = useLeafletMap({
    cafes: filteredCafes,
    onPinClick,
    selectedCafeId: selectedCafe?.id || null,
    visitedCafeIds,
    cafeIdsWithEvents,
    initialCenter: currentCity.center,
    initialZoom: currentCity.zoom,
    onMapMove: handleMapMove,
  })

  const {
    coordinates,
    error,
    loading,
    requestLocation,
    clearLocation,
    isSupported
  } = useGeolocation(getOptimalGeolocationOptions())

  // Track if we've already auto-centered on initial location
  const hasAutoCenteredRef = React.useRef(false)

  // Track programmatic city changes to avoid infinite loops
  const isProgrammaticChangeRef = React.useRef(false)

  // Handle popover closing with exit animation
  const handleClosePopover = React.useCallback(() => {
    if (isClosing) return // Prevent multiple close attempts
    
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClosePopover()
    }, 300) // Match animation duration
  }, [isClosing, onClosePopover])

  // Reset closing state when popover opens
  React.useEffect(() => {
    if (showPopover && !isClosing) {
      setIsClosing(false)
    }
  }, [showPopover, isClosing])

  // Handle view details with animation
  const handleViewDetails = React.useCallback((cafe: typeof selectedCafe) => {
    if (!cafe) return
    
    if (isClosing) return // Prevent multiple close attempts
    
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClosePopover()
      onViewDetails(cafe)
    }, 300) // Match animation duration
  }, [isClosing, onClosePopover, onViewDetails])

  // Track city transitions for smooth loading state
  const [isTransitioningCity, setIsTransitioningCity] = React.useState(false)
  const [spinDuration, setSpinDuration] = React.useState(1)

  // Load available cities on mount
  React.useEffect(() => {
    if (!availableCitiesLoaded) {
      loadAvailableCities()
    }
  }, [availableCitiesLoaded, loadAvailableCities])

  // Track if location was manually requested (vs automatic)
  const wasManuallyRequestedRef = React.useRef(false)

  // Add user location marker when coordinates are available
  React.useEffect(() => {
    if (coordinates) {
      addUserLocationMarker(coordinates.latitude, coordinates.longitude)
      // Auto-center on user location when first received OR when manually requested
      if (centerOnLocation && (!hasAutoCenteredRef.current || wasManuallyRequestedRef.current)) {
        centerOnLocation(coordinates.latitude, coordinates.longitude)
        hasAutoCenteredRef.current = true
        wasManuallyRequestedRef.current = false // Reset manual request flag
      }
    } else {
      removeUserLocationMarker()
      hasAutoCenteredRef.current = false // Reset if location is cleared
    }
  }, [coordinates, addUserLocationMarker, removeUserLocationMarker, centerOnLocation])

  const handleLocationClick = () => {
    // Mark this as a manual request so location updates will center the map
    wasManuallyRequestedRef.current = true
    
    // Always refresh location when clicked (cheap operation, useful for moving users)
    requestLocation()

    // Also center map immediately if we already have coordinates
    if (coordinates && centerOnLocation) {
      centerOnLocation(coordinates.latitude, coordinates.longitude)
    }
  }

  // Handle route toggle
  const handleRouteToggle = async () => {
    if (!selectedCafe) return

    // If no location yet, request it first
    if (!coordinates) {
      requestLocation()
      return
    }

    // Check if we're showing a route for a different cafe
    const isCurrentCafeRoute = routeCafeId === selectedCafe.id

    if (showRoute && route && isCurrentCafeRoute) {
      // Hide route for current cafe
      clearRouteVisual()
      toggleRoute()
    } else if (route && !showRoute && isCurrentCafeRoute) {
      // We have route data for current cafe, just need to show it and hide popover
      drawRoute(route.coordinates)
      toggleRoute()
      handleClosePopover() // Hide the card when showing route
    } else {
      // Load new route for this cafe (or different cafe) and hide popover
      await loadRoute(
        { lat: coordinates.latitude, lng: coordinates.longitude },
        { lat: selectedCafe.lat ?? selectedCafe.latitude, lng: selectedCafe.lng ?? selectedCafe.longitude },
        selectedCafe.id
      )
      handleClosePopover() // Hide the card when showing route
    }
  }

  // Draw route when route data becomes available
  React.useEffect(() => {
    if (route && showRoute && route.coordinates.length > 0) {
      drawRoute(route.coordinates)
    } else if (!showRoute) {
      clearRouteVisual()
    }
  }, [route, showRoute, drawRoute, clearRouteVisual])

  // Clear route when cafe changes (but not when popover just closes)
  React.useEffect(() => {
    if (!selectedCafe) {
      clearRouteVisual()
      clearRouteData()
    }
  }, [selectedCafe, clearRouteVisual, clearRouteData])

  // Handle city transitions with smooth loading state
  React.useEffect(() => {
    // Start transition (show overlay)
    setIsTransitioningCity(true)

    // Refresh tiles during the fade
    const refreshTimeoutId = setTimeout(() => {
      refreshTiles()
    }, 200)

    // End transition (hide overlay) after tiles have loaded
    // Longer duration for gentle intermission feel
    const transitionTimeoutId = setTimeout(() => {
      setIsTransitioningCity(false)
    }, 900) // Longer for smooth 500ms fade durations

    return () => {
      clearTimeout(refreshTimeoutId)
      clearTimeout(transitionTimeoutId)
    }
  }, [selectedCity, refreshTiles])

  return (
    <div className="flex-1 relative">
      {/* Leaflet Map Container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
        onClick={handleClosePopover}
      />

      {/* City Transition Overlay - Instant up, quick fade down */}
      <div
        className={`absolute inset-0 bg-cream-50 z-[1002] pointer-events-none transition-opacity ease-in-out ${
          isTransitioningCity
            ? 'opacity-100 duration-0'      // Instant when appearing
            : 'opacity-0 duration-150'       // Quick fade when disappearing
        }`}
      >
        {/* Spinning matcha emoji */}
        {isTransitioningCity && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="text-4xl animate-spin"
              style={{ animationDuration: `${spinDuration}s` }}
            >
              🍵
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
                  className="px-4 py-2 bg-matcha-500 text-white rounded-lg text-sm font-medium hover:bg-matcha-600 transition focus:outline-hidden focus:ring-2 focus:ring-matcha-500 focus:ring-offset-2"
                >
                  {COPY.location.permissionDenied.tryAgain}
                </button>
                <button
                  onClick={clearLocation}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition focus:outline-hidden focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition focus:outline-hidden focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
                  className="px-4 py-2 bg-matcha-500 text-white rounded-lg text-sm font-medium hover:bg-matcha-600 transition focus:outline-hidden focus:ring-2 focus:ring-matcha-500 focus:ring-offset-2"
                >
                  {COPY.location.unavailable.tryAgain}
                </button>
                <button
                  onClick={clearLocation}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition focus:outline-hidden focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {COPY.location.unavailable.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Popover */}
      {showPopover && selectedCafe && (
        <>
          {/* Backdrop overlay for mobile */}
          <div
            className={`absolute inset-0 bg-black bg-opacity-20 backdrop-blur-xs z-[9998] md:hidden ${
              isClosing ? 'animate-fade-out' : 'animate-fade-in'
            }`}
            onClick={handleClosePopover}
          />

          {/* Mobile Bottom Sheet */}
          <div
            className={`absolute bottom-4 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 z-[9999] border-2 border-green-200 map-popover md:hidden transform transition-all duration-300 ease-out max-h-[40vh] overflow-y-auto ${
              isClosing ? 'animate-slide-down-out' : 'animate-slide-up'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle indicator */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3 animate-scale-in" style={{ animationDelay: '0.1s' }}></div>

            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-1 mr-2">
                <h3 className="font-bold text-lg text-gray-800 mb-0.5">{selectedCafe.name}</h3>
                {selectedCafe.address && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 underline hover:text-gray-700 transition"
                  >
                    {selectedCafe.address}
                  </a>
                )}
              </div>
              {selectedCafe.displayScore && (
                <div className="bg-green-500 text-white px-3 py-1 rounded-full font-bold text-lg ml-2 flex-shrink-0">
                  {selectedCafe.displayScore.toFixed(1)}
                </div>
              )}
            </div>
            {selectedCafe.distanceInfo ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1.5">
                <Navigation size={16} className="text-green-600" />
                <span>{selectedCafe.distanceInfo.formattedKm} • {selectedCafe.distanceInfo.walkTime} walk</span>
              </div>
            ) : (
              <button
                onClick={handleLocationClick}
                className="flex items-center gap-2 text-sm text-gray-500 mb-1.5 hover:text-gray-700 transition"
              >
                <MapPin size={16} className="text-gray-400" />
                <span className="underline decoration-dotted">{COPY.map.enableLocationServices}</span>
              </button>
            )}

            {/* Quick Note */}
            {selectedCafe.quickNote && (
              <p className="text-sm text-gray-600 italic mb-1.5">&quot;{selectedCafe.quickNote}&quot;</p>
            )}

            {/* Drinks List */}
            {selectedCafe.drinks && selectedCafe.drinks.length > 0 && (
              <div className="mb-1.5">
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1">
                  <Coffee size={12} />
                  {COPY.map.drinks}
                </div>
                <div className="space-y-1">
                  {selectedCafe.drinks
                    .filter(d => d.isDefault)
                    .concat(selectedCafe.drinks.filter(d => !d.isDefault).sort((a, b) => b.score - a.score))
                    .slice(0, 3)
                    .map(drink => (
                      <div key={drink.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{drink.name || 'Iced Matcha Latte'}</span>
                        <div className="flex items-center gap-2">
                          {drink.priceAmount !== null && drink.priceAmount !== undefined && (
                            <span className="text-gray-500">${drink.priceAmount.toFixed(2)}</span>
                          )}
                          <div className="flex items-center gap-0.5">
                            <Star size={10} className="text-green-600 fill-green-600" />
                            <span className="font-semibold text-green-600">{drink.score.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Hours */}
            {selectedCafe.hours && (() => {
              const hoursData = formatHoursCompact(selectedCafe.hours)
              return hoursData && hoursData.todayHours ? (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-700 mb-1">{COPY.map.hours}</p>
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-green-600">{COPY.map.today}: </span>
                    {hoursData.todayHours.split(': ')[1]}
                  </p>
                </div>
              ) : null
            })()}

            {/* Action Buttons */}
            <div className="space-y-2 mb-2">
              {/* Primary Actions: Open Maps & View Details */}
              <div className="flex gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition shadow-md flex items-center justify-center gap-2"
                >
                  <Navigation size={18} />
                  {COPY.map.directions}
                </a>
                <button
                  onClick={() => handleViewDetails(selectedCafe)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>{COPY.map.viewDetails}</span>
                  <ChevronDown size={14} className="-rotate-90" />
                </button>
              </div>

              {/* Secondary Action: Show Route on Map - Feature toggled */}
              {routeDisplayEnabled && (
                <button
                  onClick={handleRouteToggle}
                  disabled={isLoadingRoute || loading}
                  className={`w-full py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    showRoute && routeCafeId === selectedCafe.id
                      ? 'bg-matcha-100 border-2 border-matcha-500 text-matcha-700 hover:bg-matcha-200'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${isLoadingRoute || loading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <Route size={16} />
                  <span className="text-sm">
                    {isLoadingRoute ? COPY.map.routeLoading : (showRoute && routeCafeId === selectedCafe.id) ? COPY.map.hideRoute : COPY.map.showRoute}
                  </span>
                  {route && !isLoadingRoute && coordinates && routeCafeId === selectedCafe.id && (
                    <span className="text-xs text-gray-600">
                      ({COPY.map.walkingTime(formatDuration(route.duration))})
                    </span>
                  )}
                </button>
              )}

              {/* Cafe's Instagram - Mobile */}
              {selectedCafe.instagram && (
                <div className="pt-2 border-t border-gray-100">
                  <a
                    href={`https://instagram.com/${selectedCafe.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition text-sm min-h-[44px]"
                  >
                    <Instagram size={16} />
                    <span>{selectedCafe.instagram.startsWith('@') ? selectedCafe.instagram : `@${selectedCafe.instagram}`}</span>
                  </a>
                </div>
              )}

              {/* Review Links - Mobile */}
              {(selectedCafe.instagramPostLink || selectedCafe.tiktokPostLink) && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    {selectedCafe.instagramPostLink && (
                      <a
                        href={selectedCafe.instagramPostLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-white border-2 border-purple-300 text-purple-600 py-2.5 px-4 rounded-xl font-semibold hover:bg-purple-50 active:scale-[0.98] transition-all duration-200 ease-out flex items-center justify-center gap-2 min-h-[44px] text-sm"
                      >
                        <Instagram size={16} />
                        <span>{COPY.map.seeInstagramReel}</span>
                      </a>
                    )}
                    {selectedCafe.tiktokPostLink && (
                      <a
                        href={selectedCafe.tiktokPostLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-2.5 px-4 rounded-xl font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 ease-out flex items-center justify-center gap-2 min-h-[44px] text-sm"
                      >
                        <TikTokIcon size={16} />
                        <span>{COPY.map.seeTikTokReview}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tablet+ Sidebar */}
          <div
            className="absolute top-4 left-4 bottom-4 w-80 lg:w-96 xl:w-[28rem] bg-white rounded-2xl shadow-2xl p-6 z-[9999] border-2 border-green-200 map-popover hidden md:block overflow-y-auto transform transition-all duration-300 ease-out animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <h3 className="font-bold text-xl text-gray-800 mb-1">{selectedCafe.name}</h3>
                  {selectedCafe.address && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 underline hover:text-gray-700 transition"
                    >
                      {selectedCafe.address}
                    </a>
                  )}
                </div>
                {selectedCafe.displayScore && (
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-xl ml-3 flex-shrink-0">
                    {selectedCafe.displayScore.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Location Info */}
              <div className="space-y-2">
                {selectedCafe.distanceInfo ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Navigation size={18} className="text-green-600" />
                    <span>{selectedCafe.distanceInfo.formattedKm} • {selectedCafe.distanceInfo.walkTime} walk</span>
                  </div>
                ) : (
                  <button
                    onClick={handleLocationClick}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition"
                  >
                    <MapPin size={18} className="text-gray-400" />
                    <span className="underline decoration-dotted">{COPY.map.enableLocationServices}</span>
                  </button>
                )}
              </div>

              {/* Quick Note */}
              {selectedCafe.quickNote && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-gray-700 italic">&quot;{selectedCafe.quickNote}&quot;</p>
                </div>
              )}

              {/* Drinks List for larger screens */}
              {selectedCafe.drinks && selectedCafe.drinks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                    <Coffee size={16} />
                    {COPY.map.drinks}
                  </div>
                  <div className="space-y-2">
                    {selectedCafe.drinks
                      .filter(d => d.isDefault)
                      .concat(selectedCafe.drinks.filter(d => !d.isDefault).sort((a, b) => b.score - a.score))
                      .slice(0, 4)
                      .map(drink => (
                        <div key={drink.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                          <span className="text-gray-700 font-medium">{drink.name || 'Iced Matcha Latte'}</span>
                          <div className="flex items-center gap-3">
                            {drink.priceAmount !== null && drink.priceAmount !== undefined && (
                              <span className="text-gray-600">${drink.priceAmount.toFixed(2)}</span>
                            )}
                            <div className="flex items-center gap-1">
                              <Star size={12} className="text-green-600 fill-green-600" />
                              <span className="font-semibold text-green-600">{drink.score.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Hours */}
              {selectedCafe.hours && (() => {
                const hoursData = formatHoursCompact(selectedCafe.hours)
                return hoursData && hoursData.todayHours ? (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">{COPY.map.hours}</h4>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-green-600">{COPY.map.today}: </span>
                      {hoursData.todayHours}
                    </p>
                  </div>
                ) : null
              })()}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                {/* Primary Action: Open in Maps */}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition shadow-md flex items-center justify-center gap-2"
                >
                  <Navigation size={18} />
                  {COPY.map.getDirections}
                </a>

                {/* Primary Action: View Details */}
                <button
                  onClick={() => handleViewDetails(selectedCafe)}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>{COPY.map.viewDetails}</span>
                  <ChevronDown size={14} className="-rotate-90" />
                </button>

                {/* Secondary Action: Show Route on Map - Feature toggled */}
                {routeDisplayEnabled && (
                  <button
                    onClick={handleRouteToggle}
                    disabled={isLoadingRoute || loading}
                    className={`w-full py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                      showRoute && routeCafeId === selectedCafe.id
                        ? 'bg-matcha-100 border-2 border-matcha-500 text-matcha-700 hover:bg-matcha-200'
                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                    } ${isLoadingRoute || loading ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <Route size={16} />
                    <span className="text-sm">
                      {isLoadingRoute ? COPY.map.routeLoading : (showRoute && routeCafeId === selectedCafe.id) ? COPY.map.hideRoute : COPY.map.showRoute}
                    </span>
                    {route && !isLoadingRoute && coordinates && routeCafeId === selectedCafe.id && (
                      <span className="text-xs text-gray-600">
                        ({COPY.map.walkingTime(formatDuration(route.duration))})
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Cafe's Instagram */}
              {selectedCafe.instagram && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Follow</h4>
                  <a
                    href={`https://instagram.com/${selectedCafe.instagram?.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition text-sm"
                  >
                    <Instagram size={16} />
                    <span>{selectedCafe.instagram.startsWith('@') ? selectedCafe.instagram : `@${selectedCafe.instagram}`}</span>
                  </a>
                </div>
              )}

              {/* Review Links */}
              {(selectedCafe.instagramPostLink || selectedCafe.tiktokPostLink) && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Our Reviews</h4>
                  <div className="flex gap-2">
                    {selectedCafe.instagramPostLink && (
                      <a
                        href={selectedCafe.instagramPostLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-white border-2 border-purple-300 text-purple-600 py-3 px-4 rounded-xl font-semibold hover:bg-purple-50 active:scale-[0.98] transition-all duration-200 ease-out flex items-center justify-center gap-2 min-h-[44px] text-sm"
                      >
                        <Instagram size={16} />
                        <span>{COPY.map.seeInstagramReel}</span>
                      </a>
                    )}
                    {selectedCafe.tiktokPostLink && (
                      <a
                        href={selectedCafe.tiktokPostLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 ease-out flex items-center justify-center gap-2 min-h-[44px] text-sm"
                      >
                        <TikTokIcon size={16} />
                        <span>{COPY.map.seeTikTokReview}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* City Dropdown - Rendered outside scrollable container */}
      {showCityDropdown && (
        <>
          <div className="fixed inset-0 z-[9997]" onClick={() => setShowCityDropdown(false)} />
          <div className="fixed top-[4.5rem] left-4 bg-white rounded-lg shadow-2xl border border-gray-200 py-1 z-[9998] min-w-[140px]">
            {availableCities.map(city => (
              <button
                key={city.key}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCityDropdown(false)

                  // Only transition if we're actually changing cities
                  if (city.key === selectedCity) {
                    return
                  }

                  // Show overlay instantly (duration-0), then change city
                  setIsTransitioningCity(true)
                  // Randomize spin speed for whimsy (0.3s to 2s)
                  setSpinDuration(0.3 + Math.random() * 1.7)
                  // Mark this as a programmatic change to avoid loop
                  isProgrammaticChangeRef.current = true
                  setCity(city.key)
                  // Pan map to new city center
                  // Note: The useEffect will handle the tile refresh and fade out
                  if (centerOnLocation) {
                    centerOnLocation(city.center[0], city.center[1], city.zoom)
                  }
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-matcha-50 transition-colors ${
                  selectedCity === city.key ? 'bg-matcha-50 text-matcha-700 font-bold' : 'text-gray-700'
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Drink Type Dropdown - Rendered outside scrollable container */}
      {showDrinkDropdown && (
        <>
          <div className="fixed inset-0 z-[9997]" onClick={() => setShowDrinkDropdown(false)} />
          <div className="fixed top-[4.5rem] left-4 bg-white rounded-lg shadow-2xl border border-gray-200 py-1 z-[9998] w-[200px] max-w-[calc(100vw-2rem)] max-h-[300px] overflow-y-auto">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedDrinkType(null)
                setShowDrinkDropdown(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-matcha-50 transition-colors ${
                selectedDrinkType === null ? 'bg-matcha-50 text-matcha-700 font-bold' : 'text-gray-700'
              }`}
            >
              {COPY.map.allDrinks}
            </button>
            {availableDrinkTypes.map(drinkType => (
              <button
                key={drinkType}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedDrinkType(drinkType)
                  setShowDrinkDropdown(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-matcha-50 transition-colors truncate ${
                  selectedDrinkType === drinkType ? 'bg-matcha-50 text-matcha-700 font-bold' : 'text-gray-700'
                }`}
                title={drinkType}
              >
                {drinkType}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Quick Filters - Horizontal Scrollable */}
      <div className="absolute top-4 left-4 right-4 z-[1003]">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {/* City Selector - Navigation, not filter */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowCityDropdown(!showCityDropdown)
              }}
              className="px-3 py-[2px] rounded-full text-[11px] font-bold shadow-lg transition-all flex items-center gap-0.5 bg-gradient-to-r from-matcha-600 to-matcha-500 text-white whitespace-nowrap"
            >
              <Building2 size={11} />
              {CITIES[selectedCity].name}
              <ChevronDown size={10} className={`transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Drink Type Filter */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDrinkDropdown(!showDrinkDropdown)
              }}
              className={`px-3 py-[2px] rounded-full text-[11px] font-bold shadow-lg transition-all flex items-center gap-0.5 whitespace-nowrap max-w-[140px] ${
                selectedDrinkType !== null
                  ? 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Coffee size={11} className="flex-shrink-0" />
              <span className="truncate">
                {selectedDrinkType || COPY.map.allDrinks}
              </span>
              <ChevronDown size={10} className={`transition-transform flex-shrink-0 ${showDrinkDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Rating Filters */}
          {[7, 8, 9].map(rating => (
            <button
              key={rating}
              onClick={() => setMinRating(minRating === rating ? null : rating)}
              className={`px-3 py-[2px] rounded-full text-[11px] font-bold transition-all shadow-lg flex-shrink-0 whitespace-nowrap ${
                minRating === rating
                  ? 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {COPY.map.ratingFilter(rating)}
            </button>
          ))}

          {/* Price Filters */}
          {[6, 8].map(price => (
            <button
              key={price}
              onClick={() => setMaxPrice(maxPrice === price ? null : price)}
              className={`px-3 py-[2px] rounded-full text-[11px] font-bold transition-all shadow-lg flex-shrink-0 whitespace-nowrap ${
                maxPrice === price
                  ? 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {COPY.map.underPrice(price)}
            </button>
          ))}

          {/* Open Now */}
          <button
            onClick={() => setOpenNow(!openNow)}
            className={`px-3 py-[2px] rounded-full text-[11px] font-bold transition-all shadow-lg flex-shrink-0 whitespace-nowrap ${
              openNow
                ? 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {COPY.map.openNow}
          </button>
        </div>
      </div>

      {/* Zoom Controls and Location - Bottom right positioning */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-3 z-[1001]">
        <CircleButton onClick={zoomIn}>+</CircleButton>
        <CircleButton onClick={zoomOut}>−</CircleButton>
        <CircleButton
          icon={loading ? Crosshair : MapPin}
          onClick={handleLocationClick}
          className={`${!isSupported || error ? 'opacity-50 cursor-not-allowed' : ''} ${coordinates ? 'bg-green-100' : ''} ${loading ? 'animate-pulse' : ''}`}
        />
      </div>
    </div>
  )
}

export default MapView