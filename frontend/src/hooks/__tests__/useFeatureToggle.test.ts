import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFeatureToggle, isFeatureEnabled, getEnabledFeatures, getCurrentEnvironment } from '../useFeatureToggle'

// Mock the feature config
const mockFeatureConfig = {
  ENABLE_PASSPORT: { dev: true, prod: false },
  ENABLE_EVENTS: { dev: false, prod: true },
  ENABLE_MENU: { dev: true, prod: true },
  ENABLE_USER_ACCOUNTS: { dev: false, prod: false },
}

vi.mock('../../config/features.yaml', () => mockFeatureConfig)

// Mock the admin store
vi.mock('../../stores/adminStore', () => ({
  useAdminStore: vi.fn(),
}))

describe('useFeatureToggle', () => {
  let mockUseAdminStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseAdminStore = vi.fn(() => ({
      adminModeActive: false,
      featureOverrides: {},
      environment: null,
    }))
    
    const { useAdminStore } = await import('../../stores/adminStore')
    vi.mocked(useAdminStore).mockImplementation(mockUseAdminStore)

    // Reset import.meta.env.MODE
    vi.stubGlobal('import.meta', {
      env: { MODE: 'development' }
    })
  })

  it('should return feature value based on development environment', () => {
    const { result } = renderHook(() => useFeatureToggle('ENABLE_PASSPORT'))

    expect(result.current).toBe(true) // dev: true in mock config
  })

  it('should return feature value based on production environment', () => {
    vi.stubGlobal('import.meta', {
      env: { MODE: 'production' }
    })

    const { result } = renderHook(() => useFeatureToggle('ENABLE_EVENTS'))

    expect(result.current).toBe(true) // prod: true in mock config
  })

  it('should return false for disabled features', () => {
    const { result } = renderHook(() => useFeatureToggle('ENABLE_USER_ACCOUNTS'))

    expect(result.current).toBe(false) // Both dev and prod are false
  })

  it('should return false for non-existent features', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    const { result } = renderHook(() => useFeatureToggle('NON_EXISTENT_FEATURE' as any))

    expect(result.current).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('Feature "NON_EXISTENT_FEATURE" not found in feature config')
    
    consoleSpy.mockRestore()
  })

  it('should use admin override when admin mode is active', () => {
    mockUseAdminStore.mockReturnValue({
      adminModeActive: true,
      featureOverrides: {
        ENABLE_PASSPORT: false, // Override to false
      },
      environment: null,
    })

    const { result } = renderHook(() => useFeatureToggle('ENABLE_PASSPORT'))

    expect(result.current).toBe(false) // Should use override, not config
  })

  it('should use config when admin override is undefined', () => {
    mockUseAdminStore.mockReturnValue({
      adminModeActive: true,
      featureOverrides: {
        ENABLE_EVENTS: true, // Override for different feature
      },
      environment: null,
    })

    const { result } = renderHook(() => useFeatureToggle('ENABLE_PASSPORT'))

    expect(result.current).toBe(true) // Should use config since no override for this feature
  })

  it('should use simulated environment when admin mode is active', () => {
    mockUseAdminStore.mockReturnValue({
      adminModeActive: true,
      featureOverrides: {},
      environment: 'prod', // Simulate production
    })

    const { result } = renderHook(() => useFeatureToggle('ENABLE_EVENTS'))

    expect(result.current).toBe(true) // Should use prod value from config
  })

  it('should use actual environment when admin mode is inactive', () => {
    vi.stubGlobal('import.meta', {
      env: { MODE: 'production' }
    })

    mockUseAdminStore.mockReturnValue({
      adminModeActive: false,
      featureOverrides: {},
      environment: 'dev', // This should be ignored
    })

    const { result } = renderHook(() => useFeatureToggle('ENABLE_PASSPORT'))

    expect(result.current).toBe(false) // Should use prod value (false), not dev value (true)
  })

  it('should handle missing environment in feature config', () => {
    const { result } = renderHook(() => useFeatureToggle('ENABLE_MENU'))

    expect(result.current).toBe(true) // Both dev and prod are true
  })

  it('should update when admin store values change', () => {
    const { result, rerender } = renderHook(() => useFeatureToggle('ENABLE_PASSPORT'))

    expect(result.current).toBe(true) // Initial dev value

    // Change admin store to override
    mockUseAdminStore.mockReturnValue({
      adminModeActive: true,
      featureOverrides: {
        ENABLE_PASSPORT: false,
      },
      environment: null,
    })

    rerender()

    expect(result.current).toBe(false) // Should use override
  })

  it('should memoize result correctly', () => {
    const { result, rerender } = renderHook(() => useFeatureToggle('ENABLE_PASSPORT'))

    const firstResult = result.current
    rerender()
    const secondResult = result.current

    expect(firstResult).toBe(secondResult)
  })
})

