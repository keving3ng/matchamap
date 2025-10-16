import React, { useState } from 'react'
import { api, CreateReviewRequest } from '../../utils/api'
import { COPY } from '../../constants/copy'
import { PrimaryButton, SecondaryButton } from '../ui/Button'
import { AlertDialog } from '../ui/AlertDialog'
import { ReviewRatingInput } from './ReviewRatingInput'
import { PhotoUploadWidget } from './PhotoUploadWidget'

interface ReviewFormProps {
  cafeId: number
  onSuccess?: () => void
  onCancel?: () => void
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ cafeId, onSuccess, onCancel }) => {
  // Rating state
  const [overallRating, setOverallRating] = useState<number>(0)
  const [matchaRating, setMatchaRating] = useState<number | null>(null)
  const [ambianceRating, setAmbianceRating] = useState<number | null>(null)
  const [serviceRating, setServiceRating] = useState<number | null>(null)
  const [valueRating, setValueRating] = useState<number | null>(null)
  
  // Content state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [photos, setPhotos] = useState<File[]>([])
  
  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Validation
  const charCount = content.length
  const minChars = 50
  const maxChars = 2000
  const isValid = overallRating > 0 && content.length >= minChars && content.length <= maxChars
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid) {
      if (overallRating === 0) {
        setError(COPY.reviews.ratingRequired)
      } else if (content.length < minChars) {
        setError(COPY.reviews.contentTooShort(minChars))
      } else if (content.length > maxChars) {
        setError(COPY.reviews.contentTooLong(maxChars))
      }
      return
    }
    
    try {
      setSubmitting(true)
      setError(null)
      
      // First, upload photos if any
      const photoIds: number[] = []
      if (photos.length > 0) {
        setUploadingPhotos(true)
        
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i]
          const formData = new FormData()
          formData.append('photo', photo)
          formData.append('cafeId', cafeId.toString())
          
          try {
            const { photo: uploadedPhoto } = await api.photos.upload(formData)
            photoIds.push(uploadedPhoto.id)
          } catch (photoError) {
            console.error(`Failed to upload photo ${i + 1}:`, photoError)
            throw new Error(COPY.reviews.photoUploadError)
          }
        }
        
        setUploadingPhotos(false)
      }
      
      // Create review data
      const reviewData: CreateReviewRequest = {
        overallRating,
        matchaQualityRating: matchaRating,
        ambianceRating,
        serviceRating,
        valueRating,
        title: title || undefined,
        content,
        visitDate: visitDate || undefined,
        isPublic,
        photoIds: photoIds.length > 0 ? photoIds : undefined,
      }
      
      // Submit review
      console.log('[ReviewForm] Submitting review:', reviewData)
      const result = await api.reviews.create(cafeId, reviewData)
      console.log('[ReviewForm] Review created successfully:', result)

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
      }, 2000)

    } catch (err) {
      console.error('[ReviewForm] Error submitting review:', err)
      const errorMessage = err instanceof Error ? err.message : COPY.reviews.submitError
      console.error('[ReviewForm] Error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setSubmitting(false)
      setUploadingPhotos(false)
    }
  }
  
  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 text-lg font-semibold mb-2">
          ✓ {COPY.reviews.submitSuccess}
        </div>
        <div className="text-gray-600">
          {COPY.reviews.submitSuccessMessage}
        </div>
      </div>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">{COPY.reviews.writeReview}</h2>
      
      {/* Overall Rating */}
      <ReviewRatingInput
        label={COPY.reviews.overallRatingRequired}
        value={overallRating}
        onChange={(value) => setOverallRating(value || 0)}
        max={10}
        required
      />
      
      {/* Aspect Ratings (Optional) */}
      <details className="border border-gray-200 rounded-lg p-4">
        <summary className="cursor-pointer font-semibold text-gray-900 hover:text-gray-700">
          {COPY.reviews.aspectRatings}
        </summary>
        <div className="mt-4 space-y-4">
          <ReviewRatingInput
            label={COPY.reviews.matchaQuality}
            value={matchaRating}
            onChange={setMatchaRating}
            max={10}
          />
          <ReviewRatingInput
            label={COPY.reviews.ambiance}
            value={ambianceRating}
            onChange={setAmbianceRating}
            max={10}
          />
          <ReviewRatingInput
            label={COPY.reviews.service}
            value={serviceRating}
            onChange={setServiceRating}
            max={10}
          />
          <ReviewRatingInput
            label={COPY.reviews.value}
            value={valueRating}
            onChange={setValueRating}
            max={10}
          />
        </div>
      </details>
      
      {/* Title (Optional) */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {COPY.reviews.title}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={COPY.reviews.titlePlaceholder}
          className="
            w-full px-4 py-3 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            text-gray-900 placeholder-gray-500
          "
          maxLength={100}
        />
      </div>
      
      {/* Review Content */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {COPY.reviews.yourReview} *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={COPY.reviews.contentPlaceholder}
          className="
            w-full px-4 py-3 border border-gray-300 rounded-lg h-32
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            text-gray-900 placeholder-gray-500 resize-none
          "
          minLength={minChars}
          maxLength={maxChars}
          required
        />
        <div className={`text-sm mt-1 ${
          charCount < minChars 
            ? 'text-red-500' 
            : charCount > maxChars 
              ? 'text-red-500' 
              : 'text-gray-500'
        }`}>
          {COPY.reviews.charCount(charCount, maxChars)}
          {charCount < minChars && (
            <span className="ml-2">({COPY.reviews.minCharacters(minChars)})</span>
          )}
        </div>
      </div>
      
      {/* Photo Upload */}
      <PhotoUploadWidget
        photos={photos}
        onChange={setPhotos}
        maxPhotos={5}
      />
      
      {/* Visit Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {COPY.reviews.visitDate}
        </label>
        <input
          type="date"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]} // Can't be future date
          className="
            px-4 py-3 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            text-gray-900
          "
        />
      </div>
      
      {/* Public/Private */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          id="public-review"
          className="
            w-5 h-5 text-green-600 border-gray-300 rounded
            focus:ring-green-500 focus:ring-2
          "
        />
        <label htmlFor="public-review" className="text-sm text-gray-700">
          {COPY.reviews.makePublic}
        </label>
      </div>
      
      {/* Error Display */}
      {error && (
        <AlertDialog
          variant="error"
          title="Error"
          message={error}
          primaryAction={{ 
            label: COPY.common.retry, 
            onClick: () => setError(null) 
          }}
        />
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <PrimaryButton 
          type="submit" 
          disabled={!isValid || submitting || uploadingPhotos}
          className="flex-1"
        >
          {uploadingPhotos 
            ? COPY.reviews.photoUploadProgress(1, photos.length)
            : submitting 
              ? COPY.reviews.submitting 
              : COPY.reviews.submitReview
          }
        </PrimaryButton>
        
        {onCancel && (
          <SecondaryButton 
            type="button"
            onClick={onCancel}
            disabled={submitting || uploadingPhotos}
            className="flex-1 sm:flex-none"
          >
            {COPY.common.cancel}
          </SecondaryButton>
        )}
      </div>
    </form>
  )
}