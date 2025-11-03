import '@testing-library/jest-dom'
import { beforeEach, afterEach, vi } from 'vitest'
import { setupLocalStorage, setupSessionStorage, resetFeatureFlags, mockApi } from './helpers'

// ==================== Browser API Mocks ====================

// Mock IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: class IntersectionObserver {
    root = null
    rootMargin = ''
    thresholds = []
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords() { return [] }
  }
})

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  }
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
})

// ==================== Global Storage Setup ====================

// Setup localStorage and sessionStorage with proper Zustand-compatible mocks
setupLocalStorage()
setupSessionStorage()

// ==================== Global Feature Flag Mock ====================

// Mock the features.yaml import
vi.mock('../config/features.yaml', () => ({
  default: globalThis.__TEST_FEATURE_FLAGS__ || {},
}))

// ==================== Global Test Lifecycle ====================

// Reset mocks before each test
beforeEach(() => {
  // Reset storages
  localStorage.clear?.()
  sessionStorage.clear?.()

  // Reset feature flags
  resetFeatureFlags()

  // Reset API mocks
  mockApi.reset()

  // Clear all mocks
  vi.clearAllMocks()
})

// Cleanup after each test
afterEach(() => {
  vi.clearAllTimers()
  vi.restoreAllMocks()
})