import React, { useEffect, Suspense } from 'react'
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router'

// Lazy load ALL components for optimal bundle splitting
// Only load what users actually navigate to
const MapView = React.lazy(() => import('./MapView'))
const ListView = React.lazy(() => import('./ListView'))
const DetailView = React.lazy(() => import('./DetailView'))
const EventDetailView = React.lazy(() => import('./EventDetailView'))
const PassportView = React.lazy(() => import('./PassportView'))
const EventsView = React.lazy(() => import('./EventsView'))
const LoginPage = React.lazy(() => import('./auth/LoginPage'))
const ProtectedRoute = React.lazy(() => import('./auth/ProtectedRoute'))
const ContactPage = React.lazy(() => import('./ContactPage'))
const AboutPage = React.lazy(() => import('./AboutPage'))
const InstallHelpView = React.lazy(() => import('./InstallHelpView'))

// Lazy load admin components for better performance
const AdminLayout = React.lazy(() => import('./admin/AdminLayout'))
const AdminErrorBoundary = React.lazy(() => import('./admin/AdminErrorBoundary'))
const AdminSettingsPage = React.lazy(() => import('./admin/AdminSettingsPage'))
const CafeManagementPage = React.lazy(() => import('./admin/CafeManagementPage'))
const EventManagementPage = React.lazy(() => import('./admin/EventManagementPage'))
const ApiManagementPage = React.lazy(() => import('./admin/ApiManagementPage'))
const MiscAdminPage = React.lazy(() => import('./admin/MiscAdminPage'))
const BulkImporterPage = React.lazy(() => import('./admin/BulkImporterPage'))
const WaitlistPage = React.lazy(() => import('./admin/WaitlistPage'))
const StatsPage = React.lazy(() => import('./admin/StatsPage'))
import { useFeatureToggle } from '../hooks/useFeatureToggle'
import { useAppFeatures } from '../hooks/useAppFeatures'
import { useDataStore } from '../stores/dataStore'
import { useCafeStore } from '../stores/cafeStore'
import { useCityStore } from '../stores/cityStore'
import { parseCafeUrlPath, getCityFromShortcode } from '../utils/cityMapping'
import { useUIStore } from '../stores/uiStore'
import { useVisitedCafesStore } from '../stores/visitedCafesStore'
import { useCafeSelection } from '../hooks/useCafeSelection'
import { Skeleton } from './ui/Skeleton'
import { CafeDataNotice } from './CafeDataNotice'
import { UpdateNotice } from './UpdateNotice'

// Loading fallback component for admin pages
const AdminLoadingFallback: React.FC = () => (
  <div className="flex-1 overflow-y-auto p-6">
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton variant="text" width="40%" height={32} className="mb-4" />
      <div className="bg-white rounded-lg shadow-xs p-6 space-y-4">
        <Skeleton variant="rectangular" height={200} />
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="40%" height={20} />
      </div>
    </div>
  </div>
)

// Loading fallback for user-facing pages (minimal/fast)
const PageLoadingFallback: React.FC = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="animate-pulse text-green-600">
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </div>
  </div>
)

