import { create } from 'zustand'
import type { CafeWithDistance } from '../types'

interface UIState {
  // Map popover state
  showPopover: boolean
  selectedCafe: CafeWithDistance | null
  setShowPopover: (show: boolean) => void
  setSelectedCafe: (cafe: CafeWithDistance | null) => void
  closePopover: () => void

  // List view state
  expandedCard: number | null
  setExpandedCard: (id: number | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Map popover state
  showPopover: false,
  selectedCafe: null,
  setShowPopover: (show) => set({ showPopover: show }),
  setSelectedCafe: (cafe) => set({ selectedCafe: cafe }),
  closePopover: () => set({ showPopover: false }),

  // List view state
  expandedCard: null,
  setExpandedCard: (id) => set({ expandedCard: id }),
}))
