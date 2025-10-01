import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDistanceCalculation } from '../useDistanceCalculation'
import type { Cafe } from '../../types'
import type { Coordinates } from '../../utils/distance'

const mockCafes: Cafe[] = [
  {
    id: 1,
    name: 'Downtown Cafe',
    score: 9.0,
    lat: 43.6532,
    lng: -79.3832,
    neighborhood: 'Downtown',
    address: '123 Main St',
    quickNote: 'Great matcha',
    city: 'toronto',
    emoji: '🍃',
    color: 'from-green-400 to-green-600',
  },
  {
    id: 2,
    name: 'Yorkville Cafe',
    score: 8.5,
    lat: 43.6708,
    lng: -79.3915,
    neighborhood: 'Yorkville',
    address: '456 Bloor St',
    quickNote: 'Nice ambiance',
    city: 'toronto',
    emoji: '☯️',
    color: 'from-purple-400 to-purple-600',
  },
  {
    id: 3,
    name: 'Queen West Cafe',
    score: 8.0,
    lat: 43.6426,
    lng: -79.4020,
    neighborhood: 'Queen West',
    address: '789 Queen St',
    quickNote: 'Trendy spot',
    city: 'toronto',
    emoji: '🎋',
    color: 'from-emerald-400 to-emerald-600',
  },
]

const torontoDowntown: Coordinates = { latitude: 43.6532, longitude: -79.3832 }

describe('useDistanceCalculation', () => {
  it('should initialize with empty distance data when no user location', () => {
    const { result } = renderHook(() =>
      useDistanceCalculation({
        cafes: mockCafes,
        userLocation: null,
      })
    )

    expect(result.current.hasUserLocation).toBe(false)
    expect(result.current.cafesWithDistance).toHaveLength(3)
    expect(result.current.cafesWithDistance[0].distanceInfo).toBeNull()
    expect(result.current.nearestCafe).toBeNull()
    expect(result.current.distanceStats.count).toBe(0)
  })

  it('should calculate distances when user location is provided', () => {
    const { result } = renderHook(() =>
      useDistanceCalculation({
        cafes: mockCafes,
        userLocation: torontoDowntown,
      })
    )

    expect(result.current.hasUserLocation).toBe(true)
    expect(result.current.cafesWithDistance).toHaveLength(3)
    
    // Downtown cafe should be closest (0 distance)
    const downtownCafe = result.current.cafesWithDistance.find(c => c.id === 1)
    expect(downtownCafe?.distanceInfo?.kilometers).toBe(0)
  })

  it('should sort cafes by distance', () => {
    const { result } = renderHook(() =>
      useDistanceCalculation({
        cafes: mockCafes,
        userLocation: torontoDowntown,
      })
    )

    const sorted = result.current.cafesByDistance
    
    // Downtown cafe should be first (closest)
    expect(sorted[0].id).toBe(1)
    expect(sorted[0].name).toBe('Downtown Cafe')
    
    // Should be sorted by distance ascending
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i].distanceInfo?.kilometers || Infinity
      const previous = sorted[i - 1].distanceInfo?.kilometers || Infinity
      expect(current).toBeGreaterThanOrEqual(previous)
    }
  })

  it('should find nearest cafe', () => {
    const { result } = renderHook(() =>
      useDistanceCalculation({
        cafes: mockCafes,
        userLocation: torontoDowntown,
      })
    )

    const nearest = result.current.nearestCafe
    expect(nearest).not.toBeNull()
    expect(nearest!.id).toBe(1)
    expect(nearest!.name).toBe('Downtown Cafe')
  })

  it('should provide distance statistics', () => {
    const { result } = renderHook(() =>
      useDistanceCalculation({
        cafes: mockCafes,
        userLocation: torontoDowntown,
      })
    )

    const stats = result.current.distanceStats
    expect(stats.count).toBe(3)
    expect(stats.minDistance).toBe(0)
    expect(stats.maxDistance).toBeGreaterThan(0)
    expect(stats.averageDistance).toBeGreaterThan(0)
  })

  it('should get distance for specific cafe', () => {
    const { result } = renderHook(() =>
      useDistanceCalculation({
        cafes: mockCafes,
        userLocation: torontoDowntown,
      })
    )

    const distanceInfo = result.current.getDistanceForCafe(1)
    expect(distanceInfo).not.toBeNull()
    expect(distanceInfo!.kilometers).toBe(0)

    const nonExistentCafe = result.current.getDistanceForCafe(999)
    expect(nonExistentCafe).toBeNull()
  })

  it('should filter cafes within distance', () => {
    const { result } = renderHook(() =>
      useDistanceCalculation({
        cafes: mockCafes,
        userLocation: torontoDowntown,
      })
    )

    const within1km = result.current.getCafesWithinDistance(1)
    expect(within1km).toHaveLength(1)
    expect(within1km[0].id).toBe(1) // Only downtown cafe

    const within5km = result.current.getCafesWithinDistance(5)
    expect(within5km).toHaveLength(3) // All cafes should be within 5km
  })

  it('should handle auto-update with movement threshold', () => {
    const { result, rerender } = renderHook(
      ({ userLocation }) =>
        useDistanceCalculation({
          cafes: mockCafes,
          userLocation,
          autoUpdate: true,
          updateThresholdMeters: 100, // 100 meters threshold
        }),
      {
        initialProps: { userLocation: torontoDowntown },
      }
    )

    const initialLocation = result.current.lastCalculatedLocation

    // Small movement (under threshold)
    const smallMovement: Coordinates = {
      latitude: torontoDowntown.latitude + 0.0001, // ~11 meters
      longitude: torontoDowntown.longitude,
    }

    rerender({ userLocation: smallMovement })

    // Should not recalculate for small movement
    expect(result.current.lastCalculatedLocation).toEqual(initialLocation)

    // Large movement (over threshold)
    const largeMovement: Coordinates = {
      latitude: torontoDowntown.latitude + 0.001, // ~111 meters
      longitude: torontoDowntown.longitude,
    }

    rerender({ userLocation: largeMovement })

    // Should recalculate for large movement
    expect(result.current.lastCalculatedLocation).not.toEqual(initialLocation)
  })

  it('should manually recalculate distances', () => {
    const { result } = renderHook(() =>
      useDistanceCalculation({
        cafes: mockCafes,
        userLocation: torontoDowntown,
      })
    )

    act(() => {
      result.current.recalculateDistances()
    })

    // Manual recalculation should reset last calculated location
    expect(result.current.lastCalculatedLocation).toBeNull()
  })

  it('should disable auto-update when autoUpdate is false', () => {
    const { result, rerender } = renderHook(
      ({ userLocation }) =>
        useDistanceCalculation({
          cafes: mockCafes,
          userLocation,
          autoUpdate: false,
        }),
      {
        initialProps: { userLocation: torontoDowntown },
      }
    )

    const initialLocation = result.current.lastCalculatedLocation

    // Movement should not trigger recalculation
    const newLocation: Coordinates = {
      latitude: torontoDowntown.latitude + 0.01,
      longitude: torontoDowntown.longitude,
    }

    rerender({ userLocation: newLocation })

    expect(result.current.lastCalculatedLocation).toEqual(initialLocation)
  })
})