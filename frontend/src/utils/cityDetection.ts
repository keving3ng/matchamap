import { CITIES, type CityKey } from '../stores/cityStore'
import { calculateHaversineDistance } from './distance'

/**
 * Finds the closest city to a given coordinate
 * @param lat Latitude of the point
 * @param lng Longitude of the point
 * @returns The key of the closest city
 */
export const findClosestCity = (lat: number, lng: number): CityKey => {
  let closestCity: CityKey = 'toronto'
  let minDistance = Infinity

  for (const [cityKey, city] of Object.entries(CITIES) as [CityKey, typeof CITIES[CityKey]][]) {
    const distance = calculateHaversineDistance(
      { latitude: lat, longitude: lng },
      { latitude: city.center[0], longitude: city.center[1] }
    )

    if (distance < minDistance) {
      minDistance = distance
      closestCity = cityKey
    }
  }

  return closestCity
}
