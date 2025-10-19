import React, { useEffect, useState } from 'react'
import { ArrowLeft, Image as ImageIcon, Trash2, EyeOff, Eye, Loader, Calendar, User } from '@/components/icons'
import { useNavigate, useParams } from 'react-router'
import { api } from '../../utils/api'
import type { ReviewPhoto } from '../../../../shared/types'

interface CafeInfo {
  id: number
  name: string
  city: string
}

export const CafePhotosManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { cafeId } = useParams<{ cafeId: string }>()
  const [cafe, setCafe] = useState<CafeInfo | null>(null)
  const [photos, setPhotos] = useState<ReviewPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningPhoto, setActioningPhoto] = useState<number | null>(null)
  const [confirmingPhotoId, setConfirmingPhotoId] = useState<number | null>(null)

  useEffect(() => {
    if (!cafeId) return

    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch cafe info
        const cafeData = await api.cafes.getById(parseInt(cafeId))
        setCafe({
          id: cafeData.cafe.id,
          name: cafeData.cafe.name,
          city: cafeData.cafe.city
        })

        // Fetch all photos including hidden ones (admin view)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/cafes/${cafeId}/photos`,
          { credentials: 'include' }
        )
        const data = await response.json()
        setPhotos(data.photos || [])
      } catch (error) {
        console.error('Failed to fetch photos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [cafeId])

  const handleToggleVisibility = async (photo: ReviewPhoto) => {
    // Double-click pattern: first click sets confirming state, second click executes
    if (confirmingPhotoId !== photo.id) {
      setConfirmingPhotoId(photo.id)
      // Reset after 3 seconds if not confirmed
      setTimeout(() => setConfirmingPhotoId(null), 3000)
      return
    }

    try {
      setConfirmingPhotoId(null)
      setActioningPhoto(photo.id)

      const newStatus = photo.moderationStatus === 'approved' ? 'rejected' : 'approved'

      await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/photos/${photo.id}/moderate`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: newStatus,
            notes: `${newStatus === 'rejected' ? 'Hidden' : 'Shown'} by admin`
          })
        }
      )

      // Update local state
      setPhotos(photos.map(p =>
        p.id === photo.id ? { ...p, moderationStatus: newStatus as 'approved' | 'rejected' } : p
      ))
    } catch (error) {
      alert(`Failed to update photo: ${(error as Error).message}`)
    } finally {
      setActioningPhoto(null)
    }
  }

  const handleDelete = async (photo: ReviewPhoto) => {
    if (!confirm('Are you sure you want to permanently delete this photo? This action cannot be undone.')) {
      return
    }

    try {
      setActioningPhoto(photo.id)
      await api.photos.delete(photo.id)
      setPhotos(photos.filter(p => p.id !== photo.id))
    } catch (error) {
      alert(`Failed to delete photo: ${(error as Error).message}`)
    } finally {
      setActioningPhoto(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const visiblePhotos = photos.filter(p => p.moderationStatus === 'approved')
  const hiddenPhotos = photos.filter(p => p.moderationStatus === 'rejected')

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <button
            onClick={() => navigate('/admin/content')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition"
          >
            <ArrowLeft size={20} />
            <span>Back to Content Management</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <ImageIcon size={28} className="text-blue-500" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {cafe ? `Manage Photos - ${cafe.name}` : 'Manage Photos'}
            </h1>
          </div>
          {cafe && (
            <p className="text-sm text-gray-600 capitalize">{cafe.city}</p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-blue-500" size={48} />
          </div>
        )}

        {/* Empty State */}
        {!loading && photos.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ImageIcon size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No photos found</h3>
            <p className="text-gray-600">This cafe doesn't have any photos yet</p>
          </div>
        )}

        {/* Photos List */}
        {!loading && photos.length > 0 && (
          <div className="space-y-6">

            {/* Visible Photos */}
            {visiblePhotos.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Eye size={20} className="text-green-500" />
                  Visible Photos ({visiblePhotos.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {visiblePhotos.map((photo) => (
                    <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="aspect-square relative">
                        <img
                          src={photo.thumbnailUrl || photo.imageUrl}
                          alt={photo.caption || 'Photo'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <User size={10} />
                          <span className="truncate" title={photo.username || `User ${photo.userId}`}>
                            {photo.username || `User ${photo.userId}`}
                          </span>
                          <span>•</span>
                          <Calendar size={10} />
                          <span>{formatDate(photo.createdAt)}</span>
                        </div>
                        {photo.caption && (
                          <p
                            className="text-xs text-gray-700 mb-2 truncate"
                            title={photo.caption}
                          >
                            {photo.caption}
                          </p>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleToggleVisibility(photo)}
                            disabled={actioningPhoto === photo.id}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition disabled:opacity-50"
                          >
                            {actioningPhoto === photo.id ? (
                              <Loader className="animate-spin" size={12} />
                            ) : confirmingPhotoId === photo.id ? (
                              <>
                                <EyeOff size={12} />
                                <span>Confirm</span>
                              </>
                            ) : (
                              <>
                                <EyeOff size={12} />
                                <span>Hide</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(photo)}
                            disabled={actioningPhoto === photo.id}
                            className="flex items-center justify-center px-2 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden Photos */}
            {hiddenPhotos.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <EyeOff size={20} className="text-gray-500" />
                  Hidden Photos ({hiddenPhotos.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {hiddenPhotos.map((photo) => (
                    <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden opacity-60">
                      <div className="aspect-square relative">
                        <img
                          src={photo.thumbnailUrl || photo.imageUrl}
                          alt={photo.caption || 'Photo'}
                          className="w-full h-full object-cover grayscale"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                            HIDDEN
                          </span>
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <User size={10} />
                          <span className="truncate" title={photo.username || `User ${photo.userId}`}>
                            {photo.username || `User ${photo.userId}`}
                          </span>
                          <span>•</span>
                          <Calendar size={10} />
                          <span>{formatDate(photo.createdAt)}</span>
                        </div>
                        {photo.caption && (
                          <p
                            className="text-xs text-gray-700 mb-2 truncate"
                            title={photo.caption}
                          >
                            {photo.caption}
                          </p>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleToggleVisibility(photo)}
                            disabled={actioningPhoto === photo.id}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition disabled:opacity-50"
                          >
                            {actioningPhoto === photo.id ? (
                              <Loader className="animate-spin" size={12} />
                            ) : confirmingPhotoId === photo.id ? (
                              <>
                                <Eye size={12} />
                                <span>Confirm</span>
                              </>
                            ) : (
                              <>
                                <Eye size={12} />
                                <span>Show</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(photo)}
                            disabled={actioningPhoto === photo.id}
                            className="flex items-center justify-center px-2 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CafePhotosManagementPage
