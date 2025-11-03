import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Coffee, Star, Crown } from '@/components/icons'
import { api } from '../../utils/api'
import type { DrinkItem } from '../../types'
import { DrinkForm } from './DrinkForm'
import { useDataStore } from '../../stores/dataStore'
import { COPY } from '../../constants/copy'
import { IconButton } from '../ui/Button'

interface DrinksManagementProps {
  cafeId: number
  cafeName: string
  onClose: () => void
}

export const DrinksManagement: React.FC<DrinksManagementProps> = ({ cafeId, cafeName, onClose }) => {
  const [drinks, setDrinks] = useState<DrinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDrinkForm, setShowDrinkForm] = useState(false)
  const [editingDrink, setEditingDrink] = useState<DrinkItem | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null)
  const { fetchCafes } = useDataStore()

  const loadDrinks = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.drinks.getAll(cafeId)
      setDrinks(response.drinks)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [cafeId])

  useEffect(() => {
    loadDrinks()
  }, [loadDrinks])

  const handleDelete = async (drinkId: number) => {
    if (!confirm('Are you sure you want to delete this drink?')) return

    try {
      await api.drinks.delete(drinkId)
      await loadDrinks()
      // Refresh cafe data in the store to update map view with cache busting
      await fetchCafes(undefined, true)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleEdit = (drink: DrinkItem) => {
    setEditingDrink(drink)
    setShowDrinkForm(true)
  }

  const handleAddNew = () => {
    setEditingDrink(null)
    setShowDrinkForm(true)
  }

  const handleSetAsDefault = async (drinkId: number) => {
    if (!confirm(COPY.admin.drinksManagement.setAsDefaultConfirm)) return

    try {
      setSettingDefaultId(drinkId)
      const response = await api.drinks.setAsDefault(cafeId, drinkId)
      
      // Optimistic update: update drinks list with the response
      setDrinks(response.drinks)
      
      // Refresh cafe data in the store to update map view with cache busting
      await fetchCafes(undefined, true)
    } catch (err) {
      setError(COPY.admin.drinksManagement.setAsDefaultError)
      console.error('Error setting default drink:', err)
      // Reload drinks to sync UI with backend state on error
      await loadDrinks()
    } finally {
      setSettingDefaultId(null)
    }
  }

  const handleFormClose = async () => {
    setShowDrinkForm(false)
    setEditingDrink(null)
    await loadDrinks()
    // Refresh cafe data in the store to update map view with cache busting
    await fetchCafes(undefined, true)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Coffee size={24} />
              Manage Drinks - {cafeName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Add and manage individual drinks with scores
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : drinks.length === 0 ? (
            <div className="text-center py-12">
              <Coffee size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No drinks added yet</p>
              <button
                onClick={handleAddNew}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2 mx-auto"
              >
                <Plus size={18} />
                Add First Drink
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  {drinks.length} drink{drinks.length !== 1 ? 's' : ''} total
                </p>
                <button
                  onClick={handleAddNew}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Drink
                </button>
              </div>

              <div className="grid gap-4">
                {drinks.map((drink) => (
                  <div
                    key={drink.id}
                    className={`border rounded-lg p-4 ${drink.isDefault ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-800">
                            {drink.name || 'Iced Matcha Latte'}
                          </h3>
                          {drink.isDefault && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded flex items-center gap-1">
                              <Star size={12} className="fill-current" />
                              {COPY.admin.drinksManagement.defaultLabel}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Score:</span>
                            <p className="font-medium text-gray-800 flex items-center gap-1">
                              <Star size={14} className="text-yellow-500" />
                              {drink.score.toFixed(1)}/10
                            </p>
                          </div>

                          {drink.priceAmount !== null && drink.priceAmount !== undefined && drink.priceCurrency && (
                            <div>
                              <span className="text-gray-600">Price:</span>
                              <p className="font-medium text-gray-800">
                                {drink.priceCurrency === 'CAD' ? '$' : drink.priceCurrency === 'USD' ? '$' : '¥'}
                                {drink.priceAmount.toFixed(2)}
                              </p>
                            </div>
                          )}

                          {drink.gramsUsed && (
                            <div>
                              <span className="text-gray-600">Grams:</span>
                              <p className="font-medium text-gray-800">{drink.gramsUsed}g</p>
                            </div>
                          )}
                        </div>

                        {drink.notes && (
                          <p className="mt-2 text-sm text-gray-600 italic">
                            {drink.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <IconButton
                          icon={Edit}
                          variant="ghost"
                          ariaLabel="Edit drink"
                          onClick={() => handleEdit(drink)}
                          className="text-blue-600 hover:bg-blue-50"
                        />
                        
                        {!drink.isDefault && (
                          <IconButton
                            icon={Crown}
                            variant="ghost"
                            ariaLabel={COPY.admin.drinksManagement.setAsDefault}
                            onClick={() => handleSetAsDefault(drink.id)}
                            loading={settingDefaultId === drink.id}
                            disabled={settingDefaultId !== null}
                            className="text-amber-600 hover:bg-amber-50"
                          />
                        )}
                        
                        <IconButton
                          icon={Trash2}
                          variant="ghost"
                          ariaLabel="Delete drink"
                          onClick={() => handleDelete(drink.id)}
                          className="text-red-600 hover:bg-red-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Drink Form Modal */}
      {showDrinkForm && (
        <DrinkForm
          cafeId={cafeId}
          drink={editingDrink}
          onSave={handleFormClose}
          onCancel={handleFormClose}
        />
      )}
    </div>
  )
}
