import React, { useRef, useState } from 'react'
import { COPY } from '../../constants/copy'

interface PhotoUploadWidgetProps {
  photos: File[]
  onChange: (photos: File[]) => void
  maxPhotos?: number
  className?: string
}

export const PhotoUploadWidget: React.FC<PhotoUploadWidgetProps> = ({
  photos,
  onChange,
  maxPhotos = 5,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const remainingSlots = maxPhotos - photos.length
    const filesToAdd = files.slice(0, remainingSlots)
    
    if (filesToAdd.length > 0) {
      const newPhotos = [...photos, ...filesToAdd]
      onChange(newPhotos)
      
      // Generate previews for new files
      filesToAdd.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviews(prev => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onChange(newPhotos)
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const canAddMore = photos.length < maxPhotos

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900">
          {COPY.reviews.photosOptional}
        </label>
        <span className="text-xs text-gray-500">
          {COPY.reviews.maxPhotos(maxPhotos)}
        </span>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={previews[index] || URL.createObjectURL(photo)}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="
                absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full
                flex items-center justify-center text-xs font-bold
                opacity-0 group-hover:opacity-100 transition-opacity
                hover:bg-red-600 active:scale-[0.95]
              "
              aria-label={COPY.reviews.removePhoto}
            >
              ×
            </button>
          </div>
        ))}

        {/* Add Photo Button */}
        {canAddMore && (
          <button
            type="button"
            onClick={openFileDialog}
            className="
              aspect-square rounded-lg border-2 border-dashed border-gray-300
              flex flex-col items-center justify-center gap-2
              text-gray-500 hover:border-gray-400 hover:text-gray-600
              transition-colors min-h-[120px]
              active:scale-[0.98]
            "
          >
            <div className="text-2xl">+</div>
            <div className="text-xs text-center px-2">
              {COPY.reviews.addPhotos}
            </div>
          </button>
        )}
      </div>

      {/* Photo count */}
      {photos.length > 0 && (
        <div className="text-sm text-gray-600">
          {photos.length} of {maxPhotos} photos
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}