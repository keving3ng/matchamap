import { create } from 'zustand'

interface SessionExpiryState {
  showDialog: boolean
  intendedDestination: string | null
  
  // Actions
  showSessionExpiredDialog: (currentPath?: string) => void
  hideSessionExpiredDialog: () => void
  getIntendedDestination: () => string | null
  clearIntendedDestination: () => void
}

/**
 * Hook for managing session expiry dialog state
 * Stores the intended destination for post-login redirect
 */
export const useSessionExpiry = create<SessionExpiryState>((set, get) => ({
  showDialog: false,
  intendedDestination: null,

  showSessionExpiredDialog: (currentPath?: string) => {
    // Store current path in sessionStorage for post-login redirect
    if (currentPath) {
      sessionStorage.setItem('matchamap-redirect-after-login', currentPath)
      set({ intendedDestination: currentPath })
    }
    set({ showDialog: true })
  },

  hideSessionExpiredDialog: () => {
    set({ showDialog: false })
  },

  getIntendedDestination: () => {
    const stored = sessionStorage.getItem('matchamap-redirect-after-login')
    return stored || get().intendedDestination
  },

  clearIntendedDestination: () => {
    sessionStorage.removeItem('matchamap-redirect-after-login')
    set({ intendedDestination: null })
  },
}))