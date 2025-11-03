import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginRequest, RegisterRequest } from '../../../shared/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  clearAuth: () => void
  refreshAccessToken: () => Promise<boolean>
  getCurrentUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            credentials: 'include', // Include cookies in request
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Login failed')
          }

          const data = await response.json()

          set({
            user: data.user,
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
            credentials: 'include', // Include cookies in request
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
        // Call logout endpoint to clear cookies on server
        fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include', // Include cookies in request
        }).catch(() => {
          // Ignore errors on logout
        })

        // Clear auth state
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        })
      },

      clearAuth: () => {
        // Clear auth state without calling logout endpoint
        // Used when token is already invalid (401/403 responses)
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        })
      },

      refreshAccessToken: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include', // Include cookies (refresh token) in request
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            // If refresh fails, log out
            get().logout()
            return false
          }

          // Server sets new access token cookie automatically
          return true
        } catch {
          get().logout()
          return false
        }
      },

      getCurrentUser: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            credentials: 'include', // Include cookies (access token) in request
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
          set({ user: data.user, isAuthenticated: true })
        } catch (error) {
          console.error('Failed to get current user:', error)
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
