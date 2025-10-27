import { useState, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useVisitedCafesStore } from '../stores/visitedCafesStore'

interface MigrationState {
  isOpen: boolean
  isLoading: boolean
  error: string | null
  localVisitCount: number
}

/**
 * Hook for managing passport sync from localStorage to backend
 * Simplified to only handle initial localStorage cleanup for existing users
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
   * Check if cleanup is needed and show modal
   * Now only shows for users with localStorage data to offer cleanup
   */
  const checkAndShowMigration = useCallback(() => {
    // Only show for authenticated users with local stamps to offer cleanup
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
   * Close modal
   */
  const closeMigration = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      error: null,
    }))
  }, [])

  /**
   * Clear localStorage data (simplified - no migration needed)
   */
  const migrateStamps = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Simply clear local storage since passport is now built from check-ins
      clearAllStamps()

      setState(prev => ({
        ...prev,
        isLoading: false,
        isOpen: false,
        error: null,
      }))
    } catch (error) {
      console.error('Cleanup failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Cleanup failed',
      }))
    }
  }, [clearAllStamps])

  /**
   * Skip cleanup and clear local storage
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