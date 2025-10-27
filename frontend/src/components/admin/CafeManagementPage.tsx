import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Coffee, Plus, Search, Edit, Trash2, Loader, AlertCircle, Info } from '@/components/icons'
import { useDataStore } from '../../stores/dataStore'
import { api } from '../../utils/api'
import { CafeForm } from './CafeForm'
import { CafeFormWizard } from './CafeFormWizard'
import { DrinksManagement } from './DrinksManagement'
import { ComponentErrorBoundary } from './ComponentErrorBoundary'
import { IconButton } from '../ui'
import { COPY } from '../../constants/copy'
import { OPTIONAL_CAFE_FIELDS } from '../../constants/cafeFields'
import { borderRadius, zIndex, spacing } from '../../styles/spacing'
import { CITIES } from '../../stores/cityStore'
import type { Cafe } from '../../types'

export const CafeManagementPage: React.FC = () => {
  const { allCafes, fetchCafes, isLoading } = useDataStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null)
  const [filterCity, setFilterCity] = useState<string>('all')
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [managingDrinksCafe, setManagingDrinksCafe] = useState<Cafe | null>(null)
  const [openTooltip, setOpenTooltip] = useState<number | null>(null)

  useEffect(() => {
    fetchCafes(undefined, true) // Bust cache on mount for admin
  }, [])

  // Memoized helper function to check for missing optional fields
  const getMissingFields = useMemo(() => {
    return (cafe: Cafe): string[] => {
      return OPTIONAL_CAFE_FIELDS
        .filter(field => {
          const value = cafe[field.key as keyof Cafe]
          
          // For numeric fields (chargeForAltMilk, ambianceScore), 0 is valid
          const isNumericField = field.key === 'ambianceScore' || field.key === 'chargeForAltMilk'
          if (isNumericField) {
            return value === null || value === undefined
          }
          
          // For string fields, null/undefined/empty are all missing
          return value === null || value === undefined || value === ''
        })
        .map(field => field.label)
    }
  }, [])

  // Close tooltip when clicking outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (openTooltip !== null) {
      const target = event.target as Element
      if (!target.closest('[data-tooltip-container]')) {
        setOpenTooltip(null)
      }
    }
  }, [openTooltip])

  useEffect(() => {
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [handleClickOutside])

  // Component for missing fields indicator with tooltip
  const MissingFieldsIndicator: React.FC<{ cafe: Cafe }> = ({ cafe }) => {
    const tooltipRef = useRef<HTMLDivElement>(null)
    const missingFields = getMissingFields(cafe)
    const isTooltipOpen = openTooltip === cafe.id
    
    // Memoize the parseInt call for tooltip positioning threshold
    const threshold = useMemo(() => parseInt(spacing.tooltipPositionThreshold, 10), [])
    
    if (missingFields.length === 0) {
      return null
    }

    // Calculate tooltip positioning to avoid viewport cutoff
    const getTooltipPosition = () => {
      if (!tooltipRef.current) return 'bottom-full'
      
      const rect = tooltipRef.current.getBoundingClientRect()
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom
      
      // If not enough space above (< threshold for tooltip), position below
      return spaceAbove < threshold && spaceBelow > threshold ? 'top-full mt-2' : 'bottom-full mb-2'
    }

    const handleToggleTooltip = (event: React.MouseEvent) => {
      event.stopPropagation()
      setOpenTooltip(isTooltipOpen ? null : cafe.id)
    }

    return (
      <div 
        ref={tooltipRef}
        className="relative inline-block"
        data-tooltip-container
        onMouseEnter={() => setOpenTooltip(cafe.id)}
        onMouseLeave={() => setOpenTooltip(null)}
        onClick={handleToggleTooltip}
      >
        <span
          className="inline-flex items-center justify-center bg-amber-100 text-amber-600 border border-amber-300 cursor-help hover:bg-amber-200 transition-colors"
          style={{
            width: spacing.tooltipTriggerSize,
            height: spacing.tooltipTriggerSize,
            borderRadius: borderRadius.full
          }}
          title={COPY.admin.cafeManagement.missingFieldsList(missingFields)}
        >
          <Info size={16} data-testid="lucide-info" />
        </span>
        
        {isTooltipOpen && (
          <div
            className={`absolute left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm shadow-xl ${getTooltipPosition()}`}
            style={{
              zIndex: zIndex.modal,
              borderRadius: borderRadius.lg,
              maxWidth: spacing.tooltipMaxWidth,
              minWidth: spacing.tooltipMinWidth,
              paddingLeft: spacing.tooltipPaddingX,
              paddingRight: spacing.tooltipPaddingX,
              paddingTop: spacing.tooltipPadding,
              paddingBottom: spacing.tooltipPadding
            }}
          >
            <div className="font-semibold mb-1">
              {COPY.admin.cafeManagement.missingFieldsTooltip(missingFields.length)}
            </div>
            <div className="text-gray-200">
              {COPY.admin.cafeManagement.missingFieldsList(missingFields)}
            </div>
            {/* Tooltip arrow */}
            <div 
              className={`absolute left-1/2 transform -translate-x-1/2 border-transparent ${
                getTooltipPosition().includes('bottom-full') 
                  ? 'top-full border-t-gray-800' 
                  : 'bottom-full border-b-gray-800'
              }`}
              style={{
                borderWidth: spacing.tooltipArrowSize
              }}
            ></div>
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
              {Object.values(CITIES).map(city => (
                <option key={city.key} value={city.key}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-green-500" size={48} data-testid="lucide-loader" />
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
                      variant="danger"
                      shape="square"
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
        <ComponentErrorBoundary componentName="Cafe Creation Wizard">
          <CafeFormWizard
            onSave={handleSaveCafe}
            onCancel={() => setShowForm(false)}
          />
        </ComponentErrorBoundary>
      ) : showForm && editingCafe ? (
        <ComponentErrorBoundary componentName="Cafe Editor">
          <CafeForm
            cafe={editingCafe}
            onSave={handleSaveCafe}
            onCancel={() => setShowForm(false)}
          />
        </ComponentErrorBoundary>
      ) : null}

      {/* Drinks Management Modal */}
      {managingDrinksCafe && (
        <ComponentErrorBoundary componentName="Drinks Management">
          <DrinksManagement
            cafeId={managingDrinksCafe.id}
            cafeName={managingDrinksCafe.name}
            onClose={() => setManagingDrinksCafe(null)}
          />
        </ComponentErrorBoundary>
      )}
    </div>
  )
}

export default CafeManagementPage
