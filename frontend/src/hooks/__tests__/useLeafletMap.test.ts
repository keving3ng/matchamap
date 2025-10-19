import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLeafletMap } from '../useLeafletMap'
import type { CafeWithDistance } from '../../types'

// Store event handlers for testing
const markerEventHandlers = new Map<string, ((e: any) => void)[]>()
const mapEventHandlers = new Map<string, ((e: any) => void)[]>()

// Configuration object for mock map (can be mutated in tests)
const mockMapConfig = {
  zoom: 13,
  center: { lat: 43.6532, lng: -79.3832 },
}

// Mock Leaflet - define inline to avoid hoisting issues
vi.mock('leaflet', () => {
  // Store mock functions for later access
  const mockFunctions = {
    setView: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    getZoom: vi.fn(() => mockMapConfig.zoom),
    getCenter: vi.fn(() => mockMapConfig.center),
    removeLayer: vi.fn(),
    invalidateSize: vi.fn(),
    fitBounds: vi.fn(),
    on: vi.fn((event: string, handler: (e: any) => void) => {
      if (!mapEventHandlers.has(event)) {
        mapEventHandlers.set(event, [])
      }
      mapEventHandlers.get(event)!.push(handler)
      return mockMap
    }),
    off: vi.fn().mockReturnThis(),
  }

  const mockMap = mockFunctions

  // Create new marker instance for each call to support method chaining
  const createMockMarker = () => {
    const marker = {
      addTo: vi.fn(),
      on: vi.fn((event: string, handler: (e: any) => void) => {
        if (!markerEventHandlers.has(event)) {
          markerEventHandlers.set(event, [])
        }
        markerEventHandlers.get(event)!.push(handler)
        return marker
      }),
    }
    marker.addTo.mockReturnValue(marker)
    return marker
  }

  const mockTileLayer = {
    addTo: vi.fn().mockReturnThis(),
    redraw: vi.fn(),
  }

  // Create new polyline instance for each call
  const createMockPolyline = () => {
    const polyline = {
      addTo: vi.fn(),
      getBounds: vi.fn().mockReturnValue([
        [43.6532, -79.3832],
        [43.6550, -79.3850],
      ]),
    }
    polyline.addTo.mockReturnValue(polyline)
    return polyline
  }

  const mockLayerGroup = vi.fn().mockReturnValue({
    addTo: vi.fn().mockReturnThis(),
  })

  const mockLeaflet = {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => mockTileLayer),
    marker: vi.fn(() => createMockMarker()),
    divIcon: vi.fn(() => ({})),
    polyline: vi.fn(() => createMockPolyline()),
    layerGroup: mockLayerGroup,
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
    // Export mock for test access
    __mockMap: mockMap,
  }
})

// Mock map markers utility
vi.mock('../../utils/mapMarkers', () => ({
  createMatchaMarker: vi.fn(() => '<div>Matcha Marker</div>'),
  createUserLocationMarker: vi.fn(() => '<div>User Marker</div>'),
}))

// Import mocked leaflet to access mock map
import * as L from 'leaflet'
const mockMapInstance = (L as any).__mockMap

