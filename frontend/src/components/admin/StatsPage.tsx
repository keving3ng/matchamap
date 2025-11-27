import React, { useEffect, useState } from 'react'
import { ArrowUpDown, TrendingUp, Users, MapPin } from '@/components/icons'
import { api } from '../../utils/api'
import { COPY } from '../../constants/copy'
import { Skeleton } from '../ui/Skeleton'
import { AlertDialog } from '../ui/AlertDialog'
import type { CafeStats, UserActivitySummary } from '../../../../shared/types'

// Type-safe numeric fields from CafeStats for sorting
type NumericCafeStatKey = 'views' | 'directions_clicks' | 'anonymous_passport_marks' | 'authenticated_checkins' | 'instagram_clicks' | 'tiktok_clicks'

interface SummaryCardProps {
  label: string
  value: number | string
  subtitle?: string
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'gradient'
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, subtitle, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    gradient: 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-800',
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="text-sm font-medium opacity-80 mb-1">{label}</div>
      <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {subtitle && <div className="text-xs mt-1 opacity-70">{subtitle}</div>}
    </div>
  )
}

interface SortableHeaderProps {
  label: string
  sortKey: NumericCafeStatKey
  currentSortKey: NumericCafeStatKey
  sortDesc: boolean
  onSort: (key: NumericCafeStatKey) => void
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, sortKey, currentSortKey, sortDesc, onSort }) => {
  const isActive = currentSortKey === sortKey

  return (
    <th className="px-4 py-3 text-right">
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 justify-end w-full hover:text-green-600 transition"
      >
        <span className={isActive ? 'font-semibold' : ''}>{label}</span>
        <ArrowUpDown size={14} className={isActive ? 'text-green-600' : 'opacity-40'} />
        {isActive && (
          <span className="text-xs">{sortDesc ? '↓' : '↑'}</span>
        )}
      </button>
    </th>
  )
}

interface CafeStatsRowProps {
  cafe: CafeStats
}

const CafeStatsRow: React.FC<CafeStatsRowProps> = ({ cafe }) => {
  const ctr = cafe.views > 0 ? ((cafe.directions_clicks / cafe.views) * 100).toFixed(1) : '0.0'
  const demand = cafe.anonymous_passport_marks + cafe.authenticated_checkins
  const social = cafe.instagram_clicks + cafe.tiktok_clicks

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-left font-medium text-gray-900">
        {cafe.name}
        <div className="text-xs text-gray-500">{cafe.neighborhood}</div>
      </td>
      <td className="px-4 py-3 text-left text-sm text-gray-600">{cafe.city}</td>
      <td className="px-4 py-3 text-right text-sm">{cafe.views.toLocaleString()}</td>
      <td className="px-4 py-3 text-right text-sm">{cafe.directions_clicks.toLocaleString()}</td>
      <td className="px-4 py-3 text-right text-sm font-medium">{ctr}%</td>
      <td className="px-4 py-3 text-right text-sm">{cafe.anonymous_passport_marks.toLocaleString()}</td>
      <td className="px-4 py-3 text-right text-sm">{cafe.authenticated_checkins.toLocaleString()}</td>
      <td className="px-4 py-3 text-right text-sm font-semibold text-green-700">{demand.toLocaleString()}</td>
      <td className="px-4 py-3 text-right text-sm">{social.toLocaleString()}</td>
    </tr>
  )
}

