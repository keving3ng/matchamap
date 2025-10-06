import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import type { PublicUserProfile, UserProfile, UpdateProfileRequest } from '../../../shared/types'

/**
 * Hook to fetch and manage user profile data
 */
export const useUserProfile = (username: string) => {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await api.profile.getUserProfile(username)
        setProfile(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    if (username) {
      fetchProfile()
    }
  }, [username])

  return { profile, isLoading, error }
}

/**
 * Hook to fetch and manage own profile data (authenticated)
 */
export const useMyProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await api.profile.getMyProfile()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const updateProfile = async (updates: UpdateProfileRequest) => {
    setError(null)

    try {
      const updatedProfile = await api.profile.updateMyProfile(updates)
      setProfile(updatedProfile)
      return { success: true, profile: updatedProfile }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile,
  }
}
