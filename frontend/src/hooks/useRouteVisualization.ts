/**
 * Custom hook for managing route visualization
 * Handles fetching routes from OpenRouteService and managing route state
 */

import { useState, useCallback, useRef } from 'react'
import { fetchWalkingRoute, type RouteCoordinate, type RouteResponse } from '../utils/routing'

interface UseRouteVisualizationResult {
  route: RouteResponse | null
  isLoadingRoute: boolean
  routeError: string | null
  showRoute: boolean
  routeCafeId: number | null
  toggleRoute: () => void
  loadRoute: (start: RouteCoordinate, end: RouteCoordinate, cafeId: number) => Promise<void>
  clearRoute: () => void
}

interface CachedRoute {
  route: RouteResponse
  cafeId: number
  startLat: number
  startLng: number
  timestamp: number
}

// Helper to calculate distance between two coordinates (Haversine formula)
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

export function useRouteVisualization(): UseRouteVisualizationResult {
  const [route, setRoute] = useState<RouteResponse | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [showRoute, setShowRoute] = useState(false)
  const [routeCafeId, setRouteCafeId] = useState<number | null>(null)

  // Cache routes by cafe ID
  const routeCacheRef = useRef<Map<number, CachedRoute>>(new Map())

  // Threshold: invalidate cache if user moves more than 50 meters
  const LOCATION_THRESHOLD_METERS = 50

  const loadRoute = useCallback(async (start: RouteCoordinate, end: RouteCoordinate, cafeId: number) => {
    setIsLoadingRoute(true)
    setRouteError(null)

    try {
      // Check if we have a cached route for this cafe
      const cached = routeCacheRef.current.get(cafeId)

      if (cached) {
        // Check if user location has changed significantly
        const distanceMoved = getDistance(
          cached.startLat,
          cached.startLng,
          start.lat,
          start.lng
        )

        if (distanceMoved < LOCATION_THRESHOLD_METERS) {
          // Use cached route
          console.log(`Using cached route for cafe ${cafeId} (moved ${distanceMoved.toFixed(1)}m)`)
          setRoute(cached.route)
          setShowRoute(true)
          setRouteCafeId(cafeId)
          setIsLoadingRoute(false)
          return
        } else {
          console.log(`Cache invalidated for cafe ${cafeId} (moved ${distanceMoved.toFixed(1)}m)`)
          routeCacheRef.current.delete(cafeId)
        }
      }

      // Fetch new route
      const routeData = await fetchWalkingRoute(start, end)

      // Cache the route
      routeCacheRef.current.set(cafeId, {
        route: routeData,
        cafeId,
        startLat: start.lat,
        startLng: start.lng,
        timestamp: Date.now(),
      })

      setRoute(routeData)
      setShowRoute(true)
      setRouteCafeId(cafeId)
    } catch (error) {
      console.error('Failed to load route:', error)
      setRouteError(error instanceof Error ? error.message : 'Failed to load route')
      setRoute(null)
      setShowRoute(false)
      setRouteCafeId(null)
    } finally {
      setIsLoadingRoute(false)
    }
  }, [])

  const clearRoute = useCallback(() => {
    setRoute(null)
    setShowRoute(false)
    setRouteError(null)
    setRouteCafeId(null)
  }, [])

  const toggleRoute = useCallback(() => {
    setShowRoute(prev => !prev)
  }, [])

  return {
    route,
    isLoadingRoute,
    routeError,
    showRoute,
    routeCafeId,
    toggleRoute,
    loadRoute,
    clearRoute,
  }
}
