import React, { useState, useEffect } from 'react'
import { TrendingUp } from '@/components/icons'
import { ContentContainer } from './ContentContainer'
import { COPY } from '../constants/copy'
import { useAuthStore } from '../stores/authStore'
import { usePassportMigration } from '../hooks/usePassportMigration'
import { PassportMigrationModal } from './passport/PassportMigrationModal'
import { api } from '../utils/api'
import type { PassportViewProps } from '../types'

interface UserCheckin {
  id: number
  cafeId: number
  visitedAt: string
  notes: string | null
  cafe: {
    id: number
    name: string
    slug: string
    address: string | null
    latitude: number
    longitude: number
    city: string
    quickNote: string
    instagram: string | null
    tiktokPostLink: string | null
    instagramPostLink: string | null
  } | null
}

export const PassportView: React.FC<PassportViewProps> = ({ cafes, visitedStamps, onToggleStamp }) => {
  const [loadingStamps, setLoadingStamps] = useState<Set<number>>(new Set())
  const [checkins, setCheckins] = useState<UserCheckin[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { isAuthenticated } = useAuthStore()
  const {
    migrationState,
    checkAndShowMigration,
    closeMigration,
    migrateStamps,
    skipMigration,
  } = usePassportMigration()

  // Load check-ins from backend for authenticated users
  useEffect(() => {
    const loadCheckins = async () => {
      if (!isAuthenticated) {
        setCheckins([])
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        const response = await api.stats.getMyCheckins()
        setCheckins(response.checkins)
      } catch (error) {
        console.error('Failed to load check-ins:', error)
        setError('Failed to load check-ins')
      } finally {
        setLoading(false)
      }
    }

    loadCheckins()
  }, [isAuthenticated])

  // Check for migration when authenticated user has check-ins loaded
  useEffect(() => {
    if (isAuthenticated && !loading && !migrationState.isOpen) {
      checkAndShowMigration()
    }
  }, [isAuthenticated, loading, migrationState.isOpen, checkAndShowMigration])

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    } catch {
      return 'Unknown date'
    }
  }

  // Determine visited state - use backend for authenticated users, localStorage for others
  const getVisitedCafeIds = (): number[] => {
    if (isAuthenticated) {
      return checkins.map(checkin => checkin.cafeId)
    }
    return visitedStamps
  }

  // Handle check-in toggle
  const handleToggleStamp = async (cafeId: number) => {
    if (isAuthenticated) {
      // Use backend API for authenticated users
      setLoadingStamps(prev => new Set(prev).add(cafeId))
      try {
        await api.stats.checkIn(cafeId)
        // Refresh check-ins
        const response = await api.stats.getMyCheckins()
        setCheckins(response.checkins)
      } catch (error) {
        console.error('Error checking in:', error)
      } finally {
        setLoadingStamps(prev => {
          const newSet = new Set(prev)
          newSet.delete(cafeId)
          return newSet
        })
      }
    } else {
      // Use localStorage for unauthenticated users
      setLoadingStamps(prev => new Set(prev).add(cafeId))
      try {
        await onToggleStamp(cafeId)
      } catch (error) {
        console.error('Error toggling stamp:', error)
      } finally {
        setLoadingStamps(prev => {
          const newSet = new Set(prev)
          newSet.delete(cafeId)
          return newSet
        })
      }
    }
  }

  const visitedCafeIds = getVisitedCafeIds()
  const visitedCount = visitedCafeIds.length
  const totalCount = cafes.length
  const percentage = Math.round((visitedCount / totalCount) * 100)

  // Get checkin data for a cafe
  const getCheckinForCafe = (cafeId: number): UserCheckin | undefined => {
    return checkins.find(checkin => checkin.cafeId === cafeId)
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white border-b-2 border-green-200 px-4 py-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
            🎫
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 font-caveat">
              {COPY.passport.title}
            </h2>
            <p className="text-sm text-gray-600">
              {COPY.passport.subtitle}
            </p>
          </div>
        </div>
      </div>

      <ContentContainer maxWidth="lg">
        {/* Loading State */}
        {loading && (
          <div className="px-4 py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent mx-auto mb-2" />
            <p className="text-gray-600">{COPY.common.loading}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="px-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Progress Card */}
        {!loading && (
          <div className="px-4 py-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 mb-1">Your Progress</p>
                  <p className="text-4xl font-bold">{visitedCount}/{totalCount}</p>
                </div>
                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                  <p className="text-3xl font-bold">{percentage}%</p>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur rounded-full h-3 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500 shadow-md"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="mt-4 flex items-center gap-2">
                {percentage >= 50 ? <TrendingUp size={20} /> : <span className="text-lg">🍵</span>}
                <p className="text-sm font-semibold">
                  {percentage >= 50 ? `${visitedCount} of ${totalCount} visited` : 'Start exploring'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collection Grid */}
        {!loading && (
          <div className="px-4 pb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Collection</h3>
            <div className="grid grid-cols-3 gap-4">
              {cafes.map((cafe) => {
                const isVisited = visitedCafeIds.includes(cafe.id)
                const checkin = getCheckinForCafe(cafe.id)

                return (
                  <button
                    key={cafe.id}
                    onClick={() => handleToggleStamp(cafe.id)}
                    disabled={loadingStamps.has(cafe.id)}
                    className={`aspect-square rounded-2xl shadow-md transition-all transform active:scale-95 disabled:cursor-wait ${
                      isVisited ? 'scale-100 shadow-lg' : 'opacity-40 grayscale scale-95'
                    } ${loadingStamps.has(cafe.id) ? 'animate-pulse' : ''}`}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                      {isVisited && (
                        <div className="absolute inset-0 border-4 border-white/40 rounded-2xl pointer-events-none" />
                      )}

                      <div className="text-4xl mb-2 drop-shadow-md">🍵</div>
                      <p className="text-white font-bold text-xs text-center leading-tight drop-shadow-md">
                        {cafe.name}
                      </p>
                      
                      {/* Display visit date for authenticated users */}
                      {isAuthenticated && checkin && (
                        <div className="mt-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full">
                          <p className="text-xs font-bold text-gray-800">
                            {formatDate(checkin.visitedAt)}
                          </p>
                        </div>
                      )}
                      
                      {/* Display score for non-visited cafes */}
                      {!isVisited && cafe.displayScore && (
                        <div className="mt-1.5 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full">
                          <p className="text-xs font-bold text-gray-800">{cafe.displayScore.toFixed(1)}</p>
                        </div>
                      )}

                      {/* Notes indicator */}
                      {isAuthenticated && checkin?.notes && (
                        <div className="absolute top-1 left-1 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                          <span className="text-sm">📝</span>
                        </div>
                      )}

                      {loadingStamps.has(cafe.id) ? (
                        <div className="absolute top-1 right-1 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent" />
                        </div>
                      ) : isVisited ? (
                        <div className="absolute top-1 right-1 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                          <span className="text-sm">✓</span>
                        </div>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </ContentContainer>

      {/* Migration Modal */}
      <PassportMigrationModal
        isOpen={migrationState.isOpen}
        isLoading={migrationState.isLoading}
        error={migrationState.error}
        localVisitCount={migrationState.localVisitCount}
        onMigrate={migrateStamps}
        onSkip={skipMigration}
        onClose={closeMigration}
      />
    </div>
  )
}

export default PassportView