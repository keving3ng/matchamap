import React, { useEffect, useMemo } from 'react'
import Header from './components/Header'
import BottomNavigation from './components/BottomNavigation'
import AppRoutes from './components/AppRoutes'
import ComingSoon from './components/ComingSoon'
import { useDistanceCalculation } from './hooks/useDistanceCalculation'
import { useAuthStore } from './stores/authStore'
import { useLocationStore } from './stores/locationStore'
import { useCityStore } from './stores/cityStore'
import { useCafeStore } from './stores/cafeStore'
import { useDataStore } from './stores/dataStore'
import { useFeatureStore } from './stores/featureStore'

export const App: React.FC = () => {
  // Feature and data stores
  const { showComingSoon } = useFeatureStore()
  const { allCafes } = useDataStore()

  // Zustand stores
  const { isAuthenticated, authenticate } = useAuthStore()
  const { coordinates } = useLocationStore()
  const { selectedCity } = useCityStore()
  const { setUserCoordinates, setCafesWithDistance } = useCafeStore()

  // Sync location store to cafe store
  useEffect(() => {
    setUserCoordinates(coordinates)
  }, [coordinates, setUserCoordinates])

  // Filter cafes by selected city
  const cafes = useMemo(() => {
    return allCafes.filter(cafe => cafe.city === selectedCity)
  }, [allCafes, selectedCity])

  // Memoize user location to prevent unnecessary recalculations
  const userLocation = useMemo(() => {
    if (!coordinates) return null
    return {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    }
  }, [coordinates?.latitude, coordinates?.longitude])

  // Calculate distances from user location
  const { cafesWithDistance } = useDistanceCalculation({
    cafes,
    userLocation,
  })

  // Update cafe store with calculated distances
  useEffect(() => {
    setCafesWithDistance(cafesWithDistance)
  }, [cafesWithDistance, setCafesWithDistance])

  if (showComingSoon && !isAuthenticated) {
    return <ComingSoon onPasswordCorrect={authenticate} />
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">
      <Header />
      <AppRoutes />
      <BottomNavigation />
    </div>
  )
}

export default App