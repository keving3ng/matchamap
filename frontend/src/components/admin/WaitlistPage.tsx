import React, { useState, useEffect } from 'react'
import { Download, ArrowUpDown, Users, TrendingUp, Calendar, Percent, Eye, EyeOff, AlertTriangle } from '@/components/icons'
import { api } from '../../utils/api'
import { COPY } from '../../constants/copy'
import { PrimaryButton, SecondaryButton, StatusBadge } from '../ui'
import { Skeleton } from '../ui'
import { formatDate, formatDateForCSV } from '../../utils/dateFormatter'
import type { WaitlistResponse } from '../../../../shared/types'

type SortField = 'email' | 'created_at'
type SortOrder = 'asc' | 'desc'

export const WaitlistPage: React.FC = () => {
  const [data, setData] = useState<WaitlistResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [offset, setOffset] = useState(0)
  const [showFraudStats, setShowFraudStats] = useState(false)

  const LIMIT = 50

  const fetchWaitlist = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setOffset(0)
      } else if (offset > 0) {
        setLoadingMore(true)
      }

      const currentOffset = reset ? 0 : offset

      const result = await api.waitlist.getAll({
        limit: LIMIT,
        offset: currentOffset,
        sortBy: sortField,
        sortOrder,
      })

      if (reset) {
        setData(result)
        setOffset(LIMIT)
      } else {
        setData(prev => prev ? {
          ...result,
          waitlist: [...prev.waitlist, ...result.waitlist]
        } : result)
        setOffset(prev => prev + LIMIT)
      }

      setError(null)
    } catch (err) {
      console.error('Failed to fetch waitlist:', err)
      setError(err instanceof Error ? err.message : COPY.admin.waitlist.errorLoading)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchWaitlist(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const handleExportCSV = () => {
    if (!data?.waitlist.length) return

    const headers = ['Email', 'Signup Date', 'Referral Source', 'Status', 'Converted At', 'Fraud Flag', 'Fraud Score', 'Fraud Reasons']
    const csvContent = [
      headers.join(','),
      ...data.waitlist.map(entry => [
        entry.email,
        formatDateForCSV(entry.createdAt),
        entry.referralSource || '',
        entry.converted ? 'Converted' : 'Pending',
        entry.convertedAt ? formatDateForCSV(entry.convertedAt) : '',
        entry.isFlaggedFraud ? 'Yes' : 'No',
        entry.fraudScore?.toFixed(2) || '0.00',
        entry.fraudReason || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `waitlist-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }


  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="text" width="60%" height={20} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={100} />
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton variant="rectangular" height={60} />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={60} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <SecondaryButton 
            onClick={() => fetchWaitlist(true)}
            className="mt-2"
          >
            {COPY.common.retry}
          </SecondaryButton>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {COPY.admin.waitlist.title}
          </h1>
          <p className="text-gray-600">
            {COPY.admin.waitlist.subtitle}
          </p>
        </div>
        
        <div className="flex gap-3">
          <SecondaryButton
            onClick={() => setShowFraudStats(!showFraudStats)}
            className="text-sm"
          >
            {showFraudStats ? <EyeOff size={16} /> : <Eye size={16} />}
            {showFraudStats ? COPY.admin.waitlist.hideFraudStats : COPY.admin.waitlist.showFraudStats}
          </SecondaryButton>
          
          <PrimaryButton
            icon={Download}
            onClick={handleExportCSV}
            disabled={!data?.waitlist.length}
          >
            {COPY.admin.waitlist.exportCsv}
          </PrimaryButton>
        </div>
      </div>

      {/* Analytics Cards */}
      {data?.analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{COPY.admin.waitlist.analytics}</p>
                <p className="text-xl font-semibold">
                  {COPY.admin.waitlist.totalSignups(data.analytics.totalSignups)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{COPY.admin.waitlist.last24Hours}</p>
                <p className="text-xl font-semibold">
                  {COPY.admin.waitlist.dailySignups(data.analytics.dailySignups)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Weekly</p>
                <p className="text-xl font-semibold">
                  {COPY.admin.waitlist.weeklySignups(data.analytics.weeklySignups)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Percent className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion</p>
                <p className="text-xl font-semibold">
                  {COPY.admin.waitlist.conversionRate(data.analytics.conversionRate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fraud Analytics Card - Only visible when toggle is on */}
      {showFraudStats && data?.analytics.suspectedFraud !== undefined && data.analytics.suspectedFraud > 0 && (
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{COPY.admin.waitlist.suspectedFraud}</p>
              <p className="text-xl font-semibold text-red-700">
                {COPY.admin.waitlist.suspectedFraudCount(data.analytics.suspectedFraud)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Waitlist Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {COPY.admin.waitlist.entriesPerPage(LIMIT)}
            </p>
            <div className="flex gap-2">
              <SecondaryButton
                onClick={() => handleSort('email')}
                className="text-sm"
              >
                <ArrowUpDown size={16} />
                {COPY.admin.waitlist.sortByEmail}
                {sortField === 'email' && (
                  <span className="ml-1">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </SecondaryButton>
              <SecondaryButton
                onClick={() => handleSort('created_at')}
                className="text-sm"
              >
                <ArrowUpDown size={16} />
                {COPY.admin.waitlist.sortByDate}
                {sortField === 'created_at' && (
                  <span className="ml-1">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </SecondaryButton>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {data?.waitlist.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {COPY.admin.waitlist.email}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {COPY.admin.waitlist.signupDate}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {COPY.admin.waitlist.referralSource}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {COPY.admin.waitlist.status}
                  </th>
                  {showFraudStats && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fraud
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.waitlist.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm text-gray-900">
                        {entry.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.referralSource || COPY.admin.waitlist.unknown}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge variant={entry.converted ? 'success' : 'warning'}>
                        {entry.converted ? COPY.admin.waitlist.converted : COPY.admin.waitlist.pending}
                      </StatusBadge>
                    </td>
                    {showFraudStats && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.isFlaggedFraud && (
                          <div className="space-y-1">
                            <StatusBadge variant="error">
                              {COPY.admin.waitlist.suspectedFraud}
                            </StatusBadge>
                            {entry.fraudReason && (
                              <p className="text-xs text-gray-500">
                                {entry.fraudReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">{COPY.admin.waitlist.noEntries}</p>
          </div>
        )}

        {/* Load More Button */}
        {data?.hasMore && (
          <div className="px-6 py-4 border-t border-gray-200 text-center">
            <SecondaryButton
              onClick={() => fetchWaitlist(false)}
              disabled={loadingMore}
            >
              {loadingMore ? COPY.admin.waitlist.loadingMore : COPY.admin.waitlist.loadMore}
            </SecondaryButton>
          </div>
        )}
      </div>
    </div>
  )
}

export default WaitlistPage