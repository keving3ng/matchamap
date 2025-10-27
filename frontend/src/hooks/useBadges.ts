/**
 * Custom hook for managing user badges
 * Handles badge fetching, checking, and notifications
 */

import { useState, useCallback, useEffect } from 'react'
import { api } from '../utils/api'
import { useAuthStore } from '../stores/authStore'
import type { UserBadge, BadgeProgress, BadgeDefinition } from '../../../shared/types'

interface UseBadgesReturn {
  // Data
  badges: UserBadge[]
  progress: BadgeProgress[]
  definitions: Record<string, BadgeDefinition>
  
  // Loading states
  isLoading: boolean
  isChecking: boolean
  
  // Error states
  error: string | null
  
  // New badge notifications
  newBadges: UserBadge[]
  hasNewBadges: boolean
  
  // Actions
  loadBadges: () => Promise<void>
  loadProgress: () => Promise<void>
  checkForNewBadges: () => Promise<void>
  dismissNewBadges: () => void
  
  // Utility
  getBadgeDefinition: (badgeKey: string) => BadgeDefinition | undefined
  refresh: () => Promise<void>
}

export const useBadges = (): UseBadgesReturn => {
  const { isAuthenticated } = useAuthStore()
  
  // State
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [progress, setProgress] = useState<BadgeProgress[]>([])
  const [definitions, setDefinitions] = useState<Record<string, BadgeDefinition>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newBadges, setNewBadges] = useState<UserBadge[]>([])

  // Load badge definitions (public endpoint)
  const loadDefinitions = useCallback(async () => {
    try {
      const response = await api.badges.getDefinitions()
      const definitionsMap = response.allBadges.reduce((acc, badge) => {
        acc[badge.key] = badge
        return acc
      }, {} as Record<string, BadgeDefinition>)
      setDefinitions(definitionsMap)
    } catch (err) {
      console.warn('Failed to load badge definitions:', err)
    }
  }, [])

  // Load user's earned badges
  const loadBadges = useCallback(async () => {
    if (!isAuthenticated) {
      setBadges([])
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.badges.getMyBadges()
      setBadges(response.badges)
    } catch (err) {
      console.error('Failed to load badges:', err)
      setError('Failed to load badges')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Load badge progress
  const loadProgress = useCallback(async () => {
    if (!isAuthenticated) {
      setProgress([])
      return
    }

    try {
      const response = await api.badges.getMyProgress()
      setProgress(response.progress)
    } catch (err) {
      console.error('Failed to load badge progress:', err)
    }
  }, [isAuthenticated])

  // Check for new badges
  const checkForNewBadges = useCallback(async () => {
    if (!isAuthenticated) return

    setIsChecking(true)
    
    try {
      const response = await api.badges.checkAndAward()
      
      if (response.newBadges.length > 0) {
        // Add definitions to new badges
        const enrichedBadges = response.newBadges.map(badge => ({
          ...badge,
          definition: definitions[badge.badgeKey]
        }))
        
        setNewBadges(enrichedBadges)
        
        // Refresh badges list
        await loadBadges()
        await loadProgress()
      }
    } catch (err) {
      console.error('Failed to check for new badges:', err)
    } finally {
      setIsChecking(false)
    }
  }, [isAuthenticated, definitions, loadBadges, loadProgress])

  // Dismiss new badge notifications
  const dismissNewBadges = useCallback(() => {
    setNewBadges([])
  }, [])

  // Get badge definition by key
  const getBadgeDefinition = useCallback((badgeKey: string): BadgeDefinition | undefined => {
    return definitions[badgeKey]
  }, [definitions])

  // Refresh all badge data
  const refresh = useCallback(async () => {
    await Promise.all([
      loadBadges(),
      loadProgress(),
      loadDefinitions()
    ])
  }, [loadBadges, loadProgress, loadDefinitions])

  // Load definitions on mount
  useEffect(() => {
    loadDefinitions()
  }, [loadDefinitions])

  // Load user data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadBadges()
      loadProgress()
    }
  }, [isAuthenticated, loadBadges, loadProgress])

  return {
    // Data
    badges,
    progress,
    definitions,
    
    // Loading states
    isLoading,
    isChecking,
    
    // Error states
    error,
    
    // New badge notifications
    newBadges,
    hasNewBadges: newBadges.length > 0,
    
    // Actions
    loadBadges,
    loadProgress,
    checkForNewBadges,
    dismissNewBadges,
    
    // Utility
    getBadgeDefinition,
    refresh,
  }
}

export default useBadges