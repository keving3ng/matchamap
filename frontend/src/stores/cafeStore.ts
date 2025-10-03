import { create } from 'zustand'
import { useLocationStore } from './locationStore'
import { useCityStore } from './cityStore'
import { useDataStore } from './dataStore'
import { calculateCafeDistances } from '../utils/distance'
import type { CafeWithDistance } from '../types'

interface CafeStore {
  // Computed cafe list with distances calculated for selected city
  cafesWithDistance: CafeWithDistance[]

  // Selected cafe state
  selectedCafe: CafeWithDistance | null
  setSelectedCafe: (cafe: CafeWithDistance | null) => void

  // Internal method to recalculate cafes (called by subscriber)
  _recalculateCafes: () => void
}

export const useCafeStore = create<CafeStore>((set, get) => ({
  cafesWithDistance: [],

  selectedCafe: null,
  setSelectedCafe: (cafe) => set({ selectedCafe: cafe }),

  _recalculateCafes: () => {
    // Get current state from other stores
    const { allCafes } = useDataStore.getState()
    const { selectedCity } = useCityStore.getState()
    const { coordinates } = useLocationStore.getState()

    // Filter cafes by selected city (case-insensitive)
    const filteredCafes = allCafes.filter(cafe => {
      if (!cafe.city) return false // Skip cafes without city
      return cafe.city.toLowerCase() === selectedCity.toLowerCase()
    })

    // Calculate distances if we have user location
    let cafesWithDistance: CafeWithDistance[]

    if (coordinates) {
      const userLocation = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }
      cafesWithDistance = calculateCafeDistances(userLocation, filteredCafes)
    } else {
      // No user location - return cafes with null distance info
      cafesWithDistance = filteredCafes.map(cafe => ({
        ...cafe,
        distanceInfo: null,
      }))
    }

    set({ cafesWithDistance })
  },
}))

// Subscribe to data store changes (when cafes are fetched)
useDataStore.subscribe((state) => {
  useCafeStore.getState()._recalculateCafes()
})

// Subscribe to location store changes
useLocationStore.subscribe((state) => {
  useCafeStore.getState()._recalculateCafes()
})

// Subscribe to city store changes
useCityStore.subscribe((state) => {
  useCafeStore.getState()._recalculateCafes()
})

// Initial calculation on store creation
useCafeStore.getState()._recalculateCafes()
