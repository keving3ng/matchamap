import { useState, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useVisitedCafesStore } from '../stores/visitedCafesStore'
import { api } from '../utils/api'

interface MigrationState {
  isOpen: boolean
  isLoading: boolean
  error: string | null
  localVisitCount: number
}

/**
 * Hook for managing passport migration from localStorage to backend
 */
export const usePassportMigration = () => {
  const [state, setState] = useState<MigrationState>({
    isOpen: false,
    isLoading: false,
    error: null,
    localVisitCount: 0,
  })
  
  const { isAuthenticated } = useAuthStore()
  const { stampedCafeIds, clearAllStamps } = useVisitedCafesStore()

  /**
   * Check if migration is needed and show modal
   */
  const checkAndShowMigration = useCallback(() => {
    // Only show migration for authenticated users with local stamps
    if (isAuthenticated && stampedCafeIds.length > 0) {
      setState(prev => ({
        ...prev,
        isOpen: true,
        localVisitCount: stampedCafeIds.length,
        error: null,
      }))
    }
  }, [isAuthenticated, stampedCafeIds.length])

  /**
   * Close migration modal
   */
  const closeMigration = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      error: null,
    }))
  }, [])

  /**
   * Migrate local stamps to backend
   */
  const migrateStamps = useCallback(async () => {
    if (!isAuthenticated || stampedCafeIds.length === 0) {
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Check-in to each cafe found in localStorage
      for (const cafeId of stampedCafeIds) {
        try {
          await api.stats.checkIn(cafeId, 'Migrated from local storage')
        } catch (error) {
          console.warn(`Failed to migrate check-in for cafe ${cafeId}:`, error)
          // Continue with other cafes even if one fails
        }
      }

      // Clear local storage after successful migration
      clearAllStamps()

      setState(prev => ({
        ...prev,
        isLoading: false,
        isOpen: false,
        error: null,
      }))
    } catch (error) {
      console.error('Migration failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Migration failed',
      }))
    }
  }, [isAuthenticated, stampedCafeIds, clearAllStamps])

  /**
   * Skip migration and clear local storage
   */
  const skipMigration = useCallback(() => {
    clearAllStamps()
    closeMigration()
  }, [clearAllStamps, closeMigration])

  return {
    migrationState: state,
    checkAndShowMigration,
    closeMigration,
    migrateStamps,
    skipMigration,
  }
}