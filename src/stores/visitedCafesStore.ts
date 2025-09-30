import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface VisitedCafesState {
  visitedCafeIds: number[]
  markAsVisited: (cafeId: number) => void
  markAsUnvisited: (cafeId: number) => void
  toggleVisited: (cafeId: number) => void
  isVisited: (cafeId: number) => boolean
  getVisitedCount: () => number
  clearAllVisited: () => void
}

export const useVisitedCafesStore = create<VisitedCafesState>()(
  persist(
    (set, get) => ({
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
    }),
    {
      name: 'matchamap-visited-cafes',
    }
  )
)
