import { useState, useEffect, useMemo } from 'react'
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

export const useDistanceCalculation = ({
  cafes,
  userLocation,
  autoUpdate = true,
  updateThresholdMeters = 50, // Only recalculate if user moves 50+ meters
}: UseDistanceCalculationOptions) => {
  const [lastCalculatedLocation, setLastCalculatedLocation] = useState<Coordinates | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Check if we should recalculate distances
  const shouldRecalculate = useMemo(() => {
    if (!userLocation) return false
    if (!lastCalculatedLocation) return true
    if (!autoUpdate) return false

    // Calculate distance moved since last calculation
    const deltaLat = userLocation.latitude - lastCalculatedLocation.latitude
    const deltaLng = userLocation.longitude - lastCalculatedLocation.longitude
    const deltaMeters = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng) * 111000 // Rough conversion to meters

    return deltaMeters > updateThresholdMeters
  }, [userLocation, lastCalculatedLocation, autoUpdate, updateThresholdMeters])

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

  // Update calculating state when starting calculation
  useEffect(() => {
    if (userLocation) {
      setIsCalculating(true)
      const timer = setTimeout(() => setIsCalculating(false), 100)
      return () => clearTimeout(timer)
    } else {
      setIsCalculating(false)
    }
  }, [userLocation])

  // Update last calculated location when we recalculate
  useEffect(() => {
    if (shouldRecalculate && userLocation) {
      setLastCalculatedLocation(userLocation)
    }
  }, [shouldRecalculate, userLocation])

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
    setLastCalculatedLocation(null) // Force recalculation on next update
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
    isCalculating,
    hasUserLocation: !!userLocation,
    lastCalculatedLocation,
    distanceStats,
    recalculateDistances,
    getDistanceForCafe,
    getCafesWithinDistance,
  }
}