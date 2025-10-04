import { create } from 'zustand'
import { useLocationStore } from './locationStore'
import { useDataStore } from './dataStore'
import { calculateCafeDistances } from '../utils/distance'
import type { CafeWithDistance } from '../types'

interface CafeStore {
  // Computed cafe list with distances calculated (shows all cafes regardless of city)
  cafesWithDistance: CafeWithDistance[]

  // Selected cafe state
  selectedCafe: CafeWithDistance | null
  setSelectedCafe: (cafe: CafeWithDistance | null) => void

  // Internal method to recalculate cafes (called by subscriber)
  _recalculateCafes: () => void
}

export const useCafeStore = create<CafeStore>((set) => ({
  cafesWithDistance: [],

  selectedCafe: null,
  setSelectedCafe: (cafe) => set({ selectedCafe: cafe }),

  _recalculateCafes: () => {
    // Get current state from other stores
    const { allCafes } = useDataStore.getState()
    const { coordinates } = useLocationStore.getState()

    // Show all cafes (no city filtering) - user can see all cafes when zoomed out
    const cafesToShow = allCafes

    // Calculate distances if we have user location
    let cafesWithDistance: CafeWithDistance[]

    if (coordinates) {
      const userLocation = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }
      cafesWithDistance = calculateCafeDistances(userLocation, cafesToShow)
    } else {
      // No user location - return cafes with null distance info
      cafesWithDistance = cafesToShow.map(cafe => ({
        ...cafe,
        distanceInfo: null,
      }))
    }

    set({ cafesWithDistance })
  },
}))

// Subscribe to data store changes (when cafes are fetched)
useDataStore.subscribe(() => {
  useCafeStore.getState()._recalculateCafes()
})

// Subscribe to location store changes
useLocationStore.subscribe(() => {
  useCafeStore.getState()._recalculateCafes()
})

// Note: No longer subscribing to city changes since we show all cafes regardless of city
// City selection is only used for map centering, not cafe filtering

// Initial calculation on store creation
useCafeStore.getState()._recalculateCafes()
