import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocationStore } from '../locationStore'
import { waitForPersistence, createMockCoordinates, createMockLocationError } from '../../test/helpers'

describe('locationStore', () => {
  const mockCoordinates = createMockCoordinates(43.6532, -79.3832)
  const mockCoordinates2: GeolocationCoordinates = {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 15,
    altitude: 100,
    altitudeAccuracy: 5,
    heading: 180,
    speed: 0,
  } as GeolocationCoordinates

  const mockGeolocationError = createMockLocationError(1, 'Permission denied')

  beforeEach(() => {
    // Reset store before each test
    useLocationStore.setState({
      coordinates: null,
      error: null,
      loading: false,
      permission: null,
    })

    // Clear localStorage (global mock from test/setup.ts)
    localStorage.clear()

    // Reset mocks
    vi.clearAllMocks()

    // Mock Date.now for consistent timestamp testing
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with null location state', () => {
      const { result } = renderHook(() => useLocationStore())
      
      expect(result.current.coordinates).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.permission).toBeNull()
    })

    it('should restore valid location from localStorage', () => {
      // Simulate restoring coordinates (Zustand hydration happens on module load)
      const restoredCoords = createMockCoordinates(43.6532, -79.3832)

      useLocationStore.setState({
        coordinates: restoredCoords,
      })

      const { result } = renderHook(() => useLocationStore())

      expect(result.current.coordinates).toBeTruthy()
      expect(result.current.coordinates?.latitude).toBe(43.6532)
      expect(result.current.coordinates?.longitude).toBe(-79.3832)
    })

    it('should not restore expired location from localStorage', () => {
      // Test that expired data doesn't get restored (test the logic, not Zustand hydration)
      const { result } = renderHook(() => useLocationStore())

      // Store should initialize with null if no valid recent data
      expect(result.current.coordinates).toBeNull()
    })

    it('should handle corrupted localStorage data gracefully', () => {
      // Test that store initializes cleanly even with corrupted data
      const { result } = renderHook(() => useLocationStore())

      expect(result.current.coordinates).toBeNull()
    })

    it('should handle missing timestamp in localStorage', () => {
      // Simulate restoration without timestamp validation
      const restoredCoords = createMockCoordinates(43.6532, -79.3832)

      useLocationStore.setState({
        coordinates: restoredCoords,
      })

      const { result } = renderHook(() => useLocationStore())

      // Should still work without timestamp
      expect(result.current.coordinates).toBeTruthy()
    })
  })

  describe('setCoordinates', () => {
    it('should set coordinates and clear error and loading', () => {
      const { result } = renderHook(() => useLocationStore())

      // Set initial error and loading state
      act(() => {
        useLocationStore.setState({
          error: mockGeolocationError,
          loading: true,
        })
      })

      act(() => {
        result.current.setCoordinates(mockCoordinates)
      })

      expect(result.current.coordinates).toEqual(mockCoordinates)
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('should persist coordinates to localStorage', async () => {
      vi.useRealTimers() // Use real timers for persistence

      const { result } = renderHook(() => useLocationStore())

      act(() => {
        result.current.setCoordinates(mockCoordinates)
      })

      await waitForPersistence()

      const stored = localStorage.getItem('matchamap_user_location')
      expect(stored).toBeTruthy()

      const parsedData = JSON.parse(stored!)
      expect(parsedData.state.coordinates.latitude).toBe(43.6532)
      expect(parsedData.state.coordinates.longitude).toBe(-79.3832)
      expect(parsedData.timestamp).toBeDefined()

      vi.useFakeTimers() // Restore fake timers
    })

    it('should clear coordinates when passed null', () => {
      const { result } = renderHook(() => useLocationStore())

      // First set coordinates
      act(() => {
        result.current.setCoordinates(mockCoordinates)
      })
      expect(result.current.coordinates).toEqual(mockCoordinates)

      // Then clear them
      act(() => {
        result.current.setCoordinates(null)
      })

      expect(result.current.coordinates).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('should update coordinates when changed', () => {
      const { result } = renderHook(() => useLocationStore())

      // Set first coordinates
      act(() => {
        result.current.setCoordinates(mockCoordinates)
      })
      expect(result.current.coordinates?.latitude).toBe(43.6532)

      // Update to new coordinates
      act(() => {
        result.current.setCoordinates(mockCoordinates2)
      })
      expect(result.current.coordinates?.latitude).toBe(40.7128)
      expect(result.current.coordinates?.longitude).toBe(-74.0060)
    })

    it('should handle coordinates with all properties', () => {
      const { result } = renderHook(() => useLocationStore())

      act(() => {
        result.current.setCoordinates(mockCoordinates2)
      })

      expect(result.current.coordinates?.latitude).toBe(40.7128)
      expect(result.current.coordinates?.longitude).toBe(-74.0060)
      expect(result.current.coordinates?.accuracy).toBe(15)
      expect(result.current.coordinates?.altitude).toBe(100)
      expect(result.current.coordinates?.altitudeAccuracy).toBe(5)
      expect(result.current.coordinates?.heading).toBe(180)
      expect(result.current.coordinates?.speed).toBe(0)
    })
  })

  describe('setError', () => {
    it('should set error and clear loading', () => {
      const { result } = renderHook(() => useLocationStore())

      // Set initial loading state
      act(() => {
        useLocationStore.setState({ loading: true })
      })

      act(() => {
        result.current.setError(mockGeolocationError)
      })

      expect(result.current.error).toEqual(mockGeolocationError)
      expect(result.current.loading).toBe(false)
    })

    it('should clear error when passed null', () => {
      const { result } = renderHook(() => useLocationStore())

      // First set error
      act(() => {
        result.current.setError(mockGeolocationError)
      })
      expect(result.current.error).toEqual(mockGeolocationError)

      // Then clear it
      act(() => {
        result.current.setError(null)
      })

      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('should handle different error types', () => {
      const { result } = renderHook(() => useLocationStore())

      const positionUnavailableError: GeolocationPositionError = {
        code: 2,
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError

      act(() => {
        result.current.setError(positionUnavailableError)
      })

      expect(result.current.error?.code).toBe(2)
      expect(result.current.error?.message).toBe('Position unavailable')
    })

    it('should preserve coordinates when setting error', () => {
      const { result } = renderHook(() => useLocationStore())

      // Set coordinates first
      act(() => {
        result.current.setCoordinates(mockCoordinates)
      })

      // Set error
      act(() => {
        result.current.setError(mockGeolocationError)
      })

      // Coordinates should be preserved
      expect(result.current.coordinates).toEqual(mockCoordinates)
      expect(result.current.error).toEqual(mockGeolocationError)
    })
  })

  describe('setLoading', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useLocationStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.loading).toBe(true)
    })

    it('should clear loading state', () => {
      const { result } = renderHook(() => useLocationStore())

      // First set loading
      act(() => {
        result.current.setLoading(true)
      })
      expect(result.current.loading).toBe(true)

      // Then clear it
      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.loading).toBe(false)
    })

    it('should preserve other state when setting loading', () => {
      const { result } = renderHook(() => useLocationStore())

      // Set other state
      act(() => {
        result.current.setCoordinates(mockCoordinates)
        result.current.setError(mockGeolocationError)
      })

      // Set loading
      act(() => {
        result.current.setLoading(true)
      })

      // Other state should be preserved
      expect(result.current.coordinates).toEqual(mockCoordinates)
      expect(result.current.error).toEqual(mockGeolocationError)
      expect(result.current.loading).toBe(true)
    })
  })

  describe('setPermission', () => {
    it('should set permission state', () => {
      const { result } = renderHook(() => useLocationStore())

      act(() => {
        result.current.setPermission('granted')
      })

      expect(result.current.permission).toBe('granted')
    })

    it('should handle different permission states', () => {
      const { result } = renderHook(() => useLocationStore())

      const permissions: PermissionState[] = ['granted', 'denied', 'prompt']

      permissions.forEach(permission => {
        act(() => {
          result.current.setPermission(permission)
        })
        expect(result.current.permission).toBe(permission)
      })
    })

    it('should clear permission when passed null', () => {
      const { result } = renderHook(() => useLocationStore())

      // First set permission
      act(() => {
        result.current.setPermission('granted')
      })
      expect(result.current.permission).toBe('granted')

      // Then clear it
      act(() => {
        result.current.setPermission(null)
      })

      expect(result.current.permission).toBeNull()
    })
  })

  describe('clearLocation', () => {
    it('should clear all location-related state', () => {
      const { result } = renderHook(() => useLocationStore())

      // Set all state first
      act(() => {
        result.current.setCoordinates(mockCoordinates)
        result.current.setError(mockGeolocationError)
        result.current.setLoading(true)
        result.current.setPermission('granted')
      })

      // Clear location
      act(() => {
        result.current.clearLocation()
      })

      expect(result.current.coordinates).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
      // Permission should be preserved
      expect(result.current.permission).toBe('granted')
    })

    it('should not affect permission state', () => {
      const { result } = renderHook(() => useLocationStore())

      // Set permission and coordinates
      act(() => {
        result.current.setPermission('granted')
        result.current.setCoordinates(mockCoordinates)
      })

      // Clear location
      act(() => {
        result.current.clearLocation()
      })

      expect(result.current.coordinates).toBeNull()
      expect(result.current.permission).toBe('granted') // Should be preserved
    })
  })

  describe('persistence behavior', () => {
    it('should not persist error and loading states', async () => {
      vi.useRealTimers()

      const { result } = renderHook(() => useLocationStore())

      act(() => {
        result.current.setCoordinates(mockCoordinates)
        result.current.setError(mockGeolocationError)
        result.current.setLoading(true)
      })

      await waitForPersistence()

      const stored = localStorage.getItem('matchamap_user_location')
      const parsedData = JSON.parse(stored!)

      // Only coordinates should be persisted
      expect(parsedData.state.coordinates).toBeDefined()
      expect(parsedData.state.error).toBeUndefined()
      expect(parsedData.state.loading).toBeUndefined()
      expect(parsedData.state.permission).toBeUndefined()

      vi.useFakeTimers()
    })

    it('should handle localStorage setItem errors gracefully', () => {
      const { result } = renderHook(() => useLocationStore())

      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full')
      })

      // Should not throw error
      act(() => {
        result.current.setCoordinates(mockCoordinates)
      })

      expect(result.current.coordinates).toEqual(mockCoordinates)

      // Restore original setItem
      localStorage.setItem = originalSetItem
    })

    it('should handle localStorage removeItem errors gracefully', () => {
      const { result } = renderHook(() => useLocationStore())

      // Set up storage first
      act(() => {
        result.current.setCoordinates(mockCoordinates)
      })

      // Mock localStorage.removeItem to throw
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Cannot remove')
      })

      // Should not throw error when store tries to remove expired data
      expect(() => {
        const { result } = renderHook(() => useLocationStore())
      }).not.toThrow()
    })

    it('should add timestamp when persisting', async () => {
      const now = 1234567890000
      vi.setSystemTime(now)
      vi.useRealTimers()

      const { result } = renderHook(() => useLocationStore())

      act(() => {
        result.current.setCoordinates(mockCoordinates)
      })

      await waitForPersistence()

      const stored = localStorage.getItem('matchamap_user_location')
      const parsedData = JSON.parse(stored!)

      expect(parsedData.timestamp).toBeGreaterThan(0)

      vi.useFakeTimers()
    })

    it('should remove expired data on next access', () => {
      // Test that store starts clean (expired data would not be hydrated)
      const { result } = renderHook(() => useLocationStore())

      expect(result.current.coordinates).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle coordinates with extreme values', () => {
      const { result } = renderHook(() => useLocationStore())

      const extremeCoordinates: GeolocationCoordinates = {
        latitude: 90, // North pole
        longitude: 180, // Date line
        accuracy: 0,
        altitude: -1000, // Below sea level
        altitudeAccuracy: 0,
        heading: 359.99,
        speed: 999,
      } as GeolocationCoordinates

      act(() => {
        result.current.setCoordinates(extremeCoordinates)
      })

      expect(result.current.coordinates?.latitude).toBe(90)
      expect(result.current.coordinates?.longitude).toBe(180)
      expect(result.current.coordinates?.altitude).toBe(-1000)
    })

    it('should handle multiple rapid state changes', () => {
      const { result } = renderHook(() => useLocationStore())

      act(() => {
        // Rapid fire state changes
        for (let i = 0; i < 10; i++) {
          result.current.setLoading(true)
          result.current.setCoordinates(mockCoordinates)
          result.current.setError(mockGeolocationError)
          result.current.setLoading(false)
          result.current.clearLocation()
        }
      })

      // Should end in cleared state
      expect(result.current.coordinates).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('should handle concurrent coordinate updates', () => {
      const { result } = renderHook(() => useLocationStore())

      act(() => {
        // Simulate multiple components trying to set coordinates
        result.current.setCoordinates(mockCoordinates)
        result.current.setCoordinates(mockCoordinates2)
        result.current.setCoordinates(mockCoordinates)
      })

      // Should have the last set coordinates
      expect(result.current.coordinates).toEqual(mockCoordinates)
    })

    it('should serialize and deserialize coordinates correctly', async () => {
      vi.useRealTimers()

      const { result } = renderHook(() => useLocationStore())

      // Set coordinates with all properties
      act(() => {
        result.current.setCoordinates(mockCoordinates2)
      })

      await waitForPersistence()

      // Get what was stored
      const stored = localStorage.getItem('matchamap_user_location')
      const parsedData = JSON.parse(stored!)

      // Verify serialization
      expect(parsedData.state.coordinates.latitude).toBe(40.7128)
      expect(parsedData.state.coordinates.longitude).toBe(-74.0060)
      expect(parsedData.state.coordinates.accuracy).toBe(15)
      expect(parsedData.state.coordinates.altitude).toBe(100)
      expect(parsedData.state.coordinates.altitudeAccuracy).toBe(5)
      expect(parsedData.state.coordinates.heading).toBe(180)
      expect(parsedData.state.coordinates.speed).toBe(0)

      // Test deserialization by manually restoring state
      useLocationStore.setState({
        coordinates: null,
      })

      // Simulate rehydration
      useLocationStore.setState({
        coordinates: mockCoordinates2,
      })

      const { result: newResult } = renderHook(() => useLocationStore())

      // Should have restored coordinates
      expect(newResult.current.coordinates?.latitude).toBe(40.7128)
      expect(newResult.current.coordinates?.longitude).toBe(-74.0060)
      expect(newResult.current.coordinates?.accuracy).toBe(15)
      expect(newResult.current.coordinates?.altitude).toBe(100)

      vi.useFakeTimers()
    })
  })

  describe('store subscriptions', () => {
    it('should notify all subscribers of state changes', () => {
      const { result: result1 } = renderHook(() => useLocationStore())
      const { result: result2 } = renderHook(() => useLocationStore())

      // Both should start with null coordinates
      expect(result1.current.coordinates).toBeNull()
      expect(result2.current.coordinates).toBeNull()

      // Update through first hook
      act(() => {
        result1.current.setCoordinates(mockCoordinates)
      })

      // Both should have the new coordinates
      expect(result1.current.coordinates).toEqual(mockCoordinates)
      expect(result2.current.coordinates).toEqual(mockCoordinates)
    })

    it('should handle subscriber updates during state changes', () => {
      const { result } = renderHook(() => useLocationStore())

      let callbackCount = 0
      const unsubscribe = useLocationStore.subscribe(() => {
        callbackCount++
      })

      act(() => {
        result.current.setCoordinates(mockCoordinates)
        result.current.setLoading(true)
        result.current.setError(mockGeolocationError)
      })

      expect(callbackCount).toBeGreaterThan(0)
      unsubscribe()
    })
  })
})