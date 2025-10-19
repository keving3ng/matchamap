import React, { useState } from 'react'
import { X, Save } from '@/components/icons'
import { PrimaryButton, SecondaryButton } from '../ui'
import { COPY } from '../../constants/copy'
import type { UserProfile, UpdateProfileRequest } from '../../../../shared/types'
import { sanitizeText, sanitizeUrl } from '../../utils/sanitize'

interface EditProfileModalProps {
  profile: UserProfile
  isOpen: boolean
  onClose: () => void
  onSave: (updates: UpdateProfileRequest) => Promise<{ success: boolean; error?: string }>
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    location: profile.location || '',
    instagram: profile.instagram || '',
    tiktok: profile.tiktok || '',
    website: profile.website || '',
    isPublic: profile.isPublic,
    showActivity: profile.showActivity,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    // Sanitize all text inputs before sending
    const updates: UpdateProfileRequest = {
      displayName: formData.displayName ? sanitizeText(formData.displayName.trim()) || null : null,
      bio: formData.bio ? sanitizeText(formData.bio.trim()) || null : null,
      location: formData.location ? sanitizeText(formData.location.trim()) || null : null,
      instagram: formData.instagram ? sanitizeText(formData.instagram.trim()) || null : null,
      tiktok: formData.tiktok ? sanitizeText(formData.tiktok.trim()) || null : null,
      website: formData.website ? sanitizeUrl(formData.website.trim()) || null : null,
      privacy: {
        isPublic: formData.isPublic,
        showActivity: formData.showActivity,
      },
    }

    const result = await onSave(updates)
    setIsSaving(false)

    if (result.success) {
      onClose()
    } else {
      setError(result.error || COPY.profile.failedToUpdate)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{COPY.profile.editProfile}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={COPY.common.close}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Display Name */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {COPY.profile.displayName}
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
              placeholder={COPY.profile.displayNamePlaceholder}
            />
          </div>

          {/* Bio */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {COPY.profile.bio}
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-matcha-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
              placeholder={COPY.profile.bioPlaceholder}
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {COPY.profile.bioCharCount(formData.bio.length, 500)}
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {COPY.profile.location}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
              placeholder={COPY.profile.locationPlaceholder}
            />
          </div>

          {/* Social Links */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {COPY.profile.instagram}
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                @
              </span>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => handleChange('instagram', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
                placeholder={COPY.profile.usernamePlaceholder}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {COPY.profile.tiktok}
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                @
              </span>
              <input
                type="text"
                value={formData.tiktok}
                onChange={(e) => handleChange('tiktok', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
                placeholder={COPY.profile.usernamePlaceholder}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {COPY.profile.websiteUrl}
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
              placeholder={COPY.profile.websitePlaceholder}
            />
          </div>

          {/* Privacy Settings */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{COPY.profile.privacySettings}</h3>

            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => handleChange('isPublic', e.target.checked)}
                className="w-5 h-5 text-matcha-600 border-gray-300 rounded focus:ring-matcha-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{COPY.profile.publicProfile}</div>
                <div className="text-xs text-gray-500">{COPY.profile.publicProfileDescription}</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showActivity}
                onChange={(e) => handleChange('showActivity', e.target.checked)}
                className="w-5 h-5 text-matcha-600 border-gray-300 rounded focus:ring-matcha-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{COPY.profile.showActivity}</div>
                <div className="text-xs text-gray-500">{COPY.profile.showActivityDescription}</div>
              </div>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <SecondaryButton onClick={onClose} disabled={isSaving}>
            {COPY.common.cancel}
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isSaving}
            icon={Save}
          >
            {isSaving ? COPY.profile.saving : COPY.profile.saveChanges}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
