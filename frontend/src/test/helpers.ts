/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test Utilities and Helpers
 *
 * This file provides reusable utilities for testing:
 * - Feature flag mocking
 * - Store mocking with proper persistence
 * - API mocking
 * - Storage mocking (localStorage/sessionStorage)
 * - Data factories for creating test fixtures
 */

import { vi } from 'vitest'
import type { User, Cafe, CityWithCount } from '../../../shared/types'
import type { StateStorage } from 'zustand/middleware'

// ==================== Feature Flag Mocking ====================

/**
 * Mock a feature flag value for testing
 * @param flag - The feature flag key (e.g., 'ENABLE_USER_ACCOUNTS')
 * @param value - The value to set (true/false)
 *
 * @example
 * mockFeatureFlag('ENABLE_USER_ACCOUNTS', true)
 * // Now all code will see ENABLE_USER_ACCOUNTS as enabled
 */
export function mockFeatureFlag(flag: string, value: boolean) {
  // Set up the feature config structure that matches the YAML format
  if (!globalThis.__TEST_FEATURE_FLAGS__) {
    globalThis.__TEST_FEATURE_FLAGS__ = {}
  }
  globalThis.__TEST_FEATURE_FLAGS__[flag] = {
    dev: value,
    prod: value,
  }
}

/**
 * Reset all mocked feature flags
 */
export function resetFeatureFlags() {
  globalThis.__TEST_FEATURE_FLAGS__ = {}
}

/**
 * Get mocked feature flags
 */
export function getFeatureFlags() {
  return globalThis.__TEST_FEATURE_FLAGS__ || {}
}

// ==================== Storage Mocking ====================

/**
 * Create a mock storage that works with Zustand's persist middleware
 * This properly handles the storage format Zustand expects
 *
 * @returns Storage-compatible object with helper methods
 *
 * @example
 * const storage = mockStorage()
 * storage.setItem('key', 'value')
 * expect(storage.getItem('key')).toBe('value')
 */
export function mockStorage(): StateStorage & {
  store: Record<string, string>
  reset: () => void
  clear: () => void
  get: (key: string) => any
  set: (key: string, value: any) => void
} {
  let store: Record<string, string> = {}

  const storage = {
    store,
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
      storage.store = store
    },
    reset: () => {
      store = {}
      storage.store = store
    },
    // Helper to get parsed data
    get: (key: string) => {
      const item = store[key]
      if (!item) return null
      try {
        const parsed = JSON.parse(item)
        return parsed.state || parsed
      } catch {
        return item
      }
    },
    // Helper to set data in Zustand format
    set: (key: string, value: any) => {
      store[key] = JSON.stringify({
        state: value,
        version: 0,
      })
    },
  }

  return storage
}

/**
 * Wait for Zustand's persist middleware to complete
 * Useful when testing store updates that should persist
 *
 * @param ms - Milliseconds to wait (default: 100)
 *
 * @example
 * store.setState({ value: 'new' })
 * await waitForPersistence()
 * expect(storage.get('store-key')).toEqual({ value: 'new' })
 */
export function waitForPersistence(ms: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Setup localStorage mock for tests
 * Call this in beforeEach to reset storage between tests
 */
export function setupLocalStorage() {
  const storage = mockStorage()
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    writable: true,
  })
  return storage
}

/**
 * Setup sessionStorage mock for tests
 * Call this in beforeEach to reset storage between tests
 */
export function setupSessionStorage() {
  const storage = mockStorage()
  Object.defineProperty(window, 'sessionStorage', {
    value: storage,
    writable: true,
  })
  return storage
}

// ==================== API Mocking ====================

type MockApiResponse = {
  ok?: boolean
  status?: number
  json?: () => Promise<any>
  text?: () => Promise<string>
}

/**
 * API mocking utilities for fetch calls
 * Provides a clean interface for mocking API responses
 *
 * @example
 * mockApi.get('/api/cafes', { cafes: [] })
 * mockApi.post('/api/auth/login', { user: mockUser })
 * mockApi.error('/api/cafes', 'Network error', 500)
 */
