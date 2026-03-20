import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLeafletMap } from '../useLeafletMap'
import type { CafeWithDistance } from '../../types'

const markerEventHandlers = new Map<string, ((e: unknown) => void)[]>()
const mapEventHandlers = new Map<string, ((e: unknown) => void)[]>()

const mockMapConfig = { zoom: 13, center: { lat: 43.6532, lng: -79.3832 } }

vi.mock('leaflet', () => {
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
    on: vi.fn((event: string, handler: (e: unknown) => void) => {
      if (!mapEventHandlers.has(event)) mapEventHandlers.set(event, [])
      mapEventHandlers.get(event)!.push(handler)
      return mockMap
    }),
    off: vi.fn().mockReturnThis(),
  }
  const mockMap = mockFunctions

  const createMockMarker = () => {
    const marker = {
      addTo: vi.fn(),
      on: vi.fn((event: string, handler: (e: unknown) => void) => {
        if (!markerEventHandlers.has(event)) markerEventHandlers.set(event, [])
        markerEventHandlers.get(event)!.push(handler)
        return marker
      }),
    }
    marker.addTo.mockReturnValue(marker)
    return marker
  }

  const mockTileLayer = { addTo: vi.fn().mockReturnThis(), redraw: vi.fn() }
  const createMockPolyline = () => {
    const polyline = {
      addTo: vi.fn(),
      getBounds: vi.fn().mockReturnValue([
        [43.6532, -79.3832],
        [43.655, -79.385],
      ]),
    }
    polyline.addTo.mockReturnValue(polyline)
    return polyline
  }

  const mockLeaflet = {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => mockTileLayer),
    marker: vi.fn(() => createMockMarker()),
    divIcon: vi.fn(() => ({})),
    polyline: vi.fn(() => createMockPolyline()),
    layerGroup: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
  }

  return { default: mockLeaflet, ...mockLeaflet, __mockMap: mockMap }
})

vi.mock('../../utils/mapMarkers', () => ({
  createMatchaMarker: vi.fn(() => '<div>m</div>'),
  createUserLocationMarker: vi.fn(() => '<div>u</div>'),
}))

describe('useLeafletMap', () => {
  const mockCafes: CafeWithDistance[] = [
    {
      id: 1,
      name: 'Matcha Bar',
      slug: 'a',
      city: 'toronto',
      link: 'x',
      quickNote: '',
      lat: 43.6532,
      lng: -79.3832,
      latitude: 43.6532,
      longitude: -79.3832,
      displayScore: 8,
      distanceInfo: null,
    },
  ]

  const defaultOptions = {
    cafes: mockCafes,
    onPinClick: vi.fn(),
    selectedCafeId: null,
    visitedCafeIds: [] as number[],
    initialCenter: [43.6532, -79.3832] as [number, number],
    initialZoom: 13,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    markerEventHandlers.clear()
    mapEventHandlers.clear()
    mockMapConfig.zoom = 13
  })

  it('returns ref and control functions', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))
    expect(result.current.containerRef).toBeDefined()
    expect(typeof result.current.zoomIn).toBe('function')
    expect(typeof result.current.drawRoute).toBe('function')
  })

  it('does not throw when map has no container yet', () => {
    const { result } = renderHook(() => useLeafletMap(defaultOptions))
    expect(() => {
      act(() => {
        result.current.zoomIn()
        result.current.zoomOut()
        result.current.centerOnLocation(43.7, -79.4)
        result.current.centerOnLocation(43.7, -79.4, 15)
        result.current.addUserLocationMarker(43.65, -79.38)
        result.current.removeUserLocationMarker()
        result.current.drawRoute([{ lat: 43.65, lng: -79.38 }])
        result.current.clearRoute()
        result.current.refreshTiles()
      })
    }).not.toThrow()
  })

  it('survives unmount', () => {
    const { unmount } = renderHook(() => useLeafletMap({ ...defaultOptions, cafes: [] }))
    expect(() => unmount()).not.toThrow()
  })
})
