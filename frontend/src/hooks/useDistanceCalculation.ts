import { useRef, useEffect, useMemo, useState } from 'react'
import { calculateCafeDistances, sortCafesByDistance, findNearestCafe } from '../utils/distance'
import type { Cafe } from '../types'
import type { Coordinates, DistanceResult } from '../utils/distance'

export interface CafeWithDistance extends Cafe {
  distanceInfo: DistanceResult | null
}

interface UseDistanceCalculationOptions {
  cafes: Cafe[]
  userLocation: Coordinates | null
  autoUpdate?: boolean
  updateThresholdMeters?: number
}

// Helper to compare coordinates by value
const areCoordinatesEqual = (
  a: Coordinates | null,
  b: Coordinates | null
): boolean => {
  if (a === null || b === null) return a === b
  return a.latitude === b.latitude && a.longitude === b.longitude
}

export const useDistanceCalculation = ({
  cafes,
  userLocation,
}: UseDistanceCalculationOptions) => {
  const [lastCalculatedLocation, setLastCalculatedLocation] = useState<Coordinates | null>(userLocation)
  const wasManuallyResetRef = useRef(false)
  const previousUserLocationRef = useRef<Coordinates | null>(userLocation)

  // We've simplified this - always recalculate when userLocation changes
  // The shouldRecalculate logic was preventing updates when location first became available

  // Calculate distances for all cafes
  const cafesWithDistance = useMemo<CafeWithDistance[]>(() => {
    if (!userLocation) {
      // If no user location, return cafes with null distance info
      return cafes.map(cafe => ({
        ...cafe,
        distanceInfo: null,
      }))
    }

    const result = calculateCafeDistances(userLocation, cafes)
    return result
  }, [cafes, userLocation])

  // Update last calculated location when userLocation changes
  // Only update if coordinates actually changed (not just reference equality)
  // This allows recalculateDistances to set it to null without it being immediately reset
  useEffect(() => {
    if (!wasManuallyResetRef.current) {
      // Normal update: update when userLocation changes
      if (userLocation !== null && !areCoordinatesEqual(lastCalculatedLocation, userLocation)) {
        setLastCalculatedLocation(userLocation)
      } else if (userLocation === null && lastCalculatedLocation !== null) {
        setLastCalculatedLocation(null)
      }
    } else {
      // If manually reset, only update if userLocation actually changed from the previous value
      const userLocationChanged = !areCoordinatesEqual(previousUserLocationRef.current, userLocation)
      if (userLocationChanged) {
        if (userLocation !== null) {
          setLastCalculatedLocation(userLocation)
        } else {
          setLastCalculatedLocation(null)
        }
        wasManuallyResetRef.current = false
      }
    }
    previousUserLocationRef.current = userLocation
  }, [userLocation, lastCalculatedLocation])

  // Sort cafes by distance
  const cafesByDistance = useMemo(() => {
    return sortCafesByDistance(cafesWithDistance)
  }, [cafesWithDistance])

  // Find nearest cafe
  const nearestCafe = useMemo(() => {
    return findNearestCafe(cafesWithDistance)
  }, [cafesWithDistance])

  // Manual recalculation function
  const recalculateDistances = () => {
    setLastCalculatedLocation(null) // Reset last calculated location
    wasManuallyResetRef.current = true // Track that it was manually reset
  }

  // Get distance info for a specific cafe
  const getDistanceForCafe = (cafeId: number): DistanceResult | null => {
    const cafe = cafesWithDistance.find(c => c.id === cafeId)
    return cafe?.distanceInfo || null
  }

  // Filter cafes within a certain distance
  const getCafesWithinDistance = (maxDistanceKm: number): CafeWithDistance[] => {
    return cafesWithDistance.filter(cafe =>
      cafe.distanceInfo && cafe.distanceInfo.kilometers <= maxDistanceKm
    )
  }

  // Get statistics about distances
  const distanceStats = useMemo(() => {
    const cafesWithValidDistance = cafesWithDistance.filter(cafe => cafe.distanceInfo)

    if (cafesWithValidDistance.length === 0) {
      return {
        count: 0,
        averageDistance: 0,
        minDistance: 0,
        maxDistance: 0,
        within1km: 0,
        within5km: 0,
      }
    }

    const distances = cafesWithValidDistance.map(cafe => cafe.distanceInfo!.kilometers)

    return {
      count: cafesWithValidDistance.length,
      averageDistance: distances.reduce((sum, d) => sum + d, 0) / distances.length,
      minDistance: Math.min(...distances),
      maxDistance: Math.max(...distances),
      within1km: cafesWithValidDistance.filter(cafe => cafe.distanceInfo!.kilometers <= 1).length,
      within5km: cafesWithValidDistance.filter(cafe => cafe.distanceInfo!.kilometers <= 5).length,
    }
  }, [cafesWithDistance])

  return {
    cafesWithDistance,
    cafesByDistance,
    nearestCafe,
    isCalculating: false, // Removed state - calculations are synchronous in useMemo
    hasUserLocation: !!userLocation,
    lastCalculatedLocation,
    distanceStats,
    recalculateDistances,
    getDistanceForCafe,
    getCafesWithinDistance,
  }
}