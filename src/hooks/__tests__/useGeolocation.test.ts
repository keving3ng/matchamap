import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGeolocation } from '../useGeolocation'

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}

// Mock navigator.permissions
const mockPermissions = {
  query: vi.fn().mockResolvedValue({
    state: 'prompt',
    addEventListener: vi.fn(),
  }),
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
  configurable: true,
})

Object.defineProperty(global.navigator, 'permissions', {
  value: mockPermissions,
  writable: true,
  configurable: true,
})

describe('useGeolocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
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
      setTimeout(() => success(mockPosition), 0)
    })

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      result.current.requestLocation()
    })

    expect(result.current.loading).toBe(true)

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    expect(result.current.coordinates).toEqual(mockPosition.coords)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle permission denied error', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied the request for Geolocation.',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    }

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      setTimeout(() => error(mockError), 0)
    })

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      result.current.requestLocation()
    })

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    expect(result.current.error).toEqual(mockError)
    expect(result.current.loading).toBe(false)
    expect(result.current.coordinates).toBeNull()
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
    // Temporarily remove geolocation support
    const originalGeolocation = global.navigator.geolocation
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useGeolocation())

    expect(result.current.isSupported).toBe(false)

    // Restore geolocation
    Object.defineProperty(global.navigator, 'geolocation', {
      value: originalGeolocation,
      writable: true,
      configurable: true,
    })
  })
})