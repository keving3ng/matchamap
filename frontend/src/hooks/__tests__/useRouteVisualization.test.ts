import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRouteVisualization } from '../useRouteVisualization'

// Mock the routing utility
const mockRouteResponse = {
  coordinates: [
    { lat: 43.6532, lng: -79.3832 },
    { lat: 43.6550, lng: -79.3850 },
  ],
  distance: 2.1,
  duration: 25,
}

vi.mock('../../utils/routing', () => ({
  fetchWalkingRoute: vi.fn(),
}))

describe('useRouteVisualization', () => {
  let mockFetchWalkingRoute: any

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockFetchWalkingRoute = vi.fn()
    const { fetchWalkingRoute } = await import('../../utils/routing')
    vi.mocked(fetchWalkingRoute).mockImplementation(mockFetchWalkingRoute)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRouteVisualization())

    expect(result.current.route).toBeNull()
    expect(result.current.isLoadingRoute).toBe(false)
    expect(result.current.routeError).toBeNull()
    expect(result.current.showRoute).toBe(false)
    expect(result.current.routeCafeId).toBeNull()
    expect(typeof result.current.toggleRoute).toBe('function')
    expect(typeof result.current.loadRoute).toBe('function')
    expect(typeof result.current.clearRoute).toBe('function')
  })

  it('should load route successfully', async () => {
    mockFetchWalkingRoute.mockResolvedValue(mockRouteResponse)

    const { result } = renderHook(() => useRouteVisualization())

    const start = { lat: 43.6532, lng: -79.3832 }
    const end = { lat: 43.6550, lng: -79.3850 }
    const cafeId = 1

    await act(async () => {
      await result.current.loadRoute(start, end, cafeId)
    })

    expect(result.current.isLoadingRoute).toBe(false)
    expect(result.current.route).toEqual(mockRouteResponse)
    expect(result.current.showRoute).toBe(true)
    expect(result.current.routeCafeId).toBe(cafeId)
    expect(result.current.routeError).toBeNull()
    expect(mockFetchWalkingRoute).toHaveBeenCalledWith(start, end)
  })

  it('should set loading state during route fetch', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    mockFetchWalkingRoute.mockReturnValue(promise)

    const { result } = renderHook(() => useRouteVisualization())

    const start = { lat: 43.6532, lng: -79.3832 }
    const end = { lat: 43.6550, lng: -79.3850 }

    act(() => {
      result.current.loadRoute(start, end, 1)
    })

    expect(result.current.isLoadingRoute).toBe(true)

    await act(async () => {
      resolvePromise!(mockRouteResponse)
      await promise
    })

    expect(result.current.isLoadingRoute).toBe(false)
  })

  it('should handle route fetch error', async () => {
    const errorMessage = 'Failed to fetch route'
    mockFetchWalkingRoute.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useRouteVisualization())

    const start = { lat: 43.6532, lng: -79.3832 }
    const end = { lat: 43.6550, lng: -79.3850 }

    await act(async () => {
      await result.current.loadRoute(start, end, 1)
    })

    expect(result.current.isLoadingRoute).toBe(false)
    expect(result.current.route).toBeNull()
    expect(result.current.showRoute).toBe(false)
    expect(result.current.routeCafeId).toBeNull()
    expect(result.current.routeError).toBe(errorMessage)
  })

  it('should handle non-Error objects in catch block', async () => {
    mockFetchWalkingRoute.mockRejectedValue('String error')

    const { result } = renderHook(() => useRouteVisualization())

    const start = { lat: 43.6532, lng: -79.3832 }
    const end = { lat: 43.6550, lng: -79.3850 }

    await act(async () => {
      await result.current.loadRoute(start, end, 1)
    })

    expect(result.current.routeError).toBe('Failed to load route')
  })

  it('should cache routes by cafe ID', async () => {
    mockFetchWalkingRoute.mockResolvedValue(mockRouteResponse)

    const { result } = renderHook(() => useRouteVisualization())

    const start = { lat: 43.6532, lng: -79.3832 }
    const end = { lat: 43.6550, lng: -79.3850 }
    const cafeId = 1

    // First load
    await act(async () => {
      await result.current.loadRoute(start, end, cafeId)
    })

    expect(mockFetchWalkingRoute).toHaveBeenCalledTimes(1)

    // Second load with same cafe and similar location (should use cache)
    const similarStart = { lat: 43.6535, lng: -79.3835 } // Very close to original
    await act(async () => {
      await result.current.loadRoute(similarStart, end, cafeId)
    })

    // Should not call fetch again due to cache hit
    expect(mockFetchWalkingRoute).toHaveBeenCalledTimes(1)
    expect(result.current.route).toEqual(mockRouteResponse)
  })

  it('should invalidate cache when user moves beyond threshold', async () => {
    mockFetchWalkingRoute.mockResolvedValue(mockRouteResponse)

    const { result } = renderHook(() => useRouteVisualization())

    const start = { lat: 43.6532, lng: -79.3832 }
    const end = { lat: 43.6550, lng: -79.3850 }
    const cafeId = 1

    // First load
    await act(async () => {
      await result.current.loadRoute(start, end, cafeId)
    })

    expect(mockFetchWalkingRoute).toHaveBeenCalledTimes(1)

    // Second load with different start location (beyond threshold)
    const farStart = { lat: 43.7000, lng: -79.4000 } // Far from original
    await act(async () => {
      await result.current.loadRoute(farStart, end, cafeId)
    })

    // Should call fetch again due to cache invalidation
    expect(mockFetchWalkingRoute).toHaveBeenCalledTimes(2)
  })

  it('should not cache routes for different cafes', async () => {
    mockFetchWalkingRoute.mockResolvedValue(mockRouteResponse)

    const { result } = renderHook(() => useRouteVisualization())

    const start = { lat: 43.6532, lng: -79.3832 }
    const end1 = { lat: 43.6550, lng: -79.3850 }
    const end2 = { lat: 43.6570, lng: -79.3870 }

    // Load route for cafe 1
    await act(async () => {
      await result.current.loadRoute(start, end1, 1)
    })

    expect(mockFetchWalkingRoute).toHaveBeenCalledTimes(1)

    // Load route for cafe 2 (should not use cache)
    await act(async () => {
      await result.current.loadRoute(start, end2, 2)
    })

    expect(mockFetchWalkingRoute).toHaveBeenCalledTimes(2)
  })

  it('should toggle route visibility', () => {
    const { result } = renderHook(() => useRouteVisualization())

    expect(result.current.showRoute).toBe(false)

    act(() => {
      result.current.toggleRoute()
    })

    expect(result.current.showRoute).toBe(true)

    act(() => {
      result.current.toggleRoute()
    })

    expect(result.current.showRoute).toBe(false)
  })

  it('should clear route state', async () => {
    mockFetchWalkingRoute.mockResolvedValue(mockRouteResponse)

    const { result } = renderHook(() => useRouteVisualization())

    // Load a route first
    await act(async () => {
      await result.current.loadRoute(
        { lat: 43.6532, lng: -79.3832 },
        { lat: 43.6550, lng: -79.3850 },
        1
      )
    })

    expect(result.current.route).not.toBeNull()
    expect(result.current.showRoute).toBe(true)
    expect(result.current.routeCafeId).toBe(1)

    // Clear route
    act(() => {
      result.current.clearRoute()
    })

    expect(result.current.route).toBeNull()
    expect(result.current.showRoute).toBe(false)
    expect(result.current.routeError).toBeNull()
    expect(result.current.routeCafeId).toBeNull()
  })

  it('should clear error when clearRoute is called', async () => {
    mockFetchWalkingRoute.mockRejectedValue(new Error('Test error'))

    const { result } = renderHook(() => useRouteVisualization())

    // Create an error
    await act(async () => {
      await result.current.loadRoute(
        { lat: 43.6532, lng: -79.3832 },
        { lat: 43.6550, lng: -79.3850 },
        1
      )
    })

    expect(result.current.routeError).not.toBeNull()

    // Clear route should also clear error
    act(() => {
      result.current.clearRoute()
    })

    expect(result.current.routeError).toBeNull()
  })

  it('should clear error when loading new route', async () => {
    mockFetchWalkingRoute
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce(mockRouteResponse)

    const { result } = renderHook(() => useRouteVisualization())

    // Create an error
    await act(async () => {
      await result.current.loadRoute(
        { lat: 43.6532, lng: -79.3832 },
        { lat: 43.6550, lng: -79.3850 },
        1
      )
    })

    expect(result.current.routeError).not.toBeNull()

    // Load new route should clear error
    await act(async () => {
      await result.current.loadRoute(
        { lat: 43.6600, lng: -79.4000 },
        { lat: 43.6620, lng: -79.4020 },
        2
      )
    })

    expect(result.current.routeError).toBeNull()
    expect(result.current.route).toEqual(mockRouteResponse)
  })

  it('should handle multiple rapid load calls', async () => {
    let resolveCount = 0
    mockFetchWalkingRoute.mockImplementation(() => {
      resolveCount++
      return Promise.resolve({ ...mockRouteResponse, id: resolveCount })
    })

    const { result } = renderHook(() => useRouteVisualization())

    const start = { lat: 43.6532, lng: -79.3832 }
    const end = { lat: 43.6550, lng: -79.3850 }

    // Make multiple rapid calls
    await act(async () => {
      const promises = [
        result.current.loadRoute(start, end, 1),
        result.current.loadRoute(start, end, 2),
        result.current.loadRoute(start, end, 3),
      ]
      await Promise.all(promises)
    })

    // Should have called fetch for each unique cafe
    expect(mockFetchWalkingRoute).toHaveBeenCalledTimes(3)
    expect(result.current.routeCafeId).toBe(3) // Last call wins
  })

  it('should calculate distance correctly', async () => {
    mockFetchWalkingRoute.mockResolvedValue(mockRouteResponse)

    const { result } = renderHook(() => useRouteVisualization())

    const start1 = { lat: 43.6532, lng: -79.3832 }
    const start2 = { lat: 43.6533, lng: -79.3833 } // Very close (< 50m)
    const end = { lat: 43.6550, lng: -79.3850 }

    // Load route with first start
    await act(async () => {
      await result.current.loadRoute(start1, end, 1)
    })

    expect(mockFetchWalkingRoute).toHaveBeenCalledTimes(1)

    // Load route with very close start (should use cache)
    await act(async () => {
      await result.current.loadRoute(start2, end, 1)
    })

    expect(mockFetchWalkingRoute).toHaveBeenCalledTimes(1) // Should not fetch again
  })

  it('should handle coordinates with different precision', async () => {
    mockFetchWalkingRoute.mockResolvedValue(mockRouteResponse)

    const { result } = renderHook(() => useRouteVisualization())

    await act(async () => {
      await result.current.loadRoute(
        { lat: 43.653200000, lng: -79.383200000 }, // High precision
        { lat: 43.655, lng: -79.385 }, // Lower precision
        1
      )
    })

    expect(mockFetchWalkingRoute).toHaveBeenCalledWith(
      { lat: 43.653200000, lng: -79.383200000 },
      { lat: 43.655, lng: -79.385 }
    )
    expect(result.current.route).toEqual(mockRouteResponse)
  })
})