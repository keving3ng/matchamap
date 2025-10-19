import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Download, Calendar, MapPin } from 'lucide-react'
import { COPY } from '../../constants/copy'
import { zIndex } from '../../styles/spacing'
import type { ReviewPhoto } from '../../../../shared/types'

interface PhotoLightboxProps {
  photos: ReviewPhoto[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  cafeInfo?: {
    name: string
    city?: string
  }
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  initialIndex,
  isOpen,
  onClose,
  cafeInfo
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isImageLoading, setIsImageLoading] = useState(true)

  const currentPhoto = photos[currentIndex]

  // Reset when photos change or lightbox opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setIsImageLoading(true)
    }
  }, [isOpen, initialIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Preload adjacent images for instant navigation
  useEffect(() => {
    if (!isOpen || photos.length <= 1) return

    const preloadImage = (url: string) => {
      const img = new Image()
      img.src = url
    }

    // Preload previous image
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1
    if (photos[prevIndex]?.imageUrl) {
      preloadImage(photos[prevIndex].imageUrl)
    }

    // Preload next image
    const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0
    if (photos[nextIndex]?.imageUrl) {
      preloadImage(photos[nextIndex].imageUrl)
    }
  }, [currentIndex, photos, isOpen])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
    setIsImageLoading(true)
  }, [photos.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
    setIsImageLoading(true)
  }, [photos.length])

  const handleImageLoad = () => {
    setIsImageLoading(false)
  }

  const handleDownload = () => {
    if (currentPhoto.imageUrl) {
      const link = document.createElement('a')
      link.href = currentPhoto.imageUrl
      link.download = `matcha-photo-${currentPhoto.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!isOpen || !currentPhoto) return null

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-sm"
      style={{ zIndex: zIndex.modal }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <span className="text-sm font-medium">
              {currentIndex + 1} of {photos.length}
            </span>
            {cafeInfo && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-300">
                <MapPin size={14} />
                <span>{cafeInfo.name}{cafeInfo.city && `, ${cafeInfo.city}`}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title={COPY.photos.lightbox.downloadOriginal}
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title={COPY.photos.lightbox.close}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      {photos.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
            title={COPY.photos.lightbox.previous}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
            title={COPY.photos.lightbox.next}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Main image container */}
      <div className="flex items-center justify-center h-full p-4 pt-20 pb-24 sm:pb-32">
        <div className="relative w-full h-full flex items-center justify-center">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <img
            src={currentPhoto.imageUrl}
            alt={currentPhoto.caption || 'Photo'}
            className="max-w-full max-h-full w-auto h-auto object-contain"
            onLoad={handleImageLoad}
          />
        </div>
      </div>

      {/* Bottom info panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="max-w-4xl mx-auto">
          {/* Caption */}
          {currentPhoto.caption && (
            <p className="text-white text-lg mb-3 font-medium">
              {currentPhoto.caption}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <span>{formatDate(currentPhoto.createdAt)}</span>
            </div>
          </div>

          {/* Thumbnail navigation for desktop */}
          {photos.length > 1 && (
            <div className="hidden sm:flex gap-2 mt-4 overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    setCurrentIndex(index)
                    setIsImageLoading(true)
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-white scale-110'
                      : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  <img
                    src={photo.thumbnailUrl || photo.imageUrl}
                    alt={photo.caption || 'Thumbnail'}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label={COPY.photos.lightbox.close}
      />
    </div>
  )
}