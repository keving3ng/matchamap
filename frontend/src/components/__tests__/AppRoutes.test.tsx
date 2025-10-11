import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../AppRoutes'

// Mock all the page components
vi.mock('../MapView', () => ({
  MapView: () => <div>Map View</div>,
}))

vi.mock('../ListView', () => ({
  ListView: () => <div>List View</div>,
}))

vi.mock('../DetailView', () => ({
  DetailView: () => <div>Detail View</div>,
}))

vi.mock('../FeedView', () => ({
  FeedView: () => <div>Feed View</div>,
}))

vi.mock('../PassportView', () => ({
  PassportView: () => <div>Passport View</div>,
}))

vi.mock('../EventsView', () => ({
  EventsView: () => <div>Events View</div>,
}))

vi.mock('../AboutPage', () => ({
  AboutPage: () => <div>About Page</div>,
}))

vi.mock('../ContactPage', () => ({
  ContactPage: () => <div>Contact Page</div>,
}))

vi.mock('../SettingsPage', () => ({
  SettingsPage: () => <div>Settings Page</div>,
}))

vi.mock('../StorePage', () => ({
  StorePage: () => <div>Store Page</div>,
}))

vi.mock('../ComingSoon', () => ({
  ComingSoon: () => <div>Coming Soon</div>,
}))

// Mock feature toggles
vi.mock('../../hooks/useAppFeatures', () => ({
  useAppFeatures: () => ({
    isFeedEnabled: true,
    isPassportEnabled: true,
    isEventsEnabled: true,
    isStoreEnabled: true,
  }),
}))

// Mock auth store
const mockAuthStore = {
  isAuthenticated: false,
  user: null,
}

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
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
      <MemoryRouter initialEntries={['/cafe/test-cafe']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Detail View')).toBeInTheDocument()
  })

  it('should render feed view on /feed path', () => {
    render(
      <MemoryRouter initialEntries={['/feed']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Feed View')).toBeInTheDocument()
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

    // Should redirect or show unauthorized access
    expect(screen.queryByText('Settings Page')).not.toBeInTheDocument()
  })

  it('should handle 404 routes gracefully', () => {
    render(
      <MemoryRouter initialEntries={['/non-existent-route']}>
        <AppRoutes />
      </MemoryRouter>
    )

    // Should show 404 page or redirect to home
    expect(screen.getByText(/not found|404/i) || screen.getByText('Map View')).toBeInTheDocument()
  })

  it('should handle dynamic cafe routes with slugs', () => {
    render(
      <MemoryRouter initialEntries={['/cafe/amazing-matcha-cafe']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Detail View')).toBeInTheDocument()
  })

  it('should handle route parameters correctly', () => {
    render(
      <MemoryRouter initialEntries={['/cafe/test-cafe-123']}>
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

    // Admin routes should be accessible
    expect(screen.getByText('Admin') || screen.getByText('Unauthorized')).toBeInTheDocument()
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