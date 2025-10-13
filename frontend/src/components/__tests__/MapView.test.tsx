import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MapView } from '../MapView'
import type { CafeWithDistance } from '../../types'

// Mock Leaflet - define inline to avoid hoisting issues
vi.mock('leaflet', () => {
  const mockLeaflet = {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      on: vi.fn().mockReturnThis(),
      off: vi.fn().mockReturnThis(),
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
    })),
    marker: vi.fn(() => {
      const markerInstance = {
        addTo: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        setLatLng: vi.fn().mockReturnThis(),
        setIcon: vi.fn().mockReturnThis(),
      }
      markerInstance.addTo.mockReturnValue(markerInstance)
      markerInstance.on.mockReturnValue(markerInstance)
      return markerInstance
    }),
    divIcon: vi.fn(),
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn(),
      },
    },
  }

  return {
    default: mockLeaflet,
    ...mockLeaflet,
  }
})

const mockCafes: CafeWithDistance[] = [
  {
    id: 1,
    name: 'Test Cafe',
    slug: 'test-cafe',
    displayScore: 9.2,
    latitude: 43.6532,
    longitude: -79.3832,
    link: 'https://maps.google.com',
    address: '123 Test St',
    quickNote: 'Great matcha',
    city: 'toronto',
    distanceInfo: null,
  },
]

const mockProps = {
  cafes: mockCafes,
  showPopover: false,
  selectedCafe: null,
  onPinClick: vi.fn(),
  onViewDetails: vi.fn(),
  onClosePopover: vi.fn(),
}

describe('MapView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders map container', () => {
    render(<MapView {...mockProps} />)
    
    // Check if the map container is rendered
    const mapContainer = document.querySelector('[style*="min-height: 400px"]')
    expect(mapContainer).toBeInTheDocument()
  })

  it('renders zoom controls', () => {
    render(<MapView {...mockProps} />)
    
    // Check for zoom buttons
    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText('−')).toBeInTheDocument()
  })

  it('shows mobile popover when enabled', () => {
    const propsWithPopover = {
      ...mockProps,
      showPopover: true,
      selectedCafe: mockCafes[0],
    }

    render(<MapView {...propsWithPopover} />)

    // Should show cafe name in both mobile and desktop versions
    expect(screen.getAllByText('Test Cafe')).toHaveLength(2)

    // Should show quick note
    expect(screen.getAllByText('"Great matcha"')).toHaveLength(2)

    // Should have Details button on mobile and desktop
    const detailsButtons = screen.getAllByText('Details')
    expect(detailsButtons.length).toBeGreaterThanOrEqual(1)
  })
})