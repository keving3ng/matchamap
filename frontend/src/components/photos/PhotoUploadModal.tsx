import React, { useState, useRef, useCallback } from 'react'
import { Camera, X, Upload, Image as ImageIcon, AlertCircle, CheckCircle } from '@/components/icons'
import { COPY } from '../../constants/copy'
import { PrimaryButton, SecondaryButton } from '../ui'
import { api } from '../../utils/api'

interface PhotoUploadModalProps {
  cafeId: number
  cafeName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface SelectedPhoto {
  file: File
  previewUrl: string
  caption: string
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  cafeId,
  cafeName,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
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

  const handleFilesSelect = useCallback((files: FileList) => {
    const newPhotos: SelectedPhoto[] = []
    const errors: string[] = []

    // Check total count
    if (selectedPhotos.length + files.length > MAX_FILES) {
      setError(`You can only upload up to ${MAX_FILES} photos at once`)
      return
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validationError = validateFile(file)

      if (validationError) {
        errors.push(`${file.name}: ${validationError}`)
      } else {
        const url = URL.createObjectURL(file)
        newPhotos.push({ file, previewUrl: url, caption: '' })
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'))
    } else {
      setError(null)
    }

    setSelectedPhotos(prev => [...prev, ...newPhotos])
  }, [validateFile, selectedPhotos.length])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(e.target.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files)
    }
  }

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].previewUrl)
      updated.splice(index, 1)
      return updated
    })
    setError(null)
  }

  const handleCaptionChange = (index: number, caption: string) => {
    setSelectedPhotos(prev => {
      const updated = [...prev]
      updated[index].caption = caption
      return updated
    })
  }

  const handleUpload = async () => {
    if (selectedPhotos.length === 0) return

    try {
      setIsUploading(true)
      setError(null)
      setUploadProgress(0)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Upload all photos sequentially
      for (const photo of selectedPhotos) {
        const formData = new FormData()
        formData.append('photo', photo.file)
        formData.append('cafeId', cafeId.toString())
        if (photo.caption.trim()) {
          formData.append('caption', photo.caption.trim())
        }
        await api.photos.upload(formData)
      }

      clearInterval(progressInterval)
      setUploadProgress(100)
      setSuccess(true)

      // Show success message briefly, then close
      setTimeout(() => {
        onSuccess?.()
        handleClose()
      }, 1500)
    } catch (err) {
      console.error('Upload failed:', err)
      setError(err instanceof Error ? err.message : COPY.photos.upload.error)
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    // Clean up preview URLs
    selectedPhotos.forEach(photo => {
      URL.revokeObjectURL(photo.previewUrl)
    })

    // Reset state
    setSelectedPhotos([])
    setError(null)
    setSuccess(false)
    setUploadProgress(0)
    setIsUploading(false)

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xs max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <Camera size={24} className="text-matcha-600" />
            <div>
              <h2 className="text-xl font-bold text-charcoal-900">
                {COPY.photos.upload.title}
              </h2>
              <p className="text-sm text-gray-600">{cafeName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Success State */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">{COPY.photos.upload.success}</p>
                <p className="text-sm text-green-700">{COPY.photos.upload.pending}</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !success && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
              <p className="text-red-900 whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* File Upload Area */}
          {selectedPhotos.length === 0 && !success && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-matcha-500 bg-matcha-50'
                  : 'border-gray-300 hover:border-matcha-400 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`p-4 rounded-full ${isDragging ? 'bg-matcha-100' : 'bg-gray-100'}`}>
                  <Upload size={32} className={isDragging ? 'text-matcha-600' : 'text-gray-400'} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    {COPY.photos.upload.dragDrop}
                  </p>
                  <p className="text-sm text-gray-600">
                    {COPY.photos.upload.fileTypes}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Upload up to {MAX_FILES} photos at once
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isUploading}
                multiple
              />
            </div>
          )}

          {/* Photo Previews */}
          {selectedPhotos.length > 0 && !success && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedPhotos.length} / {MAX_FILES} photos selected
                </p>
                {selectedPhotos.length < MAX_FILES && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-matcha-600 hover:text-matcha-700 font-medium"
                  >
                    + Add more
                  </button>
                )}
              </div>

              {selectedPhotos.map((photo, index) => (
                <div key={index} className="space-y-3 p-4 border border-gray-200 rounded-xl">
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={photo.previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    {!isUploading && (
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-xs rounded-lg shadow-xs hover:bg-white transition-colors"
                        aria-label="Remove photo"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <ImageIcon size={14} />
                    <span className="font-medium truncate">{photo.file.name}</span>
                    <span className="text-gray-400">•</span>
                    <span>{(photo.file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Caption (optional)
                    </label>
                    <textarea
                      value={photo.caption}
                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                      placeholder={COPY.photos.upload.captionPlaceholder}
                      maxLength={500}
                      rows={2}
                      disabled={isUploading}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-matcha-500 focus:border-matcha-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {photo.caption.length}/500
                    </p>
                  </div>
                </div>
              ))}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{COPY.photos.upload.uploading}</span>
                    <span className="font-medium text-matcha-600">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-matcha-500 to-matcha-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isUploading}
                multiple
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex gap-3 rounded-b-2xl">
            <SecondaryButton
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1"
            >
              {COPY.photos.upload.cancel}
            </SecondaryButton>
            <PrimaryButton
              onClick={handleUpload}
              disabled={selectedPhotos.length === 0 || isUploading}
              className="flex-1"
            >
              <div className="flex items-center justify-center gap-2">
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{COPY.photos.upload.uploading}</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>{COPY.photos.upload.submit}</span>
                  </>
                )}
              </div>
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  )
}

export default PhotoUploadModal
