import { create } from 'zustand'
import type { CafeWithDistance } from '../types'

interface CafeStore {
  // Cafe list with distances calculated
  cafesWithDistance: CafeWithDistance[]
  setCafesWithDistance: (cafes: CafeWithDistance[]) => void

  // Selected cafe state
  selectedCafe: CafeWithDistance | null
  setSelectedCafe: (cafe: CafeWithDistance | null) => void

  // User coordinates (for distance calculation)
  userCoordinates: GeolocationCoordinates | null
  setUserCoordinates: (coords: GeolocationCoordinates | null) => void
}

export const useCafeStore = create<CafeStore>((set) => ({
  cafesWithDistance: [],
  setCafesWithDistance: (cafes) => set({ cafesWithDistance: cafes }),

  selectedCafe: null,
  setSelectedCafe: (cafe) => set({ selectedCafe: cafe }),

  userCoordinates: null,
  setUserCoordinates: (coords) => set({ userCoordinates: coords }),
}))
