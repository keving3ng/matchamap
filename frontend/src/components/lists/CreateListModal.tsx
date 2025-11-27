import React, { useState } from 'react'
import { X, Save, Plus } from '@/components/icons'
import { PrimaryButton, SecondaryButton } from '../ui'
import { COPY } from '../../constants/copy'
import type { UserList, CreateListRequest, UpdateListRequest } from '../../../../shared/types'
import { sanitizeText } from '../../utils/sanitize'

interface CreateListModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: CreateListRequest) => Promise<{ success: boolean; error?: string; list?: UserList }>
  onUpdate?: (id: number, data: UpdateListRequest) => Promise<{ success: boolean; error?: string; list?: UserList }>
  existingList?: UserList | null
}

export const CreateListModal: React.FC<CreateListModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  existingList,
}) => {
  const isEditing = !!existingList
  const [formData, setFormData] = useState({
    name: existingList?.name || '',
    description: existingList?.description || '',
    isPublic: existingList?.isPublic || false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    // Sanitize inputs
    const sanitizedName = sanitizeText(formData.name.trim())
    if (!sanitizedName) {
      setError('List name is required')
      setIsSaving(false)
      return
    }

    const data = {
      name: sanitizedName,
      description: formData.description ? sanitizeText(formData.description.trim()) : undefined,
      isPublic: formData.isPublic,
    }

    let result
    if (isEditing && existingList && onUpdate) {
      result = await onUpdate(existingList.id, data)
    } else {
      result = await onCreate(data)
    }

    setIsSaving(false)

    if (result.success) {
      onClose()
      // Reset form
      setFormData({ name: '', description: '', isPublic: false })
      setError(null)
    } else {
      setError(result.error || 'Failed to save list')
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xs max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? COPY.lists.editList : COPY.lists.createNewList}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={COPY.lists.cancel}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* List Name */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {COPY.lists.listName}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
                placeholder={COPY.lists.listNamePlaceholder}
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {COPY.lists.description}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-matcha-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={500}
                placeholder={COPY.lists.descriptionPlaceholder}
              />
            </div>

            {/* Public Toggle */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => handleChange('isPublic', e.target.checked)}
                  className="w-5 h-5 text-matcha-600 border-gray-300 rounded focus:ring-matcha-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{COPY.lists.makePublic}</div>
                  <div className="text-xs text-gray-500">{COPY.lists.makePublicDescription}</div>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <SecondaryButton onClick={onClose} disabled={isSaving}>
              {COPY.lists.cancel}
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              disabled={isSaving || !formData.name.trim()}
              icon={isEditing ? Save : Plus}
            >
              {isSaving
                ? (isEditing ? COPY.lists.saving : COPY.lists.creating)
                : (isEditing ? COPY.lists.save : COPY.lists.create)}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  )
}
