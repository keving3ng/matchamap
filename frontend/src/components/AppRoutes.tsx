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
const UserProfilePage = React.lazy(() => import('./profile/UserProfilePage').then(m => ({ default: m.UserProfilePage })))
const ContactPage = React.lazy(() => import('./ContactPage'))
const AboutPage = React.lazy(() => import('./AboutPage'))
const StorePage = React.lazy(() => import('./StorePage'))
const SettingsPage = React.lazy(() => import('./SettingsPage'))
const LeaderboardPage = React.lazy(() => import('./leaderboards/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })))

// Lazy load admin components for better performance
const AdminLayout = React.lazy(() => import('./admin/AdminLayout'))
const AdminErrorBoundary = React.lazy(() => import('./admin/AdminErrorBoundary'))
const AdminSettingsPage = React.lazy(() => import('./admin/AdminSettingsPage'))
const CafeManagementPage = React.lazy(() => import('./admin/CafeManagementPage'))
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
const ModerationDashboard = React.lazy(() => import('./admin/ModerationDashboard'))
const StatsPage = React.lazy(() => import('./admin/StatsPage'))
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
  const { isEventsEnabled, isPassportEnabled } = useAppFeatures()
  const isAdminEnabled = useFeatureToggle('ENABLE_ADMIN_PANEL')
  const isContactEnabled = useFeatureToggle('ENABLE_CONTACT')
  const isAboutEnabled = useFeatureToggle('ENABLE_ABOUT')
  const isStoreEnabled = useFeatureToggle('ENABLE_STORE')
  const isSettingsEnabled = useFeatureToggle('ENABLE_SETTINGS')
  const isUserAccountsEnabled = useFeatureToggle('ENABLE_USER_ACCOUNTS')
  const isUserProfilesEnabled = useFeatureToggle('ENABLE_USER_PROFILES')

  const { eventItems, fetchCafes } = useDataStore()
  const { cafesWithDistance, selectedCafe } = useCafeStore()
  const { showPopover, expandedCard, setExpandedCard, closePopover } = useUIStore()
  const { stampedCafeIds, toggleStamp } = useVisitedCafesStore()
  const { handlePinClick, viewDetails } = useCafeSelection(cafesWithDistance)
  const location = useLocation()

  // Fetch only cafes on mount - feed/events lazy load when navigated to
  useEffect(() => {
    fetchCafes() // Only fetch cafes (70% of users only use map)
  }, [fetchCafes])

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
        <Suspense fallback={<PageLoadingFallback />}>
          <MapView
            cafes={cafesWithDistance}
            showPopover={showPopover}
            selectedCafe={selectedCafe}
            onPinClick={handlePinClick}
            onViewDetails={viewDetails}
            onClosePopover={closePopover}
          />
        </Suspense>
      } />
      <Route path="/list" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <ListView
            cafes={cafesWithDistance}
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
              cafes={cafesWithDistance}
              visitedStamps={stampedCafeIds}
              onToggleStamp={toggleStamp}
            />
          </Suspense>
        } />
      )}
      {/* Login route - only if user accounts enabled */}
      {isUserAccountsEnabled && (
        <Route path="/login" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <LoginPage />
          </Suspense>
        } />
      )}
      {/* Profile route - only if user accounts AND profiles enabled */}
      {isUserAccountsEnabled && isUserProfilesEnabled && (
        <Route path="/profile/:username" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <UserProfilePage />
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
      {isStoreEnabled && (
        <Route path="/store" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <StorePage />
          </Suspense>
        } />
      )}
      {isSettingsEnabled && (
        <Route path="/settings" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <SettingsPage />
          </Suspense>
        } />
      )}
      {/* Leaderboards route - only if social features enabled */}
      {useFeatureToggle('ENABLE_USER_SOCIAL') && (
        <Route path="/leaderboards" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <LeaderboardPage />
          </Suspense>
        } />
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
          <Route path="/admin/moderation" element={
            <ProtectedRoute requireAdmin={true}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminErrorBoundary>
                  <AdminLayout>
                    <ModerationDashboard />
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
  )
}

export default AppRoutes
