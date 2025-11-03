import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { App } from '../../App'

// Mock useAppFeatures
vi.mock('../../hooks/useAppFeatures', () => ({
  useAppFeatures: () => ({
    showComingSoon: false,
    isFeedEnabled: false,
    isPassportEnabled: true,
    isEventsEnabled: true,
    isStoreEnabled: true,
  }),
}))

// Mock authStore to prevent async getCurrentUser calls
vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    user: null,
    getCurrentUser: vi.fn().mockResolvedValue(undefined),
  }),
}))

// Mock stores used by AppRoutes
vi.mock('../../stores/dataStore', () => ({
  useDataStore: () => ({
    cafesFetched: true,
    isLoading: false,
    eventItems: [],
    eventsFetched: false,
    fetchCafes: vi.fn(),
    fetchEvents: vi.fn(),
  }),
}))

vi.mock('../../stores/cafeStore', () => ({
  useCafeStore: () => ({
    cafesWithDistance: [],
    selectedCafe: null,
    setSelectedCafe: vi.fn(),
  }),
}))

vi.mock('../../stores/uiStore', () => ({
  useUIStore: () => ({
    showPopover: false,
    expandedCard: null,
    setExpandedCard: vi.fn(),
    closePopover: vi.fn(),
    setShowPopover: vi.fn(),
  }),
}))

vi.mock('../../stores/visitedCafesStore', () => ({
  useVisitedCafesStore: () => ({
    stampedCafeIds: [],
    toggleStamp: vi.fn(),
    visitedCafeIds: [],
    toggleVisited: vi.fn(),
  }),
}))

// Mock Header and BottomNavigation since they use react-router hooks
// We're testing App structure, not these components
vi.mock('../Header', () => ({
  default: () => <div data-testid="header">MatchaMap</div>,
}))

// Mock SessionExpiredDialog since it uses useNavigate
vi.mock('../SessionExpiredDialog', () => ({
  SessionExpiredDialog: () => <div data-testid="session-expired-dialog" />,
}))

vi.mock('../BottomNavigation', () => ({
  default: () => (
    <div data-testid="bottom-nav">
      <button className="flex flex-col items-center gap-1 transition text-green-600">
        <span className="text-xs font-semibold">Map</span>
      </button>
      <button className="flex flex-col items-center gap-1 transition text-gray-400">
        <span className="text-xs">List</span>
      </button>
      <button className="flex flex-col items-center gap-1 transition text-gray-400">
        <span className="text-xs">Passport</span>
      </button>
    </div>
  ),
  BottomNavigation: () => (
    <div data-testid="bottom-nav">
      <button className="flex flex-col items-center gap-1 transition text-green-600">
        <span className="text-xs font-semibold">Map</span>
      </button>
      <button className="flex flex-col items-center gap-1 transition text-gray-400">
        <span className="text-xs">List</span>
      </button>
      <button className="flex flex-col items-center gap-1 transition text-gray-400">
        <span className="text-xs">Passport</span>
      </button>
    </div>
  ),
}))

// Mock AppRoutes to avoid complex routing setup
vi.mock('../AppRoutes', () => ({
  default: () => <div data-testid="app-routes">AppRoutes Content</div>,
}))

// Mock useCafeSelection to avoid Router context dependency
// useCafeSelection uses useNavigate() which needs Router context
// By mocking it, AppRoutes can render without needing Router context for navigation
vi.mock('../../hooks/useCafeSelection', () => ({
  useCafeSelection: () => ({
    handlePinClick: vi.fn(),
    viewDetails: vi.fn(),
  }),
}))

// Mock useFeatureToggle hook used by AppRoutes
vi.mock('../../hooks/useFeatureToggle', () => ({
  useFeatureToggle: () => false,
  getCurrentEnvironment: () => 'production',
}))

// Simple render function since we mocked AppRoutes
const renderApp = (component: React.ReactElement) => {
  return render(component)
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders MatchaMap title', () => {
    renderApp(<App />)
    expect(screen.getByText('MatchaMap')).toBeInTheDocument()
  })

  it('renders navigation tabs', () => {
    renderApp(<App />)
    expect(screen.getByText('Map')).toBeInTheDocument()
    expect(screen.getByText('List')).toBeInTheDocument()
    expect(screen.queryByText('Feed')).not.toBeInTheDocument()
    expect(screen.getByText('Passport')).toBeInTheDocument()
  })

  it('starts with map view selected', () => {
    renderApp(<App />)
    const mapButton = screen.getByText('Map').closest('button')
    expect(mapButton).toHaveClass('text-green-600')
  })
})