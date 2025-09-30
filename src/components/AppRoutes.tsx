import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MapView from './MapView'
import ListView from './ListView'
import DetailView from './DetailView'
import FeedView from './FeedView'
import PassportView from './PassportView'
import EventsView from './EventsView'
import { useVisitedCafesStore } from '../stores/visitedCafesStore'
import type { CafeWithDistance, FeedItem, EventItem } from '../types'

interface AppRoutesProps {
  // Map/List shared props
  cafesWithDistance: CafeWithDistance[]
  selectedCafe: CafeWithDistance | null
  onLocationChange: (coords: GeolocationCoordinates | null) => void

  // Map props
  showPopover: boolean
  onPinClick: (cafe: CafeWithDistance) => void
  onViewDetails: (cafe: CafeWithDistance) => void
  onClosePopover: () => void

  // List props
  expandedCard: number | null
  onToggleExpand: (id: number | null) => void

  // Feed props
  feedItems: FeedItem[]

  // Events props
  eventItems: EventItem[]
  isEventsEnabled?: boolean

  // Passport props
  cafes: CafeWithDistance[]
  onToggleStamp: (id: number) => void
  isPassportEnabled?: boolean

  // Detail props
  onToggleVisited: (id: number) => void
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  cafesWithDistance,
  selectedCafe,
  onLocationChange,
  showPopover,
  onPinClick,
  onViewDetails,
  onClosePopover,
  expandedCard,
  onToggleExpand,
  feedItems,
  eventItems,
  isEventsEnabled = false,
  cafes,
  onToggleStamp,
  isPassportEnabled = false,
  onToggleVisited,
}) => {
  const { stampedCafeIds, visitedCafeIds } = useVisitedCafesStore()

  return (
    <Routes>
      <Route path="/" element={
        <MapView
          cafes={cafesWithDistance}
          showPopover={showPopover}
          selectedCafe={selectedCafe}
          onPinClick={onPinClick}
          onViewDetails={onViewDetails}
          onClosePopover={onClosePopover}
          onLocationChange={onLocationChange}
        />
      } />
      <Route path="/list" element={
        <ListView
          cafes={cafesWithDistance}
          expandedCard={expandedCard}
          onToggleExpand={onToggleExpand}
          onViewDetails={onViewDetails}
          onLocationChange={onLocationChange}
        />
      } />
      <Route path="/feed" element={
        <FeedView feedItems={feedItems} />
      } />
      {isEventsEnabled && (
        <Route path="/events" element={
          <EventsView eventItems={eventItems} />
        } />
      )}
      {isPassportEnabled && (
        <Route path="/passport" element={
          <PassportView
            cafes={cafes}
            visitedStamps={stampedCafeIds}
            onToggleStamp={onToggleStamp}
          />
        } />
      )}
      <Route path="/cafe/:id" element={
        <DetailView
          cafe={selectedCafe || cafesWithDistance[0]}
          visitedLocations={visitedCafeIds}
          onToggleVisited={onToggleVisited}
        />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
