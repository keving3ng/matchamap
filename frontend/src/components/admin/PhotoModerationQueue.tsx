import React, { useState, useEffect } from 'react'
import { Check, X, User, Calendar, MapPin, Image as ImageIcon, FileImage } from '@/components/icons'
import { COPY } from '../../constants/copy'
import { PrimaryButton, SecondaryButton } from '../ui'
import { Skeleton } from '../ui'
import { api } from '../../utils/api'
import type { ReviewPhoto } from '../../../../shared/types'

interface PhotoModerationQueueProps {
  className?: string
}

interface PhotoWithDetails extends ReviewPhoto {
  userName?: string
  cafeName?: string
}

export const PhotoModerationQueue: React.FC<PhotoModerationQueueProps> = ({ className = '' }) => {
  const [photos, setPhotos] = useState<PhotoWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [moderatingIds, setModeratingIds] = useState<Set<number>>(new Set())

  const fetchPendingPhotos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Note: This endpoint doesn't exist yet in the API, but based on the photo upload guide
      // it should be GET /api/admin/photos
      const response = await api.admin.getPhotosForModeration()
      setPhotos(response.photos)
    } catch (err) {
      console.error('Failed to fetch pending photos:', err)
      setError('Failed to load pending photos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingPhotos()
  }, [])

  const handleModerate = async (
    photoId: number,
    status: 'approved' | 'rejected',
    notes?: string
  ) => {
    try {
      setModeratingIds(prev => new Set(prev).add(photoId))

      // Note: This endpoint doesn't exist yet in the API, but based on the photo upload guide
      // it should be PUT /api/admin/photos/:id/moderate
      await api.admin.moderatePhoto(photoId, { status, notes })

      // Remove the photo from the list
      setPhotos(prev => prev.filter(photo => photo.id !== photoId))

      // Show success message (optional - could add toast notification)
      console.log(`Photo ${status} successfully`)
    } catch (err) {
      console.error(`Failed to ${status} photo:`, err)
      // Could add error toast notification here
    } finally {
      setModeratingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(photoId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex gap-6">
              <Skeleton className="w-32 h-32 rounded-lg" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
        <p className="text-red-600 mb-4">{error}</p>
        <SecondaryButton onClick={fetchPendingPhotos}>
          {COPY.reviews.retry}
        </SecondaryButton>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center ${className}`}>
        <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {COPY.photos.moderation.noPending}
        </h3>
        <p className="text-gray-600">
          {COPY.photos.moderation.allReviewed}
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-charcoal-900">
          {COPY.photos.moderation.queue}
        </h2>
        <span className="text-gray-600">
          {photos.length} photo{photos.length !== 1 ? 's' : ''} pending
        </span>
      </div>

      {/* Photo List */}
      <div className="space-y-4">
        {photos.map((photo) => (
          <PhotoModerationCard
            key={photo.id}
            photo={photo}
            onModerate={handleModerate}
            isLoading={moderatingIds.has(photo.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface PhotoModerationCardProps {
  photo: PhotoWithDetails
  onModerate: (photoId: number, status: 'approved' | 'rejected', notes?: string) => Promise<void>
  isLoading: boolean
}

const PhotoModerationCard: React.FC<PhotoModerationCardProps> = ({
  photo,
  onModerate,
  isLoading
}) => {
  const [notes, setNotes] = useState('')
  const [showNotesInput, setShowNotesInput] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  const handleApprove = () => {
    onModerate(photo.id, 'approved', notes || undefined)
  }

  const handleReject = () => {
    setShowNotesInput(true)
  }

  const confirmReject = () => {
    onModerate(photo.id, 'rejected', notes || undefined)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs">
      <div className="flex gap-6">
        {/* Photo Preview */}
        <div className="flex-shrink-0">
          <img
            src={photo.thumbnailUrl || photo.imageUrl}
            alt={photo.caption || 'Uploaded photo'}
            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
          />
        </div>

        {/* Photo Details */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Left column */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={14} />
                <span>
                  {COPY.photos.moderation.uploadedBy}{' '}
                  <span className="font-medium">{photo.userName || `User ${photo.userId}`}</span>
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} />
                <span>{formatDate(photo.createdAt)}</span>
              </div>

              {photo.cafeName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span>
                    {COPY.photos.moderation.cafe}: <span className="font-medium">{photo.cafeName}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-2">
              {photo.fileSize && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileImage size={14} />
                  <span>{COPY.photos.moderation.fileSize}: {formatFileSize(photo.fileSize)}</span>
                </div>
              )}
              
              {photo.width && photo.height && (
                <div className="text-sm text-gray-600">
                  {COPY.photos.moderation.dimensions}: {photo.width} × {photo.height}
                </div>
              )}
            </div>
          </div>

          {/* Caption */}
          {photo.caption && (
            <div className="mb-4">
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                &quot;{photo.caption}&quot;
              </p>
            </div>
          )}

          {/* Notes Input (for rejection) */}
          {showNotesInput && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {COPY.photos.moderation.notes}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={COPY.photos.moderation.notesPlaceholder}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-matcha-500 focus:border-matcha-500"
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!showNotesInput ? (
              <>
                <PrimaryButton
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Check size={16} />
                  {COPY.photos.moderation.approve}
                </PrimaryButton>
                <SecondaryButton
                  onClick={handleReject}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={16} />
                  {COPY.photos.moderation.reject}
                </SecondaryButton>
              </>
            ) : (
              <>
                <PrimaryButton
                  onClick={confirmReject}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                >
                  <X size={16} />
                  Confirm {COPY.photos.moderation.reject}
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => {
                    setShowNotesInput(false)
                    setNotes('')
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </SecondaryButton>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}