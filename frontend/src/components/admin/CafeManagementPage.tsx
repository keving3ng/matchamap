import React, { useEffect, useState } from 'react'
import { Coffee, Plus, Search, Edit, Trash2, Loader, AlertCircle, Info } from 'lucide-react'
import { useDataStore } from '../../stores/dataStore'
import { api } from '../../utils/api'
import { CafeForm } from './CafeForm'
import { CafeFormWizard } from './CafeFormWizard'
import { DrinksManagement } from './DrinksManagement'
import { IconButton } from '../ui'
import { COPY } from '../../constants/copy'
import type { Cafe } from '../../types'

export const CafeManagementPage: React.FC = () => {
  const { allCafes, fetchCafes, isLoading } = useDataStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null)
  const [filterCity, setFilterCity] = useState<string>('all')
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [managingDrinksCafe, setManagingDrinksCafe] = useState<Cafe | null>(null)

  useEffect(() => {
    fetchCafes(undefined, true) // Bust cache on mount for admin
  }, [])

  // Helper function to check for missing optional fields
  const getMissingFields = (cafe: Cafe): string[] => {
    const optionalFields = [
      { key: 'address', label: 'Address' },
      { key: 'review', label: 'Review' },
      { key: 'hours', label: 'Hours' },
      { key: 'instagram', label: 'Instagram' },
      { key: 'instagramPostLink', label: 'Instagram Post' },
      { key: 'tiktokPostLink', label: 'TikTok Post' },
      { key: 'images', label: 'Images' },
      { key: 'ambianceScore', label: 'Ambiance Score' },
      { key: 'chargeForAltMilk', label: 'Alt Milk Pricing' },
    ]
    
    return optionalFields
      .filter(field => {
        const value = cafe[field.key as keyof Cafe]
        return value === null || value === undefined || value === ''
      })
      .map(field => field.label)
  }

  // Component for missing fields indicator with tooltip
  const MissingFieldsIndicator: React.FC<{ cafe: Cafe }> = ({ cafe }) => {
    const [showTooltip, setShowTooltip] = useState(false)
    const missingFields = getMissingFields(cafe)
    
    if (missingFields.length === 0) {
      return null
    }

    return (
      <div 
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)} // For mobile
      >
        <span 
          className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-600 border border-amber-300 rounded-full cursor-help hover:bg-amber-200 transition-colors"
          title={COPY.admin.cafeManagement.missingFieldsList(missingFields)}
        >
          <Info size={12} />
        </span>
        
        {showTooltip && (
          <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg max-w-64 break-words">
            <div className="font-semibold mb-1">
              {COPY.admin.cafeManagement.missingFieldsTooltip(missingFields.length)}
            </div>
            <div className="text-gray-200">
              {COPY.admin.cafeManagement.missingFieldsList(missingFields)}
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        )}
      </div>
    )
  }

  const handleAddCafe = () => {
    setEditingCafe(null)
    setShowForm(true)
  }

  const handleEditCafe = (cafe: Cafe) => {
    setEditingCafe(cafe)
    setShowForm(true)
  }

  const handleSaveCafe = async (cafeData: Partial<Cafe>) => {
    try {
      if (editingCafe) {
        await api.cafes.update(editingCafe.id, cafeData)
      } else {
        await api.cafes.create(cafeData)
      }
      await fetchCafes(undefined, true) // Bust cache after save
    } catch (error) {
      throw error
    }
  }

  const handleDeleteCafe = async (cafeId: number) => {
    if (!confirm('Are you sure you want to delete this cafe? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(cafeId)
      await api.cafes.delete(cafeId)
      // Refresh cafe list with cache busting
      await fetchCafes(undefined, true)
    } catch (error) {
      alert(`Failed to delete cafe: ${(error as Error).message}`)
    } finally {
      setIsDeleting(null)
    }
  }

  // Filter cafes based on search and city filter
  const filteredCafes = allCafes.filter(cafe => {
    const matchesSearch = cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cafe.quickNote.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cafe.city.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCity = filterCity === 'all' || cafe.city === filterCity

    return matchesSearch && matchesCity
  })

  // Check if cafe is missing location information
  const isMissingLocation = (cafe: Cafe) => {
    return !cafe.address || cafe.latitude === 0 || cafe.longitude === 0
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-green-800 mb-2 flex items-center gap-2">
                <Coffee size={28} />
                Cafe Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Add, edit, and manage all cafe locations
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddCafe}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
              >
                <Plus size={20} />
                Add New Cafe
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search cafes by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Cities</option>
              <option value="toronto">Toronto</option>
              <option value="montreal">Montreal</option>
              <option value="tokyo">Tokyo</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-green-500" size={48} />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCafes.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Coffee size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No cafes found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterCity !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first cafe'}
            </p>
            {!searchQuery && filterCity === 'all' && (
              <button
                onClick={handleAddCafe}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                <Plus size={20} />
                Add Your First Cafe
              </button>
            )}
          </div>
        )}

        {/* Cafe List */}
        {!isLoading && filteredCafes.length > 0 && (
          <div className="space-y-3">
            {filteredCafes.map((cafe) => (
              <div key={cafe.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-800">{cafe.name}</h3>
                      {isMissingLocation(cafe) && (
                        <span title="Missing location information (address, latitude, or longitude)">
                          <AlertCircle
                            size={16}
                            className="text-orange-500"
                          />
                        </span>
                      )}
                      <MissingFieldsIndicator cafe={cafe} />
                      {cafe.displayScore && (
                        <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full font-bold text-sm">
                          {cafe.displayScore.toFixed(1)}
                        </span>
                      )}
                      <span className="text-sm text-gray-500 capitalize">{cafe.city}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1 italic">"{cafe.quickNote}"</p>
                    {cafe.review && (
                      <p className="text-sm text-gray-500 line-clamp-2">{cafe.review}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEditCafe(cafe)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => setManagingDrinksCafe(cafe)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                    >
                      <Coffee size={16} />
                      Drinks
                    </button>
                    <IconButton
                      onClick={() => handleDeleteCafe(cafe.id)}
                      disabled={isDeleting === cafe.id}
                      icon={isDeleting === cafe.id ? Loader : Trash2}
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 disabled:opacity-50"
                      ariaLabel="Delete cafe"
                      loading={isDeleting === cafe.id}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {!isLoading && filteredCafes.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredCafes.length} of {allCafes.length} cafes
          </div>
        )}
      </div>

      {/* Cafe Form Modal - Use wizard for adding, regular form for editing */}
      {showForm && editingCafe === null ? (
        <CafeFormWizard
          onSave={handleSaveCafe}
          onCancel={() => setShowForm(false)}
        />
      ) : showForm && editingCafe ? (
        <CafeForm
          cafe={editingCafe}
          onSave={handleSaveCafe}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {/* Drinks Management Modal */}
      {managingDrinksCafe && (
        <DrinksManagement
          cafeId={managingDrinksCafe.id}
          cafeName={managingDrinksCafe.name}
          onClose={() => setManagingDrinksCafe(null)}
        />
      )}
    </div>
  )
}

export default CafeManagementPage
