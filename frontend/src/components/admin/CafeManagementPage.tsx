import React, { useEffect, useState } from 'react'
import { Coffee, Plus, Search, Edit, Trash2, Loader } from 'lucide-react'
import { useDataStore } from '../../stores/dataStore'
import { api } from '../../utils/api'
import { CafeForm } from './CafeForm'
import type { Cafe } from '../../types'

export const CafeManagementPage: React.FC = () => {
  const { allCafes, fetchCafes, isLoading } = useDataStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null)
  const [filterCity, setFilterCity] = useState<string>('all')
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetchCafes()
  }, [])

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
      await fetchCafes()
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
      // Refresh cafe list
      await fetchCafes()
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

            <button
              onClick={handleAddCafe}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
            >
              <Plus size={20} />
              Add New Cafe
            </button>
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
                      <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full font-bold text-sm">
                        {cafe.score.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">{cafe.city}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1 italic">"{cafe.quickNote}"</p>
                    {cafe.review && (
                      <p className="text-sm text-gray-500 line-clamp-2">{cafe.review}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCafe(cafe)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCafe(cafe.id)}
                      disabled={isDeleting === cafe.id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {isDeleting === cafe.id ? (
                        <Loader className="animate-spin" size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Delete
                    </button>
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

      {/* Cafe Form Modal */}
      {showForm && (
        <CafeForm
          cafe={editingCafe}
          onSave={handleSaveCafe}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

export default CafeManagementPage
