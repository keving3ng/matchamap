import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePassportMigration } from '../usePassportMigration'
import { useAuthStore } from '../../stores/authStore'
import { useVisitedCafesStore } from '../../stores/visitedCafesStore'
import { api } from '../../utils/api'

// Mock the stores and API
vi.mock('../../stores/authStore')
vi.mock('../../stores/visitedCafesStore')
vi.mock('../../utils/api')

const mockAuthStore = vi.mocked(useAuthStore)
const mockVisitedCafesStore = vi.mocked(useVisitedCafesStore)
const mockApi = vi.mocked(api)

describe('usePassportMigration', () => {
  const mockClearAllStamps = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default auth store mock
    mockAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, email: 'test@example.com' },
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshToken: vi.fn(),
      verifyEmail: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    })
    
    // Default visited cafes store mock
    mockVisitedCafesStore.mockReturnValue({
      stampedCafeIds: [1, 2, 3],
      clearAllStamps: mockClearAllStamps,
      isStamped: vi.fn(),
      toggleStamp: vi.fn(),
      getStampedCafeIds: vi.fn(),
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePassportMigration())

    expect(result.current.migrationState).toEqual({
      isOpen: false,
      isLoading: false,
      error: null,
      localVisitCount: 0,
    })
  })

  it('should show migration modal when user is authenticated and has local visits', () => {
    const { result } = renderHook(() => usePassportMigration())

    act(() => {
      result.current.checkAndShowMigration()
    })

    expect(result.current.migrationState).toEqual({
      isOpen: true,
      isLoading: false,
      error: null,
      localVisitCount: 3,
    })
  })

  it('should not show migration modal when user is not authenticated', () => {
    mockAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshToken: vi.fn(),
      verifyEmail: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    })

    const { result } = renderHook(() => usePassportMigration())

    act(() => {
      result.current.checkAndShowMigration()
    })

    expect(result.current.migrationState.isOpen).toBe(false)
  })

  it('should not show migration modal when no local visits exist', () => {
    mockVisitedCafesStore.mockReturnValue({
      stampedCafeIds: [],
      clearAllStamps: mockClearAllStamps,
      isStamped: vi.fn(),
      toggleStamp: vi.fn(),
      getStampedCafeIds: vi.fn(),
    })

    const { result } = renderHook(() => usePassportMigration())

    act(() => {
      result.current.checkAndShowMigration()
    })

    expect(result.current.migrationState.isOpen).toBe(false)
  })

  it('should close migration modal', () => {
    const { result } = renderHook(() => usePassportMigration())

    // First open the modal
    act(() => {
      result.current.checkAndShowMigration()
    })
    expect(result.current.migrationState.isOpen).toBe(true)

    // Then close it
    act(() => {
      result.current.closeMigration()
    })
    expect(result.current.migrationState.isOpen).toBe(false)
  })

  it('should skip migration and close modal', () => {
    const { result } = renderHook(() => usePassportMigration())

    // Open the modal
    act(() => {
      result.current.checkAndShowMigration()
    })
    expect(result.current.migrationState.isOpen).toBe(true)

    // Skip migration
    act(() => {
      result.current.skipMigration()
    })
    expect(result.current.migrationState.isOpen).toBe(false)
  })

  it('should migrate stamps successfully', async () => {
    // Mock successful API responses
    mockApi.stats.checkIn.mockResolvedValue(undefined)

    const { result } = renderHook(() => usePassportMigration())

    // Open the modal
    act(() => {
      result.current.checkAndShowMigration()
    })

    // Start migration
    await act(async () => {
      await result.current.migrateStamps()
    })

    // Should call API for each cafe with notes parameter
    expect(mockApi.stats.checkIn).toHaveBeenCalledTimes(3)
    expect(mockApi.stats.checkIn).toHaveBeenCalledWith(1, 'Migrated from local storage')
    expect(mockApi.stats.checkIn).toHaveBeenCalledWith(2, 'Migrated from local storage')
    expect(mockApi.stats.checkIn).toHaveBeenCalledWith(3, 'Migrated from local storage')

    // Should clear local stamps
    expect(mockClearAllStamps).toHaveBeenCalledTimes(1)

    // Should close modal
    expect(result.current.migrationState.isOpen).toBe(false)
  })

  it('should show loading state during migration', async () => {
    // Mock a slow API response
    let resolvePromise: () => void
    const slowPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    mockApi.stats.checkIn.mockReturnValue(slowPromise)

    const { result } = renderHook(() => usePassportMigration())

    // Open the modal
    act(() => {
      result.current.checkAndShowMigration()
    })

    // Start migration
    const migrationPromise = act(async () => {
      await result.current.migrateStamps()
    })

    // Should be loading
    expect(result.current.migrationState.isLoading).toBe(true)

    // Resolve the API call
    resolvePromise!()
    await migrationPromise

    // Should no longer be loading
    expect(result.current.migrationState.isLoading).toBe(false)
  })

  it('should handle migration errors gracefully', async () => {
    // Mock API error for first cafe, success for others
    mockApi.stats.checkIn
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue(undefined)

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() => usePassportMigration())

    // Open the modal
    act(() => {
      result.current.checkAndShowMigration()
    })

    // Start migration
    await act(async () => {
      await result.current.migrateStamps()
    })

    // Should still attempt all migrations
    expect(mockApi.stats.checkIn).toHaveBeenCalledTimes(3)

    // Should log the error
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to migrate check-in for cafe 1:',
      expect.any(Error)
    )

    // Should still clear local stamps and close modal
    expect(mockClearAllStamps).toHaveBeenCalledTimes(1)
    expect(result.current.migrationState.isOpen).toBe(false)

    consoleSpy.mockRestore()
  })

  it('should handle complete migration failure', async () => {
    // Mock all API calls to fail
    mockApi.stats.checkIn.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => usePassportMigration())

    // Open the modal
    act(() => {
      result.current.checkAndShowMigration()
    })

    // Start migration
    await act(async () => {
      await result.current.migrateStamps()
    })

    // Should show error state when ALL migrations fail
    expect(result.current.migrationState.error).toBe('Failed to sync visits. Please try again.')
    expect(result.current.migrationState.isLoading).toBe(false)
    expect(result.current.migrationState.isOpen).toBe(true) // Should stay open on error

    // Should not clear local stamps on complete failure
    expect(mockClearAllStamps).not.toHaveBeenCalled()
  })

  it('should reset error state when retrying migration', async () => {
    const { result } = renderHook(() => usePassportMigration())

    // Simulate error state by directly setting it
    act(() => {
      result.current.checkAndShowMigration()
    })
    
    // Set up successful API call
    mockApi.stats.checkIn.mockResolvedValue(undefined)
    
    // Migration should clear error state
    await act(async () => {
      await result.current.migrateStamps()
    })

    // Error should be cleared
    expect(result.current.migrationState.error).toBe(null)
    expect(result.current.migrationState.isOpen).toBe(false)
  })

  it('should be callable multiple times safely', () => {
    const { result } = renderHook(() => usePassportMigration())

    // Call multiple times
    act(() => {
      result.current.checkAndShowMigration()
    })
    act(() => {
      result.current.checkAndShowMigration()
    })

    // Should still work correctly
    expect(result.current.migrationState.isOpen).toBe(true)
    expect(result.current.migrationState.localVisitCount).toBe(3)
  })
})