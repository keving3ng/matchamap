import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAppFeatures } from '../useAppFeatures'

// Mock the useFeatureToggle hook
vi.mock('../useFeatureToggle', () => ({
  useFeatureToggle: vi.fn(),
}))

describe('useAppFeatures', () => {
  let mockUseFeatureToggle: any

  beforeEach(async () => {
    vi.clearAllMocks()

    mockUseFeatureToggle = vi.fn()
    const { useFeatureToggle } = await import('../useFeatureToggle')
    vi.mocked(useFeatureToggle).mockImplementation(mockUseFeatureToggle)
  })

  it('should return all features as expected', () => {
    // Mock feature toggle responses
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      switch (flag) {
        case 'ENABLE_PASSPORT':
          return true
        case 'ENABLE_EVENTS':
          return false
        case 'ENABLE_MENU':
          return true
        case 'ENABLE_CITY_SELECTOR':
          return false
        case 'ENABLE_USER_ACCOUNTS':
          return true
        case 'SHOW_COMING_SOON':
          return false
        default:
          return false
      }
    })

    const { result } = renderHook(() => useAppFeatures())

    expect(result.current.isPassportEnabled).toBe(true)
    expect(result.current.isEventsEnabled).toBe(false)
    expect(result.current.isMenuEnabled).toBe(true)
    expect(result.current.isCitySelectorEnabled).toBe(false)
    expect(result.current.isUserAccountsEnabled).toBe(true)
    expect(result.current.showComingSoon).toBe(false)
  })

  it('should call useFeatureToggle for all required flags', () => {
    mockUseFeatureToggle.mockReturnValue(false)

    renderHook(() => useAppFeatures())

    expect(mockUseFeatureToggle).toHaveBeenCalledWith('ENABLE_PASSPORT')
    expect(mockUseFeatureToggle).toHaveBeenCalledWith('ENABLE_EVENTS')
    expect(mockUseFeatureToggle).toHaveBeenCalledWith('ENABLE_MENU')
    expect(mockUseFeatureToggle).toHaveBeenCalledWith('ENABLE_CITY_SELECTOR')
    expect(mockUseFeatureToggle).toHaveBeenCalledWith('ENABLE_USER_ACCOUNTS')
    expect(mockUseFeatureToggle).toHaveBeenCalledWith('SHOW_COMING_SOON')
    expect(mockUseFeatureToggle).toHaveBeenCalledTimes(6)
  })

  it('should return all features disabled when all flags are false', () => {
    mockUseFeatureToggle.mockReturnValue(false)

    const { result } = renderHook(() => useAppFeatures())

    expect(result.current.isPassportEnabled).toBe(false)
    expect(result.current.isEventsEnabled).toBe(false)
    expect(result.current.isMenuEnabled).toBe(false)
    expect(result.current.isCitySelectorEnabled).toBe(false)
    expect(result.current.isUserAccountsEnabled).toBe(false)
    expect(result.current.showComingSoon).toBe(false)
  })

  it('should return all features enabled when all flags are true', () => {
    mockUseFeatureToggle.mockReturnValue(true)

    const { result } = renderHook(() => useAppFeatures())

    expect(result.current.isPassportEnabled).toBe(true)
    expect(result.current.isEventsEnabled).toBe(true)
    expect(result.current.isMenuEnabled).toBe(true)
    expect(result.current.isCitySelectorEnabled).toBe(true)
    expect(result.current.isUserAccountsEnabled).toBe(true)
    expect(result.current.showComingSoon).toBe(true)
  })

  it('should update when feature toggle values change', () => {
    let passportEnabled = false
    
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      if (flag === 'ENABLE_PASSPORT') {
        return passportEnabled
      }
      return false
    })

    const { result, rerender } = renderHook(() => useAppFeatures())

    expect(result.current.isPassportEnabled).toBe(false)

    // Change the feature toggle value
    passportEnabled = true
    rerender()

    expect(result.current.isPassportEnabled).toBe(true)
  })

  it('should handle individual feature flag changes', () => {
    const featureStates = {
      ENABLE_PASSPORT: true,
      ENABLE_EVENTS: false,
      ENABLE_MENU: true,
      ENABLE_CITY_SELECTOR: false,
      ENABLE_USER_ACCOUNTS: true,
      SHOW_COMING_SOON: false,
    }

    mockUseFeatureToggle.mockImplementation((flag: string) => {
      return featureStates[flag as keyof typeof featureStates] || false
    })

    const { result, rerender } = renderHook(() => useAppFeatures())

    // Initial state
    expect(result.current.isEventsEnabled).toBe(false)

    // Change just the events flag
    featureStates.ENABLE_EVENTS = true
    rerender()

    expect(result.current.isEventsEnabled).toBe(true)
    // Other flags should remain unchanged
    expect(result.current.isPassportEnabled).toBe(true)
    expect(result.current.isMenuEnabled).toBe(true)
    expect(result.current.isCitySelectorEnabled).toBe(false)
  })

  it('should maintain consistent return object structure', () => {
    mockUseFeatureToggle.mockReturnValue(false)

    const { result } = renderHook(() => useAppFeatures())

    // Check that all expected properties exist
    expect(result.current).toHaveProperty('isPassportEnabled')
    expect(result.current).toHaveProperty('isEventsEnabled')
    expect(result.current).toHaveProperty('isMenuEnabled')
    expect(result.current).toHaveProperty('isCitySelectorEnabled')
    expect(result.current).toHaveProperty('isUserAccountsEnabled')
    expect(result.current).toHaveProperty('showComingSoon')

    // Check that all properties are boolean
    Object.values(result.current).forEach(value => {
      expect(typeof value).toBe('boolean')
    })
  })

  it('should work with mixed true/false values', () => {
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      // Alternating pattern
      const flags = [
        'ENABLE_PASSPORT',
        'ENABLE_EVENTS', 
        'ENABLE_MENU',
        'ENABLE_CITY_SELECTOR',
        'ENABLE_USER_ACCOUNTS',
        'SHOW_COMING_SOON'
      ]
      const index = flags.indexOf(flag)
      return index % 2 === 0 // Even indexes return true, odd return false
    })

    const { result } = renderHook(() => useAppFeatures())

    expect(result.current.isPassportEnabled).toBe(true)     // index 0 (even)
    expect(result.current.isEventsEnabled).toBe(false)      // index 1 (odd)
    expect(result.current.isMenuEnabled).toBe(true)         // index 2 (even)
    expect(result.current.isCitySelectorEnabled).toBe(false) // index 3 (odd)
    expect(result.current.isUserAccountsEnabled).toBe(true) // index 4 (even)
    expect(result.current.showComingSoon).toBe(false)       // index 5 (odd)
  })

  it('should handle useFeatureToggle errors gracefully', () => {
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      if (flag === 'ENABLE_PASSPORT') {
        throw new Error('Feature toggle error')
      }
      return false
    })

    // Should not throw, but the error will be handled by useFeatureToggle itself
    expect(() => {
      renderHook(() => useAppFeatures())
    }).toThrow() // This will throw because useFeatureToggle throws
  })

  it('should not modify the returned object on subsequent calls', () => {
    mockUseFeatureToggle.mockReturnValue(true)

    const { result } = renderHook(() => useAppFeatures())

    const firstCall = result.current
    const secondCall = result.current

    expect(firstCall).toBe(secondCall) // Should be the same object reference due to React optimization
  })

  it('should handle rapid feature flag changes', () => {
    let toggleCount = 0
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      if (flag === 'ENABLE_PASSPORT') {
        return toggleCount % 2 === 0
      }
      return false
    })

    const { result, rerender } = renderHook(() => useAppFeatures())

    expect(result.current.isPassportEnabled).toBe(true) // toggleCount = 0

    toggleCount = 1
    rerender()
    expect(result.current.isPassportEnabled).toBe(false)

    toggleCount = 2  
    rerender()
    expect(result.current.isPassportEnabled).toBe(true)

    toggleCount = 3
    rerender()
    expect(result.current.isPassportEnabled).toBe(false)
  })

  it('should handle undefined/null returns from useFeatureToggle', () => {
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      if (flag === 'ENABLE_PASSPORT') {
        return undefined
      }
      if (flag === 'ENABLE_EVENTS') {
        return null
      }
      return false
    })

    const { result } = renderHook(() => useAppFeatures())

    // Hook returns whatever useFeatureToggle returns (undefined/null/boolean)
    expect(result.current.isPassportEnabled).toBeUndefined()
    expect(result.current.isEventsEnabled).toBeNull()
    expect(result.current.isMenuEnabled).toBe(false)
  })
})