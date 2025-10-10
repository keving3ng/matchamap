import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../authStore'
import type { User, LoginResponse, RegisterRequest } from '../../../../shared/types'

// Mock the API
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

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

  const mockLoginResponse: LoginResponse = {
    user: mockUser,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }

  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
    
    // Clear sessionStorage
    sessionStorageMock.clear()
    
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
      expect(result.current.accessToken).toBeNull()
      expect(result.current.refreshToken).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should restore session from sessionStorage on init', () => {
      // Set up sessionStorage with existing session
      const persistedData = {
        state: {
          user: mockUser,
          accessToken: 'persisted-token',
          refreshToken: 'persisted-refresh-token',
          isAuthenticated: true,
        },
        version: 0
      }
      sessionStorageMock.setItem('matchamap-auth', JSON.stringify(persistedData))
      
      // Create new store instance to trigger restoration
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.accessToken).toBe('persisted-token')
      expect(result.current.refreshToken).toBe('persisted-refresh-token')
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('login', () => {
    it('should set user and tokens on successful login', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLoginResponse),
      })

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' })
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.accessToken).toBe('mock-access-token')
      expect(result.current.refreshToken).toBe('mock-refresh-token')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should persist session to sessionStorage', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLoginResponse),
      })

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' })
      })

      const storedData = sessionStorageMock.getItem('matchamap-auth')
      expect(storedData).toBeTruthy()
      
      const parsedData = JSON.parse(storedData!)
      expect(parsedData.state.user).toEqual(mockUser)
      expect(parsedData.state.accessToken).toBe('mock-access-token')
      expect(parsedData.state.isAuthenticated).toBe(true)
    })

    it('should set loading state during login', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockFetch.mockImplementationOnce(() => new Promise(resolve => {
        // Check loading state while request is pending
        expect(result.current.isLoading).toBe(true)
        resolve({
          ok: true,
          json: () => Promise.resolve(mockLoginResponse),
        })
      }))

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' })
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
      expect(result.current.accessToken).toBeNull()
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
          body: JSON.stringify(registerData),
        })
      )

      // Then login endpoint
      expect(mockFetch).toHaveBeenNthCalledWith(2,
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
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
    beforeEach(async () => {
      // Set authenticated state
      const { result } = renderHook(() => useAuthStore())
      await act(async () => {
        result.current.useAuthStore.setState({
          user: mockUser,
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token',
          isAuthenticated: true,
        })
      })
    })

    it('should clear user state and call logout endpoint', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token',
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
      expect(result.current.accessToken).toBeNull()
      expect(result.current.refreshToken).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      )
    })

    it('should clear sessionStorage', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial authenticated state and sessionStorage
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token',
          isAuthenticated: true,
        })
      })
      sessionStorageMock.setItem('matchamap-auth', JSON.stringify({ test: 'data' }))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await act(async () => {
        result.current.logout()
      })

      expect(sessionStorageMock.getItem('matchamap-auth')).toBeNull()
    })

    it('should handle logout endpoint failure gracefully', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token',
          isAuthenticated: true,
        })
      })

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        result.current.logout()
      })

      // Should still clear state even if endpoint fails
      expect(result.current.user).toBeNull()
      expect(result.current.accessToken).toBeNull()
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
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token',
          isAuthenticated: true,
        })
      })
      sessionStorageMock.setItem('matchamap-auth', JSON.stringify({ test: 'data' }))

      await act(async () => {
        result.current.clearAuth()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.accessToken).toBeNull()
      expect(result.current.refreshToken).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(sessionStorageMock.getItem('matchamap-auth')).toBeNull()

      // Should not call any API endpoints
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial state with refresh token
      act(() => {
        useAuthStore.setState({
          refreshToken: 'test-refresh-token',
        })
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'new-access-token' }),
      })

      let refreshResult: boolean | undefined
      await act(async () => {
        refreshResult = await result.current.refreshAccessToken()
      })

      expect(refreshResult).toBe(true)
      expect(result.current.accessToken).toBe('new-access-token')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/refresh'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: 'test-refresh-token' }),
        }
      )
    })

    it('should return false and logout if no refresh token', async () => {
      const { result } = renderHook(() => useAuthStore())

      let refreshResult: boolean | undefined
      await act(async () => {
        refreshResult = await result.current.refreshAccessToken()
      })

      expect(refreshResult).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should logout if refresh fails', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial state with refresh token and user
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          refreshToken: 'test-refresh-token',
          isAuthenticated: true,
        })
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid refresh token' }),
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
    it('should fetch current user with valid token', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial state with access token
      act(() => {
        useAuthStore.setState({
          accessToken: 'valid-token',
        })
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      })

      await act(async () => {
        await result.current.getCurrentUser()
      })

      expect(result.current.user).toEqual(mockUser)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        }
      )
    })

    it('should not make request if no access token', async () => {
      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.getCurrentUser()
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should try to refresh token if request fails', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial state
      act(() => {
        useAuthStore.setState({
          accessToken: 'expired-token',
          refreshToken: 'valid-refresh-token',
        })
      })

      // Mock failed user request
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      // Mock successful refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'new-token' }),
      })

      // Mock successful user request with new token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      })

      await act(async () => {
        await result.current.getCurrentUser()
      })

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.accessToken).toBe('new-token')
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
    it('should only persist selected fields', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token',
          isAuthenticated: true,
          isLoading: true,
          error: 'some error',
        })
      })

      const storedData = sessionStorageMock.getItem('matchamap-auth')
      expect(storedData).toBeTruthy()
      
      const parsedData = JSON.parse(storedData!)
      
      // Should persist these fields
      expect(parsedData.state.user).toEqual(mockUser)
      expect(parsedData.state.accessToken).toBe('test-token')
      expect(parsedData.state.refreshToken).toBe('test-refresh-token')
      expect(parsedData.state.isAuthenticated).toBe(true)
      
      // Should NOT persist these fields
      expect(parsedData.state.isLoading).toBeUndefined()
      expect(parsedData.state.error).toBeUndefined()
    })
  })
})