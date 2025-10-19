import React, { useEffect, Suspense } from 'react'
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router'
import MapView from './MapView'
import ListView from './ListView'
import DetailView from './DetailView'
import EventDetailView from './EventDetailView'
import FeedView from './FeedView'
import PassportView from './PassportView'
import EventsView from './EventsView'
import LoginPage from './auth/LoginPage'
import ProtectedRoute from './auth/ProtectedRoute'
import { UserProfilePage } from './profile/UserProfilePage'
import ContactPage from './ContactPage'
import AboutPage from './AboutPage'
import StorePage from './StorePage'
import SettingsPage from './SettingsPage'
// Lazy load admin components for better performance
const AdminLayout = React.lazy(() => import('./admin/AdminLayout'))
const AdminErrorBoundary = React.lazy(() => import('./admin/AdminErrorBoundary'))
const AdminSettingsPage = React.lazy(() => import('./admin/AdminSettingsPage'))
const CafeManagementPage = React.lazy(() => import('./admin/CafeManagementPage'))
const NewsfeedManagementPage = React.lazy(() => import('./admin/NewsfeedManagementPage'))
const EventManagementPage = React.lazy(() => import('./admin/EventManagementPage'))
const ApiManagementPage = React.lazy(() => import('./admin/ApiManagementPage'))
const UserManagementPage = React.lazy(() => import('./admin/UserManagementPage'))
const ProductsManagementPage = React.lazy(() => import('./admin/ProductsManagementPage'))
const MiscAdminPage = React.lazy(() => import('./admin/MiscAdminPage'))
const BulkImporterPage = React.lazy(() => import('./admin/BulkImporterPage'))
const WaitlistPage = React.lazy(() => import('./admin/WaitlistPage'))
const ContentManagementPage = React.lazy(() => import('./admin/ContentManagementPage'))
const CafePhotosManagementPage = React.lazy(() => import('./admin/CafePhotosManagementPage'))
const CafeReviewsManagementPage = React.lazy(() => import('./admin/CafeReviewsManagementPage'))
import { useFeatureToggle } from '../hooks/useFeatureToggle'
import { useAppFeatures } from '../hooks/useAppFeatures'
import { useDataStore } from '../stores/dataStore'
import { useCafeStore } from '../stores/cafeStore'
import { useUIStore } from '../stores/uiStore'
import { useVisitedCafesStore } from '../stores/visitedCafesStore'
import { useCafeSelection } from '../hooks/useCafeSelection'
import { Skeleton } from './ui/Skeleton'

// Loading fallback component for admin pages
const AdminLoadingFallback: React.FC = () => (
  <div className="flex-1 overflow-y-auto p-6">
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton variant="text" width="40%" height={32} className="mb-4" />
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <Skeleton variant="rectangular" height={200} />
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="40%" height={20} />
      </div>
    </div>
  </div>
)

// Wrapper component for cafe detail view with URL params
const CafeDetailWrapper: React.FC = () => {
  const { slug } = useParams<{ cityShortcode: string; slug: string }>()
  const { cafesWithDistance } = useCafeStore()
  const { visitedCafeIds, toggleVisited } = useVisitedCafesStore()
  const { cafesFetched, isLoading } = useDataStore()

  // Find cafe by slug
  const cafe = cafesWithDistance.find(c => {
    // Create slug from cafe name for comparison
    const cafeSlug = c.name.toLowerCase().replace(/\s+/g, '-')
    return cafeSlug === slug
  })

  // Show loading state while cafes are being fetched
  if (!cafesFetched || isLoading) {
    return (
      <div className="flex-1 overflow-y-auto pb-24 pt-0">
        <Skeleton variant="rectangular" height={224} className="mb-4" />
        <div className="px-4 max-w-2xl mx-auto">
          <Skeleton variant="text" width="80%" height={32} className="mb-4" />
          <Skeleton variant="rectangular" height={200} className="mb-4" />
          <Skeleton variant="text" width="100%" height={20} className="mb-2" />
          <Skeleton variant="text" width="100%" height={20} className="mb-2" />
          <Skeleton variant="text" width="60%" height={20} />
        </div>
      </div>
    )
  }

  // Only redirect if cafes are loaded and cafe not found
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

// Wrapper component for event detail view with URL params
const EventDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { eventItems, eventsFetched, isLoading, fetchEvents } = useDataStore()

  // Fetch events if not already fetched
  useEffect(() => {
    if (!eventsFetched && !isLoading) {
      fetchEvents()
    }
  }, [eventsFetched, isLoading, fetchEvents])

  // Find event by ID
  const eventId = parseInt(id || '', 10)
  const event = eventItems.find(e => e.id === eventId)

  // Show loading state while events are being fetched
  if (!eventsFetched || isLoading) {
    return (
      <div className="flex-1 overflow-y-auto pb-24 pt-0">
        <Skeleton variant="rectangular" height={224} className="mb-4" />
        <div className="px-4 max-w-2xl mx-auto">
          <Skeleton variant="text" width="80%" height={32} className="mb-4" />
          <Skeleton variant="rectangular" height={200} className="mb-4" />
          <Skeleton variant="text" width="100%" height={20} className="mb-2" />
          <Skeleton variant="text" width="100%" height={20} className="mb-2" />
          <Skeleton variant="text" width="60%" height={20} />
        </div>
      </div>
    )
  }

  // If events are loaded but event not found, redirect to events list
  if (!event) {
    return <Navigate to="/events" replace />
  }

  // Ensure published is a boolean (default to true if undefined)
  const eventWithDefaults = {
    ...event,
    published: event.published ?? true
  }

  return <EventDetailView event={eventWithDefaults} />
}

