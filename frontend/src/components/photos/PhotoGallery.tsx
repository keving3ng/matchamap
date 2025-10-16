import React, { useState, useEffect, useCallback } from 'react'
import { Camera, ChevronRight, User, Calendar } from 'lucide-react'
import { api } from '../../utils/api'
import { COPY } from '../../constants/copy'
import { Skeleton } from '../ui'
import { useFeatureToggle } from '../../hooks/useFeatureToggle'
import type { ReviewPhoto } from '../../../../shared/types'

interface PhotoGalleryProps {
  cafeId: number
  onPhotoClick?: (photo: ReviewPhoto, index: number, photos: ReviewPhoto[]) => void
  maxInitialPhotos?: number
  showUploadButton?: boolean
  onUploadClick?: () => void
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  cafeId,
  onPhotoClick,
  maxInitialPhotos = 6,
  showUploadButton = false,
  onUploadClick
}) => {
  const [photos, setPhotos] = useState<ReviewPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const hasUserAccounts = useFeatureToggle('ENABLE_USER_ACCOUNTS')

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.photos.getByCafe(cafeId, {
        limit: showAll ? 50 : maxInitialPhotos + 1, // +1 to check if there are more
        offset: 0
      })
      setPhotos(response.photos)
    } catch (err) {
      console.error('Failed to fetch photos:', err)
      setError('Failed to load photos')
    } finally {
      setLoading(false)
    }
  }, [cafeId, showAll, maxInitialPhotos])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handlePhotoClick = (photo: ReviewPhoto, index: number) => {
    onPhotoClick?.(photo, index, photos)
  }

  const displayedPhotos = showAll ? photos : photos.slice(0, maxInitialPhotos)
  const hasMorePhotos = photos.length > maxInitialPhotos

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          {showUploadButton && <Skeleton className="h-8 w-20" />}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-charcoal-900">
            {COPY.photos.title}
          </h3>
          {showUploadButton && hasUserAccounts && (
            <button
              onClick={onUploadClick}
              className="flex items-center gap-2 px-3 py-1.5 bg-matcha-500 text-white text-sm font-medium rounded-lg hover:bg-matcha-600 transition-colors active:scale-95"
            >
              <Camera size={16} />
              {COPY.photos.upload}
            </button>
          )}
        </div>
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Camera size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-2">{COPY.photos.noPhotos}</p>
          {showUploadButton && hasUserAccounts && (
            <button
              onClick={onUploadClick}
              className="text-matcha-600 font-medium hover:text-matcha-700 transition-colors"
            >
              {COPY.photos.beFirst}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-charcoal-900">
          {COPY.photos.title} ({photos.length})
        </h3>
        {showUploadButton && hasUserAccounts && (
          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-matcha-500 text-white text-sm font-medium rounded-lg hover:bg-matcha-600 transition-colors active:scale-95"
          >
            <Camera size={16} />
            {COPY.photos.upload}
          </button>
        )}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2">
        {displayedPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square group cursor-pointer"
            onClick={() => handlePhotoClick(photo, index)}
          >
            <img
              src={photo.thumbnailUrl || photo.imageUrl}
              alt={photo.caption || `Photo of ${cafeId}`}
              className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105 group-active:scale-95"
              loading="lazy"
            />
            
            {/* Overlay with photo info */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
            
            {/* Bottom overlay with metadata */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1 text-white text-xs">
                <User size={12} />
                <span className="truncate">{photo.userId}</span>
              </div>
              {photo.createdAt && (
                <div className="flex items-center gap-1 text-white text-xs mt-1">
                  <Calendar size={12} />
                  <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {hasMorePhotos && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 font-medium"
        >
          {COPY.photos.showMore(photos.length - maxInitialPhotos)}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  )
}