// Wrapper component for cafe detail view with URL params
export const CafeDetailWrapper: React.FC = () => {
  const { slug, cityShortcode } = useParams<{ cityShortcode: string; slug: string }>()
  const { cafesWithDistance } = useCafeStore()
  const { visitedCafeIds, toggleVisited } = useVisitedCafesStore()
  const { cafesFetched, cafeLoading, cafeCity, cafeStatus } = useDataStore()
  const requestedCity = getCityFromShortcode(cityShortcode || '')

  // Find cafe by slug
  const cafe = cafeCity === requestedCity ? cafesWithDistance.find(c => {
    // Create slug from cafe name for comparison
    const cafeSlug = c.name.toLowerCase().replace(/\s+/g, '-')
    return cafeSlug === slug
  }) : undefined

  // Wait only while the requested city is being fetched. A failed request must exit loading.
  if (cafeLoading || cafeStatus === 'idle' && !cafesFetched || cafeCity !== requestedCity && cafeStatus !== 'error' && cafeStatus !== 'cleared') {
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

  // An uncached or missing detail needs a useful exit instead of a redirect loop.
  if (!cafe) {
    return <div data-cafe-view tabIndex={-1} className="flex-1 overflow-y-auto pb-24 focus:outline-none">
      <CafeDataNotice city={requestedCity} detail missingCafe />
    </div>
  }

  return (
    <>
      <CafeDataNotice city={requestedCity} detail />
      <DetailView
        cafe={cafe}
        visitedLocations={visitedCafeIds}
        onToggleVisited={toggleVisited}
      />
    </>
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
  const { isEventsEnabled, isPassportEnabled } = useAppFeatures()
  const isAdminEnabled = useFeatureToggle('ENABLE_ADMIN_PANEL')
  const isContactEnabled = useFeatureToggle('ENABLE_CONTACT')
  const isAboutEnabled = useFeatureToggle('ENABLE_ABOUT')
  const isUserAccountsEnabled = useFeatureToggle('ENABLE_USER_ACCOUNTS')

  const { eventItems, fetchCafes, cafeCity } = useDataStore()
  const { cafesWithDistance, selectedCafe } = useCafeStore()
  const { showPopover, expandedCard, setExpandedCard, closePopover } = useUIStore()
  const { stampedCafeIds, toggleStamp } = useVisitedCafesStore()
  const location = useLocation()
  const selectedCity = useCityStore(state => state.selectedCity)
  const routePrefix = location.pathname.split('/')[1]
  const parsedCity = ['admin', 'events', 'cafe'].includes(routePrefix) ? undefined : parseCafeUrlPath(location.pathname)?.city
  const requestedCity = parsedCity ?? selectedCity
  // Do not render the prior city even for the frame before the fetch effect runs.
  const visibleCafes = cafeCity === requestedCity ? cafesWithDistance : []
  const { handlePinClick, viewDetails } = useCafeSelection(visibleCafes)

  // Fetch only cafes on mount - feed/events lazy load when navigated to
  useEffect(() => {
    if (location.pathname.startsWith('/admin') || location.pathname === '/login') return
    void fetchCafes({ city: requestedCity })
  }, [fetchCafes, requestedCity, location.pathname])

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
    <>
      <UpdateNotice />
      {(location.pathname === '/' || location.pathname === '/list') && <CafeDataNotice city={requestedCity} />}
      <Routes>
      <Route path="/" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <MapView
            cafes={visibleCafes}
            showPopover={showPopover}
            selectedCafe={cafeCity === requestedCity ? selectedCafe : null}
            onPinClick={handlePinClick}
            onViewDetails={viewDetails}
            onClosePopover={closePopover}
          />
        </Suspense>
      } />
      <Route path="/list" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <ListView
            cafes={visibleCafes}
            expandedCard={expandedCard}
            onToggleExpand={setExpandedCard}
            onViewDetails={viewDetails}
          />
        </Suspense>
      } />
      {isEventsEnabled && (
        <>
          <Route path="/events" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <EventsView eventItems={eventItems} />
            </Suspense>
          } />
          <Route path="/events/:id" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <EventDetailWrapper />
            </Suspense>
          } />
        </>
      )}
      {isPassportEnabled && (
        <Route path="/passport" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <PassportView
              cafes={visibleCafes}
              visitedStamps={stampedCafeIds}
              onToggleStamp={toggleStamp}
            />
          </Suspense>
        } />
      )}
      {/* Login route - for user accounts or admin access (admins use /login directly when user accounts off) */}
      {(isUserAccountsEnabled || isAdminEnabled) && (
        <Route path="/login" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <LoginPage />
          </Suspense>
        } />
      )}
      {isContactEnabled && (
        <Route path="/contact" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <ContactPage />
          </Suspense>
        } />
      )}
      {isAboutEnabled && (
        <Route path="/about" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <AboutPage />
          </Suspense>
        } />
      )}
      <Route path="/install" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <InstallHelpView />
        </Suspense>
      } />
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
          <Route path="/admin/stats" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <StatsPage />
                  </AdminLayout>
                </AdminErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
        </>
      )}
      {/* New URL pattern: /{city-shortcode}/{cafe-slug} */}
      <Route path="/:cityShortcode/:slug" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <CafeDetailWrapper />
        </Suspense>
      } />

      {/* Legacy route for backwards compatibility - redirect to new format */}
      <Route path="/cafe/:id" element={<Navigate to="/" replace />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default AppRoutes
