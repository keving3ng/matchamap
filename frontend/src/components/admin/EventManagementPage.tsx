import React, { useState, useEffect } from 'react'
import { Calendar, Plus, Search, Edit, Trash2, Star } from 'lucide-react'
import { api } from '../../utils/api'
import type { Event } from '../../../../shared/types'

export const EventManagementPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    venue: '',
    location: '',
    description: '',
    price: '',
    featured: false,
    published: true,
  })

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await api.events.getAllAdmin({ limit: 100 })
      setEvents(response.events)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingEvent(null)
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      venue: '',
      location: '',
      description: '',
      price: '',
      featured: false,
      published: true,
    })
    setShowEditor(true)
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData(event)
    setShowEditor(true)
  }

  const handleSave = async () => {
    try {
      // Only send fields that are part of the event data model (exclude metadata)
      const { id, ...editableFields } = formData

      if (editingEvent) {
        await api.events.update(editingEvent.id, editableFields)
      } else {
        await api.events.create(editableFields)
      }
      await loadEvents()
      setShowEditor(false)
      setEditingEvent(null)
    } catch (error) {
      console.error('Failed to save event:', error)
      alert('Failed to save event: ' + (error as Error).message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      await api.events.delete(id)
      await loadEvents()
    } catch (error) {
      console.error('Failed to delete event:', error)
      alert('Failed to delete event: ' + (error as Error).message)
    }
  }

  const handleToggleFeatured = async (event: Event) => {
    try {
      await api.events.update(event.id, { featured: !event.featured })
      await loadEvents()
    } catch (error) {
      console.error('Failed to toggle featured status:', error)
    }
  }

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (showEditor) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              {editingEvent ? 'Edit Event' : 'Create Event'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter event title..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Venue</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter venue name..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter full address..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter event description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price (Optional)</label>
                  <input
                    type="text"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g. $25 or Free"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.image || ''}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Featured Event
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="published" className="text-sm font-medium text-gray-700">
                    Published
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowEditor(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-green-800 mb-2 flex items-center gap-2">
                <Calendar size={28} />
                Event Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Create and manage matcha-related events
              </p>
            </div>

            <button
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
            >
              <Plus size={20} />
              Add New Event
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        )}

        {/* Event List */}
        {!loading && (
          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No events found</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-lg text-gray-800">{event.title}</h3>
                        {event.featured && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                            <Star size={12} />
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {event.date}
                        </span>
                        <span>•</span>
                        <span>{event.time}</span>
                        <span>•</span>
                        <span>{event.venue}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {event.price && `${event.price} • `}
                        {event.description.substring(0, 100)}...
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleFeatured(event)}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                          event.featured
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title={event.featured ? 'Remove featured' : 'Set as featured'}
                      >
                        <Star size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(event)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EventManagementPage
