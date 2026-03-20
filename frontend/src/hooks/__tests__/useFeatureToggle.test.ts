import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFeatureToggle, isFeatureEnabled, getEnabledFeatures, getCurrentEnvironment } from '../useFeatureToggle'

vi.mock('../../config/features.yaml', () => ({
  default: {
    ENABLE_PASSPORT: { dev: true, prod: false },
    ENABLE_EVENTS: { dev: false, prod: true },
    ENABLE_MENU: { dev: true, prod: true },
    ENABLE_USER_ACCOUNTS: { dev: false, prod: false },
  },
}))

vi.mock('../../stores/adminStore', () => ({
  useAdminStore: vi.fn(),
}))

let mockUseAdminStore: ReturnType<typeof vi.fn>

describe('useFeatureToggle', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.stubEnv('MODE', 'development')
    mockUseAdminStore = vi.fn(() => ({
      adminModeActive: false,
      featureOverrides: {},
      environment: null as 'dev' | 'prod' | null,
    }))
    const { useAdminStore } = await import('../../stores/adminStore')
    vi.mocked(useAdminStore).mockImplementation(mockUseAdminStore)
  })

  it('reads YAML by environment', () => {
    expect(renderHook(() => useFeatureToggle('ENABLE_PASSPORT')).result.current).toBe(true)
    vi.stubEnv('MODE', 'production')
    expect(renderHook(() => useFeatureToggle('ENABLE_PASSPORT')).result.current).toBe(false)
  })

  it('applies admin overrides only when admin mode is on', () => {
    mockUseAdminStore.mockReturnValue({
      adminModeActive: true,
      featureOverrides: { ENABLE_PASSPORT: false },
      environment: null,
    })
    expect(renderHook(() => useFeatureToggle('ENABLE_PASSPORT')).result.current).toBe(false)
  })

  it('uses admin environment for config when admin mode is on', () => {
    mockUseAdminStore.mockReturnValue({
      adminModeActive: true,
      featureOverrides: {},
      environment: 'prod',
    })
    expect(renderHook(() => useFeatureToggle('ENABLE_EVENTS')).result.current).toBe(true)
  })

  it('warns and returns false for unknown feature keys', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(renderHook(() => useFeatureToggle('NON_EXISTENT_FEATURE' as never)).result.current).toBe(false)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('isFeatureEnabled', () => {
  it('mirrors environment without admin store', () => {
    vi.stubEnv('MODE', 'development')
    expect(isFeatureEnabled('ENABLE_PASSPORT')).toBe(true)
    vi.stubEnv('MODE', 'production')
    expect(isFeatureEnabled('ENABLE_EVENTS')).toBe(true)
  })
})

describe('getEnabledFeatures', () => {
  it('lists keys enabled in current mode', () => {
    vi.stubEnv('MODE', 'development')
    expect(getEnabledFeatures()).toContain('ENABLE_PASSPORT')
    vi.stubEnv('MODE', 'production')
    expect(getEnabledFeatures()).toContain('ENABLE_EVENTS')
  })
})

describe('getCurrentEnvironment', () => {
  it('maps MODE to dev or prod', () => {
    vi.stubEnv('MODE', 'development')
    expect(getCurrentEnvironment()).toBe('dev')
    vi.stubEnv('MODE', 'production')
    expect(getCurrentEnvironment()).toBe('prod')
  })
})
