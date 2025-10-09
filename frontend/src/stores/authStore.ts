import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginRequest, LoginResponse, RegisterRequest } from '../../../shared/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<boolean>
  getCurrentUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Login failed')
          }

          const data: LoginResponse = await response.json()

          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          })
          throw error
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Registration failed')
          }

          await response.json()
          set({ isLoading: false, error: null })

          // After successful registration, automatically log in
          await get().login({ email: data.email, password: data.password })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          })
          throw error
        }
      },

      logout: () => {
        // Optionally call logout endpoint
        const { accessToken } = get()
        if (accessToken) {
          fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }).catch(() => {
            // Ignore errors on logout
          })
        }

        // Clear auth state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        })

        // Explicitly clear sessionStorage to ensure tokens are removed
        sessionStorage.removeItem('matchamap-auth')
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return false

        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          })

          if (!response.ok) {
            // If refresh fails, log out
            get().logout()
            return false
          }

          const data = await response.json()
          set({ accessToken: data.accessToken })
          return true
        } catch (error) {
          get().logout()
          return false
        }
      },

      getCurrentUser: async () => {
        const { accessToken } = get()
        if (!accessToken) return

        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })

          if (!response.ok) {
            // Token might be expired, try to refresh
            const refreshed = await get().refreshAccessToken()
            if (refreshed) {
              // Retry with new token
              await get().getCurrentUser()
            }
            return
          }

          const data = await response.json()
          set({ user: data.user })
        } catch (error) {
          console.error('Failed to get current user:', error)
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'matchamap-auth',
      // Use sessionStorage instead of localStorage for better security
      // Tokens will be cleared when browser tab closes
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }) as AuthState,
    }
  )
)
