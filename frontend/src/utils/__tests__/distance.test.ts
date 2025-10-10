import { describe, it, expect } from 'vitest'
import {
  calculateHaversineDistance,
  getDistanceInfo,
  formatDistance,
  calculateWalkTime,
  calculateCafeDistances,
  sortCafesByDistance,
  findNearestCafe,
} from '../distance'
import type { Coordinates } from '../distance'

describe('distance utilities', () => {
  const torontoDowntown: Coordinates = { latitude: 43.6532, longitude: -79.3832 }
  const torontoYorkville: Coordinates = { latitude: 43.6708, longitude: -79.3915 }
  // const torontoQueenWest: Coordinates = { latitude: 43.6426, longitude: -79.4020 }

  describe('calculateHaversineDistance', () => {
    it('should calculate distance between Toronto downtown and Yorkville', () => {
      const distance = calculateHaversineDistance(torontoDowntown, torontoYorkville)
      
      // Distance should be approximately 2.2 km
      expect(distance).toBeGreaterThan(2.0)
      expect(distance).toBeLessThan(2.5)
    })

    it('should return 0 for same coordinates', () => {
      const distance = calculateHaversineDistance(torontoDowntown, torontoDowntown)
      expect(distance).toBe(0)
    })

    it('should handle negative coordinates', () => {
      const coord1: Coordinates = { latitude: -33.8688, longitude: 151.2093 } // Sydney
      const coord2: Coordinates = { latitude: 51.5074, longitude: -0.1278 } // London
      
      const distance = calculateHaversineDistance(coord1, coord2)
      expect(distance).toBeGreaterThan(16000) // About 17,000 km
    })
  })

  describe('getDistanceInfo', () => {
    it('should return comprehensive distance information', () => {
      const info = getDistanceInfo(torontoDowntown, torontoYorkville)
      
      expect(info.kilometers).toBeGreaterThan(2.0)
      expect(info.miles).toBeGreaterThan(1.2)
      expect(info.formattedKm).toContain('km')
      expect(info.formattedMiles).toContain('miles')
      expect(info.walkTime).toContain('min')
    })
  })

  describe('formatDistance', () => {
    it('should format very short distances in meters', () => {
      expect(formatDistance(0.05, 'km')).toBe('50m')
      expect(formatDistance(0.08, 'km')).toBe('80m')
    })

    it('should format distances under 1 unit with decimal places', () => {
      expect(formatDistance(0.15, 'km')).toBe('0.15 km')
      expect(formatDistance(0.5, 'miles')).toBe('0.5 miles')
    })

    it('should format distances under 10 units with one decimal', () => {
      expect(formatDistance(2.7, 'km')).toBe('2.7 km')
      expect(formatDistance(5.2, 'miles')).toBe('5.2 miles')
    })

    it('should format long distances as whole numbers', () => {
      expect(formatDistance(15.7, 'km')).toBe('16 km')
      expect(formatDistance(25.3, 'miles')).toBe('25 miles')
    })
  })

  describe('calculateWalkTime', () => {
    it('should calculate walking time for short distances', () => {
      expect(calculateWalkTime(0.5)).toBe('6 min')
      expect(calculateWalkTime(1.0)).toBe('12 min')
    })

    it('should handle very short distances', () => {
      expect(calculateWalkTime(0.05)).toBe('1 min') // 0.05km / 5kmh * 60min = 0.6min, rounds to 1min
    })

    it('should handle zero or near-zero distances', () => {
      expect(calculateWalkTime(0)).toBe('< 1 min')
      expect(calculateWalkTime(0.005)).toBe('< 1 min') // 0.005km / 5kmh * 60min = 0.06min, rounds to 0min
    })

    it('should format long walking times with hours', () => {
      expect(calculateWalkTime(5.0)).toBe('1h')
      expect(calculateWalkTime(7.5)).toBe('1h 30m')
      expect(calculateWalkTime(10.0)).toBe('2h')
    })
  })

  describe('calculateCafeDistances', () => {
    const mockCafes = [
      { id: 1, name: 'Cafe A', latitude: 43.6532, longitude: -79.3832 },
      { id: 2, name: 'Cafe B', latitude: 43.6708, longitude: -79.3915 },
      { id: 3, name: 'Cafe C', latitude: 43.6426, longitude: -79.4020 },
    ]

    it('should add distance info to all cafes', () => {
      const result = calculateCafeDistances(torontoDowntown, mockCafes)
      
      expect(result).toHaveLength(3)
      expect(result[0].distanceInfo).not.toBeNull()
      expect(result[1].distanceInfo).not.toBeNull()
      expect(result[2].distanceInfo).not.toBeNull()
      
      // First cafe should be at downtown (0 distance)
      expect(result[0].distanceInfo!.kilometers).toBe(0)
    })

    it('should return null distance info when no user location', () => {
      const result = calculateCafeDistances(null, mockCafes)
      
      expect(result).toHaveLength(3)
      expect(result[0].distanceInfo).toBeNull()
      expect(result[1].distanceInfo).toBeNull()
      expect(result[2].distanceInfo).toBeNull()
    })

    it('should preserve original cafe properties', () => {
      const result = calculateCafeDistances(torontoDowntown, mockCafes)
      
      expect(result[0].id).toBe(1)
      expect(result[0].name).toBe('Cafe A')
      expect(result[1].id).toBe(2)
      expect(result[1].name).toBe('Cafe B')
    })
  })

  describe('sortCafesByDistance', () => {
    const mockCafesWithDistance = [
      { 
        id: 1, 
        name: 'Far Cafe',
        distanceInfo: { kilometers: 5.0, miles: 3.1, formattedKm: '5.0 km', formattedMiles: '3.1 miles', walkTime: '1h' }
      },
      { 
        id: 2, 
        name: 'Near Cafe',
        distanceInfo: { kilometers: 1.0, miles: 0.6, formattedKm: '1.0 km', formattedMiles: '0.6 miles', walkTime: '12 min' }
      },
      { 
        id: 3, 
        name: 'No Distance Cafe',
        distanceInfo: null
      },
    ]

    it('should sort cafes by distance ascending', () => {
      const sorted = sortCafesByDistance(mockCafesWithDistance)
      
      expect(sorted[0].name).toBe('Near Cafe')
      expect(sorted[1].name).toBe('Far Cafe')
      expect(sorted[2].name).toBe('No Distance Cafe') // Null distances go to end
    })

    it('should not modify original array', () => {
      const original = [...mockCafesWithDistance]
      sortCafesByDistance(mockCafesWithDistance)
      
      expect(mockCafesWithDistance).toEqual(original)
    })
  })

  describe('findNearestCafe', () => {
    const mockCafesWithDistance = [
      { 
        id: 1, 
        name: 'Far Cafe',
        distanceInfo: { kilometers: 5.0, miles: 3.1, formattedKm: '5.0 km', formattedMiles: '3.1 miles', walkTime: '1h' }
      },
      { 
        id: 2, 
        name: 'Nearest Cafe',
        distanceInfo: { kilometers: 0.5, miles: 0.3, formattedKm: '0.5 km', formattedMiles: '0.3 miles', walkTime: '6 min' }
      },
      { 
        id: 3, 
        name: 'No Distance Cafe',
        distanceInfo: null
      },
    ]

    it('should find the nearest cafe', () => {
      const nearest = findNearestCafe(mockCafesWithDistance)
      
      expect(nearest).not.toBeNull()
      expect(nearest!.name).toBe('Nearest Cafe')
      expect(nearest!.distanceInfo!.kilometers).toBe(0.5)
    })

    it('should return null if no cafes have distance info', () => {
      const cafesWithoutDistance = [
        { id: 1, name: 'Cafe A', distanceInfo: null },
        { id: 2, name: 'Cafe B', distanceInfo: null },
      ]
      
      const nearest = findNearestCafe(cafesWithoutDistance)
      expect(nearest).toBeNull()
    })

    it('should return null for empty array', () => {
      const nearest = findNearestCafe([])
      expect(nearest).toBeNull()
    })
  })
})