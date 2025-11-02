import React, { useState } from 'react'
import { COPY } from '../../constants/copy'
import { api } from '../../utils/api'
import { PrimaryButton, SecondaryButton } from '../ui/Button'
import { AlertDialog } from '../ui/AlertDialog'
import type { CreateSuggestionRequest } from '../../../../shared/types'

interface CafeSuggestionFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const CafeSuggestionForm: React.FC<CafeSuggestionFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateSuggestionRequest>({
    name: '',
    address: '',
    city: 'toronto',
    neighborhood: '',
    description: '',
    googleMapsUrl: '',
    instagram: '',
    website: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = COPY.suggestions.nameRequired
    } else if (formData.name.trim().length < 2) {
      newErrors.name = COPY.suggestions.nameMinLength
    } else if (formData.name.trim().length > 200) {
      newErrors.name = COPY.suggestions.nameMaxLength
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = COPY.suggestions.addressRequired
    } else if (formData.address.trim().length < 5) {
      newErrors.address = COPY.suggestions.addressMinLength
    } else if (formData.address.trim().length > 500) {
      newErrors.address = COPY.suggestions.addressMaxLength
    }

    // City validation
    if (!formData.city) {
      newErrors.city = COPY.suggestions.cityRequired
    }

    // Description validation (optional but has constraints if provided)
    if (formData.description && formData.description.trim().length > 0) {
      if (formData.description.trim().length < 10) {
        newErrors.description = COPY.suggestions.descriptionMinLength
      } else if (formData.description.trim().length > 1000) {
        newErrors.description = COPY.suggestions.descriptionMaxLength
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      await api.suggestions.create(formData)
      setShowSuccess(true)
      // Reset form
      setFormData({
        name: '',
        address: '',
        city: 'toronto',
        neighborhood: '',
        description: '',
        googleMapsUrl: '',
        instagram: '',
        website: '',
      })
      setErrors({})
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to submit suggestion:', error)
      setShowError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof CreateSuggestionRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2">{COPY.suggestions.title}</h2>
      <p className="text-gray-600 mb-6">{COPY.suggestions.description}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            {COPY.suggestions.nameLabel}
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={COPY.suggestions.namePlaceholder}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-1">
            {COPY.suggestions.addressLabel}
          </label>
          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder={COPY.suggestions.addressPlaceholder}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-1">
            {COPY.suggestions.cityLabel}
          </label>
          <select
            id="city"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          >
            <option value="toronto">Toronto</option>
            <option value="vancouver">Vancouver</option>
            <option value="montreal">Montreal</option>
            <option value="tokyo">Tokyo</option>
          </select>
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        {/* Neighborhood */}
        <div>
          <label htmlFor="neighborhood" className="block text-sm font-medium mb-1">
            {COPY.suggestions.neighborhoodLabel}
          </label>
          <input
            type="text"
            id="neighborhood"
            value={formData.neighborhood}
            onChange={(e) => handleChange('neighborhood', e.target.value)}
            placeholder={COPY.suggestions.neighborhoodPlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            {COPY.suggestions.descriptionLabel}
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder={COPY.suggestions.descriptionPlaceholder}
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Google Maps URL */}
        <div>
          <label htmlFor="googleMapsUrl" className="block text-sm font-medium mb-1">
            {COPY.suggestions.googleMapsLabel}
          </label>
          <input
            type="url"
            id="googleMapsUrl"
            value={formData.googleMapsUrl}
            onChange={(e) => handleChange('googleMapsUrl', e.target.value)}
            placeholder={COPY.suggestions.googleMapsPlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isSubmitting}
          />
        </div>

        {/* Instagram */}
        <div>
          <label htmlFor="instagram" className="block text-sm font-medium mb-1">
            {COPY.suggestions.instagramLabel}
          </label>
          <input
            type="text"
            id="instagram"
            value={formData.instagram}
            onChange={(e) => handleChange('instagram', e.target.value)}
            placeholder={COPY.suggestions.instagramPlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isSubmitting}
          />
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium mb-1">
            {COPY.suggestions.websiteLabel}
          </label>
          <input
            type="url"
            id="website"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder={COPY.suggestions.websitePlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isSubmitting}
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <PrimaryButton type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? COPY.suggestions.submitting : COPY.suggestions.submitButton}
          </PrimaryButton>
          {onCancel && (
            <SecondaryButton type="button" onClick={onCancel} disabled={isSubmitting}>
              {COPY.suggestions.cancelButton}
            </SecondaryButton>
          )}
        </div>
      </form>

      {/* Success Dialog */}
      {showSuccess && (
        <AlertDialog
          variant="success"
          title={COPY.suggestions.successTitle}
          message={COPY.suggestions.successMessage}
          primaryAction={{
            label: 'OK',
            onClick: () => setShowSuccess(false),
          }}
        />
      )}

      {/* Error Dialog */}
      {showError && (
        <AlertDialog
          variant="error"
          title={COPY.suggestions.errorTitle}
          message={COPY.suggestions.errorMessage}
          primaryAction={{
            label: 'OK',
            onClick: () => setShowError(false),
          }}
        />
      )}
    </div>
  )
}
