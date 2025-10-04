import { create } from 'zustand'

interface UIState {
  // Map popover state
  showPopover: boolean
  setShowPopover: (show: boolean) => void
  closePopover: () => void

  // List view state
  expandedCard: number | null
  setExpandedCard: (id: number | null) => void

  // Drink type filter state (shared across Map and List views)
  selectedDrinkType: string | null
  setSelectedDrinkType: (drinkType: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Map popover state
  showPopover: false,
  setShowPopover: (show) => set({ showPopover: show }),
  closePopover: () => set({ showPopover: false }),

  // List view state
  expandedCard: null,
  setExpandedCard: (id) => set({ expandedCard: id }),

  // Drink type filter state
  selectedDrinkType: null,
  setSelectedDrinkType: (drinkType) => set({ selectedDrinkType: drinkType }),
}))
