import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthStore } from '../authStore'
import { waitForPersistence, createMockUser } from '../../test/helpers'
import type { User, RegisterRequest } from '../../../../shared/types'

// Mock the API
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('authStore', () => {
  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    role: 'user',
    lastActiveAt: null,
    isEmailVerified: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  }

  const mockLoginResponse = {
    user: mockUser,
  }

  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })

    // Reset fetch mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with unauthenticated state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle auth state without persistence', () => {
      // Directly set state to simulate authenticated session
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      })

      const { result } = renderHook(() => useAuthStore())

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('login', () => {
    it('should set user on successful login', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLoginResponse),
      })

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' })
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      
      // Verify credentials: 'include' is used
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          credentials: 'include',
        })
      )
    })

    it('should handle login errors properly', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })

      await act(async () => {
        try {
          await result.current.login({ email: 'test@example.com', password: 'wrongpassword' })
        } catch (error) {
          // Expected error
        }
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Invalid credentials')
    })

    it('should set loading state during login', async () => {
      const { result } = renderHook(() => useAuthStore())

      let resolvePromise: () => void
      const delayedPromise = new Promise<any>((resolve) => {
        resolvePromise = () => {
          resolve({
            ok: true,
            json: () => Promise.resolve(mockLoginResponse),
          })
        }
      })

      mockFetch.mockReturnValueOnce(delayedPromise)

      // Start login in act()
      act(() => {
        result.current.login({ email: 'test@example.com', password: 'password123' })
      })

      // Wait for loading state to become true
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve the promise and wait for completion
      await act(async () => {
        resolvePromise!()
        // Give the promise chain time to complete
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('should handle login failure with error message', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })

      await expect(async () => {
        await act(async () => {
          await result.current.login({ email: 'wrong@example.com', password: 'wrongpass' })
        })
      }).rejects.toThrow('Invalid credentials')

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Invalid credentials')
    })

    it('should handle network error during login', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(async () => {
        await act(async () => {
          await result.current.login({ email: 'test@example.com', password: 'password123' })
        })
      }).rejects.toThrow('Network error')

      expect(result.current.error).toBe('Network error')
      expect(result.current.isLoading).toBe(false)
    })

    it('should make correct API request', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLoginResponse),
      })

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' })
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        }
      )
    })
  })

  describe('register', () => {
    const registerData: RegisterRequest = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
    }

    it('should register and automatically login on success', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Mock register response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Registration successful' }),
      })

      // Mock login response (auto-login after register)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLoginResponse),
      })

      await act(async () => {
        await result.current.register(registerData)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.error).toBeNull()
      
      // Should have called register endpoint first
      expect(mockFetch).toHaveBeenNthCalledWith(1,
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(registerData),
        })
      )

      // Then login endpoint
      expect(mockFetch).toHaveBeenNthCalledWith(2,
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ email: registerData.email, password: registerData.password }),
        })
      )
    })

    it('should handle registration failure', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Email already exists' }),
      })

      await expect(async () => {
        await act(async () => {
          await result.current.register(registerData)
        })
      }).rejects.toThrow('Email already exists')

      expect(result.current.error).toBe('Email already exists')
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('should clear user state and call logout endpoint', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
        })
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await act(async () => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        {
          method: 'POST',
          credentials: 'include',
        }
      )
    })

    it('should clear auth state on logout', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
        })
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await act(async () => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should handle logout endpoint failure gracefully', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
        })
      })

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        result.current.logout()
      })

      // Should still clear state even if endpoint fails
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('clearAuth', () => {
    it('should clear auth state without calling logout endpoint', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
        })
      })

      await act(async () => {
        result.current.clearAuth()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)

      // Should not call any API endpoints
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      let refreshResult: boolean | undefined
      await act(async () => {
        refreshResult = await result.current.refreshAccessToken()
      })

      expect(refreshResult).toBe(true)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/refresh'),
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    })

    it('should return false and logout if refresh fails', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Mock failed refresh response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid refresh token' }),
      })

      // Mock logout endpoint (called when refresh fails)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      let refreshResult: boolean | undefined
      await act(async () => {
        refreshResult = await result.current.refreshAccessToken()
      })

      expect(refreshResult).toBe(false)
    })

    it('should logout if refresh fails', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial state with user
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
        })
      })

      // Mock failed refresh response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid refresh token' }),
      })

      // Mock logout endpoint (called when refresh fails)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      let refreshResult: boolean | undefined
      await act(async () => {
        refreshResult = await result.current.refreshAccessToken()
      })

      expect(refreshResult).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('should fetch current user with cookies', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      })

      await act(async () => {
        await result.current.getCurrentUser()
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        {
          credentials: 'include',
        }
      )
    })

    it('should handle failed getCurrentUser request', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Mock failed getCurrentUser (401)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      // Mock successful refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      // Mock successful retry of getCurrentUser
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      })

      await act(async () => {
        await result.current.getCurrentUser()
      })

      // Should have: 1) failed getCurrentUser, 2) refresh, 3) retry getCurrentUser
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should retry getCurrentUser after successful token refresh', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Mock failed user request (401)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      // Mock successful refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      // Mock successful retry of getCurrentUser
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      })

      await act(async () => {
        await result.current.getCurrentUser()
      })

      // Should have: 1) failed getCurrentUser, 2) refresh, 3) retry getCurrentUser
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useAuthStore())

      // Set error state
      act(() => {
        useAuthStore.setState({ error: 'Some error' })
      })

      expect(result.current.error).toBe('Some error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('persistence', () => {
    it('should handle state changes correctly', async () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
          isLoading: true,
          error: 'some error',
        })
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBe('some error')
    })
  })
})