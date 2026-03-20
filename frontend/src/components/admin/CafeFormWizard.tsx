import React, { useState } from 'react'
import { X, Save, MapPin, Star, Coffee, ArrowRight, ArrowLeft, Search } from '@/components/icons'
import { api } from '../../utils/api'
import { formatHoursList } from '../../utils/formatHours'
import { CITIES, CityKey } from '../../stores/cityStore'
import type { CafeFormData } from '../../../../shared/types'

interface CafeFormWizardProps {
  onSave: (cafeData: CafeFormData) => Promise<void>
  onCancel: () => void
}

type WizardStep = 'url' | 'details' | 'review'

export const CafeFormWizard: React.FC<CafeFormWizardProps> = ({ onSave, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('url')
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    city: 'toronto' as CityKey,
    lat: 0,
    lng: 0,
    address: '',
    hours: '',
    googleMapsUrl: '',
    ambianceScore: 0,
    chargeForAltMilk: null as number | null,
    quickNote: '',
    review: '',
    source: '',
    instagram: '',
    instagramPostLink: '',
    tiktokPostLink: '',
    images: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Lookup place from Google Maps URL
  const handleLookupPlace = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLookingUp(true)
    setLookupError(null)

    try {
      const response = await api.places.lookup(googleMapsUrl)
      const place = response.place

      setFormData(prev => ({
        ...prev,
        name: place.name,
        lat: place.latitude,
        lng: place.longitude,
        address: place.address,
        hours: place.hours || '',
        googleMapsUrl: googleMapsUrl,
      }))

      // Move to next step
      setCurrentStep('details')
    } catch (err) {
      setLookupError((err as Error).message)
    } finally {
      setIsLookingUp(false)
    }
  }

  // Step 2: Confirm and adjust place details
  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep('review')
  }

  // Step 3: Add review data and submit
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-')

      const payload: CafeFormData = {
        name: formData.name,
        slug,
        link: formData.googleMapsUrl,
        latitude: formData.lat,
        longitude: formData.lng,
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

      await onSave(payload)
      onCancel()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xs max-w-2xl w-full max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Coffee size={24} />
              Add New Cafe
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <div className={`flex items-center gap-2 ${currentStep === 'url' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 'url' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>1</span>
                <span className="text-sm">Lookup</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300" />
              <div className={`flex items-center gap-2 ${currentStep === 'details' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 'details' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>2</span>
                <span className="text-sm">Details</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300" />
              <div className={`flex items-center gap-2 ${currentStep === 'review' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 'review' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>3</span>
                <span className="text-sm">Review</span>
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Step 1: Google Maps URL */}
          {currentStep === 'url' && (
            <form onSubmit={handleLookupPlace} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Search size={20} />
                  Enter Google Maps URL
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Paste the full Google Maps URL for this cafe. We&apos;ll automatically fetch the location details.
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Maps URL *
                </label>
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  required
                  placeholder="https://www.google.com/maps/place/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />

                {lookupError && (
                  <div className="mt-3 text-sm text-red-600">
                    {lookupError}
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-500">
                  💡 Tip: Use the full URL (not shortened goo.gl links)
                </p>
              </div>

              <button
                type="submit"
                disabled={isLookingUp || !googleMapsUrl}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLookingUp ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Looking up place...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Confirm Place Details */}
          {currentStep === 'details' && (
            <form onSubmit={handleDetailsNext} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Confirm Place Details
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review and adjust the information we found. All fields can be edited.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
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
                    Hours
                  </label>
                  {formData.hours ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-700 space-y-1">
                        {formatHoursList(formData.hours).map((hours, index) => (
                          <div key={index}>{hours}</div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Automatically imported from Google Maps
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No hours available</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('url')}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Add Review Data */}
          {currentStep === 'review' && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Star size={20} />
                  Add Your Review
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Now add your matcha review and ratings for this cafe.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  ℹ️ <strong>Note:</strong> Drink scores, pricing, and details will be managed separately after creating the cafe. You&apos;ll be able to add multiple drinks with individual scores.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ratings */}
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
                    placeholder="e.g., 8.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Rate the cafe&apos;s atmosphere and vibe</p>
                </div>

                {/* Alt Milk Charge */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alt Milk Charge (leave empty if free)
                  </label>
                  <input
                    type="number"
                    name="chargeForAltMilk"
                    value={formData.chargeForAltMilk || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      chargeForAltMilk: e.target.value ? parseFloat(e.target.value) : null
                    }))}
                    min="0"
                    step="0.25"
                    placeholder="e.g., 1.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Price charged for alternative milk</p>
                </div>

                {/* Source */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source (optional)
                  </label>
                  <input
                    type="text"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    placeholder="e.g., Instagram, Friend recommendation, Google"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Where did you discover this cafe?</p>
                </div>

                {/* Content */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Note * (Short tagline)
                  </label>
                  <input
                    type="text"
                    name="quickNote"
                    value={formData.quickNote}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Best ceremonial matcha in Toronto"
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

                {/* Social */}
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('details')}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Cafe
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default CafeFormWizard
