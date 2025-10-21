import React, { useState, useRef, useCallback } from 'react'
import { X, Star, Camera, Trash2, CheckCircle, AlertCircle } from '@/components/icons'
import { COPY } from '../../constants/copy'
import { PrimaryButton, SecondaryButton, AlertDialog } from '../ui'
import { api } from '../../utils/api'
import { spacing } from '../../styles/spacing'
import type { Cafe } from '../../../../shared/types'

interface CheckInModalProps {
  cafe: Cafe
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface SelectedPhoto {
  file: File
  previewUrl: string
}

const MAX_PHOTOS = 3
const MAX_NOTES_LENGTH = COPY.checkin.notesMaxLength
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * CheckInModal - Enhanced check-in modal with notes, photos, and rating
 * 
 * Features:
 * - Notes input with character limit
 * - Photo upload (up to 3 photos)
 * - Quick 5-star rating
 * - Mobile-optimized with proper touch targets
 * - Success/error feedback
 */
export const CheckInModal: React.FC<CheckInModalProps> = ({
  cafe,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return COPY.photos.upload.invalidFileType
    }
    if (file.size > MAX_FILE_SIZE) {
      return COPY.photos.upload.fileTooLarge
    }
    if (file.size === 0) {
      return COPY.photos.upload.emptyFile
    }
    return null
  }, [])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newPhotos: SelectedPhoto[] = []
    const errors: string[] = []

    // Check if adding these photos would exceed the limit
    if (selectedPhotos.length + files.length > MAX_PHOTOS) {
      setErrorMessage(`You can only upload up to ${MAX_PHOTOS} photos`)
      return
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validationError = validateFile(file)

      if (validationError) {
        errors.push(`${file.name}: ${validationError}`)
      } else {
        const url = URL.createObjectURL(file)
        newPhotos.push({ file, previewUrl: url })
      }
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join('\n'))
    } else {
      setErrorMessage('')
      setSelectedPhotos(prev => [...prev, ...newPhotos])
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => {
      const removed = prev[index]
      URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_NOTES_LENGTH) {
      setNotes(value)
    }
  }

  const handleRatingClick = (newRating: number) => {
    setRating(rating === newRating ? null : newRating)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      // Upload photos first if any are selected
      const photoIds: number[] = []
      for (const photo of selectedPhotos) {
        try {
          const formData = new FormData()
          formData.append('photo', photo.file)
          formData.append('cafeId', cafe.id.toString())
          formData.append('caption', '') // No caption for check-in photos
          
          const result = await api.photos.upload(formData)
          photoIds.push(result.photo.id)
        } catch (photoError) {
          console.error('Photo upload failed:', photoError)
          // Continue with check-in even if photo upload fails
        }
      }

      // Submit check-in with notes
      await api.stats.checkIn(cafe.id, notes || undefined)

      // Show success state
      setShowSuccess(true)
    } catch (error) {
      console.error('Check-in failed:', error)
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : COPY.checkin.errorMessage
      )
      setShowError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccess(false)
    resetForm()
    onSuccess()
  }

  const handleErrorClose = () => {
    setShowError(false)
  }

  const resetForm = () => {
    setNotes('')
    setRating(null)
    selectedPhotos.forEach(photo => URL.revokeObjectURL(photo.previewUrl))
    setSelectedPhotos([])
    setErrorMessage('')
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onClose()
    }
  }

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      selectedPhotos.forEach(photo => URL.revokeObjectURL(photo.previewUrl))
    }
  }, [])

  if (!isOpen) return null

  // Success dialog
  if (showSuccess) {
    return (
      <AlertDialog
        variant="success"
        title={COPY.checkin.successTitle}
        message={COPY.checkin.successMessage}
        primaryAction={{
          label: COPY.checkin.successClose,
          onClick: handleSuccessClose
        }}
      />
    )
  }

  // Error dialog
  if (showError) {
    return (
      <AlertDialog
        variant="error"
        title={COPY.checkin.errorTitle}
        message={errorMessage || COPY.checkin.errorMessage}
        primaryAction={{
          label: COPY.checkin.errorRetry,
          onClick: handleErrorClose
        }}
        secondaryAction={{
          label: COPY.checkin.errorClose,
          onClick: handleClose
        }}
      />
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {COPY.checkin.title} {cafe.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {COPY.checkin.subtitle}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {COPY.checkin.ratingLabel} {COPY.checkin.ratingOptional}
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingClick(star)}
                  disabled={isSubmitting}
                  className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={COPY.checkin.stars(star)}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      rating && star <= rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
              {rating && (
                <button
                  onClick={() => setRating(null)}
                  disabled={isSubmitting}
                  className="ml-2 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  {COPY.checkin.clearRating}
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              {COPY.checkin.notesLabel}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={handleNotesChange}
              placeholder={COPY.checkin.notesPlaceholder}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-gray-500">
                {COPY.checkin.notesCharCount(notes.length, MAX_NOTES_LENGTH)}
              </div>
              {notes.length >= MAX_NOTES_LENGTH && (
                <div className="text-xs text-red-500">
                  {COPY.checkin.notesTooLong(MAX_NOTES_LENGTH)}
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {COPY.checkin.photosLabel}
            </label>
            
            {/* Photo previews */}
            {selectedPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {selectedPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo.previewUrl}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      disabled={isSubmitting}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 min-h-[32px] min-w-[32px] flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                      aria-label={COPY.checkin.removePhoto}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add photos button */}
            {selectedPhotos.length < MAX_PHOTOS && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  disabled={isSubmitting}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors min-h-[44px] flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-600">
                    {COPY.checkin.addPhotos} ({selectedPhotos.length}/{MAX_PHOTOS})
                  </span>
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-700 whitespace-pre-line">{errorMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <SecondaryButton
            onClick={handleClose}
            disabled={isSubmitting}
            fullWidth
          >
            {COPY.checkin.cancel}
          </SecondaryButton>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            fullWidth
          >
            {isSubmitting ? COPY.checkin.submittingButton : COPY.checkin.submitButton}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}