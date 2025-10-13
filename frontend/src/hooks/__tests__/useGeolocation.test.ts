import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGeolocation } from '../useGeolocation'
import { useLocationStore } from '../../stores/locationStore'

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}

// Mock navigator.permissions
const mockPermissions = {
  query: vi.fn(),
}

describe('useGeolocation', () => {
  beforeEach(() => {
    // Reset location store
    useLocationStore.setState({
      coordinates: null,
      error: null,
      loading: false,
      permission: 'prompt',
    })

    // Clear all mocks
    vi.clearAllMocks()

    // Setup navigator.geolocation mock
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    })

    // Setup navigator.permissions mock with proper Promise return
    mockPermissions.query.mockResolvedValue({
      state: 'prompt',
      addEventListener: vi.fn(),
    })

    Object.defineProperty(globalThis.navigator, 'permissions', {
      value: mockPermissions,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGeolocation())

    expect(result.current.coordinates).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.isSupported).toBe(true)
  })

  it('should request location successfully', async () => {
    const mockPosition = {
      coords: {
        latitude: 43.6532,
        longitude: -79.3832,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    }

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition)
    })

    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.requestLocation()
    })

    await waitFor(() => {
      expect(result.current.coordinates).toEqual(mockPosition.coords)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  it('should handle permission denied error', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied the request for Geolocation.',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    }

    mockGeolocation.getCurrentPosition.mockImplementation((_success, error) => {
      error(mockError)
    })

    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.requestLocation()
    })

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError)
      expect(result.current.loading).toBe(false)
      expect(result.current.coordinates).toBeNull()
    })
  })

  it('should clear location data', () => {
    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.clearLocation()
    })

    expect(result.current.coordinates).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('should detect unsupported browsers', () => {
    // Remove geolocation support before rendering hook
    delete (globalThis.navigator as any).geolocation

    const { result } = renderHook(() => useGeolocation())

    expect(result.current.isSupported).toBe(false)

    // Restore geolocation for other tests
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    })
  })
})