import React, { useState } from 'react'
import Header from './components/Header'
import BottomNavigation from './components/BottomNavigation'
import AppRoutes from './components/AppRoutes'
import ComingSoon from './components/ComingSoon'
import { useDistanceCalculation } from './hooks/useDistanceCalculation'
import { useFeatureToggle } from './hooks/useFeatureToggle'
import { useCafeSelection } from './hooks/useCafeSelection'
import { useUIStore } from './stores/uiStore'
import { useAuthStore } from './stores/authStore'
import { useVisitedCafesStore } from './stores/visitedCafesStore'
import { useLocationStore } from './stores/locationStore'
import { useCityStore } from './stores/cityStore'
import cafeData from './data/cafes.json'
import type { CafeData } from './types'

export const App: React.FC = () => {
  // Feature toggles
  const isPassportEnabled = useFeatureToggle('ENABLE_PASSPORT')
  const isEventsEnabled = useFeatureToggle('ENABLE_EVENTS')
  const isMenuEnabled = useFeatureToggle('ENABLE_MENU')
  const isCitySelectorEnabled = useFeatureToggle('ENABLE_CITY_SELECTOR')
  const showComingSoon = useFeatureToggle('SHOW_COMING_SOON')

  // Zustand stores
  const { isAuthenticated, authenticate } = useAuthStore()
  const { showPopover, expandedCard, setExpandedCard, closePopover } = useUIStore()
  const { toggleVisited, toggleStamp } = useVisitedCafesStore()
  const { coordinates } = useLocationStore()
  const { selectedCity } = useCityStore()

  // Local state for user coordinates (bridges between location store and distance calculation)
  const [userCoordinates, setUserCoordinates] = useState<GeolocationCoordinates | null>(null)

  // Sync location store to local state
  React.useEffect(() => {
    setUserCoordinates(coordinates)
  }, [coordinates])

  const { cafes: allCafes, feed, events } = cafeData as CafeData

  // Filter cafes by selected city
  const cafes = React.useMemo(() => {
    return allCafes.filter(cafe => cafe.city === selectedCity)
  }, [allCafes, selectedCity])

  // Memoize user location to prevent unnecessary recalculations
  const userLocation = React.useMemo(() => {
    if (!userCoordinates) return null
    return {
      latitude: userCoordinates.latitude,
      longitude: userCoordinates.longitude,
    }
  }, [userCoordinates?.latitude, userCoordinates?.longitude])

  // Calculate distances from user location
  const { cafesWithDistance } = useDistanceCalculation({
    cafes,
    userLocation,
  })

  // Cafe selection hook
  const { selectedCafe, handlePinClick, viewDetails } = useCafeSelection(cafesWithDistance)

  if (showComingSoon && !isAuthenticated) {
    return <ComingSoon onPasswordCorrect={authenticate} />
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">
      <Header isMenuEnabled={isMenuEnabled} isCitySelectorEnabled={isCitySelectorEnabled} />

      <AppRoutes
        cafesWithDistance={cafesWithDistance}
        selectedCafe={selectedCafe}
        onLocationChange={setUserCoordinates}
        showPopover={showPopover}
        onPinClick={handlePinClick}
        onViewDetails={viewDetails}
        onClosePopover={closePopover}
        expandedCard={expandedCard}
        onToggleExpand={setExpandedCard}
        feedItems={feed}
        eventItems={events}
        isEventsEnabled={isEventsEnabled}
        cafes={cafesWithDistance}
        onToggleStamp={toggleStamp}
        isPassportEnabled={isPassportEnabled}
        onToggleVisited={toggleVisited}
      />

      <BottomNavigation
        isPassportEnabled={isPassportEnabled}
        isEventsEnabled={isEventsEnabled}
      />
    </div>
  )
}

export default App