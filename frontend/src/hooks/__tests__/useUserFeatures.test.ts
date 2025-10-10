import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUserFeatures } from '../useUserFeatures'

// Mock the useFeatureToggle hook
vi.mock('../useFeatureToggle', () => ({
  useFeatureToggle: vi.fn(),
}))

describe('useUserFeatures', () => {
  let mockUseFeatureToggle: any

  beforeEach(() => {
    mockUseFeatureToggle = vi.fn()
    const { useFeatureToggle } = await import('../useFeatureToggle')
    vi.mocked(useFeatureToggle).mockImplementation(mockUseFeatureToggle)
  })

  it('should return all features disabled when user accounts are disabled', () => {
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      // All flags disabled
      return false
    })

    const { result } = renderHook(() => useUserFeatures())

    expect(result.current.isUserAccountsEnabled).toBe(false)
    expect(result.current.isUserProfilesEnabled).toBe(false)
    expect(result.current.isUserSocialEnabled).toBe(false)
    expect(result.current.isUserCheckinsEnabled).toBe(false)
    expect(result.current.isUserReviewsEnabled).toBe(false)
    expect(result.current.isUserPhotosEnabled).toBe(false)
    expect(result.current.isUserFollowingEnabled).toBe(false)
    expect(result.current.isUserFavoritesEnabled).toBe(false)
    expect(result.current.isUserListsEnabled).toBe(false)
    expect(result.current.hasAnyUserFeatures).toBe(false)
  })

  it('should enable profiles when user accounts enabled and profiles enabled', () => {
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      switch (flag) {
        case 'ENABLE_USER_ACCOUNTS':
          return true
        case 'ENABLE_USER_PROFILES':
          return true
        case 'ENABLE_USER_SOCIAL':
          return false
        default:
          return false
      }
    })

    const { result } = renderHook(() => useUserFeatures())

    expect(result.current.isUserAccountsEnabled).toBe(true)
    expect(result.current.isUserProfilesEnabled).toBe(true)
    expect(result.current.isUserSocialEnabled).toBe(false)
    expect(result.current.hasAnyUserFeatures).toBe(true)
  })

  it('should enable all social features when user accounts and social enabled', () => {
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      switch (flag) {
        case 'ENABLE_USER_ACCOUNTS':
          return true
        case 'ENABLE_USER_PROFILES':
          return true
        case 'ENABLE_USER_SOCIAL':
          return true
        default:
          return false
      }
    })

    const { result } = renderHook(() => useUserFeatures())

    expect(result.current.isUserAccountsEnabled).toBe(true)
    expect(result.current.isUserProfilesEnabled).toBe(true)
    expect(result.current.isUserSocialEnabled).toBe(true)
    expect(result.current.isUserCheckinsEnabled).toBe(true)
    expect(result.current.isUserReviewsEnabled).toBe(true)
    expect(result.current.isUserPhotosEnabled).toBe(true)
    expect(result.current.isUserFollowingEnabled).toBe(true)
    expect(result.current.isUserFavoritesEnabled).toBe(true)
    expect(result.current.isUserListsEnabled).toBe(true)
    expect(result.current.hasAnyUserFeatures).toBe(true)
  })

  it('should require user accounts for profiles even when profiles enabled', () => {
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      switch (flag) {
        case 'ENABLE_USER_ACCOUNTS':
          return false
        case 'ENABLE_USER_PROFILES':
          return true // Enabled but accounts disabled
        case 'ENABLE_USER_SOCIAL':
          return true
        default:
          return false
      }
    })

    const { result } = renderHook(() => useUserFeatures())

    expect(result.current.isUserAccountsEnabled).toBe(false)
    expect(result.current.isUserProfilesEnabled).toBe(false) // Should be false due to dependency
    expect(result.current.isUserSocialEnabled).toBe(false) // Should be false due to dependency
    expect(result.current.hasAnyUserFeatures).toBe(false)
  })

  it('should require user accounts for social features even when social enabled', () => {
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      switch (flag) {
        case 'ENABLE_USER_ACCOUNTS':
          return false
        case 'ENABLE_USER_PROFILES':
          return false
        case 'ENABLE_USER_SOCIAL':
          return true // Enabled but accounts disabled
        default:
          return false
      }
    })

    const { result } = renderHook(() => useUserFeatures())

    expect(result.current.isUserAccountsEnabled).toBe(false)
    expect(result.current.isUserSocialEnabled).toBe(false) // Should be false due to dependency
    expect(result.current.isUserCheckinsEnabled).toBe(false)
    expect(result.current.isUserReviewsEnabled).toBe(false)
    expect(result.current.isUserPhotosEnabled).toBe(false)
    expect(result.current.isUserFollowingEnabled).toBe(false)
    expect(result.current.isUserFavoritesEnabled).toBe(false)
    expect(result.current.isUserListsEnabled).toBe(false)
    expect(result.current.hasAnyUserFeatures).toBe(false)
  })

  it('should enable accounts without social when social disabled', () => {
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      switch (flag) {
        case 'ENABLE_USER_ACCOUNTS':
          return true
        case 'ENABLE_USER_PROFILES':
          return false
        case 'ENABLE_USER_SOCIAL':
          return false
        default:
          return false
      }
    })

    const { result } = renderHook(() => useUserFeatures())

    expect(result.current.isUserAccountsEnabled).toBe(true)
    expect(result.current.isUserProfilesEnabled).toBe(false)
    expect(result.current.isUserSocialEnabled).toBe(false)
    expect(result.current.isUserCheckinsEnabled).toBe(false)
    expect(result.current.isUserReviewsEnabled).toBe(false)
    expect(result.current.isUserPhotosEnabled).toBe(false)
    expect(result.current.isUserFollowingEnabled).toBe(false)
    expect(result.current.isUserFavoritesEnabled).toBe(false)
    expect(result.current.isUserListsEnabled).toBe(false)
    expect(result.current.hasAnyUserFeatures).toBe(false) // No profiles or social
  })

  it('should call useFeatureToggle for all required flags', () => {
    mockUseFeatureToggle.mockReturnValue(false)

    renderHook(() => useUserFeatures())

    expect(mockUseFeatureToggle).toHaveBeenCalledWith('ENABLE_USER_ACCOUNTS')
    expect(mockUseFeatureToggle).toHaveBeenCalledWith('ENABLE_USER_PROFILES')
    expect(mockUseFeatureToggle).toHaveBeenCalledWith('ENABLE_USER_SOCIAL')
    expect(mockUseFeatureToggle).toHaveBeenCalledTimes(3)
  })

  it('should update when feature flags change', () => {
    let accountsEnabled = false
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      switch (flag) {
        case 'ENABLE_USER_ACCOUNTS':
          return accountsEnabled
        case 'ENABLE_USER_PROFILES':
          return true
        case 'ENABLE_USER_SOCIAL':
          return true
        default:
          return false
      }
    })

    const { result, rerender } = renderHook(() => useUserFeatures())

    // Initially disabled
    expect(result.current.isUserAccountsEnabled).toBe(false)
    expect(result.current.isUserProfilesEnabled).toBe(false)
    expect(result.current.isUserSocialEnabled).toBe(false)

    // Enable accounts
    accountsEnabled = true
    rerender()

    expect(result.current.isUserAccountsEnabled).toBe(true)
    expect(result.current.isUserProfilesEnabled).toBe(true)
    expect(result.current.isUserSocialEnabled).toBe(true)
  })

  it('should handle all individual social feature flags consistently', () => {
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      switch (flag) {
        case 'ENABLE_USER_ACCOUNTS':
          return true
        case 'ENABLE_USER_PROFILES':
          return false
        case 'ENABLE_USER_SOCIAL':
          return true
        default:
          return false
      }
    })

    const { result } = renderHook(() => useUserFeatures())

    // All individual social features should have the same value as isUserSocialEnabled
    const socialEnabled = result.current.isUserSocialEnabled
    expect(result.current.isUserCheckinsEnabled).toBe(socialEnabled)
    expect(result.current.isUserReviewsEnabled).toBe(socialEnabled)
    expect(result.current.isUserPhotosEnabled).toBe(socialEnabled)
    expect(result.current.isUserFollowingEnabled).toBe(socialEnabled)
    expect(result.current.isUserFavoritesEnabled).toBe(socialEnabled)
    expect(result.current.isUserListsEnabled).toBe(socialEnabled)
  })

  it('should calculate hasAnyUserFeatures correctly for different combinations', () => {
    // Test case 1: Only accounts, no profiles or social
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      return flag === 'ENABLE_USER_ACCOUNTS'
    })

    const { result, rerender } = renderHook(() => useUserFeatures())
    expect(result.current.hasAnyUserFeatures).toBe(false) // No profiles or social

    // Test case 2: Accounts + profiles
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      return flag === 'ENABLE_USER_ACCOUNTS' || flag === 'ENABLE_USER_PROFILES'
    })
    rerender()
    expect(result.current.hasAnyUserFeatures).toBe(true)

    // Test case 3: Accounts + social
    mockUseFeatureToggle.mockImplementation((flag: string) => {
      return flag === 'ENABLE_USER_ACCOUNTS' || flag === 'ENABLE_USER_SOCIAL'
    })
    rerender()
    expect(result.current.hasAnyUserFeatures).toBe(true)
  })
})