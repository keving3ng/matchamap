import React, { useState, useEffect } from 'react'
import { COPY } from '../../constants/copy'
import { api } from '../../utils/api'
import { useAuthStore } from '../../stores/authStore'
import { useUserFeatures } from '../../hooks/useUserFeatures'
import { PrimaryButton, SecondaryButton, TertiaryButton } from '../ui'
import { Skeleton } from '../ui'

// Types for leaderboard data
interface LeaderboardEntry {
  rank: number
  userId: number
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  location?: string | null
}

interface PassportEntry extends LeaderboardEntry {
  totalCheckins: number
  passportCompletion: number
}

interface ReviewerEntry extends LeaderboardEntry {
  totalReviews: number
  reputationScore: number
}

interface ContributorEntry extends LeaderboardEntry {
  totalReviews: number
  totalPhotos: number
  totalFavorites: number
  totalContributions: number
  reputationScore: number
}

type LeaderboardType = 'passport' | 'reviewers' | 'contributors'
type TimePeriod = 'all' | 'monthly'

interface LeaderboardPageProps {
  className?: string
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ className = '' }) => {
  const { isAuthenticated } = useAuthStore()
  const { hasUserSocial } = useUserFeatures()
  
  // State
  const [activeTab, setActiveTab] = useState<LeaderboardType>('passport')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all')
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [leaderboardData, setLeaderboardData] = useState<any[]>([])
  const [userRank, setUserRank] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        period: timePeriod,
        city: selectedCity === 'all' ? undefined : selectedCity,
        limit: 50,
      }

      let response
      switch (activeTab) {
        case 'passport':
          response = await api.leaderboard.getPassportLeaderboard(params)
          break
        case 'reviewers':
          response = await api.leaderboard.getReviewerLeaderboard(params)
          break
        case 'contributors':
          response = await api.leaderboard.getContributorLeaderboard(params)
          break
      }

      setLeaderboardData(response.leaderboard)
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError(COPY.leaderboard.errorDescription)
    } finally {
      setLoading(false)
    }
  }

  // Fetch user rank (if authenticated)
  const fetchUserRank = async () => {
    if (!isAuthenticated) return

    try {
      const response = await api.leaderboard.getUserRank({
        type: activeTab,
        period: timePeriod,
        city: selectedCity === 'all' ? undefined : selectedCity,
      })
      setUserRank(response.userRank)
    } catch (err) {
      console.error('Error fetching user rank:', err)
      setUserRank(null)
    }
  }

  // Effects
  useEffect(() => {
    if (hasUserSocial) {
      fetchLeaderboard()
      fetchUserRank()
    }
  }, [activeTab, timePeriod, selectedCity, hasUserSocial])

  // Don't render if social features are disabled
  if (!hasUserSocial) {
    return null
  }

  const handleRetry = () => {
    fetchLeaderboard()
    fetchUserRank()
  }

  const getTabTitle = (type: LeaderboardType) => {
    switch (type) {
      case 'passport':
        return COPY.leaderboard.passportTitle
      case 'reviewers':
        return COPY.leaderboard.reviewerTitle
      case 'contributors':
        return COPY.leaderboard.contributorTitle
    }
  }

  const getTabDescription = (type: LeaderboardType) => {
    switch (type) {
      case 'passport':
        return COPY.leaderboard.passportDescription
      case 'reviewers':
        return COPY.leaderboard.reviewerDescription
      case 'contributors':
        return COPY.leaderboard.contributorDescription
    }
  }

  const renderUserAvatar = (entry: LeaderboardEntry) => {
    if (entry.avatarUrl) {
      return (
        <img
          src={entry.avatarUrl}
          alt={COPY.leaderboard.userAvatar(entry.username)}
          className="w-10 h-10 rounded-full object-cover"
        />
      )
    }
    
    // Fallback to initials
    const initials = (entry.displayName || entry.username)
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
    
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center text-white font-semibold text-sm">
        {initials}
      </div>
    )
  }

  const renderStats = (entry: any) => {
    switch (activeTab) {
      case 'passport':
        return (
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              {COPY.leaderboard.checkinsCount(entry.totalCheckins)}
            </div>
            <div className="text-sm text-gray-600">
              {COPY.leaderboard.passportProgress(entry.passportCompletion)}
            </div>
          </div>
        )
      case 'reviewers':
        return (
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              {COPY.leaderboard.reviewsCount(entry.totalReviews)}
            </div>
            <div className="text-sm text-gray-600">
              {COPY.leaderboard.reputationScore(entry.reputationScore)}
            </div>
          </div>
        )
      case 'contributors':
        return (
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              {COPY.leaderboard.contributionsCount(entry.totalContributions)}
            </div>
            <div className="text-sm text-gray-600">
              {COPY.leaderboard.contributionBreakdown(
                entry.totalReviews,
                entry.totalPhotos,
                entry.totalFavorites
              )}
            </div>
          </div>
        )
    }
  }

  const renderRankBadge = (rank: number) => {
    let badgeClass = 'bg-gray-100 text-gray-800'
    let icon = null

    if (rank === 1) {
      badgeClass = 'bg-yellow-100 text-yellow-800'
      icon = '🥇'
    } else if (rank === 2) {
      badgeClass = 'bg-gray-200 text-gray-800'
      icon = '🥈'
    } else if (rank === 3) {
      badgeClass = 'bg-yellow-200 text-yellow-900'
      icon = '🥉'
    }

    return (
      <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${badgeClass}`}>
        {icon && <span>{icon}</span>}
        <span>#{rank}</span>
      </div>
    )
  }

  return (
    <div className={`max-w-4xl mx-auto p-4 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {COPY.leaderboard.title}
        </h1>
        <p className="text-gray-600">
          {COPY.leaderboard.subtitle}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['passport', 'reviewers', 'contributors'] as LeaderboardType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === tab
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {COPY.leaderboard[tab]}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
        {/* Time Period Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setTimePeriod('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              timePeriod === 'all'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {COPY.leaderboard.allTime}
          </button>
          <button
            onClick={() => setTimePeriod('monthly')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              timePeriod === 'monthly'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {COPY.leaderboard.monthly}
          </button>
        </div>

        {/* City Filter - simplified for now */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCity('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCity === 'all'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {COPY.leaderboard.allCities}
          </button>
        </div>
      </div>

      {/* Current Tab Info */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          {getTabTitle(activeTab)}
        </h2>
        <p className="text-gray-600">
          {getTabDescription(activeTab)}
        </p>
      </div>

      {/* User Rank (if authenticated and has rank) */}
      {isAuthenticated && userRank && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-1">
            {COPY.leaderboard.yourRank}
          </h3>
          <p className="text-green-800">
            {COPY.leaderboard.yourRankDescription(userRank.rank, getTabTitle(activeTab))}
          </p>
        </div>
      )}

      {/* Leaderboard Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="w-32 h-4 mb-2" />
                  <Skeleton className="w-24 h-3" />
                </div>
                <div className="text-right">
                  <Skeleton className="w-20 h-4 mb-2" />
                  <Skeleton className="w-16 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {COPY.leaderboard.errorTitle}
          </h3>
          <p className="text-gray-600 mb-4">
            {COPY.leaderboard.errorDescription}
          </p>
          <PrimaryButton onClick={handleRetry}>
            {COPY.leaderboard.retry}
          </PrimaryButton>
        </div>
      ) : leaderboardData.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {COPY.leaderboard.noData}
          </h3>
          <p className="text-gray-600">
            {COPY.leaderboard.noDataDescription}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboardData.map((entry) => (
            <div
              key={`${entry.userId}-${entry.rank}`}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                {renderRankBadge(entry.rank)}
                
                {/* Avatar */}
                {renderUserAvatar(entry)}
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {entry.displayName || entry.username}
                  </div>
                  {entry.displayName && (
                    <div className="text-sm text-gray-600 truncate">
                      @{entry.username}
                    </div>
                  )}
                  {entry.location && (
                    <div className="text-xs text-gray-500 truncate">
                      📍 {entry.location}
                    </div>
                  )}
                </div>
                
                {/* Stats */}
                {renderStats(entry)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}