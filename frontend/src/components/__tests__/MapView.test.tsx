import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MapView } from '../MapView'
import type { CafeWithDistance } from '../../types'

// Mock Leaflet
vi.mock('leaflet', () => ({
  map: vi.fn(() => ({
    setView: vi.fn(),
    remove: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn(),
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn(),
    on: vi.fn(),
  })),
  divIcon: vi.fn(),
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: vi.fn(),
    },
  },
}))

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
    
    // Should show content in both mobile and desktop versions
    expect(screen.getAllByText('Test Cafe')).toHaveLength(2)
    expect(screen.getAllByText('Downtown')).toHaveLength(2)
    
    // Should have Details button on mobile and desktop
    const detailsButtons = screen.getAllByText('Details')
    expect(detailsButtons.length).toBeGreaterThanOrEqual(1)
  })
})