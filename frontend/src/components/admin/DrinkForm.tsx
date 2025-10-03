import React, { useState, useEffect } from 'react'
import { X, Save, Coffee } from 'lucide-react'
import { api } from '../../utils/api'
import type { DrinkItem } from '../../types'

interface DrinkFormProps {
  cafeId: number
  drink?: DrinkItem | null
  onSave: () => void
  onCancel: () => void
}

export const DrinkForm: React.FC<DrinkFormProps> = ({ cafeId, drink, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: drink?.name || '',
    score: drink?.score || 0,
    priceAmount: drink?.priceAmount ?? null,
    priceCurrency: drink?.priceCurrency || '',
    gramsUsed: drink?.gramsUsed || null,
    isDefault: drink?.isDefault || false,
    notes: drink?.notes || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? checked
        : type === 'number'
          ? (value === '' ? null : parseFloat(value) || 0)
          : (value === '' ? null : value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (drink) {
        // Update existing drink
        await api.drinks.update(drink.id, formData)
      } else {
        // Create new drink
        await api.drinks.create(cafeId, formData)
      }
      onSave()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Coffee size={24} />
            {drink ? 'Edit Drink' : 'Add New Drink'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Drink Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drink Name (optional)
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="Defaults to 'Iced Matcha Latte' if not provided"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to use default name
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score * (0-10)
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

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Amount (optional)
                </label>
                <input
                  type="number"
                  name="priceAmount"
                  value={formData.priceAmount ?? ''}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 7.50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency (optional)
                </label>
                <select
                  name="priceCurrency"
                  value={formData.priceCurrency || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- None --</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="USD">USD ($)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              {/* Grams Used */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grams of Matcha Used (optional)
                </label>
                <input
                  type="number"
                  name="gramsUsed"
                  value={formData.gramsUsed || ''}
                  onChange={handleChange}
                  min="0"
                  placeholder="e.g., 5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Is Default */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Set as default drink (will show this score on map pins)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Only one drink can be default per cafe
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Any special notes about this drink..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {drink ? 'Update Drink' : 'Add Drink'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
