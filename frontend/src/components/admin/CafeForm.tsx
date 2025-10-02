import React, { useState, useEffect } from 'react'
import { X, Save, MapPin, DollarSign, Star, Coffee } from 'lucide-react'
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
    lat: 0,
    lng: 0,
    score: 0,
    ambianceScore: 0,
    otherDrinksScore: 0,
    price: 0,
    chargeForAltMilk: false,
    gramsUsed: 0,
    quickNote: '',
    review: '',
    hours: '',
    instagram: '',
    instagramPostLink: '',
    tiktokPostLink: '',
    googleMapsUrl: '',
    images: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cafe) {
      setFormData({
        name: cafe.name,
        city: cafe.city,
        lat: cafe.lat,
        lng: cafe.lng,
        score: cafe.score,
        ambianceScore: cafe.secondaryScores?.ambiance || 0,
        otherDrinksScore: cafe.secondaryScores?.otherDrinks || 0,
        price: cafe.price || 0,
        chargeForAltMilk: cafe.chargeForAltMilk,
        gramsUsed: cafe.gramsUsed || 0,
        quickNote: cafe.quickNote,
        review: cafe.review || '',
        hours: cafe.hours || '',
        instagram: cafe.instagram || '',
        instagramPostLink: cafe.instagramPostLink || '',
        tiktokPostLink: cafe.tiktokPostLink || '',
        googleMapsUrl: cafe.googleMapsUrl || '',
        images: cafe.images || '',
      })
    } else {
      // Reset to initial empty state when adding new cafe
      setFormData({
        name: '',
        city: 'toronto',
        lat: 0,
        lng: 0,
        score: 0,
        ambianceScore: 0,
        otherDrinksScore: 0,
        price: 0,
        chargeForAltMilk: false,
        gramsUsed: 0,
        quickNote: '',
        review: '',
        hours: '',
        instagram: '',
        instagramPostLink: '',
        tiktokPostLink: '',
        googleMapsUrl: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Generate slug from name
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-')

      // Transform to backend API format (matching Drizzle schema)
      const payload = {
        name: formData.name,
        slug,
        link: formData.googleMapsUrl,
        latitude: formData.lat,
        longitude: formData.lng,
        city: formData.city,
        score: formData.score,
        ambianceScore: formData.ambianceScore,
        otherDrinksScore: formData.otherDrinksScore,
        price: formData.price,
        chargeForAltMilk: formData.chargeForAltMilk,
        gramsUsed: formData.gramsUsed,
        quickNote: formData.quickNote,
        review: formData.review,
        hours: formData.hours,
        instagram: formData.instagram,
        instagramPostLink: formData.instagramPostLink,
        tiktokPostLink: formData.tiktokPostLink,
        images: formData.images,
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
                <option value="toronto">Toronto</option>
                <option value="montreal">Montreal</option>
                <option value="tokyo">Tokyo</option>
              </select>
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Location
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude *
              </label>
              <input
                type="number"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                step="0.000001"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude *
              </label>
              <input
                type="number"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                step="0.000001"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Maps URL *
              </label>
              <input
                type="url"
                name="googleMapsUrl"
                value={formData.googleMapsUrl}
                onChange={handleChange}
                required
                placeholder="https://maps.google.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Ratings */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Star size={20} />
                Ratings
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Score * (0-10)
              </label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.1"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ambiance Score (0-10)
              </label>
              <input
                type="number"
                name="ambianceScore"
                value={formData.ambianceScore}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Drinks Score (0-10)
              </label>
              <input
                type="number"
                name="otherDrinksScore"
                value={formData.otherDrinksScore}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Pricing */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Pricing
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (e.g., 7.50)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grams of Matcha Used
              </label>
              <input
                type="number"
                name="gramsUsed"
                value={formData.gramsUsed}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="chargeForAltMilk"
                  checked={formData.chargeForAltMilk}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Charges for alternative milk
                </span>
              </label>
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
