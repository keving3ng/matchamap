import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCafeStore } from '../cafeStore'
import { useDataStore } from '../dataStore'
import { useLocationStore } from '../locationStore'
import type { Cafe, CafeWithDistance } from '../../../shared/types'

// Mock the distance utility
vi.mock('../utils/distance', () => ({
  calculateCafeDistances: vi.fn((userLocation, cafes) => {
    if (!userLocation) {
      return cafes.map(cafe => ({
        ...cafe,
        distanceInfo: null,
      }))
    }
    
    // Mock distance calculation for testing
    return cafes.map((cafe, index) => ({
      ...cafe,
      distanceInfo: {
        kilometers: index + 1, // Simple mock distances: 1km, 2km, 3km...
        miles: (index + 1) * 0.621371,
        formattedKm: `${index + 1} km`,
        formattedMiles: `${((index + 1) * 0.621371).toFixed(1)} miles`,
        walkTime: `${(index + 1) * 12} min`, // Mock walk times
      },
    }))
  }),
}))

describe('cafeStore', () => {
  const mockCafes: Cafe[] = [
    {
      id: 1,
      name: 'Cafe One',
      slug: 'cafe-one',
      latitude: 43.6532,
      longitude: -79.3832,
      link: 'https://maps.google.com/?cid=1',
      address: '123 Queen St',
      city: 'toronto',
      displayScore: 8.5,
      ambianceScore: 8.0,
      quickNote: 'Great matcha!',
      chargeForAltMilk: 75,
      review: 'Excellent matcha latte',
      source: 'Google',
      instagram: '@cafeone',
      instagramPostLink: 'https://instagram.com/p/1',
      tiktokPostLink: 'https://tiktok.com/@user/video/1',
      hours: '9am-5pm',
      images: 'https://example.com/image1.jpg',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Cafe Two',
      slug: 'cafe-two',
      latitude: 43.6643,
      longitude: -79.3943,
      link: 'https://maps.google.com/?cid=2',
      address: '456 King St',
      city: 'toronto',
      displayScore: 7.5,
      ambianceScore: 7.0,
      quickNote: 'Cozy atmosphere',
      chargeForAltMilk: 50,
      review: 'Nice place',
      source: 'Friend recommendation',
      instagram: '@cafetwo',
      instagramPostLink: 'https://instagram.com/p/2',
      tiktokPostLink: null,
      hours: '8am-6pm',
      images: 'https://example.com/image2.jpg',
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
    },
  ]

  const mockUserLocation = {
    latitude: 43.6532,
    longitude: -79.3832,
  }

  beforeEach(() => {
    // Reset all stores before each test
    useCafeStore.setState({
      cafesWithDistance: [],
      selectedCafe: null,
    })

    useDataStore.setState({
      allCafes: [],
      feedItems: [],
      eventItems: [],
      isLoading: false,
      error: null,
      cafesFetched: false,
      feedFetched: false,
      eventsFetched: false,
    })

    useLocationStore.setState({
      coordinates: null,
      address: null,
      city: null,
      isLoading: false,
      error: null,
      permissionState: 'prompt',
      hasRequestedPermission: false,
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useCafeStore())
      
      expect(result.current.cafesWithDistance).toEqual([])
      expect(result.current.selectedCafe).toBeNull()
    })

    it('should recalculate cafes on initialization', () => {
      // Set up data store with cafes
      act(() => {
        useDataStore.setState({ allCafes: mockCafes })
      })

      const { result } = renderHook(() => useCafeStore())

      // Should have cafes without distance info (no user location)
      expect(result.current.cafesWithDistance).toHaveLength(2)
      expect(result.current.cafesWithDistance[0].distanceInfo).toBeNull()
      expect(result.current.cafesWithDistance[1].distanceInfo).toBeNull()
    })
  })

  describe('selectedCafe', () => {
    it('should set and get selected cafe', () => {
      const { result } = renderHook(() => useCafeStore())
      const mockCafeWithDistance: CafeWithDistance = {
        ...mockCafes[0],
        distanceInfo: null,
      }

      act(() => {
        result.current.setSelectedCafe(mockCafeWithDistance)
      })

      expect(result.current.selectedCafe).toEqual(mockCafeWithDistance)
    })

    it('should clear selected cafe', () => {
      const { result } = renderHook(() => useCafeStore())
      const mockCafeWithDistance: CafeWithDistance = {
        ...mockCafes[0],
        distanceInfo: null,
      }

      // Set cafe first
      act(() => {
        result.current.setSelectedCafe(mockCafeWithDistance)
      })

      expect(result.current.selectedCafe).toEqual(mockCafeWithDistance)

      // Clear cafe
      act(() => {
        result.current.setSelectedCafe(null)
      })

      expect(result.current.selectedCafe).toBeNull()
    })
  })

  describe('cafe recalculation', () => {
    it('should recalculate cafes when data store changes', () => {
      const { result } = renderHook(() => useCafeStore())

      // Initially no cafes
      expect(result.current.cafesWithDistance).toEqual([])

      // Update data store with cafes
      act(() => {
        useDataStore.setState({ allCafes: mockCafes })
      })

      // Trigger recalculation manually for testing
      act(() => {
        result.current._recalculateCafes()
      })

      expect(result.current.cafesWithDistance).toHaveLength(2)
      expect(result.current.cafesWithDistance[0].name).toBe('Cafe One')
      expect(result.current.cafesWithDistance[1].name).toBe('Cafe Two')
    })

    it('should add distance info when user location is available', () => {
      const { result } = renderHook(() => useCafeStore())

      // Set up data store with cafes
      act(() => {
        useDataStore.setState({ allCafes: mockCafes })
      })

      // Set user location
      act(() => {
        useLocationStore.setState({ coordinates: mockUserLocation })
      })

      // Trigger recalculation
      act(() => {
        result.current._recalculateCafes()
      })

      expect(result.current.cafesWithDistance).toHaveLength(2)
      
      // Check that distance info was added
      const cafe1 = result.current.cafesWithDistance[0]
      const cafe2 = result.current.cafesWithDistance[1]
      
      expect(cafe1.distanceInfo).not.toBeNull()
      expect(cafe1.distanceInfo?.kilometers).toBe(1) // Mocked distance
      expect(cafe1.distanceInfo?.formattedKm).toBe('1 km')
      expect(cafe1.distanceInfo?.walkTime).toBe('12 min')

      expect(cafe2.distanceInfo).not.toBeNull()
      expect(cafe2.distanceInfo?.kilometers).toBe(2) // Mocked distance
      expect(cafe2.distanceInfo?.formattedKm).toBe('2 km')
      expect(cafe2.distanceInfo?.walkTime).toBe('24 min')
    })

    it('should remove distance info when user location is cleared', () => {
      const { result } = renderHook(() => useCafeStore())

      // Set up initial state with cafes and location
      act(() => {
        useDataStore.setState({ allCafes: mockCafes })
        useLocationStore.setState({ coordinates: mockUserLocation })
      })

      // Trigger recalculation
      act(() => {
        result.current._recalculateCafes()
      })

      // Verify distance info is present
      expect(result.current.cafesWithDistance[0].distanceInfo).not.toBeNull()

      // Clear user location
      act(() => {
        useLocationStore.setState({ coordinates: null })
      })

      // Trigger recalculation
      act(() => {
        result.current._recalculateCafes()
      })

      // Distance info should be null
      expect(result.current.cafesWithDistance[0].distanceInfo).toBeNull()
      expect(result.current.cafesWithDistance[1].distanceInfo).toBeNull()
    })

    it('should show all cafes regardless of city', () => {
      const { result } = renderHook(() => useCafeStore())

      const mixedCityCafes: Cafe[] = [
        { ...mockCafes[0], city: 'toronto' },
        { ...mockCafes[1], city: 'montreal' },
      ]

      // Set up data store with cafes from different cities
      act(() => {
        useDataStore.setState({ allCafes: mixedCityCafes })
      })

      // Trigger recalculation
      act(() => {
        result.current._recalculateCafes()
      })

      // Should show all cafes regardless of city
      expect(result.current.cafesWithDistance).toHaveLength(2)
      expect(result.current.cafesWithDistance[0].city).toBe('toronto')
      expect(result.current.cafesWithDistance[1].city).toBe('montreal')
    })

    it('should handle empty cafe list', () => {
      const { result } = renderHook(() => useCafeStore())

      // Set empty cafe list
      act(() => {
        useDataStore.setState({ allCafes: [] })
      })

      // Trigger recalculation
      act(() => {
        result.current._recalculateCafes()
      })

      expect(result.current.cafesWithDistance).toEqual([])
    })

    it('should handle cafes with missing lat/lng properties', () => {
      const { result } = renderHook(() => useCafeStore())

      const cafeWithMissingCoords: Cafe = {
        ...mockCafes[0],
        // Only has latitude/longitude, not lat/lng
      }

      act(() => {
        useDataStore.setState({ allCafes: [cafeWithMissingCoords] })
        useLocationStore.setState({ coordinates: mockUserLocation })
      })

      // Trigger recalculation
      act(() => {
        result.current._recalculateCafes()
      })

      // Should still work with latitude/longitude properties
      expect(result.current.cafesWithDistance).toHaveLength(1)
      expect(result.current.cafesWithDistance[0].distanceInfo).not.toBeNull()
    })
  })

  describe('store subscriptions', () => {
    it('should automatically recalculate when data store changes', () => {
      const { result } = renderHook(() => useCafeStore())

      // Spy on _recalculateCafes method
      const recalculateSpy = vi.spyOn(result.current, '_recalculateCafes')

      // Change data store
      act(() => {
        useDataStore.setState({ allCafes: mockCafes })
      })

      // Should have triggered recalculation automatically
      expect(recalculateSpy).toHaveBeenCalled()
    })

    it('should automatically recalculate when location store changes', () => {
      const { result } = renderHook(() => useCafeStore())

      // Set up initial data
      act(() => {
        useDataStore.setState({ allCafes: mockCafes })
      })

      // Spy on _recalculateCafes method
      const recalculateSpy = vi.spyOn(result.current, '_recalculateCafes')

      // Change location store
      act(() => {
        useLocationStore.setState({ coordinates: mockUserLocation })
      })

      // Should have triggered recalculation automatically
      expect(recalculateSpy).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle undefined or null coordinates gracefully', () => {
      const { result } = renderHook(() => useCafeStore())

      act(() => {
        useDataStore.setState({ allCafes: mockCafes })
        useLocationStore.setState({ coordinates: null })
      })

      // Trigger recalculation
      act(() => {
        result.current._recalculateCafes()
      })

      expect(result.current.cafesWithDistance).toHaveLength(2)
      expect(result.current.cafesWithDistance[0].distanceInfo).toBeNull()
      expect(result.current.cafesWithDistance[1].distanceInfo).toBeNull()
    })

    it('should handle cafes with incomplete location data', () => {
      const { result } = renderHook(() => useCafeStore())

      const incompleteLocationCafe = {
        ...mockCafes[0],
        latitude: 0,
        longitude: 0,
      }

      act(() => {
        useDataStore.setState({ allCafes: [incompleteLocationCafe] })
        useLocationStore.setState({ coordinates: mockUserLocation })
      })

      // Trigger recalculation
      act(() => {
        result.current._recalculateCafes()
      })

      expect(result.current.cafesWithDistance).toHaveLength(1)
      // Should still calculate distance even with 0,0 coordinates
      expect(result.current.cafesWithDistance[0].distanceInfo).not.toBeNull()
    })

    it('should preserve other cafe properties during recalculation', () => {
      const { result } = renderHook(() => useCafeStore())

      act(() => {
        useDataStore.setState({ allCafes: mockCafes })
        useLocationStore.setState({ coordinates: mockUserLocation })
      })

      // Trigger recalculation
      act(() => {
        result.current._recalculateCafes()
      })

      const cafe = result.current.cafesWithDistance[0]
      
      // All original properties should be preserved
      expect(cafe.id).toBe(mockCafes[0].id)
      expect(cafe.name).toBe(mockCafes[0].name)
      expect(cafe.slug).toBe(mockCafes[0].slug)
      expect(cafe.address).toBe(mockCafes[0].address)
      expect(cafe.city).toBe(mockCafes[0].city)
      expect(cafe.displayScore).toBe(mockCafes[0].displayScore)
      expect(cafe.quickNote).toBe(mockCafes[0].quickNote)
      
      // Plus the new distanceInfo property
      expect(cafe.distanceInfo).toBeDefined()
    })
  })

  describe('performance considerations', () => {
    it('should not mutate original cafe objects', () => {
      const { result } = renderHook(() => useCafeStore())

      const originalCafes = [...mockCafes]

      act(() => {
        useDataStore.setState({ allCafes: mockCafes })
        useLocationStore.setState({ coordinates: mockUserLocation })
      })

      // Trigger recalculation
      act(() => {
        result.current._recalculateCafes()
      })

      // Original cafes should be unchanged
      expect(mockCafes[0]).toEqual(originalCafes[0])
      expect(mockCafes[1]).toEqual(originalCafes[1])
      
      // But store should have new objects with distance info
      expect(result.current.cafesWithDistance[0]).not.toBe(mockCafes[0])
      expect(result.current.cafesWithDistance[0].distanceInfo).toBeDefined()
    })

    it('should handle large numbers of cafes efficiently', () => {
      const { result } = renderHook(() => useCafeStore())

      // Create 100 mock cafes
      const largeCafeList: Cafe[] = Array.from({ length: 100 }, (_, index) => ({
        ...mockCafes[0],
        id: index + 1,
        name: `Cafe ${index + 1}`,
        slug: `cafe-${index + 1}`,
        latitude: 43.6532 + (index * 0.001),
        longitude: -79.3832 + (index * 0.001),
      }))

      act(() => {
        useDataStore.setState({ allCafes: largeCafeList })
        useLocationStore.setState({ coordinates: mockUserLocation })
      })

      // Trigger recalculation
      act(() => {
        result.current._recalculateCafes()
      })

      expect(result.current.cafesWithDistance).toHaveLength(100)
      // All cafes should have distance info
      result.current.cafesWithDistance.forEach(cafe => {
        expect(cafe.distanceInfo).not.toBeNull()
      })
    })
  })
})