describe('useLeafletMap', () => {
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
    },
  ]

  const defaultOptions = {
    cafes: mockCafes,
    onPinClick: vi.fn(),
    selectedCafeId: null,
    visitedCafeIds: [],
    initialCenter: [43.6532, -79.3832] as [number, number],
    initialZoom: 13,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    markerEventHandlers.clear()
    mapEventHandlers.clear()
    // Reset zoom to default
    mockMapConfig.zoom = 13
  })

  describe('hook API', () => {
    it('should return containerRef for map attachment', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      expect(result.current.containerRef).toBeDefined()
      expect(result.current.containerRef.current).toBeNull()
    })

    it('should return map control functions', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      expect(typeof result.current.zoomIn).toBe('function')
      expect(typeof result.current.zoomOut).toBe('function')
      expect(typeof result.current.centerOnLocation).toBe('function')
      expect(typeof result.current.addUserLocationMarker).toBe('function')
      expect(typeof result.current.removeUserLocationMarker).toBe('function')
      expect(typeof result.current.drawRoute).toBe('function')
      expect(typeof result.current.clearRoute).toBe('function')
      expect(typeof result.current.refreshTiles).toBe('function')
    })

    it('should initialize with null map instance', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      expect(result.current.map).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should handle zoom in when map is not initialized', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      expect(() => {
        act(() => {
          result.current.zoomIn()
        })
      }).not.toThrow()
    })

    it('should handle zoom out when map is not initialized', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      expect(() => {
        act(() => {
          result.current.zoomOut()
        })
      }).not.toThrow()
    })

    it('should handle centerOnLocation when map is not initialized', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      expect(() => {
        act(() => {
          result.current.centerOnLocation(43.7000, -79.4000)
        })
      }).not.toThrow()
    })

    it('should handle centerOnLocation with explicit zoom', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      expect(() => {
        act(() => {
          result.current.centerOnLocation(43.7000, -79.4000, 15)
        })
      }).not.toThrow()
    })

    it('should handle addUserLocationMarker when map is not initialized', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      expect(() => {
        act(() => {
          result.current.addUserLocationMarker(43.6532, -79.3832)
        })
      }).not.toThrow()
    })

    it('should handle removeUserLocationMarker when map is not initialized', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      expect(() => {
        act(() => {
          result.current.removeUserLocationMarker()
        })
      }).not.toThrow()
    })

    it('should handle removeUserLocationMarker when no marker exists', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      expect(() => {
        act(() => {
          result.current.removeUserLocationMarker()
        })
      }).not.toThrow()
    })

    it('should handle drawRoute when map is not initialized', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      const coordinates = [{ lat: 43.6532, lng: -79.3832 }]

      expect(() => {
        act(() => {
          result.current.drawRoute(coordinates)
        })
      }).not.toThrow()
    })

    it('should handle clearRoute when map is not initialized', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      expect(() => {
        act(() => {
          result.current.clearRoute()
        })
      }).not.toThrow()
    })

    it('should handle refreshTiles when map is not initialized', () => {
      const { result } = renderHook(() => useLeafletMap(defaultOptions))

      expect(() => {
        act(() => {
          result.current.refreshTiles()
        })
      }).not.toThrow()
    })
  })

  describe('options handling', () => {
    it('should accept empty cafes array', () => {
      expect(() => {
        renderHook(() =>
          useLeafletMap({
            ...defaultOptions,
            cafes: [],
          })
        )
      }).not.toThrow()
    })

    it('should accept cafes with only latitude/longitude properties', () => {
      const cafesWithLatLng = [
        {
          id: 1,
          name: 'Test Cafe',
          city: 'toronto',
          latitude: 43.6532,
          longitude: -79.3832,
          address: '123 Test St',
          rating: 4.5,
          distanceInfo: null,
        } as CafeWithDistance,
      ]

      expect(() => {
        renderHook(() =>
          useLeafletMap({
            ...defaultOptions,
            cafes: cafesWithLatLng,
          })
        )
      }).not.toThrow()
    })

    it('should accept selectedCafeId option', () => {
      expect(() => {
        renderHook(() =>
          useLeafletMap({
            ...defaultOptions,
            selectedCafeId: 1,
          })
        )
      }).not.toThrow()
    })

    it('should accept visitedCafeIds option', () => {
      expect(() => {
        renderHook(() =>
          useLeafletMap({
            ...defaultOptions,
            visitedCafeIds: [1, 2],
          })
        )
      }).not.toThrow()
    })

    it('should accept onMapMove callback', () => {
      const onMapMove = vi.fn()

      expect(() => {
        renderHook(() =>
          useLeafletMap({
            ...defaultOptions,
            onMapMove,
          })
        )
      }).not.toThrow()
    })

    it('should accept custom initial center and zoom', () => {
      expect(() => {
        renderHook(() =>
          useLeafletMap({
            ...defaultOptions,
            initialCenter: [43.7000, -79.4000],
            initialZoom: 15,
          })
        )
      }).not.toThrow()
    })
  })

  describe('cleanup', () => {
    it('should not throw on unmount', () => {
      const { unmount } = renderHook(() => useLeafletMap(defaultOptions))

      expect(() => {
        unmount()
      }).not.toThrow()
    })

    it('should handle unmount with empty cafes', () => {
      const { unmount } = renderHook(() =>
        useLeafletMap({
          ...defaultOptions,
          cafes: [],
        })
      )

      expect(() => {
        unmount()
      }).not.toThrow()
    })
  })

  describe('options updates', () => {
    it('should handle cafes updates', () => {
      const { rerender } = renderHook(
        ({ cafes }) => useLeafletMap({ ...defaultOptions, cafes }),
        { initialProps: { cafes: mockCafes } }
      )

      const newCafes = [
        ...mockCafes,
        {
          id: 3,
          name: 'New Cafe',
          city: 'toronto',
          lat: 43.6600,
          lng: -79.4000,
          latitude: 43.6600,
          longitude: -79.4000,
          address: '789 Bay St',
          rating: 4.0,
          distanceInfo: null,
        },
      ]

      expect(() => {
        rerender({ cafes: newCafes })
      }).not.toThrow()
    })

    it('should handle selectedCafeId updates', () => {
      const { rerender } = renderHook(
        ({ selectedCafeId }) => useLeafletMap({ ...defaultOptions, selectedCafeId }),
        { initialProps: { selectedCafeId: null } }
      )

      expect(() => {
        rerender({ selectedCafeId: 1 })
      }).not.toThrow()
    })

    it('should handle visitedCafeIds updates', () => {
      const { rerender } = renderHook(
        ({ visitedCafeIds }) => useLeafletMap({ ...defaultOptions, visitedCafeIds }),
        { initialProps: { visitedCafeIds: [] } }
      )

      expect(() => {
        rerender({ visitedCafeIds: [1] })
      }).not.toThrow()
    })
  })

  // Note: Integration tests for click/dblclick handlers and map move events
  // are challenging to test without full DOM initialization. The existing tests
  // verify the hook's API surface and error handling. The actual event handler
  // behavior is better verified through E2E tests or manual testing.
})