export const AppRoutes: React.FC = () => {
  const { isFeedEnabled, isEventsEnabled, isPassportEnabled } = useAppFeatures()
  const isAdminEnabled = useFeatureToggle('ENABLE_ADMIN_PANEL')
  const isContactEnabled = useFeatureToggle('ENABLE_CONTACT')
  const isAboutEnabled = useFeatureToggle('ENABLE_ABOUT')
  const isStoreEnabled = useFeatureToggle('ENABLE_STORE')
  const isSettingsEnabled = useFeatureToggle('ENABLE_SETTINGS')

  const { feedItems, eventItems, fetchCafes } = useDataStore()
  const { cafesWithDistance, selectedCafe } = useCafeStore()
  const { showPopover, expandedCard, setExpandedCard, closePopover } = useUIStore()
  const { stampedCafeIds, toggleStamp } = useVisitedCafesStore()
  const { handlePinClick, viewDetails } = useCafeSelection(cafesWithDistance)
  const location = useLocation()

  // Fetch only cafes on mount - feed/events lazy load when navigated to
  useEffect(() => {
    fetchCafes() // Only fetch cafes (70% of users only use map)
  }, [])

  // Handle navigation state for cafe selection (from event views)
  useEffect(() => {
    const state = location.state as { selectedCafeId?: number } | null
    if (state?.selectedCafeId && cafesWithDistance.length > 0) {
      const cafe = cafesWithDistance.find(c => c.id === state.selectedCafeId)
      if (cafe) {
        handlePinClick(cafe)
        // Clear the state to prevent re-triggering on back navigation
        window.history.replaceState({}, document.title)
      }
    }
  }, [location.state, cafesWithDistance, handlePinClick])

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
      {isFeedEnabled && (
        <Route path="/feed" element={
          <FeedView feedItems={feedItems} />
        } />
      )}
      {isEventsEnabled && (
        <>
          <Route path="/events" element={
            <EventsView eventItems={eventItems} />
          } />
          <Route path="/events/:id" element={<EventDetailWrapper />} />
        </>
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
      {/* Login route - only if user accounts enabled */}
      {useFeatureToggle('ENABLE_USER_ACCOUNTS') && (
        <Route path="/login" element={<LoginPage />} />
      )}
      {/* Profile route - only if user accounts AND profiles enabled */}
      {useFeatureToggle('ENABLE_USER_ACCOUNTS') && useFeatureToggle('ENABLE_USER_PROFILES') && (
        <Route path="/profile/:username" element={<UserProfilePage />} />
      )}
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
          {/* Admin routes wrapped with Suspense for lazy loading and error boundaries */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <CafeManagementPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/cafes" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <CafeManagementPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/newsfeed" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <NewsfeedManagementPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/events" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <EventManagementPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <UserManagementPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/waitlist" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <WaitlistPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <ProductsManagementPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/api" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <ApiManagementPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/misc" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <MiscAdminPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/import" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <BulkImporterPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <AdminSettingsPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/content" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <ContentManagementPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/content/cafes/:cafeId/photos" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <CafePhotosManagementPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/content/cafes/:cafeId/reviews" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <CafeReviewsManagementPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
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