export const mockApi = {
  _mocks: new Map<string, MockApiResponse>(),

  /**
   * Mock a successful GET request
   */
  get: (url: string, data: any) => {
    mockApi._mocks.set(`GET:${url}`, {
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    })
  },

  /**
   * Mock a successful POST request
   */
  post: (url: string, data: any) => {
    mockApi._mocks.set(`POST:${url}`, {
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    })
  },

  /**
   * Mock a successful PUT request
   */
  put: (url: string, data: any) => {
    mockApi._mocks.set(`PUT:${url}`, {
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    })
  },

  /**
   * Mock a successful DELETE request
   */
  delete: (url: string, data: any = {}) => {
    mockApi._mocks.set(`DELETE:${url}`, {
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    })
  },

  /**
   * Mock an error response
   */
  error: (url: string, error: string, status: number = 500) => {
    mockApi._mocks.set(`*:${url}`, {
      ok: false,
      status,
      json: () => Promise.resolve({ error }),
    })
  },

  /**
   * Reset all API mocks
   */
  reset: () => {
    mockApi._mocks.clear()
  },

  /**
   * Setup global fetch mock
   * Call this in beforeEach or test setup
   */
  setup: () => {
    globalThis.fetch = vi.fn((url: string | URL | Request, options?: RequestInit) => {
      const method = (options?.method || 'GET').toUpperCase()
      const urlStr = typeof url === 'string' ? url : url.toString()

      // Try exact match first
      let mock = mockApi._mocks.get(`${method}:${urlStr}`)

      // Try wildcard match
      if (!mock) {
        mock = mockApi._mocks.get(`*:${urlStr}`)
      }

      // Default to 404
      if (!mock) {
        mock = {
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Not found' }),
        }
      }

      return Promise.resolve(mock as Response)
    }) as any
  },
}

// ==================== Data Factories ====================

/**
 * Create a mock user for testing
 *
 * @example
 * const user = createMockUser({ username: 'testuser' })
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    role: 'user',
    lastActiveAt: null,
    isEmailVerified: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    ...overrides,
  }
}

/**
 * Create a mock admin user for testing
 */
export function createMockAdmin(overrides?: Partial<User>): User {
  return createMockUser({
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    ...overrides,
  })
}

/**
 * Create a mock cafe for testing
 *
 * @example
 * const cafe = createMockCafe({ name: 'Test Cafe' })
 */
export function createMockCafe(overrides?: Partial<Cafe>): Cafe {
  return {
    id: 1,
    name: 'Test Cafe',
    slug: 'test-cafe',
    address: '123 Test St',
    city: 'toronto',
    latitude: 43.6532,
    longitude: -79.3832,
    googleMapsUrl: 'https://maps.google.com/?q=test',
    hours: 'Mon-Fri 9am-5pm',
    hasWifi: true,
    matchaScore: 8.5,
    latteScore: 7.5,
    description: 'A test cafe',
    neighbourhood: 'Downtown',
    instagramHandle: '@testcafe',
    website: 'https://testcafe.com',
    status: 'active',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    ...overrides,
  } as Cafe
}

/**
 * Create multiple mock cafes
 *
 * @example
 * const cafes = createMockCafes(5) // Creates 5 cafes with IDs 1-5
 */
export function createMockCafes(count: number): Cafe[] {
  return Array.from({ length: count }, (_, i) =>
    createMockCafe({
      id: i + 1,
      name: `Test Cafe ${i + 1}`,
      slug: `test-cafe-${i + 1}`,
    })
  )
}

/**
 * Create a mock city with count for testing
 *
 * @example
 * const city = createMockCity({ city: 'montreal', cafe_count: 10 })
 */
export function createMockCity(overrides?: Partial<CityWithCount>): CityWithCount {
  return {
    city: 'toronto',
    cafe_count: 5,
    ...overrides,
  }
}

/**
 * Create mock GeolocationCoordinates for testing
 */
export function createMockCoordinates(
  lat: number = 43.6532,
  lng: number = -79.3832
): GeolocationCoordinates {
  return {
    latitude: lat,
    longitude: lng,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  } as GeolocationCoordinates
}

/**
 * Create mock GeolocationPositionError for testing
 */
export function createMockLocationError(
  code: number = 1,
  message: string = 'Permission denied'
): GeolocationPositionError {
  return {
    code,
    message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError
}

// ==================== Store Utilities ====================

/**
 * Reset a Zustand store to initial state
 * Useful for cleaning up between tests
 *
 * @example
 * resetStore(useAuthStore, { user: null, isAuthenticated: false })
 */
export function resetStore<T>(
  store: { setState: (state: Partial<T>) => void; getState: () => T },
  initialState: Partial<T>
) {
  store.setState(initialState)
}

// ==================== TypeScript Augmentation ====================

declare global {
  var __TEST_FEATURE_FLAGS__: Record<string, any>
}
