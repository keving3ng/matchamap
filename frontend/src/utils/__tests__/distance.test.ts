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

  it('calculates Haversine distance and comprehensive distance info', () => {
    expect(calculateHaversineDistance(torontoDowntown, torontoDowntown)).toBe(0)
    const info = getDistanceInfo(torontoDowntown, torontoYorkville)
    expect(info.kilometers).toBeGreaterThan(2.0)
    expect(info.kilometers).toBeLessThan(2.5)
    expect(info.formattedKm).toContain('km')
    expect(info.formattedMiles).toContain('miles')
    expect(info.walkTime).toContain('min')
  })

  it('formats distances and walk times across short and long ranges', () => {
    expect(formatDistance(0.05, 'km')).toBe('50m')
    expect(formatDistance(0.5, 'miles')).toBe('0.5 miles')
    expect(formatDistance(2.7, 'km')).toBe('2.7 km')
    expect(formatDistance(15.7, 'km')).toBe('16 km')

    expect(calculateWalkTime(0)).toBe('< 1 min')
    expect(calculateWalkTime(0.5)).toBe('6 min')
    expect(calculateWalkTime(7.5)).toBe('1h 30m')
  })

  it('calculates, sorts, and finds nearest cafes without mutating input', () => {
    const cafes = [
      { id: 1, name: 'Yorkville', latitude: 43.6708, longitude: -79.3915 },
      { id: 2, name: 'Downtown', latitude: 43.6532, longitude: -79.3832 },
    ]
    expect(calculateCafeDistances(null, cafes).every(c => c.distanceInfo === null)).toBe(true)

    const withDist = calculateCafeDistances(torontoDowntown, cafes)
    const sorted = sortCafesByDistance([
      ...withDist,
      { id: 3, name: 'Unknown', latitude: 0, longitude: 0, distanceInfo: null },
    ])
    expect(sorted.map(c => c.name)).toEqual(['Downtown', 'Yorkville', 'Unknown'])
    expect(findNearestCafe(withDist)?.name).toBe('Downtown')
    expect(findNearestCafe([])).toBeNull()
  })
})
