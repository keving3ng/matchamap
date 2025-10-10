/**
 * Utility functions for working with city data and filtering
 */

import type { Cafe } from '../../../shared/types'

/**
 * Extract unique cities from an array of cafes
 * Only returns cities that have at least one cafe
 * @param cafes Array of cafe objects
 * @returns Sorted array of unique city names
 */
export const getAvailableCitiesFromCafes = (cafes: Cafe[]): string[] => {
  return [...new Set(cafes.map(cafe => cafe.city).filter(Boolean))].sort()
}

