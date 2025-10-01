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
}

export const useLeafletMap = ({
  cafes,
  onPinClick,
  selectedCafeId,
  visitedCafeIds = [],
  initialCenter = [43.6532, -79.3832],
  initialZoom = 13
}: UseLeafletMapOptions) => {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<number, L.Marker>>(new Map())
  const userLocationMarkerRef = useRef<L.Marker | null>(null)
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

    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors, © CARTO',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
    }
  }, [])

  // Update map center when initialCenter changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(initialCenter, initialZoom)
    }
  }, [initialCenter, initialZoom])

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

      const marker = L.marker([cafe.lat, cafe.lng], { icon: customIcon })
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

  const centerOnLocation = useCallback((lat: number, lng: number) => {
    mapRef.current?.setView([lat, lng], 15)
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

  return {
    containerRef,
    zoomIn,
    zoomOut,
    centerOnLocation,
    addUserLocationMarker,
    removeUserLocationMarker,
    map: mapRef.current,
  }
}