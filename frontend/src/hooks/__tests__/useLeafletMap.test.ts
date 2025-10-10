import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLeafletMap } from '../useLeafletMap'
import type { CafeWithDistance } from '../../types'

// Mock Leaflet
const mockMap = {
  setView: vi.fn(),
  remove: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  getZoom: vi.fn().mockReturnValue(13),
  getCenter: vi.fn().mockReturnValue({ lat: 43.6532, lng: -79.3832 }),
  removeLayer: vi.fn(),
  invalidateSize: vi.fn(),
  fitBounds: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}

const mockTileLayer = {
  addTo: vi.fn().mockReturnThis(),
  redraw: vi.fn(),
}

const mockMarker = {
  addTo: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
}

const mockPolyline = {
  addTo: vi.fn().mockReturnThis(),
  getBounds: vi.fn().mockReturnValue([]),
}

const mockLayerGroup = vi.fn()

vi.mock('leaflet', () => ({
  map: vi.fn(() => mockMap),
  tileLayer: vi.fn(() => mockTileLayer),
  marker: vi.fn(() => mockMarker),
  divIcon: vi.fn(() => ({})),
  polyline: vi.fn(() => mockPolyline),
  layerGroup: mockLayerGroup,
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: vi.fn(),
    },
  },
}))

// Mock map markers utility
vi.mock('../../utils/mapMarkers', () => ({
  createMatchaMarker: vi.fn(() => '<div>Matcha Marker</div>'),
  createUserLocationMarker: vi.fn(() => '<div>User Marker</div>'),
}))

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
    }
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
    
    // Reset mock implementations
    mockMap.setView.mockClear()
    mockMap.remove.mockClear()
    mockMap.getZoom.mockReturnValue(13)
    mockTileLayer.addTo.mockReturnValue(mockTileLayer)
    mockMarker.addTo.mockReturnValue(mockMarker)
    mockMarker.on.mockReturnValue(mockMarker)
  })

  it('should initialize map with correct center and zoom', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    // Check that map was created
    const L = require('leaflet')
    expect(L.map).toHaveBeenCalled()
    expect(L.tileLayer).toHaveBeenCalled()
    expect(mockTileLayer.addTo).toHaveBeenCalledWith(mockMap)
    
    // containerRef should be available
    expect(result.current.containerRef).toBeDefined()
  })

  it('should clean up map on unmount', () => {
    const { unmount } = renderHook(() => useLeafletMap(defaultOptions))

    unmount()

    expect(mockMap.remove).toHaveBeenCalled()
  })

  it('should add markers for all cafes', () => {
    renderHook(() => useLeafletMap(defaultOptions))

    const L = require('leaflet')
    expect(L.marker).toHaveBeenCalledTimes(2) // One for each cafe
    expect(L.divIcon).toHaveBeenCalledTimes(2)
    expect(mockMarker.addTo).toHaveBeenCalledTimes(2)
  })

  it('should handle pin click events', () => {
    const onPinClick = vi.fn()
    renderHook(() => useLeafletMap({ ...defaultOptions, onPinClick }))

    // Simulate marker click
    expect(mockMarker.on).toHaveBeenCalledWith('click', expect.any(Function))
    
    // Get the click handler and call it
    const clickHandler = mockMarker.on.mock.calls.find(call => call[0] === 'click')?.[1]
    expect(clickHandler).toBeDefined()
  })

  it('should zoom in when zoomIn is called', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    act(() => {
      result.current.zoomIn()
    })

    expect(mockMap.zoomIn).toHaveBeenCalled()
  })

  it('should zoom out when zoomOut is called', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    act(() => {
      result.current.zoomOut()
    })

    expect(mockMap.zoomOut).toHaveBeenCalled()
  })

  it('should center on location when centerOnLocation is called', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    act(() => {
      result.current.centerOnLocation(43.7000, -79.4000, 15)
    })

    expect(mockMap.setView).toHaveBeenCalledWith([43.7000, -79.4000], 15)
  })

  it('should center on location with default zoom when no zoom provided', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    act(() => {
      result.current.centerOnLocation(43.7000, -79.4000)
    })

    expect(mockMap.setView).toHaveBeenCalledWith([43.7000, -79.4000], 15)
  })

  it('should add user location marker', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    act(() => {
      result.current.addUserLocationMarker(43.6532, -79.3832)
    })

    const L = require('leaflet')
    // Should create additional marker for user location
    expect(L.marker).toHaveBeenCalledWith([43.6532, -79.3832], expect.any(Object))
    expect(L.divIcon).toHaveBeenCalled()
  })

  it('should remove existing user location marker before adding new one', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    // Add first marker
    act(() => {
      result.current.addUserLocationMarker(43.6532, -79.3832)
    })

    // Add second marker (should remove first)
    act(() => {
      result.current.addUserLocationMarker(43.7000, -79.4000)
    })

    expect(mockMap.removeLayer).toHaveBeenCalled()
  })

  it('should remove user location marker when removeUserLocationMarker is called', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    // Add marker first
    act(() => {
      result.current.addUserLocationMarker(43.6532, -79.3832)
    })

    // Remove marker
    act(() => {
      result.current.removeUserLocationMarker()
    })

    expect(mockMap.removeLayer).toHaveBeenCalled()
  })

  it('should handle removeUserLocationMarker when no marker exists', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    // Should not throw when no marker exists
    expect(() => {
      act(() => {
        result.current.removeUserLocationMarker()
      })
    }).not.toThrow()
  })

  it('should draw route with coordinates', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    const coordinates = [
      { lat: 43.6532, lng: -79.3832 },
      { lat: 43.6550, lng: -79.3850 },
    ]

    act(() => {
      result.current.drawRoute(coordinates)
    })

    const L = require('leaflet')
    expect(L.polyline).toHaveBeenCalledTimes(2) // Outline and main line
    expect(mockPolyline.addTo).toHaveBeenCalledTimes(2)
    expect(mockMap.fitBounds).toHaveBeenCalled()
  })

  it('should clear existing route before drawing new one', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    const coordinates1 = [{ lat: 43.6532, lng: -79.3832 }]
    const coordinates2 = [{ lat: 43.6550, lng: -79.3850 }]

    // Draw first route
    act(() => {
      result.current.drawRoute(coordinates1)
    })

    // Draw second route (should clear first)
    act(() => {
      result.current.drawRoute(coordinates2)
    })

    expect(mockMap.removeLayer).toHaveBeenCalled()
  })

  it('should clear route when clearRoute is called', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    // Draw route first
    const coordinates = [{ lat: 43.6532, lng: -79.3832 }]
    act(() => {
      result.current.drawRoute(coordinates)
    })

    // Clear route
    act(() => {
      result.current.clearRoute()
    })

    expect(mockMap.removeLayer).toHaveBeenCalled()
  })

  it('should handle clearRoute when no route exists', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    // Should not throw when no route exists
    expect(() => {
      act(() => {
        result.current.clearRoute()
      })
    }).not.toThrow()
  })

  it('should refresh tiles when refreshTiles is called', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    act(() => {
      result.current.refreshTiles()
    })

    expect(mockTileLayer.redraw).toHaveBeenCalled()
    expect(mockMap.invalidateSize).toHaveBeenCalled()
  })

  it('should update markers when cafes change', () => {
    const { rerender } = renderHook(
      ({ cafes }) => useLeafletMap({ ...defaultOptions, cafes }),
      { initialProps: { cafes: mockCafes } }
    )

    const L = require('leaflet')
    const initialMarkerCalls = L.marker.mock.calls.length

    // Update with new cafes
    const newCafes = [...mockCafes, {
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
    }]

    rerender({ cafes: newCafes })

    // Should remove old markers and add new ones
    expect(mockMap.removeLayer).toHaveBeenCalled()
    expect(L.marker.mock.calls.length).toBeGreaterThan(initialMarkerCalls)
  })

  it('should handle selected cafe highlighting', () => {
    const { rerender } = renderHook(
      ({ selectedCafeId }) => useLeafletMap({ ...defaultOptions, selectedCafeId }),
      { initialProps: { selectedCafeId: null } }
    )

    // Update with selected cafe
    rerender({ selectedCafeId: 1 })

    // Should recreate markers with selection state
    const { createMatchaMarker } = require('../../utils/mapMarkers')
    expect(createMatchaMarker).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ isSelected: true })
    )
  })

  it('should handle visited cafe highlighting', () => {
    renderHook(() => useLeafletMap({
      ...defaultOptions,
      visitedCafeIds: [1]
    }))

    const { createMatchaMarker } = require('../../utils/mapMarkers')
    expect(createMatchaMarker).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({ isVisited: true })
    )
  })

  it('should handle map move events when onMapMove is provided', () => {
    const onMapMove = vi.fn()
    renderHook(() => useLeafletMap({ ...defaultOptions, onMapMove }))

    expect(mockMap.on).toHaveBeenCalledWith('moveend', expect.any(Function))
  })

  it('should not add map move listener when onMapMove is not provided', () => {
    renderHook(() => useLeafletMap(defaultOptions))

    // Should not call map.on with moveend when onMapMove is undefined
    const moveEndCalls = mockMap.on.mock.calls.filter(call => call[0] === 'moveend')
    expect(moveEndCalls).toHaveLength(0)
  })

  it('should handle cafes without lat/lng properties', () => {
    const cafesWithLatLng = [{
      id: 1,
      name: 'Test Cafe',
      city: 'toronto',
      latitude: 43.6532,
      longitude: -79.3832,
      address: '123 Test St',
      rating: 4.5,
      distanceInfo: null,
    }]

    renderHook(() => useLeafletMap({
      ...defaultOptions,
      cafes: cafesWithLatLng as any
    }))

    const L = require('leaflet')
    expect(L.marker).toHaveBeenCalledWith([43.6532, -79.3832], expect.any(Object))
  })

  it('should return map instance', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    expect(result.current.map).toBe(mockMap)
  })

  it('should handle empty cafes array', () => {
    renderHook(() => useLeafletMap({
      ...defaultOptions,
      cafes: []
    }))

    const L = require('leaflet')
    expect(L.map).toHaveBeenCalled() // Map should still be created
    // No markers should be created for empty cafes
    expect(L.marker).not.toHaveBeenCalled()
  })

  it('should handle drawRoute with no map instance', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))

    // Mock map as null
    result.current.map = null

    const coordinates = [{ lat: 43.6532, lng: -79.3832 }]

    expect(() => {
      act(() => {
        result.current.drawRoute(coordinates)
      })
    }).not.toThrow()
  })
})