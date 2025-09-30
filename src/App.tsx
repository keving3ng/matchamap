import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './components/Header'
import BottomNavigation from './components/BottomNavigation'
import AppRoutes from './components/AppRoutes'
import ComingSoon from './components/ComingSoon'
import { useDistanceCalculation } from './hooks/useDistanceCalculation'
import { useFeatureToggle } from './hooks/useFeatureToggle'
import cafeData from './data/cafes.json'
import type { CafeData, CafeWithDistance } from './types'

export const App: React.FC = () => {
  const navigate = useNavigate()
  const [showPopover, setShowPopover] = useState<boolean>(false)
  const [selectedCafe, setSelectedCafe] = useState<CafeWithDistance | null>(null)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [visitedStamps, setVisitedStamps] = useState<number[]>([2, 4])
  const [visitedLocations, setVisitedLocations] = useState<number[]>([2, 4])
  const [userCoordinates, setUserCoordinates] = useState<GeolocationCoordinates | null>(null)

  // Feature toggles
  const isPassportEnabled = useFeatureToggle('ENABLE_PASSPORT')
  const isEventsEnabled = useFeatureToggle('ENABLE_EVENTS')
  const isMenuEnabled = useFeatureToggle('ENABLE_MENU')
  const showComingSoon = useFeatureToggle('SHOW_COMING_SOON')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const { cafes, feed, events } = cafeData as CafeData

  // Memoize user location to prevent unnecessary recalculations
  const userLocation = React.useMemo(() => {
    if (!userCoordinates) return null
    return {
      latitude: userCoordinates.latitude,
      longitude: userCoordinates.longitude,
    }
  }, [userCoordinates?.latitude, userCoordinates?.longitude])

  // Calculate distances from user location
  const {
    cafesWithDistance,
  } = useDistanceCalculation({
    cafes,
    userLocation,
  })

  const handlePinClick = (cafe: CafeWithDistance): void => {
    setSelectedCafe(cafe)
    setShowPopover(true)
  }

  // Ensure selectedCafe always has the latest distance info
  const selectedCafeWithLatestInfo = React.useMemo(() => {
    if (!selectedCafe) return null
    return cafesWithDistance.find(c => c.id === selectedCafe.id) || selectedCafe
  }, [selectedCafe, cafesWithDistance])

  const viewDetails = (cafe: CafeWithDistance): void => {
    setSelectedCafe(cafe)
    navigate(`/cafe/${cafe.id}`)
    setShowPopover(false)
  }

  const toggleStamp = (id: number): void => {
    if (visitedStamps.includes(id)) {
      setVisitedStamps(visitedStamps.filter(stampId => stampId !== id))
    } else {
      setVisitedStamps([...visitedStamps, id])
    }
  }

  const toggleVisited = (id: number): void => {
    if (visitedLocations.includes(id)) {
      setVisitedLocations(visitedLocations.filter(locId => locId !== id))
    } else {
      setVisitedLocations([...visitedLocations, id])
    }
  }

  if (showComingSoon && !isAuthenticated) {
    return <ComingSoon onPasswordCorrect={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">
      <Header isMenuEnabled={isMenuEnabled} />

      <AppRoutes
        cafesWithDistance={cafesWithDistance}
        selectedCafe={selectedCafeWithLatestInfo}
        onLocationChange={setUserCoordinates}
        showPopover={showPopover}
        onPinClick={handlePinClick}
        onViewDetails={viewDetails}
        onClosePopover={() => setShowPopover(false)}
        expandedCard={expandedCard}
        onToggleExpand={setExpandedCard}
        feedItems={feed}
        eventItems={events}
        isEventsEnabled={isEventsEnabled}
        cafes={cafesWithDistance}
        visitedStamps={visitedStamps}
        onToggleStamp={toggleStamp}
        isPassportEnabled={isPassportEnabled}
        visitedLocations={visitedLocations}
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