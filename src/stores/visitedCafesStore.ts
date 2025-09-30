import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface VisitedCafesState {
  // Visited locations (for detail view)
  visitedCafeIds: number[]
  markAsVisited: (cafeId: number) => void
  markAsUnvisited: (cafeId: number) => void
  toggleVisited: (cafeId: number) => void
  isVisited: (cafeId: number) => boolean
  getVisitedCount: () => number
  clearAllVisited: () => void

  // Passport stamps (for passport view)
  stampedCafeIds: number[]
  addStamp: (cafeId: number) => void
  removeStamp: (cafeId: number) => void
  toggleStamp: (cafeId: number) => void
  isStamped: (cafeId: number) => boolean
  getStampCount: () => number
  clearAllStamps: () => void
}

export const useVisitedCafesStore = create<VisitedCafesState>()(
  persist(
    (set, get) => ({
      // Visited locations
      visitedCafeIds: [],
      markAsVisited: (cafeId) =>
        set((state) => ({
          visitedCafeIds: state.visitedCafeIds.includes(cafeId)
            ? state.visitedCafeIds
            : [...state.visitedCafeIds, cafeId],
        })),
      markAsUnvisited: (cafeId) =>
        set((state) => ({
          visitedCafeIds: state.visitedCafeIds.filter((id) => id !== cafeId),
        })),
      toggleVisited: (cafeId) => {
        const state = get()
        if (state.visitedCafeIds.includes(cafeId)) {
          state.markAsUnvisited(cafeId)
        } else {
          state.markAsVisited(cafeId)
        }
      },
      isVisited: (cafeId) => get().visitedCafeIds.includes(cafeId),
      getVisitedCount: () => get().visitedCafeIds.length,
      clearAllVisited: () => set({ visitedCafeIds: [] }),

      // Passport stamps
      stampedCafeIds: [],
      addStamp: (cafeId) =>
        set((state) => ({
          stampedCafeIds: state.stampedCafeIds.includes(cafeId)
            ? state.stampedCafeIds
            : [...state.stampedCafeIds, cafeId],
        })),
      removeStamp: (cafeId) =>
        set((state) => ({
          stampedCafeIds: state.stampedCafeIds.filter((id) => id !== cafeId),
        })),
      toggleStamp: (cafeId) => {
        const state = get()
        if (state.stampedCafeIds.includes(cafeId)) {
          state.removeStamp(cafeId)
        } else {
          state.addStamp(cafeId)
        }
      },
      isStamped: (cafeId) => get().stampedCafeIds.includes(cafeId),
      getStampCount: () => get().stampedCafeIds.length,
      clearAllStamps: () => set({ stampedCafeIds: [] }),
    }),
    {
      name: 'matchamap-visited-cafes',
    }
  )
)
