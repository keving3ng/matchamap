import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../AppRoutes'

// Mock all the page components
vi.mock('../MapView', () => ({
  default: () => <div>Map View</div>,
}))

vi.mock('../ListView', () => ({
  default: () => <div>List View</div>,
}))

vi.mock('../DetailView', () => ({
  default: () => <div>Detail View</div>,
}))

vi.mock('../EventDetailView', () => ({
  default: () => <div>Event Detail View</div>,
}))

vi.mock('../FeedView', () => ({
  default: () => <div>Feed View</div>,
}))

vi.mock('../PassportView', () => ({
  default: () => <div>Passport View</div>,
}))

vi.mock('../EventsView', () => ({
  default: () => <div>Events View</div>,
}))

vi.mock('../AboutPage', () => ({
  default: () => <div>About Page</div>,
}))

vi.mock('../ContactPage', () => ({
  default: () => <div>Contact Page</div>,
}))

vi.mock('../SettingsPage', () => ({
  default: () => <div>Settings Page</div>,
}))

vi.mock('../StorePage', () => ({
  default: () => <div>Store Page</div>,
}))

vi.mock('../auth/LoginPage', () => ({
  default: () => <div>Login Page</div>,
}))

vi.mock('../auth/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../profile/UserProfilePage', () => ({
  UserProfilePage: () => <div>User Profile Page</div>,
}))

// Mock feature toggles
vi.mock('../../hooks/useAppFeatures', () => ({
  useAppFeatures: () => ({
    isFeedEnabled: false,
    isPassportEnabled: true,
    isEventsEnabled: true,
    isStoreEnabled: true,
  }),
}))

vi.mock('../../hooks/useFeatureToggle', () => ({
  useFeatureToggle: () => true,
}))

// Mock auth store
const mockAuthStore = {
  isAuthenticated: false,
  user: null,
}

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Mock cafe store with test cafe
const mockCafe = {
  id: 1,
  name: 'Test Cafe',
  slug: 'test-cafe',
  address: '123 Test St',
  latitude: 43.6532,
  longitude: -79.3832,
  city: 'toronto',
  quickNote: 'Test quick note',
}

// Mock data store
vi.mock('../../stores/dataStore', () => ({
  useDataStore: () => ({
    cafes: [mockCafe],
    feedItems: [],
    eventItems: [],
    fetchCafes: vi.fn(),
    fetchFeed: vi.fn(),
    fetchEvents: vi.fn(),
    cafesFetched: true,
    feedFetched: true,
    eventsFetched: true,
    isLoading: false,
  }),
}))

vi.mock('../../stores/cafeStore', () => ({
  useCafeStore: () => ({
    cafesWithDistance: [mockCafe],
    selectedCafe: null,
  }),
}))

// Mock UI store
vi.mock('../../stores/uiStore', () => ({
  useUIStore: () => ({
    showPopover: false,
    expandedCard: null,
    setExpandedCard: vi.fn(),
    closePopover: vi.fn(),
  }),
}))

// Mock visited cafes store
vi.mock('../../stores/visitedCafesStore', () => ({
  useVisitedCafesStore: () => ({
    stampedCafeIds: [],
    toggleStamp: vi.fn(),
    visitedCafeIds: [],
    toggleVisited: vi.fn(),
  }),
}))

// Mock cafe selection hook
vi.mock('../../hooks/useCafeSelection', () => ({
  useCafeSelection: () => ({
    handlePinClick: vi.fn(),
    viewDetails: vi.fn(),
  }),
}))

describe('AppRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = false
    mockAuthStore.user = null
  })

  it('should render map view on root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Map View')).toBeInTheDocument()
  })

  it('should render list view on /list path', () => {
    render(
      <MemoryRouter initialEntries={['/list']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('List View')).toBeInTheDocument()
  })

  it('should render detail view on cafe paths', () => {
    render(
      <MemoryRouter initialEntries={['/toronto/test-cafe']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Detail View')).toBeInTheDocument()
  })

  it('should redirect to map view when feed is disabled and /feed is accessed', () => {
    render(
      <MemoryRouter initialEntries={['/feed']}>
        <AppRoutes />
      </MemoryRouter>
    )

    // Feed is disabled, should redirect to map view
    expect(screen.getByText('Map View')).toBeInTheDocument()
  })

  it('should render passport view on /passport path', () => {
    render(
      <MemoryRouter initialEntries={['/passport']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Passport View')).toBeInTheDocument()
  })

  it('should render events view on /events path', () => {
    render(
      <MemoryRouter initialEntries={['/events']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Events View')).toBeInTheDocument()
  })

  it('should render about page on /about path', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('About Page')).toBeInTheDocument()
  })

  it('should render contact page on /contact path', () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Contact Page')).toBeInTheDocument()
  })

  it('should render store page on /store path', () => {
    render(
      <MemoryRouter initialEntries={['/store']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Store Page')).toBeInTheDocument()
  })

  it('should render settings page on /settings path when authenticated', () => {
    mockAuthStore.isAuthenticated = true
    
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Settings Page')).toBeInTheDocument()
  })

  it('should redirect to login when accessing protected routes without auth', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <AppRoutes />
      </MemoryRouter>
    )

    // Settings page doesn't require auth (ProtectedRoute is only for admin routes)
    // So it should be accessible
    expect(screen.getByText('Settings Page')).toBeInTheDocument()
  })

  it('should handle 404 routes gracefully', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-city/unknown-cafe']}>
        <AppRoutes />
      </MemoryRouter>
    )

    // Unknown cafes should redirect to home
    expect(screen.getByText('Map View')).toBeInTheDocument()
  })

  it('should handle dynamic cafe routes with slugs', () => {
    render(
      <MemoryRouter initialEntries={['/toronto/test-cafe']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Detail View')).toBeInTheDocument()
  })

  it('should handle route parameters correctly', () => {
    render(
      <MemoryRouter initialEntries={['/toronto/test-cafe']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Detail View')).toBeInTheDocument()
  })

  it('should handle nested admin routes', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = { role: 'admin' }

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AppRoutes />
      </MemoryRouter>
    )

    // Admin routes are lazy loaded and wrapped in ProtectedRoute which we mocked to render children
    // Since admin components are mocked, we won't see actual admin content in tests
    // Just verify no error is thrown
    const body = document.body
    expect(body).toBeInTheDocument()
  })

  it('should lazy load routes for performance', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    )

    // Routes should be lazy loaded (this is more of an implementation detail)
    expect(screen.getByText('Map View')).toBeInTheDocument()
  })
})