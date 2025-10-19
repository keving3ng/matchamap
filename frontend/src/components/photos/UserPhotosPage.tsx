import React, { useState, useEffect } from 'react'
import { Camera, Trash2, MapPin, Calendar, FileImage, AlertCircle } from '@/components/icons'
import { useNavigate } from 'react-router'
import { COPY } from '../../constants/copy'
import { PrimaryButton, SecondaryButton, StatusBadge } from '../ui'
import { Skeleton } from '../ui'
import { api } from '../../utils/api'
import { ContentContainer } from '../ContentContainer'
import { PhotoLightbox } from './PhotoLightbox'
import type { ReviewPhoto } from '../../../../shared/types'

interface UserPhotosPageProps {
  className?: string
}

interface PhotoWithCafeInfo extends ReviewPhoto {
  cafeName?: string
  cafeCity?: string
}

export const UserPhotosPage: React.FC<UserPhotosPageProps> = ({ className = '' }) => {
  const [photos, setPhotos] = useState<PhotoWithCafeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    photos: PhotoWithCafeInfo[]
    index: number
  } | null>(null)
  const navigate = useNavigate()

  const fetchMyPhotos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.photos.getMyPhotos({ limit: 100 })
      setPhotos(response.photos as PhotoWithCafeInfo[])
    } catch (err) {
      console.error('Failed to fetch my photos:', err)
      setError('Failed to load your photos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyPhotos()
  }, [])

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm(COPY.photos.myPhotos.confirmDelete)) {
      return
    }

    try {
      setDeletingIds(prev => new Set(prev).add(photoId))
      await api.photos.delete(photoId)
      setPhotos(prev => prev.filter(photo => photo.id !== photoId))
      // Could add success toast notification here
    } catch (err) {
      console.error('Failed to delete photo:', err)
      // Could add error toast notification here
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(photoId)
        return newSet
      })
    }
  }

  const handlePhotoClick = (_photo: PhotoWithCafeInfo, index: number) => {
    setLightboxPhoto({ photos, index })
  }

  if (loading) {
    return (
      <ContentContainer maxWidth="lg" className={`py-8 ${className}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-24 h-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ContentContainer>
    )
  }

  if (error) {
    return (
      <ContentContainer maxWidth="lg" className={`py-8 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <SecondaryButton onClick={fetchMyPhotos}>
            {COPY.reviews.retry}
          </SecondaryButton>
        </div>
      </ContentContainer>
    )
  }

  return (
    <ContentContainer maxWidth="lg" className={`py-8 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-charcoal-900">
            {COPY.photos.myPhotos.title}
          </h1>
          <PrimaryButton
            onClick={() => navigate('/cafes')}
            className="flex items-center gap-2"
          >
            <Camera size={16} />
            {COPY.photos.upload.title}
          </PrimaryButton>
        </div>

        {/* Photos */}
        {photos.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <Camera size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {COPY.photos.myPhotos.noPhotos}
            </h3>
            <p className="text-gray-600 mb-4">
              {COPY.photos.myPhotos.startVisiting}
            </p>
            <PrimaryButton
              onClick={() => navigate('/cafes')}
              className="flex items-center gap-2"
            >
              <Camera size={16} />
              Find Cafes to Visit
            </PrimaryButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onPhotoClick={() => handlePhotoClick(photo, index)}
                onDelete={() => handleDeletePhoto(photo.id)}
                isDeleting={deletingIds.has(photo.id)}
              />
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightboxPhoto && (
          <PhotoLightbox
            photos={lightboxPhoto.photos}
            initialIndex={lightboxPhoto.index}
            isOpen={true}
            onClose={() => setLightboxPhoto(null)}
          />
        )}
      </div>
    </ContentContainer>
  )
}

interface PhotoCardProps {
  photo: PhotoWithCafeInfo
  onPhotoClick: () => void
  onDelete: () => void
  isDeleting: boolean
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onPhotoClick,
  onDelete,
  isDeleting
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex gap-4">
          {/* Photo thumbnail */}
          <button
            onClick={onPhotoClick}
            className="flex-shrink-0 group"
          >
            <img
              src={photo.thumbnailUrl || photo.imageUrl}
              alt={photo.caption || 'Your photo'}
              className="w-24 h-24 object-cover rounded-lg border border-gray-200 group-hover:opacity-80 transition-opacity"
            />
          </button>

          {/* Photo info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <StatusBadge
                variant={
                  photo.moderationStatus === 'approved' ? 'success' :
                  photo.moderationStatus === 'pending' ? 'warning' : 'error'
                }
                className="text-xs"
              >
                {COPY.photos.myPhotos.status[photo.moderationStatus]}
              </StatusBadge>
              
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title={COPY.photos.myPhotos.delete}
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Cafe info */}
            {photo.cafeName && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <MapPin size={12} />
                <span className="truncate">
                  {photo.cafeName}{photo.cafeCity && `, ${photo.cafeCity}`}
                </span>
              </div>
            )}

            {/* Date */}
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
              <Calendar size={12} />
              <span>{formatDate(photo.createdAt)}</span>
            </div>

            {/* Caption */}
            {photo.caption && (
              <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                "{photo.caption}"
              </p>
            )}

            {/* File info */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {photo.fileSize && (
                <div className="flex items-center gap-1">
                  <FileImage size={10} />
                  <span>{formatFileSize(photo.fileSize)}</span>
                </div>
              )}
              {photo.width && photo.height && (
                <span>{photo.width} × {photo.height}</span>
              )}
            </div>

            {/* Rejection notice */}
            {photo.moderationStatus === 'rejected' && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                <div className="flex items-center gap-1 text-red-600 font-medium">
                  <AlertCircle size={12} />
                  Photo was rejected
                </div>
                {/* Add moderation notes if available in the photo object */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}