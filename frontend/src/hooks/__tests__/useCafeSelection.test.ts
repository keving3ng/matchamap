import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useCafeSelection } from '../useCafeSelection'
import type { CafeWithDistance } from '../../types'

// Mock the stores
vi.mock('../../stores/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    setShowPopover: vi.fn(),
    closePopover: vi.fn(),
  })),
}))

vi.mock('../../stores/cafeStore', () => ({
  useCafeStore: vi.fn(() => ({
    selectedCafe: null,
    setSelectedCafe: vi.fn(),
  })),
}))

// Mock the city mapping utility
vi.mock('../../utils/cityMapping', () => ({
  getCafeUrlPath: vi.fn((city: string, slug: string) => `/city/${city}/cafes/${slug}`),
}))

// Mock React Router
const mockNavigate = vi.fn()
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

// Wrapper for hooks that need Router context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('useCafeSelection', () => {
  const mockCafes: CafeWithDistance[] = [
    {
      id: 1,
      name: 'Matcha Bar',
      city: 'toronto',
      lat: 43.6532,
      lng: -79.3832,
      latitude: 43.6532,
      longitude: -79.3832,
      address: '123 Queen St',
      rating: 4.5,
      distanceInfo: { distance: 0.5, walkingTime: 6 },
    },
    {
      id: 2,
      name: 'Green Tea House',
      city: 'toronto',
      lat: 43.6550,
      lng: -79.3850,
      latitude: 43.6550,
      longitude: -79.3850,
      address: '456 King St',
      rating: 4.2,
      distanceInfo: { distance: 0.8, walkingTime: 10 },
    }
  ]

  let mockUIStore: any
  let mockCafeStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock stores
    mockUIStore = {
      setShowPopover: vi.fn(),
      closePopover: vi.fn(),
    }
    
    mockCafeStore = {
      selectedCafe: null,
      setSelectedCafe: vi.fn(),
    }

    // Update the mocked modules
    const { useUIStore } = await import('../../stores/uiStore')
    const { useCafeStore } = await import('../../stores/cafeStore')
    vi.mocked(useUIStore).mockReturnValue(mockUIStore)
    vi.mocked(useCafeStore).mockReturnValue(mockCafeStore)
  })

  it('should initialize with no selected cafe when none provided', () => {
    const { result } = renderHook(
      () => useCafeSelection(mockCafes),
      { wrapper }
    )

    expect(result.current.selectedCafe).toBeNull()
  })

  it('should return selected cafe with latest distance info', () => {
    // Set up selected cafe in store
    mockCafeStore.selectedCafe = {
      id: 1,
      name: 'Matcha Bar',
      city: 'toronto',
      lat: 43.6532,
      lng: -79.3832,
      latitude: 43.6532,
      longitude: -79.3832,
      address: '123 Queen St',
      rating: 4.5,
      distanceInfo: null, // Old data without distance
    }

    const { result } = renderHook(
      () => useCafeSelection(mockCafes),
      { wrapper }
    )

    // Should return cafe with updated distance info from cafesWithDistance
    expect(result.current.selectedCafe).toEqual(mockCafes[0])
    expect(result.current.selectedCafe?.distanceInfo).toEqual({
      distance: 0.5,
      walkingTime: 6,
    })
  })

  it('should return selected cafe as-is when not found in cafesWithDistance', () => {
    const selectedCafe = {
      id: 999,
      name: 'Missing Cafe',
      city: 'toronto',
      lat: 43.6532,
      lng: -79.3832,
      latitude: 43.6532,
      longitude: -79.3832,
      address: '999 Missing St',
      rating: 4.0,
      distanceInfo: null,
    }

    mockCafeStore.selectedCafe = selectedCafe

    const { result } = renderHook(
      () => useCafeSelection(mockCafes),
      { wrapper }
    )

    expect(result.current.selectedCafe).toEqual(selectedCafe)
  })

  it('should handle pin click by setting cafe and showing popover', () => {
    const { result } = renderHook(
      () => useCafeSelection(mockCafes),
      { wrapper }
    )

    act(() => {
      result.current.handlePinClick(mockCafes[0])
    })

    expect(mockCafeStore.setSelectedCafe).toHaveBeenCalledWith(mockCafes[0])
    expect(mockUIStore.setShowPopover).toHaveBeenCalledWith(true)
  })

  it('should view details by setting cafe, generating URL, and navigating', () => {
    const { result } = renderHook(
      () => useCafeSelection(mockCafes),
      { wrapper }
    )

    act(() => {
      result.current.viewDetails(mockCafes[0])
    })

    expect(mockCafeStore.setSelectedCafe).toHaveBeenCalledWith(mockCafes[0])
    expect(mockNavigate).toHaveBeenCalledWith('/city/toronto/cafes/matcha-bar')
    expect(mockUIStore.closePopover).toHaveBeenCalled()
  })

  it('should generate correct slug from cafe name with spaces', () => {
    const cafeWithSpaces = {
      ...mockCafes[0],
      name: 'The Matcha Bar & Tea House',
    }

    const { result } = renderHook(
      () => useCafeSelection(mockCafes),
      { wrapper }
    )

    act(() => {
      result.current.viewDetails(cafeWithSpaces)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/city/toronto/cafes/the-matcha-bar-&-tea-house')
  })

  it('should update selected cafe when cafesWithDistance changes', () => {
    // Start with one cafe selected
    mockCafeStore.selectedCafe = mockCafes[0]

    const { result, rerender } = renderHook(
      ({ cafes }) => useCafeSelection(cafes),
      {
        wrapper,
        initialProps: { cafes: mockCafes }
      }
    )

    expect(result.current.selectedCafe).toEqual(mockCafes[0])

    // Update the cafes with new distance info
    const updatedCafes = mockCafes.map(cafe => ({
      ...cafe,
      distanceInfo: cafe.id === 1 
        ? { distance: 1.2, walkingTime: 15 }
        : cafe.distanceInfo
    }))

    rerender({ cafes: updatedCafes })

    expect(result.current.selectedCafe?.distanceInfo).toEqual({
      distance: 1.2,
      walkingTime: 15,
    })
  })

  it('should handle empty cafesWithDistance array', () => {
    const { result } = renderHook(
      () => useCafeSelection([]),
      { wrapper }
    )

    expect(result.current.selectedCafe).toBeNull()

    // Should not throw when calling handlers
    act(() => {
      result.current.handlePinClick(mockCafes[0])
    })

    expect(mockCafeStore.setSelectedCafe).toHaveBeenCalledWith(mockCafes[0])
  })

  it('should handle cafes without distanceInfo', () => {
    const cafesWithoutDistance = mockCafes.map(cafe => ({
      ...cafe,
      distanceInfo: null,
    }))

    mockCafeStore.selectedCafe = cafesWithoutDistance[0]

    const { result } = renderHook(
      () => useCafeSelection(cafesWithoutDistance),
      { wrapper }
    )

    expect(result.current.selectedCafe?.distanceInfo).toBeNull()
  })
})