export const StatsPage: React.FC = () => {
  const [cafeStats, setCafeStats] = useState<CafeStats[]>([])
  const [userSummary, setUserSummary] = useState<UserActivitySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<NumericCafeStatKey>('views')
  const [sortDesc, setSortDesc] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const [cafeData, userData] = await Promise.all([
        api.adminAnalytics.getCafeStats(),
        api.adminAnalytics.getUserActivitySummary(),
      ])
      setCafeStats(cafeData.stats)
      setUserSummary(userData)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError(COPY.admin.analytics.error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: NumericCafeStatKey) => {
    if (sortBy === key) {
      setSortDesc(!sortDesc)
    } else {
      setSortBy(key)
      setSortDesc(true)
    }
  }

  const sorted = [...cafeStats].sort((a, b) => {
    const aVal = a[sortBy] as number
    const bVal = b[sortBy] as number
    return sortDesc ? bVal - aVal : aVal - bVal
  })

  // Calculate aggregate metrics
  const totalViews = cafeStats.reduce((sum, s) => sum + s.views, 0)
  const totalDirections = cafeStats.reduce((sum, s) => sum + s.directions_clicks, 0)
  const totalAnonymousMarks = cafeStats.reduce((sum, s) => sum + s.anonymous_passport_marks, 0)
  const totalAuthCheckins = cafeStats.reduce((sum, s) => sum + s.authenticated_checkins, 0)
  const totalDemand = totalAnonymousMarks + totalAuthCheckins
  const avgCtr = totalViews > 0 ? ((totalDirections / totalViews) * 100).toFixed(1) : '0.0'

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Skeleton variant="text" width="40%" height={32} className="mb-2" />
        <Skeleton variant="text" width="60%" height={20} className="mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={100} />
          ))}
        </div>
        <Skeleton variant="rectangular" height={400} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <AlertDialog
          variant="error"
          title={COPY.admin.analytics.error}
          message={error}
          primaryAction={{ label: COPY.admin.analytics.retry, onClick: loadAnalytics }}
        />
      </div>
    )
  }

  if (!cafeStats.length && !userSummary) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center">
        <div className="bg-white rounded-lg shadow p-12">
          <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{COPY.admin.analytics.noData}</h2>
          <p className="text-gray-500">Start tracking cafe views and user activity to see analytics here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{COPY.admin.analytics.title}</h1>
        <p className="text-sm sm:text-base text-gray-600">{COPY.admin.analytics.subtitle}</p>
      </div>

      {/* User Activity Summary Cards */}
      {userSummary && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-gray-700" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{COPY.admin.analytics.userActivity}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <SummaryCard label={COPY.admin.analytics.totalUsers} value={userSummary.total_users} color="blue" />
            <SummaryCard label={COPY.admin.analytics.activeUsers7d} value={userSummary.active_users_7d} color="green" />
            <SummaryCard label={COPY.admin.analytics.activeUsers30d} value={userSummary.active_users_30d} color="green" />
            <SummaryCard label={COPY.admin.analytics.totalCheckins} value={userSummary.total_checkins} color="purple" />
            <SummaryCard label={COPY.admin.analytics.repeatVisitors} value={userSummary.repeat_visitors} color="yellow" />
          </div>
        </div>
      )}

      {/* Cafe Performance Summary Cards */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={20} className="text-gray-700" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{COPY.admin.analytics.cafePerformance}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <SummaryCard label={COPY.admin.analytics.totalViews} value={totalViews} />
          <SummaryCard label={COPY.admin.analytics.totalDirections} value={totalDirections} subtitle={`${avgCtr}% CTR`} />
          <SummaryCard label={COPY.admin.analytics.totalAnonymousMarks} value={totalAnonymousMarks} />
          <SummaryCard label={COPY.admin.analytics.totalAuthCheckins} value={totalAuthCheckins} />
          <SummaryCard
            label={COPY.admin.analytics.totalDemand}
            value={totalDemand}
            subtitle="Marks + Check-ins"
            color="gradient"
          />
        </div>
      </div>

      {/* Sortable Stats Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{COPY.admin.analytics.cafe}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{COPY.admin.analytics.city}</th>
                <SortableHeader label={COPY.admin.analytics.views} sortKey="views" currentSortKey={sortBy} sortDesc={sortDesc} onSort={handleSort} />
                <SortableHeader label={COPY.admin.analytics.directions} sortKey="directions_clicks" currentSortKey={sortBy} sortDesc={sortDesc} onSort={handleSort} />
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700" title={COPY.admin.analytics.ctrTooltip}>{COPY.admin.analytics.ctr}</th>
                <SortableHeader label={COPY.admin.analytics.anonymousMarks} sortKey="anonymous_passport_marks" currentSortKey={sortBy} sortDesc={sortDesc} onSort={handleSort} />
                <SortableHeader label={COPY.admin.analytics.checkins} sortKey="authenticated_checkins" currentSortKey={sortBy} sortDesc={sortDesc} onSort={handleSort} />
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700" title={COPY.admin.analytics.demandTooltip}>{COPY.admin.analytics.demand}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{COPY.admin.analytics.social}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sorted.length > 0 ? (
                sorted.map((cafe) => (
                  <CafeStatsRow key={cafe.id} cafe={cafe} />
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    {COPY.admin.analytics.noData}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default StatsPage
