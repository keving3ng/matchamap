import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import MapView from './MapView'
import ListView from './ListView'
import DetailView from './DetailView'
import FeedView from './FeedView'
import PassportView from './PassportView'
import EventsView from './EventsView'
import LoginPage from './auth/LoginPage'
import ProtectedRoute from './auth/ProtectedRoute'
import ContactPage from './ContactPage'
import AboutPage from './AboutPage'
import StorePage from './StorePage'
import SettingsPage from './SettingsPage'
import AdminLayout from './admin/AdminLayout'
import FeatureTogglesPage from './admin/FeatureTogglesPage'
import CafeManagementPage from './admin/CafeManagementPage'
import NewsfeedManagementPage from './admin/NewsfeedManagementPage'
import EventManagementPage from './admin/EventManagementPage'
import ApiManagementPage from './admin/ApiManagementPage'
import UserManagementPage from './admin/UserManagementPage'
import ProductsManagementPage from './admin/ProductsManagementPage'
import MiscAdminPage from './admin/MiscAdminPage'
import BulkImporterPage from './admin/BulkImporterPage'
import { useFeatureToggle } from '../hooks/useFeatureToggle'
import { useDataStore } from '../stores/dataStore'
import { useFeatureStore } from '../stores/featureStore'
import { useCafeStore } from '../stores/cafeStore'
import { useUIStore } from '../stores/uiStore'
import { useVisitedCafesStore } from '../stores/visitedCafesStore'
import { useCafeSelection } from '../hooks/useCafeSelection'

// Wrapper component for cafe detail view with URL params
const CafeDetailWrapper: React.FC = () => {
  const { slug } = useParams<{ cityShortcode: string; slug: string }>()
  const { cafesWithDistance } = useCafeStore()
  const { visitedCafeIds, toggleVisited } = useVisitedCafesStore()

  // Find cafe by slug
  const cafe = cafesWithDistance.find(c => {
    // Create slug from cafe name for comparison
    const cafeSlug = c.name.toLowerCase().replace(/\s+/g, '-')
    return cafeSlug === slug
  })

  if (!cafe) {
    return <Navigate to="/" replace />
  }

  return (
    <DetailView
      cafe={cafe}
      visitedLocations={visitedCafeIds}
      onToggleVisited={toggleVisited}
    />
  )
}

export const AppRoutes: React.FC = () => {
  const { isEventsEnabled, isPassportEnabled, isUserAccountsEnabled } = useFeatureStore()
  const isAdminEnabled = useFeatureToggle('ENABLE_ADMIN_PANEL')
  const isContactEnabled = useFeatureToggle('ENABLE_CONTACT')
  const isAboutEnabled = useFeatureToggle('ENABLE_ABOUT')
  const isStoreEnabled = useFeatureToggle('ENABLE_STORE')
  const isSettingsEnabled = useFeatureToggle('ENABLE_SETTINGS')

  const { feedItems, eventItems, fetchAll } = useDataStore()
  const { cafesWithDistance, selectedCafe } = useCafeStore()
  const { showPopover, expandedCard, setExpandedCard, closePopover } = useUIStore()
  const { stampedCafeIds, toggleStamp } = useVisitedCafesStore()
  const { handlePinClick, viewDetails } = useCafeSelection(cafesWithDistance)

  // Fetch data on mount - get all cafes regardless of location
  useEffect(() => {
    fetchAll() // Fetch all cafes from all cities
  }, [])

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
      {/* Login route - always available */}
      <Route path="/login" element={<LoginPage />} />
      {isContactEnabled && (
        <Route path="/contact" element={<ContactPage />} />
      )}
      {isAboutEnabled && (
        <Route path="/about" element={<AboutPage />} />
      )}
      {isStoreEnabled && (
        <Route path="/store" element={<StorePage />} />
      )}
      {isSettingsEnabled && (
        <Route path="/settings" element={<SettingsPage />} />
      )}
      {isAdminEnabled && (
        <>
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout>
                <FeatureTogglesPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/cafes" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout>
                <CafeManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/newsfeed" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout>
                <NewsfeedManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/events" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout>
                <EventManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout>
                <UserManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout>
                <ProductsManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/api" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout>
                <ApiManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/misc" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout>
                <MiscAdminPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/import" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout>
                <BulkImporterPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
        </>
      )}
      {/* New URL pattern: /{city-shortcode}/{cafe-slug} */}
      <Route path="/:cityShortcode/:slug" element={<CafeDetailWrapper />} />

      {/* Legacy route for backwards compatibility - redirect to new format */}
      <Route path="/cafe/:id" element={<Navigate to="/" replace />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
