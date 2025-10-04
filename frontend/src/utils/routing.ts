/**
 * Routing API integration using OpenRouteService
 * Free tier: 2,000 requests/day (no API key required for this volume)
 * Docs: https://openrouteservice.org/dev/#/api-docs
 */

export interface RouteCoordinate {
  lat: number
  lng: number
}

export interface RouteResponse {
  coordinates: RouteCoordinate[]
  distance: number // meters
  duration: number // seconds
}

/**
 * Fetch walking route from OpenRouteService
 * Uses foot-walking profile for realistic cafe visit routes
 *
 * Note: OpenRouteService requires an API key for production use
 * Get one at: https://openrouteservice.org/dev/#/signup
 * Add to .env.local as VITE_OPENROUTESERVICE_API_KEY
 */
export async function fetchWalkingRoute(
  start: RouteCoordinate,
  end: RouteCoordinate
): Promise<RouteResponse> {
  const apiKey = import.meta.env.VITE_OPENROUTESERVICE_API_KEY

  if (!apiKey) {
    console.error('OpenRouteService API key not found. Add VITE_OPENROUTESERVICE_API_KEY to .env.local')
    throw new Error('Route service not configured. Please contact support.')
  }

  const url = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson'

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/geo+json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat], // OpenRouteService uses [lng, lat] order
          [end.lng, end.lat],
        ],
        // foot-walking profile provides realistic pedestrian routes
        // including sidewalks, crosswalks, etc.
        preference: 'recommended',
        units: 'm',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenRouteService error:', response.status, errorData)
      throw new Error(`Unable to calculate route (${response.status})`)
    }

    const data = await response.json()

    // OpenRouteService GeoJSON endpoint returns features
    if (!data.features || !data.features[0]) {
      console.error('Unexpected response format:', data)
      throw new Error('Invalid route data received')
    }

    const feature = data.features[0]
    const geometry = feature.geometry.coordinates
    const properties = feature.properties

    if (!geometry || !properties) {
      console.error('Missing geometry or properties:', feature)
      throw new Error('Incomplete route data received')
    }

    // Convert from [lng, lat] to {lat, lng} for Leaflet
    const coordinates: RouteCoordinate[] = geometry.map((coord: [number, number]) => ({
      lat: coord[1],
      lng: coord[0],
    }))

    return {
      coordinates,
      distance: properties.summary.distance,
      duration: properties.summary.duration,
    }
  } catch (error) {
    console.error('Failed to fetch route:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unable to calculate route. Please try again.')
  }
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Format distance in meters to human-readable string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}
