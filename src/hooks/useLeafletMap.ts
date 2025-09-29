import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { Cafe } from '../types'

// Fix for default markers in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface UseLeafletMapOptions {
  cafes: Cafe[]
  onPinClick: (cafe: Cafe) => void
}

export const useLeafletMap = ({ cafes, onPinClick }: UseLeafletMapOptions) => {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<number, L.Marker>>(new Map())
  const userLocationMarkerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize map
    const map = L.map(containerRef.current, {
      center: [43.6532, -79.3832], // Toronto downtown
      zoom: 13,
      zoomControl: false, // We'll add custom controls
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
    })

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current!.removeLayer(marker)
    })
    markersRef.current.clear()

    // Add cafe markers
    cafes.forEach(cafe => {
      // Create custom marker with score
      const markerHtml = `
        <div class="relative">
          <div class="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <span class="text-white text-xs font-bold">📍</span>
          </div>
          <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-0.5 rounded text-xs font-semibold text-green-700 shadow-md whitespace-nowrap">
            ${cafe.score}
          </div>
        </div>
      `

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      })

      const marker = L.marker([cafe.lat, cafe.lng], { icon: customIcon })
        .addTo(mapRef.current!)
        .on('click', () => onPinClick(cafe))

      markersRef.current.set(cafe.id, marker)
    })
  }, [cafes, onPinClick])

  const zoomIn = () => {
    mapRef.current?.zoomIn()
  }

  const zoomOut = () => {
    mapRef.current?.zoomOut()
  }

  const centerOnLocation = (lat: number, lng: number) => {
    mapRef.current?.setView([lat, lng], 15)
  }

  const addUserLocationMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return

    // Remove existing user location marker
    if (userLocationMarkerRef.current) {
      mapRef.current.removeLayer(userLocationMarkerRef.current)
    }

    // Create user location marker
    const userMarkerHtml = `
      <div class="relative">
        <div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse">
          <div class="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div class="absolute w-12 h-12 border-2 border-blue-300 rounded-full opacity-30 -top-3 -left-3 animate-ping"></div>
      </div>
    `

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