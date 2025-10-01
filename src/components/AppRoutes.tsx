import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MapView from './MapView'
import ListView from './ListView'
import DetailView from './DetailView'
import FeedView from './FeedView'
import PassportView from './PassportView'
import EventsView from './EventsView'
import AdminPage from './AdminPage'
import AdminLayout from './admin/AdminLayout'
import FeatureTogglesPage from './admin/FeatureTogglesPage'
import CafeManagementPage from './admin/CafeManagementPage'
import NewsfeedManagementPage from './admin/NewsfeedManagementPage'
import EventManagementPage from './admin/EventManagementPage'
import ApiManagementPage from './admin/ApiManagementPage'
import UserManagementPage from './admin/UserManagementPage'
import ProductsManagementPage from './admin/ProductsManagementPage'
import MiscAdminPage from './admin/MiscAdminPage'
import { useFeatureToggle } from '../hooks/useFeatureToggle'
import { useDataStore } from '../stores/dataStore'
import { useFeatureStore } from '../stores/featureStore'
import { useCafeStore } from '../stores/cafeStore'
import { useUIStore } from '../stores/uiStore'
import { useVisitedCafesStore } from '../stores/visitedCafesStore'
import { useCafeSelection } from '../hooks/useCafeSelection'

export const AppRoutes: React.FC = () => {
  const { isEventsEnabled, isPassportEnabled } = useFeatureStore()
  const isAdminEnabled = useFeatureToggle('ENABLE_ADMIN_PANEL')

  const { feedItems, eventItems } = useDataStore()
  const { cafesWithDistance, selectedCafe } = useCafeStore()
  const { showPopover, expandedCard, setExpandedCard, closePopover } = useUIStore()
  const { stampedCafeIds, visitedCafeIds, toggleVisited, toggleStamp } = useVisitedCafesStore()
  const { handlePinClick, viewDetails } = useCafeSelection(cafesWithDistance)

  return (
    <Routes>
      <Route path="/" element={
        <MapView
          cafes={cafesWithDistance}
          showPopover={showPopover}
          selectedCafe={selectedCafe}
          onPinClick={handlePinClick}
          onViewDetails={viewDetails}
          onClosePopover={closePopover}
        />
      } />
      <Route path="/list" element={
        <ListView
          cafes={cafesWithDistance}
          expandedCard={expandedCard}
          onToggleExpand={setExpandedCard}
          onViewDetails={viewDetails}
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
            cafes={cafesWithDistance}
            visitedStamps={stampedCafeIds}
            onToggleStamp={toggleStamp}
          />
        } />
      )}
      {isAdminEnabled && (
        <>
          <Route path="/admin" element={
            <AdminLayout>
              <FeatureTogglesPage />
            </AdminLayout>
          } />
          <Route path="/admin/cafes" element={
            <AdminLayout>
              <CafeManagementPage />
            </AdminLayout>
          } />
          <Route path="/admin/newsfeed" element={
            <AdminLayout>
              <NewsfeedManagementPage />
            </AdminLayout>
          } />
          <Route path="/admin/events" element={
            <AdminLayout>
              <EventManagementPage />
            </AdminLayout>
          } />
          <Route path="/admin/users" element={
            <AdminLayout>
              <UserManagementPage />
            </AdminLayout>
          } />
          <Route path="/admin/products" element={
            <AdminLayout>
              <ProductsManagementPage />
            </AdminLayout>
          } />
          <Route path="/admin/api" element={
            <AdminLayout>
              <ApiManagementPage />
            </AdminLayout>
          } />
          <Route path="/admin/misc" element={
            <AdminLayout>
              <MiscAdminPage />
            </AdminLayout>
          } />
        </>
      )}
      <Route path="/cafe/:id" element={
        <DetailView
          cafe={selectedCafe || cafesWithDistance[0]}
          visitedLocations={visitedCafeIds}
          onToggleVisited={toggleVisited}
        />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
