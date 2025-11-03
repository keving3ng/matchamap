import React, { useState, useEffect } from 'react'
import { MessageSquare, Image as ImageIcon, FileText, Lightbulb, Check, X, Loader, Calendar, User, MapPin, Star } from '@/components/icons'
import { COPY } from '../../constants/copy'
import { PrimaryButton, SecondaryButton } from '../ui'
import { Skeleton } from '../ui'
import { api } from '../../utils/api'

type TabType = 'reviews' | 'photos' | 'comments' | 'suggestions'

interface ModerationItem {
  id: number
  type: 'review' | 'photo' | 'comment'
  content: string
  createdAt: string
  userId: number
  username: string
  cafeId?: number
  cafeName?: string
  moderationStatus: string
  // Photo-specific fields
  imageUrl?: string
  thumbnailUrl?: string
  fileSize?: number
  width?: number
  height?: number
  // Review-specific fields
  title?: string
  overallRating?: number
  // Comment-specific fields
  reviewId?: number
}

export const ModerationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('reviews')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<ModerationItem[]>([])
  const [reviews, setReviews] = useState<ModerationItem[]>([])
  const [comments, setComments] = useState<ModerationItem[]>([])
  const [stats, setStats] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [processingBulk, setProcessingBulk] = useState(false)
  const [moderatingIds, setModeratingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchModerationQueue()
  }, [])

  const fetchModerationQueue = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.admin.getModerationQueue()
      setPhotos(data.photos)
      setReviews(data.reviews)
      setComments(data.comments)
      setStats(data.stats)
    } catch (err) {
      console.error('Failed to fetch moderation queue:', err)
      setError(COPY.admin.moderationDashboard.error)
    } finally {
      setLoading(false)
    }
  }

  const handleModerate = async (
    item: ModerationItem,
    status: 'approved' | 'rejected',
    notes?: string
  ) => {
    try {
      setModeratingIds(prev => new Set(prev).add(item.id))

      // Call the appropriate API based on item type
      switch (item.type) {
        case 'photo':
          await api.admin.moderatePhoto(item.id, { status, notes })
          setPhotos(prev => prev.filter(p => p.id !== item.id))
          break
        case 'review':
          await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reviews/${item.id}/moderate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status, notes })
          })
          setReviews(prev => prev.filter(r => r.id !== item.id))
          break
        case 'comment':
          await fetch(`${import.meta.env.VITE_API_URL}/api/admin/comments/${item.id}/moderate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status, notes })
          })
          setComments(prev => prev.filter(c => c.id !== item.id))
          break
      }

      // Remove from selected items if it was selected
      setSelectedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
    } catch (err) {
      console.error(`Failed to ${status} ${item.type}:`, err)
      alert(`Failed to ${status} ${item.type}`)
    } finally {
      setModeratingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
    }
  }

  const handleBulkModerate = async (status: 'approved' | 'rejected') => {
    if (selectedItems.size === 0) return

    const confirmMessage = COPY.admin.moderationDashboard.bulkActions[
      status === 'approved' ? 'confirmApprove' : 'confirmReject'
    ](selectedItems.size)

    if (!window.confirm(confirmMessage)) return

    try {
      setProcessingBulk(true)

      // Build items array from selected items
      const items: Array<{ id: number; type: 'photo' | 'review' | 'comment' }> = []

      // Get current tab items
      const currentItems = getCurrentTabItems()
      selectedItems.forEach(id => {
        const item = currentItems.find(i => i.id === id)
        if (item) {
          items.push({ id: item.id, type: item.type })
        }
      })

      const result = await api.admin.bulkModerate({ items, status })

      // Remove successfully moderated items from the lists
      const successfulIds = new Set(items.map(i => i.id))
      setPhotos(prev => prev.filter(p => !successfulIds.has(p.id) || result.results.errors.some(e => e.includes(`photo ${p.id}`))))
      setReviews(prev => prev.filter(r => !successfulIds.has(r.id) || result.results.errors.some(e => e.includes(`review ${r.id}`))))
      setComments(prev => prev.filter(c => !successfulIds.has(c.id) || result.results.errors.some(e => e.includes(`comment ${c.id}`))))

      // Clear selection
      setSelectedItems(new Set())

      // Show success message
      alert(COPY.admin.moderationDashboard.bulkActions.success(status, result.results.success))

      // If there were errors, show them
      if (result.results.failed > 0) {
        console.error('Bulk moderation errors:', result.results.errors)
      }
    } catch (err) {
      console.error('Bulk moderation failed:', err)
      alert(COPY.admin.moderationDashboard.bulkActions.error)
    } finally {
      setProcessingBulk(false)
    }
  }

  const toggleItemSelection = (id: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    const currentItems = getCurrentTabItems()
    setSelectedItems(new Set(currentItems.map(item => item.id)))
  }

  const deselectAll = () => {
    setSelectedItems(new Set())
  }

  const getCurrentTabItems = (): ModerationItem[] => {
    switch (activeTab) {
      case 'reviews':
        return reviews
      case 'photos':
        return photos
      case 'comments':
        return comments
      case 'suggestions':
        return []
      default:
        return []
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode; count: number }> = [
    { id: 'reviews', label: COPY.admin.moderationDashboard.tabs.reviews, icon: <MessageSquare size={18} />, count: reviews.length },
    { id: 'photos', label: COPY.admin.moderationDashboard.tabs.photos, icon: <ImageIcon size={18} />, count: photos.length },
    { id: 'comments', label: COPY.admin.moderationDashboard.tabs.comments, icon: <FileText size={18} />, count: comments.length },
    { id: 'suggestions', label: COPY.admin.moderationDashboard.tabs.suggestions, icon: <Lightbulb size={18} />, count: 0 },
  ]

  const currentItems = getCurrentTabItems()
  const hasSelection = selectedItems.size > 0

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <SecondaryButton onClick={fetchModerationQueue}>
            {COPY.admin.moderationDashboard.retry}
          </SecondaryButton>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {COPY.admin.moderationDashboard.title}
        </h1>
        <p className="text-gray-600">
          {COPY.admin.moderationDashboard.subtitle}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare size={24} className="text-purple-500" />
              <h3 className="font-semibold text-gray-800">Reviews</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.reviews.pending}</p>
            <p className="text-sm text-gray-600">
              {COPY.admin.moderationDashboard.stats.pending(stats.reviews.pending)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <ImageIcon size={24} className="text-blue-500" />
              <h3 className="font-semibold text-gray-800">Photos</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.photos.pending}</p>
            <p className="text-sm text-gray-600">
              {COPY.admin.moderationDashboard.stats.pending(stats.photos.pending)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={24} className="text-green-500" />
              <h3 className="font-semibold text-gray-800">Comments</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.comments.pending}</p>
            <p className="text-sm text-gray-600">
              {COPY.admin.moderationDashboard.stats.pending(stats.comments.pending)}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bulk Actions Bar */}
        {currentItems.length > 0 && (
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  {hasSelection
                    ? COPY.admin.moderationDashboard.bulkActions.selected(selectedItems.size)
                    : COPY.admin.moderationDashboard.bulkActions.title}
                </span>
                {hasSelection ? (
                  <button
                    onClick={deselectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {COPY.admin.moderationDashboard.bulkActions.deselectAll}
                  </button>
                ) : (
                  <button
                    onClick={selectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {COPY.admin.moderationDashboard.bulkActions.selectAll}
                  </button>
                )}
              </div>

              {hasSelection && (
                <div className="flex gap-2">
                  <PrimaryButton
                    onClick={() => handleBulkModerate('approved')}
                    disabled={processingBulk}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Check size={16} />
                    {COPY.admin.moderationDashboard.bulkActions.approveSelected}
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={() => handleBulkModerate('rejected')}
                    disabled={processingBulk}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X size={16} />
                    {COPY.admin.moderationDashboard.bulkActions.rejectSelected}
                  </SecondaryButton>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'reviews' && (
            <ReviewsTab
              items={reviews}
              selectedItems={selectedItems}
              moderatingIds={moderatingIds}
              onToggleSelection={toggleItemSelection}
              onModerate={handleModerate}
              formatDate={formatDate}
            />
          )}
          {activeTab === 'photos' && (
            <PhotosTab
              items={photos}
              selectedItems={selectedItems}
              moderatingIds={moderatingIds}
              onToggleSelection={toggleItemSelection}
              onModerate={handleModerate}
              formatDate={formatDate}
              formatFileSize={formatFileSize}
            />
          )}
          {activeTab === 'comments' && (
            <CommentsTab
              items={comments}
              selectedItems={selectedItems}
              moderatingIds={moderatingIds}
              onToggleSelection={toggleItemSelection}
              onModerate={handleModerate}
              formatDate={formatDate}
            />
          )}
          {activeTab === 'suggestions' && <SuggestionsTab />}
        </div>
      </div>
    </div>
  )
}

// Tab Components
interface TabProps {
  items: ModerationItem[]
  selectedItems: Set<number>
  moderatingIds: Set<number>
  onToggleSelection: (id: number) => void
  onModerate: (item: ModerationItem, status: 'approved' | 'rejected', notes?: string) => Promise<void>
  formatDate: (date: string) => string
}

const ReviewsTab: React.FC<TabProps> = ({ items, selectedItems, moderatingIds, onToggleSelection, onModerate, formatDate }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {COPY.admin.moderationDashboard.placeholders.noReviews}
        </h3>
        <p className="text-gray-600">
          {COPY.admin.moderationDashboard.placeholders.allReviewed}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="bg-gray-50 rounded-lg border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={selectedItems.has(item.id)}
              onChange={() => onToggleSelection(item.id)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star size={18} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-lg">{item.overallRating?.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <User size={14} />
                    <span>{item.username}</span>
                  </div>
                  {item.cafeName && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin size={14} />
                      <span>{item.cafeName}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>

              {item.title && (
                <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
              )}

              <p className="text-gray-700 whitespace-pre-wrap mb-4">{item.content}</p>

              <div className="flex gap-3">
                <PrimaryButton
                  onClick={() => onModerate(item, 'approved')}
                  disabled={moderatingIds.has(item.id)}
                  className="flex items-center gap-2 text-sm"
                >
                  {moderatingIds.has(item.id) ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                  {COPY.admin.moderationDashboard.actions.approve}
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => onModerate(item, 'rejected')}
                  disabled={moderatingIds.has(item.id)}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={16} />
                  {COPY.admin.moderationDashboard.actions.reject}
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface PhotoTabProps extends TabProps {
  formatFileSize: (bytes: number) => string
}

const PhotosTab: React.FC<PhotoTabProps> = ({ items, selectedItems, moderatingIds, onToggleSelection, onModerate, formatDate, formatFileSize }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {COPY.admin.moderationDashboard.placeholders.noPhotos}
        </h3>
        <p className="text-gray-600">
          {COPY.admin.moderationDashboard.placeholders.allReviewed}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="bg-gray-50 rounded-lg border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={selectedItems.has(item.id)}
              onChange={() => onToggleSelection(item.id)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div className="flex-shrink-0">
              <img
                src={item.thumbnailUrl || item.imageUrl}
                alt={item.content || 'Photo'}
                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={14} />
                    <span>{item.username}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  {item.cafeName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={14} />
                      <span>{item.cafeName}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {item.fileSize && (
                    <div className="text-sm text-gray-600">
                      Size: {formatFileSize(item.fileSize)}
                    </div>
                  )}
                  {item.width && item.height && (
                    <div className="text-sm text-gray-600">
                      Dimensions: {item.width} × {item.height}
                    </div>
                  )}
                </div>
              </div>

              {item.content && (
                <div className="mb-4">
                  <p className="text-gray-900 bg-white p-3 rounded-lg">
                    &quot;{item.content}&quot;
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <PrimaryButton
                  onClick={() => onModerate(item, 'approved')}
                  disabled={moderatingIds.has(item.id)}
                  className="flex items-center gap-2 text-sm"
                >
                  {moderatingIds.has(item.id) ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                  {COPY.admin.moderationDashboard.actions.approve}
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => onModerate(item, 'rejected')}
                  disabled={moderatingIds.has(item.id)}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={16} />
                  {COPY.admin.moderationDashboard.actions.reject}
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const CommentsTab: React.FC<TabProps> = ({ items, selectedItems, moderatingIds, onToggleSelection, onModerate, formatDate }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {COPY.admin.moderationDashboard.placeholders.noComments}
        </h3>
        <p className="text-gray-600">
          {COPY.admin.moderationDashboard.placeholders.allReviewed}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="bg-gray-50 rounded-lg border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={selectedItems.has(item.id)}
              onChange={() => onToggleSelection(item.id)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <User size={14} />
                  <span>{item.username}</span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>

              <p className="text-gray-700 whitespace-pre-wrap mb-4">{item.content}</p>

              <div className="flex gap-3">
                <PrimaryButton
                  onClick={() => onModerate(item, 'approved')}
                  disabled={moderatingIds.has(item.id)}
                  className="flex items-center gap-2 text-sm"
                >
                  {moderatingIds.has(item.id) ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                  {COPY.admin.moderationDashboard.actions.approve}
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => onModerate(item, 'rejected')}
                  disabled={moderatingIds.has(item.id)}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={16} />
                  {COPY.admin.moderationDashboard.actions.reject}
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const SuggestionsTab: React.FC = () => {
  return (
    <div className="text-center py-12">
      <Lightbulb size={48} className="mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {COPY.admin.moderationDashboard.placeholders.noSuggestions}
      </h3>
      <p className="text-gray-600">
        {COPY.admin.moderationDashboard.placeholders.comingSoon}
      </p>
    </div>
  )
}

export default ModerationDashboard
