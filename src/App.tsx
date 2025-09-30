import React, { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { MapPin, List, User, Menu, ArrowLeft } from 'lucide-react'
import MapView from './components/MapView'
import ListView from './components/ListView'
import DetailView from './components/DetailView'
import FeedView from './components/FeedView'
import PassportView from './components/PassportView'
import EventsView from './components/EventsView'
import ComingSoon from './components/ComingSoon'
import { useDistanceCalculation } from './hooks/useDistanceCalculation'
import { useFeatureToggle } from './hooks/useFeatureToggle'
import cafeData from './data/cafes.json'
import type { CafeData, CafeWithDistance } from './types'

export const App: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
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

  // Determine current view from URL path
  const currentView = location.pathname === '/list' ? 'list'
    : location.pathname === '/feed' ? 'feed'
    : location.pathname === '/passport' ? 'passport'
    : location.pathname === '/events' ? 'events'
    : location.pathname.startsWith('/cafe/') ? 'detail'
    : 'map'

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
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentView === 'detail' && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-green-700 rounded-lg transition"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">🍵</span>
              </div>
              <h1 className="text-xl font-bold tracking-wide">MatchaMap</h1>
            </div>
          </div>
          {isMenuEnabled && (
            <button className="p-2 hover:bg-green-700 rounded-lg transition">
              <Menu size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <Routes>
        <Route path="/" element={
          <MapView
            cafes={cafesWithDistance}
            showPopover={showPopover}
            selectedCafe={selectedCafeWithLatestInfo}
            onPinClick={handlePinClick}
            onViewDetails={viewDetails}
            onClosePopover={() => setShowPopover(false)}
            onLocationChange={setUserCoordinates}
          />
        } />
        <Route path="/list" element={
          <ListView
            cafes={cafesWithDistance}
            expandedCard={expandedCard}
            onToggleExpand={setExpandedCard}
            onViewDetails={viewDetails}
            onLocationChange={setUserCoordinates}
          />
        } />
        <Route path="/feed" element={
          <FeedView feedItems={feed} />
        } />
        {isEventsEnabled && (
          <Route path="/events" element={
            <EventsView eventItems={events} />
          } />
        )}
        {isPassportEnabled && (
          <Route path="/passport" element={
            <PassportView
              cafes={cafes}
              visitedStamps={visitedStamps}
              onToggleStamp={toggleStamp}
            />
          } />
        )}
        <Route path="/cafe/:id" element={
          <DetailView
            cafe={selectedCafeWithLatestInfo || cafesWithDistance[0]}
            visitedLocations={visitedLocations}
            onToggleVisited={toggleVisited}
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Bottom Navigation */}
      <div className="bg-white border-t-2 border-green-200 px-6 py-3 shadow-lg">
        <div className="flex justify-around items-center">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 transition ${
              currentView === 'map' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <MapPin size={24} strokeWidth={currentView === 'map' ? 2.5 : 2} />
            <span className={`text-xs ${currentView === 'map' ? 'font-semibold' : ''}`}>Map</span>
          </button>
          <button
            onClick={() => navigate('/list')}
            className={`flex flex-col items-center gap-1 transition ${
              currentView === 'list' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <List size={24} strokeWidth={currentView === 'list' ? 2.5 : 2} />
            <span className={`text-xs ${currentView === 'list' ? 'font-semibold' : ''}`}>List</span>
          </button>
          <button
            onClick={() => navigate('/feed')}
            className={`flex flex-col items-center gap-1 transition ${
              currentView === 'feed' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <span className="text-2xl">📰</span>
            <span className={`text-xs ${currentView === 'feed' ? 'font-semibold' : ''}`}>Feed</span>
          </button>
          {isEventsEnabled && (
            <button
              onClick={() => navigate('/events')}
              className={`flex flex-col items-center gap-1 transition ${
                currentView === 'events' ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <span className="text-2xl">🎪</span>
              <span className={`text-xs ${currentView === 'events' ? 'font-semibold' : ''}`}>Events</span>
            </button>
          )}
          {isPassportEnabled && (
            <button
              onClick={() => navigate('/passport')}
              className={`flex flex-col items-center gap-1 transition ${
                currentView === 'passport' ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <User size={24} strokeWidth={currentView === 'passport' ? 2.5 : 2} />
              <span className={`text-xs ${currentView === 'passport' ? 'font-semibold' : ''}`}>Passport</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default App