describe('isFeatureEnabled', () => {
  beforeEach(() => {
    vi.stubGlobal('import.meta', {
      env: { MODE: 'development' }
    })
  })

  it('should return correct value for development environment', () => {
    expect(isFeatureEnabled('ENABLE_PASSPORT')).toBe(true)
    expect(isFeatureEnabled('ENABLE_EVENTS')).toBe(false)
  })

  it('should return correct value for production environment', () => {
    vi.stubGlobal('import.meta', {
      env: { MODE: 'production' }
    })

    expect(isFeatureEnabled('ENABLE_PASSPORT')).toBe(false)
    expect(isFeatureEnabled('ENABLE_EVENTS')).toBe(true)
  })

  it('should return false for non-existent features', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    expect(isFeatureEnabled('NON_EXISTENT_FEATURE' as any)).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('Feature "NON_EXISTENT_FEATURE" not found in feature config')
    
    consoleSpy.mockRestore()
  })

  it('should handle missing environment values', () => {
    // Test with feature that has undefined for current env
    expect(isFeatureEnabled('ENABLE_USER_ACCOUNTS')).toBe(false)
  })
})

describe('getEnabledFeatures', () => {
  beforeEach(() => {
    vi.stubGlobal('import.meta', {
      env: { MODE: 'development' }
    })
  })

  it('should return enabled features for development environment', () => {
    const enabledFeatures = getEnabledFeatures()
    
    expect(enabledFeatures).toContain('ENABLE_PASSPORT')
    expect(enabledFeatures).toContain('ENABLE_MENU')
    expect(enabledFeatures).not.toContain('ENABLE_EVENTS')
    expect(enabledFeatures).not.toContain('ENABLE_USER_ACCOUNTS')
  })

  it('should return enabled features for production environment', () => {
    vi.stubGlobal('import.meta', {
      env: { MODE: 'production' }
    })

    const enabledFeatures = getEnabledFeatures()
    
    expect(enabledFeatures).toContain('ENABLE_EVENTS')
    expect(enabledFeatures).toContain('ENABLE_MENU')
    expect(enabledFeatures).not.toContain('ENABLE_PASSPORT')
    expect(enabledFeatures).not.toContain('ENABLE_USER_ACCOUNTS')
  })

  it('should return array of feature keys', () => {
    const enabledFeatures = getEnabledFeatures()
    
    expect(Array.isArray(enabledFeatures)).toBe(true)
    enabledFeatures.forEach(feature => {
      expect(typeof feature).toBe('string')
    })
  })
})

describe('getCurrentEnvironment', () => {
  it('should return dev for development mode', () => {
    vi.stubGlobal('import.meta', {
      env: { MODE: 'development' }
    })

    expect(getCurrentEnvironment()).toBe('dev')
  })

  it('should return prod for production mode', () => {
    vi.stubGlobal('import.meta', {
      env: { MODE: 'production' }
    })

    expect(getCurrentEnvironment()).toBe('prod')
  })

  it('should return dev for unknown modes', () => {
    vi.stubGlobal('import.meta', {
      env: { MODE: 'test' }
    })

    expect(getCurrentEnvironment()).toBe('dev')
  })

  it('should handle missing MODE', () => {
    vi.stubGlobal('import.meta', {
      env: {}
    })

    expect(getCurrentEnvironment()).toBe('dev')
  })
})

describe('Feature toggle edge cases', () => {
  beforeEach(() => {
    vi.stubGlobal('import.meta', {
      env: { MODE: 'development' }
    })
  })

  it('should handle boolean admin overrides correctly', () => {
    mockUseAdminStore = vi.fn(() => ({
      adminModeActive: true,
      featureOverrides: {
        ENABLE_PASSPORT: false, // Explicit false
        ENABLE_EVENTS: true,    // Explicit true
      },
      environment: null,
    }))

    const { useAdminStore } = await import('../../stores/adminStore')
    vi.mocked(useAdminStore).mockImplementation(mockUseAdminStore)

    const { result: passportResult } = renderHook(() => useFeatureToggle('ENABLE_PASSPORT'))
    const { result: eventsResult } = renderHook(() => useFeatureToggle('ENABLE_EVENTS'))

    expect(passportResult.current).toBe(false)
    expect(eventsResult.current).toBe(true)
  })

  it('should handle environment switching in admin mode', () => {
    mockUseAdminStore = vi.fn(() => ({
      adminModeActive: true,
      featureOverrides: {},
      environment: 'prod',
    }))

    const { useAdminStore } = await import('../../stores/adminStore')
    vi.mocked(useAdminStore).mockImplementation(mockUseAdminStore)

    // Feature that differs between dev and prod
    const { result, rerender } = renderHook(() => useFeatureToggle('ENABLE_PASSPORT'))

    expect(result.current).toBe(false) // prod value

    // Switch to dev environment
    mockUseAdminStore.mockReturnValue({
      adminModeActive: true,
      featureOverrides: {},
      environment: 'dev',
    })

    rerender()

    expect(result.current).toBe(true) // dev value
  })
})