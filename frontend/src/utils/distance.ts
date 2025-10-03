// Distance calculation utilities using Haversine formula

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface DistanceResult {
  kilometers: number
  miles: number
  formattedKm: string
  formattedMiles: string
  walkTime: string
}

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * This gives great-circle distances between the two points on Earth's surface
 */
export const calculateHaversineDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371 // Earth's radius in kilometers

  const lat1Rad = (coord1.latitude * Math.PI) / 180
  const lat2Rad = (coord2.latitude * Math.PI) / 180
  const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180
  const deltaLngRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in kilometers
}

/**
 * Calculate comprehensive distance information between two coordinates
 */
export const getDistanceInfo = (
  userLocation: Coordinates,
  targetLocation: Coordinates
): DistanceResult => {
  const distanceKm = calculateHaversineDistance(userLocation, targetLocation)
  const distanceMiles = distanceKm * 0.621371

  return {
    kilometers: distanceKm,
    miles: distanceMiles,
    formattedKm: formatDistance(distanceKm, 'km'),
    formattedMiles: formatDistance(distanceMiles, 'miles'),
    walkTime: calculateWalkTime(distanceKm),
  }
}

/**
 * Format distance for display
 */
export const formatDistance = (distance: number, unit: 'km' | 'miles'): string => {
  if (distance < 0.1) {
    return `${Math.round(distance * 1000)}m`
  } else if (distance < 1) {
    return `${Math.round(distance * 100) / 100} ${unit}`
  } else if (distance < 10) {
    return `${Math.round(distance * 10) / 10} ${unit}`
  } else {
    return `${Math.round(distance)} ${unit}`
  }
}

/**
 * Calculate estimated walking time based on distance
 * Assumes average walking speed of 5 km/h (3.1 mph)
 */
export const calculateWalkTime = (distanceKm: number): string => {
  const walkingSpeedKmh = 5 // Average walking speed
  const timeHours = distanceKm / walkingSpeedKmh
  const timeMinutes = Math.round(timeHours * 60)

  if (timeMinutes <= 0) {
    return '< 1 min'
  } else if (timeMinutes < 60) {
    return `${timeMinutes} min`
  } else {
    const hours = Math.floor(timeMinutes / 60)
    const remainingMinutes = timeMinutes % 60
    if (remainingMinutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${remainingMinutes}m`
    }
  }
}

/**
 * Calculate distances for multiple cafes from user location
 */
export const calculateCafeDistances = <T extends { lat?: number; lng?: number; latitude: number; longitude: number }>(
  userLocation: Coordinates | null,
  cafes: T[]
): (T & { distanceInfo: DistanceResult | null })[] => {
  if (!userLocation) {
    return cafes.map(cafe => ({
      ...cafe,
      distanceInfo: null,
    }))
  }

  return cafes.map(cafe => {
    const distanceInfo = getDistanceInfo(userLocation, {
      latitude: cafe.lat ?? cafe.latitude,
      longitude: cafe.lng ?? cafe.longitude,
    })

    return {
      ...cafe,
      distanceInfo,
    }
  })
}

/**
 * Sort cafes by distance from user location
 */
export const sortCafesByDistance = <T extends { distanceInfo: DistanceResult | null }>(
  cafes: T[]
): T[] => {
  return [...cafes].sort((a, b) => {
    // Cafes without distance info go to the end
    if (!a.distanceInfo && !b.distanceInfo) return 0
    if (!a.distanceInfo) return 1
    if (!b.distanceInfo) return -1

    return a.distanceInfo.kilometers - b.distanceInfo.kilometers
  })
}

/**
 * Find the nearest cafe to user location
 */
export const findNearestCafe = <T extends { distanceInfo: DistanceResult | null }>(
  cafes: T[]
): T | null => {
  const sortedCafes = sortCafesByDistance(cafes)
  return sortedCafes.length > 0 && sortedCafes[0].distanceInfo ? sortedCafes[0] : null
}