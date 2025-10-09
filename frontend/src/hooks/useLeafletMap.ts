import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import { createMatchaMarker, createUserLocationMarker } from '../utils/mapMarkers'
import type { CafeWithDistance } from '../types'

// Fix for default markers in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface UseLeafletMapOptions {
  cafes: CafeWithDistance[]
  onPinClick: (cafe: CafeWithDistance) => void
  selectedCafeId?: number | null
  visitedCafeIds?: number[]
  initialCenter?: [number, number]
  initialZoom?: number
  onMapMove?: (center: { lat: number; lng: number }) => void
}

export const useLeafletMap = ({
  cafes,
  onPinClick,
  selectedCafeId,
  visitedCafeIds = [],
  initialCenter = [43.6532, -79.3832],
  initialZoom = 13,
  onMapMove
}: UseLeafletMapOptions) => {
  const mapRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const markersRef = useRef<Map<number, L.Marker>>(new Map())
  const userLocationMarkerRef = useRef<L.Marker | null>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize map
    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false, // We'll add custom controls
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
    })

    // Add tile layer with improved preloading for city switching
    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors, © CARTO',
      maxZoom: 19,
      minZoom: 8, // Allow more zoom out for global cities
      keepBuffer: 6, // Increased from 4 to prevent grey areas during city switching
      updateWhenIdle: false, // Load tiles during pan for smoother experience
      updateWhenZooming: false, // Don't update during zoom animations
      updateInterval: 100, // Faster updates (reduced from 150ms)
      // Remove bounds restriction to allow global tile loading for all cities
    }).addTo(map)
    
    tileLayerRef.current = tileLayer

    mapRef.current = map

    return () => {
      map.remove()
    }
  }, [])

  // Add map move listener
  useEffect(() => {
    if (!mapRef.current || !onMapMove) return

    const handleMoveEnd = () => {
      if (!mapRef.current) return
      const center = mapRef.current.getCenter()
      onMapMove({ lat: center.lat, lng: center.lng })
    }

    mapRef.current.on('moveend', handleMoveEnd)

    return () => {
      mapRef.current?.off('moveend', handleMoveEnd)
    }
  }, [onMapMove])

  // Note: We don't auto-update the map center when initialCenter changes
  // This would cause the map to "yank" when the user pans near another city
  // Instead, we only update the map when the user explicitly clicks a city in the dropdown
  // (which is handled via the centerOnLocation callback)

  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current!.removeLayer(marker)
    })
    markersRef.current.clear()

    // Add cafe markers with enhanced theming
    cafes.forEach(cafe => {
      const isSelected = selectedCafeId === cafe.id
      const isVisited = visitedCafeIds.includes(cafe.id)
      
      const markerHtml = createMatchaMarker(cafe, { isSelected, isVisited })

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'matcha-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -44],
      })

      const marker = L.marker([cafe.lat ?? cafe.latitude, cafe.lng ?? cafe.longitude], { icon: customIcon })
        .addTo(mapRef.current!)
        .on('click', () => onPinClick(cafe))

      markersRef.current.set(cafe.id, marker)
    })
  }, [cafes, onPinClick, selectedCafeId, visitedCafeIds])

  const zoomIn = () => {
    mapRef.current?.zoomIn()
  }

  const zoomOut = () => {
    mapRef.current?.zoomOut()
  }

  const centerOnLocation = useCallback((lat: number, lng: number, zoom?: number) => {
    if (!mapRef.current) return
    
    // Pan to new location
    mapRef.current.setView([lat, lng], zoom ?? 15)
    
    // Force tile layer refresh to ensure tiles load for new viewport
    if (tileLayerRef.current) {
      // Small delay to allow pan animation to complete
      setTimeout(() => {
        if (tileLayerRef.current && mapRef.current) {
          tileLayerRef.current.redraw()
          // Also invalidate map size to trigger tile recalculation
          mapRef.current.invalidateSize()
        }
      }, 100)
    }
  }, [])

  const addUserLocationMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return

    // Remove existing user location marker
    if (userLocationMarkerRef.current) {
      mapRef.current.removeLayer(userLocationMarkerRef.current)
    }

    // Create user location marker
    const userMarkerHtml = createUserLocationMarker()

    const userIcon = L.divIcon({
      html: userMarkerHtml,
      className: 'user-location-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    const userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(mapRef.current)
    userLocationMarkerRef.current = userMarker
  }

  const removeUserLocationMarker = () => {
    if (userLocationMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(userLocationMarkerRef.current)
      userLocationMarkerRef.current = null
    }
  }

  const drawRoute = useCallback((coordinates: Array<{ lat: number; lng: number }>) => {
    if (!mapRef.current) {
      return
    }

    // Remove existing route
    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current)
    }

    // Draw new route with enhanced styling for better visibility
    const latLngs: [number, number][] = coordinates.map(coord => [coord.lat, coord.lng])

    // Create a white outline for contrast
    const outline = L.polyline(latLngs, {
      color: '#ffffff',
      weight: 9,
      opacity: 0.9,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(mapRef.current)

    // Create the main route line on top
    const mainLine = L.polyline(latLngs, {
      color: '#558b2f', // darker matcha-700 for better contrast
      weight: 6,
      opacity: 1,
      lineJoin: 'round',
      lineCap: 'round',
      dashArray: '10, 8', // Dashed pattern for walking route
    }).addTo(mapRef.current)

    // Group both layers together
    const routeGroup = L.layerGroup([outline, mainLine])
    routeLayerRef.current = routeGroup as any

    // Fit map to show entire route
    mapRef.current.fitBounds(mainLine.getBounds(), {
      padding: [50, 50],
      maxZoom: 16,
    })
  }, [])

  const clearRoute = useCallback(() => {
    if (routeLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }
  }, [])

  const refreshTiles = useCallback(() => {
    if (tileLayerRef.current && mapRef.current) {
      tileLayerRef.current.redraw()
      mapRef.current.invalidateSize()
    }
  }, [])

  return {
    containerRef,
    zoomIn,
    zoomOut,
    centerOnLocation,
    addUserLocationMarker,
    removeUserLocationMarker,
    drawRoute,
    clearRoute,
    refreshTiles,
    map: mapRef.current,
  }
}