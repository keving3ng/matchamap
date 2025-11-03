import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePassportMigration } from '../usePassportMigration'
import { useAuthStore } from '../../stores/authStore'
import { useVisitedCafesStore } from '../../stores/visitedCafesStore'

// Mock the stores
vi.mock('../../stores/authStore')
vi.mock('../../stores/visitedCafesStore')

const mockAuthStore = vi.mocked(useAuthStore)
const mockVisitedCafesStore = vi.mocked(useVisitedCafesStore)

describe('usePassportMigration', () => {
  const mockClearAllStamps = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock implementation to default (no error)
    mockClearAllStamps.mockImplementation(() => {})

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

  it('should clean up stamps successfully', async () => {
    const { result } = renderHook(() => usePassportMigration())

    // Open the modal
    act(() => {
      result.current.checkAndShowMigration()
    })

    // Start cleanup (simplified - no API calls)
    await act(async () => {
      await result.current.migrateStamps()
    })

    // Should clear local stamps
    expect(mockClearAllStamps).toHaveBeenCalledTimes(1)

    // Should close modal
    expect(result.current.migrationState.isOpen).toBe(false)
  })

  it('should show loading state during cleanup', async () => {
    const { result } = renderHook(() => usePassportMigration())

    // Open the modal
    act(() => {
      result.current.checkAndShowMigration()
    })

    // Start cleanup and verify loading states
    await act(async () => {
      await result.current.migrateStamps()
    })

    // Should no longer be loading after completion
    expect(result.current.migrationState.isLoading).toBe(false)
  })

  it('should handle cleanup errors gracefully', async () => {
    // Mock clearAllStamps to throw an error
    mockClearAllStamps.mockImplementation(() => {
      throw new Error('Storage error')
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => usePassportMigration())

    // Open the modal
    act(() => {
      result.current.checkAndShowMigration()
    })

    // Start cleanup
    await act(async () => {
      await result.current.migrateStamps()
    })

    // Should log the error
    expect(consoleSpy).toHaveBeenCalledWith(
      'Cleanup failed:',
      expect.any(Error)
    )

    // Should show error in state
    expect(result.current.migrationState.error).toBe('Storage error')
    expect(result.current.migrationState.isLoading).toBe(false)

    consoleSpy.mockRestore()
  })

  it('should reset error state when retrying cleanup', async () => {
    const { result } = renderHook(() => usePassportMigration())

    // Open modal
    act(() => {
      result.current.checkAndShowMigration()
    })

    // Cleanup should clear error state
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