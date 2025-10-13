import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUserProfile, useMyProfile } from '../useUserProfile'
import type { PublicUserProfile, UserProfile } from '../../../../shared/types'

// Mock the API client
vi.mock('../../utils/api', () => ({
  api: {
    profile: {
      getUserProfile: vi.fn(),
      getMyProfile: vi.fn(),
      updateMyProfile: vi.fn(),
    },
  },
}))

describe('useUserProfile', () => {
  let mockGetUserProfile: any

  const mockPublicProfile: PublicUserProfile = {
    id: 1,
    username: 'testuser',
    displayName: 'Test User',
    bio: 'Test bio',
    avatarUrl: 'https://example.com/avatar.jpg',
    joinedAt: '2024-01-01T00:00:00Z',
    stats: {
      checkinsCount: 5,
      reviewsCount: 3,
      photosCount: 2,
    },
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    mockGetUserProfile = vi.fn()
    const { api } = await import('../../utils/api')
    vi.mocked(api.profile.getUserProfile).mockImplementation(mockGetUserProfile)
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useUserProfile('testuser'))

    expect(result.current.profile).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should fetch user profile successfully', async () => {
    mockGetUserProfile.mockResolvedValue(mockPublicProfile)

    const { result } = renderHook(() => useUserProfile('testuser'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.profile).toEqual(mockPublicProfile)
    expect(result.current.error).toBeNull()
    expect(mockGetUserProfile).toHaveBeenCalledWith('testuser')
  })

  it('should handle fetch error', async () => {
    const errorMessage = 'User not found'
    mockGetUserProfile.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useUserProfile('testuser'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.profile).toBeNull()
    expect(result.current.error).toBe(errorMessage)
  })

  it('should handle non-Error objects in catch', async () => {
    mockGetUserProfile.mockRejectedValue('String error')

    const { result } = renderHook(() => useUserProfile('testuser'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load profile')
  })

  it('should fetch profile when username changes', async () => {
    mockGetUserProfile.mockResolvedValue(mockPublicProfile)

    const { result, rerender } = renderHook(
      ({ username }) => useUserProfile(username),
      { initialProps: { username: 'user1' } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGetUserProfile).toHaveBeenCalledWith('user1')

    // Change username
    rerender({ username: 'user2' })

    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledWith('user2')
    })

    expect(mockGetUserProfile).toHaveBeenCalledTimes(2)
  })

  it('should not fetch when username is empty', () => {
    renderHook(() => useUserProfile(''))

    expect(mockGetUserProfile).not.toHaveBeenCalled()
  })

  it('should set loading state correctly during fetch', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    mockGetUserProfile.mockReturnValue(promise)

    const { result } = renderHook(() => useUserProfile('testuser'))

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolvePromise!(mockPublicProfile)
      await promise
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('should clear error when fetching new profile', async () => {
    mockGetUserProfile
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce(mockPublicProfile)

    const { result, rerender } = renderHook(
      ({ username }) => useUserProfile(username),
      { initialProps: { username: 'user1' } }
    )

    await waitFor(() => {
      expect(result.current.error).toBe('First error')
    })

    // Change username to trigger new fetch
    rerender({ username: 'user2' })

    await waitFor(() => {
      expect(result.current.error).toBeNull()
      expect(result.current.profile).toEqual(mockPublicProfile)
    })
  })
})

describe('useMyProfile', () => {
  let mockGetMyProfile: any
  let mockUpdateMyProfile: any

  const mockUserProfile: UserProfile = {
    id: 1,
    username: 'myuser',
    email: 'test@example.com',
    displayName: 'My User',
    bio: 'My bio',
    avatarUrl: 'https://example.com/my-avatar.jpg',
    role: 'user',
    emailVerified: true,
    joinedAt: '2024-01-01T00:00:00Z',
    lastActiveAt: '2024-01-02T00:00:00Z',
    stats: {
      checkinsCount: 10,
      reviewsCount: 5,
      photosCount: 3,
    },
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    mockGetMyProfile = vi.fn()
    mockUpdateMyProfile = vi.fn()
    const { api } = await import('../../utils/api')
    vi.mocked(api.profile.getMyProfile).mockImplementation(mockGetMyProfile)
    vi.mocked(api.profile.updateMyProfile).mockImplementation(mockUpdateMyProfile)
  })

  it('should initialize with default state and fetch profile', async () => {
    mockGetMyProfile.mockResolvedValue(mockUserProfile)

    const { result } = renderHook(() => useMyProfile())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.profile).toBeNull()
    expect(result.current.error).toBeNull()

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.profile).toEqual(mockUserProfile)
    expect(mockGetMyProfile).toHaveBeenCalledTimes(1)
  })

  it('should handle fetch error', async () => {
    const errorMessage = 'Unauthorized'
    mockGetMyProfile.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useMyProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.profile).toBeNull()
    expect(result.current.error).toBe(errorMessage)
  })

  it('should update profile successfully', async () => {
    const updatedProfile = { ...mockUserProfile, displayName: 'Updated Name' }
    mockGetMyProfile.mockResolvedValue(mockUserProfile)
    mockUpdateMyProfile.mockResolvedValue(updatedProfile)

    const { result } = renderHook(() => useMyProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const updateData = { displayName: 'Updated Name' }
    let updateResult: any

    await act(async () => {
      updateResult = await result.current.updateProfile(updateData)
    })

    expect(updateResult.success).toBe(true)
    expect(updateResult.profile).toEqual(updatedProfile)
    expect(result.current.profile).toEqual(updatedProfile)
    expect(result.current.error).toBeNull()
    expect(mockUpdateMyProfile).toHaveBeenCalledWith(updateData)
  })

  it('should handle update profile error', async () => {
    const errorMessage = 'Update failed'
    mockGetMyProfile.mockResolvedValue(mockUserProfile)
    mockUpdateMyProfile.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useMyProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const updateData = { displayName: 'New Name' }
    let updateResult: any

    await act(async () => {
      updateResult = await result.current.updateProfile(updateData)
    })

    expect(updateResult.success).toBe(false)
    expect(updateResult.error).toBe(errorMessage)
    expect(result.current.error).toBe(errorMessage)
    expect(result.current.profile).toEqual(mockUserProfile) // Should remain unchanged
  })

  it('should handle update profile with non-Error object', async () => {
    mockGetMyProfile.mockResolvedValue(mockUserProfile)
    mockUpdateMyProfile.mockRejectedValue('String error')

    const { result } = renderHook(() => useMyProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let updateResult: any

    await act(async () => {
      updateResult = await result.current.updateProfile({ displayName: 'New Name' })
    })

    expect(updateResult.success).toBe(false)
    expect(updateResult.error).toBe('Failed to update profile')
    expect(result.current.error).toBe('Failed to update profile')
  })

  it('should clear error when updating profile', async () => {
    const updatedProfile = { ...mockUserProfile, displayName: 'Updated Name' }
    mockGetMyProfile.mockRejectedValue(new Error('Initial error'))
    mockUpdateMyProfile.mockResolvedValue(updatedProfile)

    const { result } = renderHook(() => useMyProfile())

    await waitFor(() => {
      expect(result.current.error).toBe('Initial error')
    })

    await act(async () => {
      await result.current.updateProfile({ displayName: 'Updated Name' })
    })

    expect(result.current.error).toBeNull()
    expect(result.current.profile).toEqual(updatedProfile)
  })

  it('should refetch profile when refetch is called', async () => {
    const newProfile = { ...mockUserProfile, displayName: 'Refreshed Name' }
    mockGetMyProfile
      .mockResolvedValueOnce(mockUserProfile)
      .mockResolvedValueOnce(newProfile)

    const { result } = renderHook(() => useMyProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.profile).toEqual(mockUserProfile)
    })

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.profile).toEqual(newProfile)
    expect(mockGetMyProfile).toHaveBeenCalledTimes(2)
  })

  it('should set loading state during refetch', async () => {
    let resolveFirst: (value: any) => void
    let resolveSecond: (value: any) => void
    
    const firstPromise = new Promise(resolve => { resolveFirst = resolve })
    const secondPromise = new Promise(resolve => { resolveSecond = resolve })
    
    mockGetMyProfile
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise)

    const { result } = renderHook(() => useMyProfile())

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolveFirst!(mockUserProfile)
      await firstPromise
    })

    expect(result.current.isLoading).toBe(false)

    // Start refetch
    act(() => {
      result.current.refetch()
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolveSecond!(mockUserProfile)
      await secondPromise
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('should handle error during refetch', async () => {
    const errorMessage = 'Refetch failed'
    mockGetMyProfile
      .mockResolvedValueOnce(mockUserProfile)
      .mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useMyProfile())

    await waitFor(() => {
      expect(result.current.profile).toEqual(mockUserProfile)
      expect(result.current.error).toBeNull()
    })

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.profile).toBeNull() // Profile should be cleared on error
  })

  it('should provide all required return values', async () => {
    mockGetMyProfile.mockResolvedValue(mockUserProfile)

    const { result } = renderHook(() => useMyProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current).toHaveProperty('profile')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('error')
    expect(result.current).toHaveProperty('updateProfile')
    expect(result.current).toHaveProperty('refetch')
    expect(typeof result.current.updateProfile).toBe('function')
    expect(typeof result.current.refetch).toBe('function')
  })

  it('should handle multiple update calls', async () => {
    const updates = [
      { displayName: 'Name 1' },
      { displayName: 'Name 2' },
      { displayName: 'Name 3' },
    ]
    
    const responses = updates.map((update, index) => ({
      ...mockUserProfile,
      displayName: update.displayName,
    }))

    mockGetMyProfile.mockResolvedValue(mockUserProfile)
    mockUpdateMyProfile
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])

    const { result } = renderHook(() => useMyProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Make multiple update calls
    for (let i = 0; i < updates.length; i++) {
      await act(async () => {
        const updateResult = await result.current.updateProfile(updates[i])
        expect(updateResult.success).toBe(true)
        expect(result.current.profile?.displayName).toBe(updates[i].displayName)
      })
    }

    expect(mockUpdateMyProfile).toHaveBeenCalledTimes(3)
  })
})