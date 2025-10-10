import React, { useState, useEffect } from 'react'
import { X, Save, MapPin, Coffee, RefreshCw, Lock } from 'lucide-react'
import { api } from '../../utils/api'
import { COPY } from '../../constants/copy'
import { CITIES } from '../../stores/cityStore'
import type { Cafe } from '../../types'

interface CafeFormProps {
  cafe?: Cafe | null
  onSave: (cafeData: Partial<Cafe>) => Promise<void>
  onCancel: () => void
}

export const CafeForm: React.FC<CafeFormProps> = ({ cafe, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    city: 'toronto',
    latitude: 0,
    longitude: 0,
    address: '',
    link: '',
    ambianceScore: 0,
    chargeForAltMilk: null as number | null,
    quickNote: '',
    review: '',
    source: '',
    hours: '',
    instagram: '',
    instagramPostLink: '',
    tiktokPostLink: '',
    images: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  useEffect(() => {
    if (cafe) {
      setFormData({
        name: cafe.name,
        city: cafe.city,
        latitude: cafe.latitude,
        longitude: cafe.longitude,
        address: cafe.address || '',
        link: cafe.link,
        ambianceScore: cafe.ambianceScore || 0,
        chargeForAltMilk: cafe.chargeForAltMilk ?? null,
        quickNote: cafe.quickNote,
        review: cafe.review || '',
        source: cafe.source || '',
        hours: cafe.hours || '',
        instagram: cafe.instagram || '',
        instagramPostLink: cafe.instagramPostLink || '',
        tiktokPostLink: cafe.tiktokPostLink || '',
        images: cafe.images || '',
      })
    } else {
      // Reset to initial empty state when adding new cafe
      setFormData({
        name: '',
        city: 'toronto',
        latitude: 0,
        longitude: 0,
        address: '',
        link: '',
        ambianceScore: 0,
        chargeForAltMilk: null,
        quickNote: '',
        review: '',
        source: '',
        hours: '',
        instagram: '',
        instagramPostLink: '',
        tiktokPostLink: '',
        images: '',
      })
    }
  }, [cafe])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleRefreshFromGoogleMaps = async () => {
    if (!formData.link) {
      setRefreshError('Please enter a Google Maps URL first')
      return
    }

    setIsRefreshing(true)
    setRefreshError(null)

    try {
      const response = await api.places.lookup(formData.link)
      const place = response.place

      // Update form with fresh data from Google Maps
      setFormData(prev => ({
        ...prev,
        address: place.address || prev.address,
        latitude: place.latitude,
        longitude: place.longitude,
        hours: place.hours || prev.hours,
      }))

      // Show success briefly
      setRefreshError('✓ Updated from Google Maps!')
      setTimeout(() => setRefreshError(null), 3000)
    } catch (err) {
      setRefreshError((err as Error).message)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Generate slug from name
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')

      // Transform to backend API format (matching Drizzle schema)
      // Note: Coordinates are read-only in the form but still included in submission
      const payload = {
        name: formData.name,
        slug,
        link: formData.link,
        address: formData.address || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        city: formData.city,
        ambianceScore: formData.ambianceScore || null,
        chargeForAltMilk: formData.chargeForAltMilk,
        quickNote: formData.quickNote,
        review: formData.review || null,
        source: formData.source || null,
        hours: formData.hours || null,
        instagram: formData.instagram || null,
        instagramPostLink: formData.instagramPostLink || null,
        tiktokPostLink: formData.tiktokPostLink || null,
        images: formData.images || null,
      }

      await onSave(payload as any)
      onCancel()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col my-8">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Coffee size={24} />
            {cafe ? 'Edit Cafe' : 'Add New Cafe'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Coffee size={20} />
                Basic Information
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cafe Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {Object.values(CITIES).map(city => (
                  <option key={city.key} value={city.key}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Location
              </h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Maps URL *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  required
                  placeholder="https://maps.google.com/..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleRefreshFromGoogleMaps}
                  disabled={isRefreshing || !formData.link}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Refresh latitude, longitude, and hours from Google Maps"
                >
                  <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              {refreshError && (
                <p className={`text-sm mt-1 ${refreshError.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                  {refreshError}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Auto-filled from Google Maps"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  step="0.000001"
                  required
                  disabled
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  title={COPY.admin.cafeEditor.coordsReadOnly}
                />
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">{COPY.admin.cafeEditor.coordsAutoUpdated}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  step="0.000001"
                  required
                  disabled
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  title={COPY.admin.cafeEditor.coordsReadOnly}
                />
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">{COPY.admin.cafeEditor.coordsAutoUpdated}</p>
            </div>

            {/* Cafe Details */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Coffee size={20} />
                Cafe Details
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ambiance Score (0-10)
              </label>
              <input
                type="number"
                name="ambianceScore"
                value={formData.ambianceScore || ''}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.1"
                placeholder="Optional"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Charge for Alt Milk ($)
              </label>
              <input
                type="number"
                name="chargeForAltMilk"
                value={formData.chargeForAltMilk ?? ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Leave empty if unknown"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Price charged for alternative milk (0 = free, empty = unknown)</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="e.g., Uji, Kyoto, Instagram"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Where did you learn about this cafe or matcha source?</p>
            </div>

            {/* Content */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Note *
              </label>
              <input
                type="text"
                name="quickNote"
                value={formData.quickNote}
                onChange={handleChange}
                required
                placeholder="Short tagline (e.g., 'Best ceremonial matcha in Toronto')"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Review
              </label>
              <textarea
                name="review"
                value={formData.review}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Social & Contact */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Social Media & Contact
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram Handle
              </label>
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="@cafename"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram Post Link
              </label>
              <input
                type="url"
                name="instagramPostLink"
                value={formData.instagramPostLink}
                onChange={handleChange}
                placeholder="https://instagram.com/p/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TikTok Post Link
              </label>
              <input
                type="url"
                name="tiktokPostLink"
                value={formData.tiktokPostLink}
                onChange={handleChange}
                placeholder="https://tiktok.com/@user/video/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="flex justify-end gap-3 p-6 border-t flex-shrink-0 bg-gray-50">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={18} />
              {isSubmitting ? 'Saving...' : 'Save Cafe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CafeForm
