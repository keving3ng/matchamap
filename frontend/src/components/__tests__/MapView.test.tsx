import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapView } from '../MapView'
import { COPY } from '../../constants/copy'
import { useUIStore } from '../../stores/uiStore'
import type { CafeWithDistance } from '../../types'

vi.mock('../../stores/cityStore', () => ({
  useCityStore: () => ({
    selectedCity: 'toronto',
    setCity: vi.fn(),
    getCity: () => ({
      key: 'toronto',
      name: 'Toronto',
      shortCode: 'TO',
      center: [43.6532, -79.3832] as [number, number],
      zoom: 14,
    }),
    getAvailableCities: () => [],
    loadAvailableCities: vi.fn().mockResolvedValue(undefined),
    availableCitiesLoaded: true,
  }),
  CITIES: {
    toronto: {
      key: 'toronto',
      name: 'Toronto',
      shortCode: 'TO',
      center: [43.6532, -79.3832] as [number, number],
      zoom: 14,
    },
  },
}))

vi.mock('../../utils/api', () => ({
  api: {
    events: { getAll: vi.fn().mockResolvedValue({ events: [] }) },
  },
}))

vi.mock('../../hooks/useFeatureToggle', () => ({
  useFeatureToggle: () => false,
}))

// Mock Leaflet - define inline to avoid hoisting issues
vi.mock('leaflet', () => {
  const mockLeaflet = {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      removeLayer: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      on: vi.fn().mockReturnThis(),
      off: vi.fn().mockReturnThis(),
      getCenter: vi.fn(() => ({ lat: 43.65, lng: -79.38 })),
      getZoom: vi.fn(() => 14),
      invalidateSize: vi.fn(),
      fitBounds: vi.fn(),
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
    useUIStore.setState({ selectedDrinkType: null })
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

  it('does not show clear filters control when no quick filters are active', () => {
    render(<MapView {...mockProps} />)
    expect(screen.queryByRole('button', { name: COPY.map.clearFilters })).not.toBeInTheDocument()
  })

  it('shows clear filters control when a drink type is selected', () => {
    useUIStore.setState({ selectedDrinkType: 'Iced Matcha Latte' })
    render(<MapView {...mockProps} />)
    expect(screen.getByRole('button', { name: COPY.map.clearFilters })).toBeInTheDocument()
  })

  it('clears drink type and quick filters when clear is activated', async () => {
    const user = userEvent.setup()
    useUIStore.setState({ selectedDrinkType: 'Iced Matcha Latte' })
    render(<MapView {...mockProps} />)
    await user.click(screen.getByRole('button', { name: COPY.map.clearFilters }))
    expect(useUIStore.getState().selectedDrinkType).toBeNull()
    expect(screen.queryByRole('button', { name: COPY.map.clearFilters })).not.toBeInTheDocument()
  })

  it('clears local quick filters when clear is activated', async () => {
    const user = userEvent.setup()
    render(<MapView {...mockProps} />)
    const openNowBtn = screen.getByRole('button', { name: COPY.map.openNow })
    await user.click(openNowBtn)
    expect(openNowBtn).toHaveClass('from-matcha-600')
    await user.click(screen.getByRole('button', { name: COPY.map.clearFilters }))
    expect(openNowBtn).toHaveClass('bg-white')
  })
})