import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CityKey = 'toronto' | 'montreal' | 'tokyo' | 'kyoto' | 'osaka' | 'new york' | 'mississauga' | 'scarborough'

export interface City {
  key: CityKey
  name: string
  shortCode: string
  center: [number, number] // [lat, lng]
  zoom: number
}

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
}

interface CityState {
  selectedCity: CityKey
  setCity: (city: CityKey) => void
  getCity: () => City
}

export const useCityStore = create<CityState>()(
  persist(
    (set, get) => ({
      selectedCity: 'toronto',
      setCity: (city) => set({ selectedCity: city }),
      getCity: () => CITIES[get().selectedCity],
    }),
    {
      name: 'matchamap_selected_city',
    }
  )
)
