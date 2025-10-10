import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../utils/api'
import { CityKey } from '../../../shared/types'

export type { CityKey }

export interface City {
  key: CityKey
  name: string
  shortCode: string
  center: [number, number] // [lat, lng]
  zoom: number
}

/**
 * City configuration for map navigation and display
 * Keys MUST match VALID_CITY_KEYS in shared/types/index.ts
 *
 * To add a new city:
 * 1. Add the key to VALID_CITY_KEYS in shared/types/index.ts
 * 2. Add city details here
 * 3. Deploy and admin UI will automatically include it
 */
export const CITIES: Record<CityKey, City> = {
  toronto: {
    key: 'toronto',
    name: 'Toronto',
    shortCode: 'TO',
    center: [43.6532, -79.3832],
    zoom: 14,
  },
  montreal: {
    key: 'montreal',
    name: 'Montreal',
    shortCode: 'MTL',
    center: [45.5017, -73.5673],
    zoom: 13,
  },
  'new york': {
    key: 'new york',
    name: 'New York',
    shortCode: 'NYC',
    center: [40.7280, -73.9855],
    zoom: 13,
  },
  mississauga: {
    key: 'mississauga',
    name: 'Mississauga',
    shortCode: 'MIS',
    center: [43.5890, -79.6441],
    zoom: 13,
  },
  scarborough: {
    key: 'scarborough',
    name: 'Scarborough',
    shortCode: 'SCA',
    center: [43.7731, -79.2578],
    zoom: 13,
  },
  tokyo: {
    key: 'tokyo',
    name: 'Tokyo',
    shortCode: 'TYO',
    center: [35.6762, 139.6503],
    zoom: 13,
  },
  kyoto: {
    key: 'kyoto',
    name: 'Kyoto',
    shortCode: 'KYO',
    center: [35.0116, 135.7681],
    zoom: 13,
  },
  osaka: {
    key: 'osaka',
    name: 'Osaka',
    shortCode: 'OSA',
    center: [34.6937, 135.5023],
    zoom: 13,
  },
}

interface CityState {
  selectedCity: CityKey
  availableCities: CityKey[]
  availableCitiesLoaded: boolean
  setCity: (city: CityKey) => void
  getCity: () => City
  getAvailableCities: () => City[]
  loadAvailableCities: () => Promise<void>
}

export const useCityStore = create<CityState>()(
  persist(
    (set, get) => ({
      selectedCity: 'toronto',
      availableCities: [],
      availableCitiesLoaded: false,
      setCity: (city) => {
        // Only allow selection of available cities
        const availableCities = get().availableCities
        if (availableCities.length === 0 || availableCities.includes(city)) {
          set({ selectedCity: city })
        }
      },
      getCity: () => CITIES[get().selectedCity],
      getAvailableCities: () => {
        const availableCities = get().availableCities
        return availableCities.map(cityKey => CITIES[cityKey]).filter(Boolean)
      },
      loadAvailableCities: async () => {
        try {
          const { cities } = await api.cities.getAll()

          // City keys are already normalized in the database
          // Just need to lowercase and filter to valid CITIES
          const availableCityKeys = cities
            .map(cityData => cityData.city.toLowerCase().trim() as CityKey)
            .filter(cityKey => cityKey in CITIES)
            // Remove duplicates
            .filter((city, index, self) => self.indexOf(city) === index)

          set({
            availableCities: availableCityKeys,
            availableCitiesLoaded: true
          })

          // If current selected city is not available, fallback to first available or default
          const currentCity = get().selectedCity
          if (availableCityKeys.length > 0 && !availableCityKeys.includes(currentCity)) {
            set({ selectedCity: availableCityKeys[0] })
          }
        } catch (error) {
          console.error('Failed to load available cities:', error)
          // Fallback to all cities if API fails
          set({
            availableCities: Object.keys(CITIES) as CityKey[],
            availableCitiesLoaded: true
          })
        }
      },
    }),
    {
      name: 'matchamap_selected_city',
    }
  )
)
