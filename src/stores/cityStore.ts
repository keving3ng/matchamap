import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CityKey = 'toronto' | 'montreal' | 'tokyo'

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
    zoom: 13,
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
