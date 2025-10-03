import React from 'react'
import { MapPin, Navigation, Crosshair, Coffee, Star } from 'lucide-react'
import { useLeafletMap } from '../hooks/useLeafletMap'
import { useGeolocation } from '../hooks/useGeolocation'
import { useVisitedCafes } from '../hooks/useVisitedCafes'
import { useCityStore } from '../stores/cityStore'
import { CircleButton } from './CircleButton'
import { getLocationRequestAdvice, getOptimalGeolocationOptions } from '../utils/deviceDetection'
import { getMapsUrl } from '../utils/mapsUrl'
import { formatHoursCompact } from '../utils/hoursFormatter'
import type { MapViewProps } from '../types'

export const MapView: React.FC<MapViewProps> = ({ cafes, showPopover, selectedCafe, onPinClick, onViewDetails, onClosePopover }) => {
  const mapsUrl = selectedCafe ? getMapsUrl(selectedCafe.address, selectedCafe.googleMapsUrl) : ''
  const { visitedCafeIds } = useVisitedCafes()
  const { getCity } = useCityStore()
  const currentCity = getCity()

  const {
    containerRef,
    zoomIn,
    zoomOut,
    addUserLocationMarker,
    removeUserLocationMarker,
    centerOnLocation
  } = useLeafletMap({
    cafes,
    onPinClick,
    selectedCafeId: selectedCafe?.id || null,
    visitedCafeIds,
    initialCenter: currentCity.center,
    initialZoom: currentCity.zoom,
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

  // Add user location marker when coordinates are available
  React.useEffect(() => {
    if (coordinates) {
      addUserLocationMarker(coordinates.latitude, coordinates.longitude)
      // Auto-center on user location ONLY when first received
      if (centerOnLocation && !hasAutoCenteredRef.current) {
        centerOnLocation(coordinates.latitude, coordinates.longitude)
        hasAutoCenteredRef.current = true
      }
    } else {
      removeUserLocationMarker()
      hasAutoCenteredRef.current = false // Reset if location is cleared
    }
  }, [coordinates, addUserLocationMarker, removeUserLocationMarker, centerOnLocation])

  const handleLocationClick = () => {
    // Always refresh location when clicked (cheap operation, useful for moving users)
    requestLocation()

    // Also center map if we already have coordinates
    if (coordinates && centerOnLocation) {
      centerOnLocation(coordinates.latitude, coordinates.longitude)
    }
  }

  return (
    <div className="flex-1 relative">
      {/* Leaflet Map Container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
        onClick={onClosePopover}
      />

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

      {/* Responsive Popover */}
      {showPopover && selectedCafe && (
        <>
          {/* Backdrop overlay for mobile */}
          <div
            className="absolute inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-[9998] animate-fade-in md:hidden"
            onClick={onClosePopover}
          />

          {/* Mobile Bottom Sheet */}
          <div
            className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 z-[9999] border-2 border-green-200 map-popover md:hidden transform transition-all duration-300 ease-out animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle indicator */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3 animate-scale-in" style={{ animationDelay: '0.1s' }}></div>

            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{selectedCafe.name}</h3>
                <p className="text-sm text-gray-500">{selectedCafe.neighborhood}</p>
              </div>
              {(selectedCafe.displayScore || selectedCafe.score) && (
                <div className="bg-green-500 text-white px-3 py-1 rounded-full font-bold text-lg">
                  {(selectedCafe.displayScore || selectedCafe.score)!.toFixed(1)}
                </div>
              )}
            </div>
            {selectedCafe.distanceInfo ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Navigation size={16} className="text-green-600" />
                <span>{selectedCafe.distanceInfo.formattedKm} • {selectedCafe.distanceInfo.walkTime} walk</span>
              </div>
            ) : (
              <button
                onClick={handleLocationClick}
                className="flex items-center gap-2 text-sm text-gray-500 mb-3 hover:text-gray-700 transition"
              >
                <MapPin size={16} className="text-gray-400" />
                <span className="underline decoration-dotted">Enable location services</span>
              </button>
            )}

            {/* Quick Note */}
            {selectedCafe.quickNote && (
              <p className="text-sm text-gray-600 italic mb-3">"{selectedCafe.quickNote}"</p>
            )}

            {/* Drinks List */}
            {selectedCafe.drinks && selectedCafe.drinks.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1">
                  <Coffee size={12} />
                  Drinks
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
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Hours</p>
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-green-600">Today: </span>
                    {hoursData.todayHours.split(': ')[1]}
                  </p>
                </div>
              ) : null
            })()}

            {/* Action Buttons */}
            <div className="flex gap-2 mb-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition shadow-md flex items-center justify-center gap-2"
              >
                <Navigation size={18} />
                Directions
              </a>
              <button
                onClick={() => onViewDetails(selectedCafe)}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition shadow-md"
              >
                View Details
              </button>
            </div>
          </div>

          {/* Tablet+ Sidebar */}
          <div
            className="absolute top-4 left-4 bottom-4 w-80 bg-white rounded-2xl shadow-2xl p-6 z-[9999] border-2 border-green-200 map-popover hidden md:block overflow-y-auto transform transition-all duration-300 ease-out animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl text-gray-800">{selectedCafe.name}</h3>
                  <p className="text-gray-500 mt-1">{selectedCafe.neighborhood}</p>
                </div>
                {(selectedCafe.displayScore || selectedCafe.score) && (
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-xl">
                    {(selectedCafe.displayScore || selectedCafe.score)!.toFixed(1)}
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
                    <span className="underline decoration-dotted">Enable location services</span>
                  </button>
                )}
                <p className="text-sm text-gray-700">{selectedCafe.address}</p>
              </div>

              {/* Quick Note */}
              {selectedCafe.quickNote && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-gray-700 italic">"{selectedCafe.quickNote}"</p>
                </div>
              )}

              {/* Drinks List for larger screens */}
              {selectedCafe.drinks && selectedCafe.drinks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                    <Coffee size={16} />
                    Drinks
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
                    <h4 className="font-semibold text-gray-800 mb-2">Hours</h4>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-green-600">Today: </span>
                      {hoursData.todayHours}
                    </p>
                  </div>
                ) : null
              })()}

              {selectedCafe.priceRange && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Price Range</h4>
                  <p className="text-sm text-gray-600">{selectedCafe.priceRange}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={() => onViewDetails(selectedCafe)}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition shadow-md"
                >
                  View Full Details
                </button>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white border-2 border-green-300 text-green-600 py-3 rounded-xl font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
                >
                  <Navigation size={18} />
                  Get Directions
                </a>
              </div>

              {/* Social Links */}
              {(selectedCafe.instagram || selectedCafe.tiktok) && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Follow</h4>
                  <div className="flex gap-2">
                    {selectedCafe.instagram && (
                      <a
                        href="#"
                        className="flex-1 bg-gradient-to-br from-purple-500 to-pink-500 text-white py-2 px-3 rounded-lg font-medium text-center hover:from-purple-600 hover:to-pink-600 transition text-sm"
                      >
                        Instagram
                      </a>
                    )}
                    {selectedCafe.tiktok && (
                      <a
                        href="#"
                        className="flex-1 bg-gray-800 text-white py-2 px-3 rounded-lg font-medium text-center hover:bg-gray-900 transition text-sm"
                      >
                        TikTok
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

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