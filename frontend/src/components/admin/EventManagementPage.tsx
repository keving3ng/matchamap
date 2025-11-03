import React, { useState, useEffect } from 'react'
import { Calendar, Plus, Search, Edit, Trash2, Star, MoreVertical, Download, Upload, Eye, ExternalLink, Check, Clock, MapPin, DollarSign } from '@/components/icons'
import { api } from '../../utils/api'
import { COPY } from '../../constants/copy'
import { useCafeStore } from '../../stores/cafeStore'
import type { Event } from '../../../../shared/types'

export const EventManagementPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewEvent, setPreviewEvent] = useState<Event | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    venue: '',
    location: '',
    description: '',
    price: '',
    link: '',
    cafeId: null,
    featured: false,
    published: true,
  })

  // Get cafes for the cafe selector
  const { cafesWithDistance } = useCafeStore()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async (bustCache = false) => {
    try {
      setLoading(true)
      const response = await api.events.getAllAdmin({ limit: 100 }, bustCache)
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
      link: '',
      cafeId: null,
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
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...editableFields } = formData

      if (editingEvent) {
        await api.events.update(editingEvent.id, editableFields)
      } else {
        await api.events.create(editableFields)
      }
      await loadEvents(true)
      setShowEditor(false)
      setEditingEvent(null)
    } catch (error) {
      console.error('Failed to save event:', error)
      alert('Failed to save event: ' + (error as Error).message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(COPY.admin.eventManagement.confirmDelete)) return

    try {
      await api.events.delete(id)
      await loadEvents(true)
      setOpenMenuId(null)
    } catch (error) {
      console.error('Failed to delete event:', error)
      alert('Failed to delete event: ' + (error as Error).message)
    }
  }

  const handleToggleFeatured = async (event: Event) => {
    const newFeaturedStatus = !event.featured

    if (newFeaturedStatus && !confirm(COPY.admin.eventManagement.confirmMakeFeatured)) {
      return
    }

    try {
      await api.events.update(event.id, { featured: newFeaturedStatus })
      await loadEvents(true)
      setOpenMenuId(null)
    } catch (error) {
      console.error('Failed to toggle featured status:', error)
    }
  }

  const handleTogglePublished = async (event: Event) => {
    try {
      await api.events.update(event.id, { published: !event.published })
      await loadEvents(true)
      setOpenMenuId(null)
    } catch (error) {
      console.error('Failed to toggle published status:', error)
    }
  }

  const handleExportJson = (event: Event) => {
    const json = JSON.stringify(event, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `event-${event.id}-${event.title.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setOpenMenuId(null)
  }

  const handleCopyJson = async (event: Event) => {
    try {
      const json = JSON.stringify(event, null, 2)
      await navigator.clipboard.writeText(json)
      alert(COPY.admin.eventManagement.jsonCopied)
      setOpenMenuId(null)
    } catch (error) {
      console.error('Failed to copy JSON:', error)
    }
  }

  const handleImportJson = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const eventData = JSON.parse(text)

        // Remove metadata fields
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...cleanData } = eventData

        setFormData(cleanData)
        setEditingEvent(null)
        setShowEditor(true)
      } catch (error) {
        console.error('Failed to import JSON:', error)
        alert(COPY.admin.eventManagement.importError)
      }
    }
    input.click()
  }

  const handlePreview = (event: Event) => {
    setPreviewEvent(event)
    setShowPreview(true)
    setOpenMenuId(null)
  }

  const handleViewDetailsPage = (event: Event) => {
    window.open(`/events/${event.id}`, '_blank')
    setOpenMenuId(null)
  }

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Helper function to get Instagram URL from handle or post link
  const getInstagramUrl = (link: string | null | undefined): string | null => {
    if (!link) return null

    // Check if it's already a full URL
    if (link.startsWith('http')) {
      return link
    }

    // Check if it's an Instagram handle (starts with @)
    if (link.startsWith('@')) {
      return `https://instagram.com/${link.replace('@', '')}`
    }

    // Assume it's a handle without @
    return `https://instagram.com/${link}`
  }

  // Preview Modal Component
  const PreviewModal = () => {
    if (!showPreview || !previewEvent) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">{COPY.admin.eventManagement.preview}</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              ✕
            </button>
          </div>

          {/* Render the event card exactly as it appears in EventsView */}
          <div className="p-6">
            <article
              className={`bg-white rounded-2xl shadow-md border-2 ${
                previewEvent.featured ? 'border-green-400' : 'border-green-100'
              } overflow-hidden`}
            >
              {previewEvent.featured && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold">
                  <Star size={16} fill="white" />
                  {COPY.events.featuredEvent}
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Instagram link icon or emoji */}
                  {previewEvent.link && getInstagramUrl(previewEvent.link) && (
                    <a
                      href={getInstagramUrl(previewEvent.link)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-16 h-16 bg-gradient-to-br ${
                        previewEvent.featured ? 'from-green-500 to-green-700' : 'from-green-400 to-green-600'
                      } rounded-xl flex items-center justify-center text-4xl flex-shrink-0 shadow-md hover:scale-105 transition-transform`}
                      title={COPY.events.viewOnInstagram}
                    >
                      🍵
                    </a>
                  )}

                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 mb-2 leading-tight">{previewEvent.title}</h3>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Calendar size={14} className="text-green-600" />
                        <span>{previewEvent.date}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Clock size={14} className="text-green-600" />
                        <span>{previewEvent.time}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <MapPin size={14} className="text-green-600" />
                        <span>{previewEvent.venue}, {previewEvent.location}</span>
                      </div>

                      {previewEvent.price && (
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                          <DollarSign size={14} className="text-green-600" />
                          <span>{previewEvent.price}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mt-3 leading-relaxed whitespace-pre-wrap">{previewEvent.description}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    )
  }

  if (showEditor) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              {editingEvent ? COPY.admin.eventManagement.editEvent : COPY.admin.eventManagement.createEvent}
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {COPY.admin.eventManagement.selectCafe}
                </label>
                <select
                  value={formData.cafeId ?? ''}
                  onChange={(e) => {
                    const cafeId = e.target.value ? parseInt(e.target.value) : null
                    const selectedCafe = cafeId ? cafesWithDistance.find(c => c.id === cafeId) : null

                    setFormData({
                      ...formData,
                      cafeId,
                      // Auto-fill venue and location if cafe is selected
                      venue: selectedCafe ? selectedCafe.name : formData.venue,
                      location: selectedCafe ? (selectedCafe.address || '') : (formData.location || ''),
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">{COPY.admin.eventManagement.noCafeLinked}</option>
                  {cafesWithDistance.map((cafe) => (
                    <option key={cafe.id} value={cafe.id}>
                      {cafe.name} - {cafe.city}
                    </option>
                  ))}
                </select>
                {formData.cafeId && (
                  <p className="text-xs text-green-600 mt-1">✓ Venue and location auto-filled from cafe</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Venue {formData.cafeId && <span className="text-xs text-gray-500">(auto-filled)</span>}
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  disabled={!!formData.cafeId}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    formData.cafeId ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter venue name..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Location {formData.cafeId && <span className="text-xs text-gray-500">(auto-filled)</span>}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!!formData.cafeId}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    formData.cafeId ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                  }`}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {COPY.admin.eventManagement.linkField}
                  </label>
                  <input
                    type="text"
                    value={formData.link || ''}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={COPY.admin.eventManagement.linkFieldPlaceholder}
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
                {COPY.admin.eventManagement.title}
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                {COPY.admin.eventManagement.subtitle}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleImportJson}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                title={COPY.admin.eventManagement.importJson}
              >
                <Upload size={20} />
                <span className="hidden sm:inline">{COPY.admin.eventManagement.importJson}</span>
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
              >
                <Plus size={20} />
                {COPY.admin.eventManagement.addNewEvent}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={COPY.admin.eventManagement.searchPlaceholder}
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
                <p className="text-gray-500">{COPY.admin.eventManagement.noEventsFound}</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition relative">
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
                        {!event.published && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                            Unpublished
                          </span>
                        )}
                        {event.cafeId && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            Linked to Cafe
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

                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleEdit(event)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        <Edit size={16} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      {/* Three-dots menu */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          aria-label={COPY.admin.eventManagement.moreOptionsAriaLabel}
                        >
                          <MoreVertical size={20} />
                        </button>

                        {openMenuId === event.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                              <button
                                onClick={() => handlePreview(event)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye size={16} />
                                {COPY.admin.eventManagement.preview}
                              </button>
                              <button
                                onClick={() => handleViewDetailsPage(event)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <ExternalLink size={16} />
                                {COPY.admin.eventManagement.viewDetailsPage}
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => handleToggleFeatured(event)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Star size={16} className={event.featured ? 'fill-yellow-500 text-yellow-500' : ''} />
                                {event.featured ? COPY.admin.eventManagement.removeFeatured : COPY.admin.eventManagement.makeFeatured}
                              </button>
                              <button
                                onClick={() => handleTogglePublished(event)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Check size={16} />
                                {event.published ? COPY.admin.eventManagement.unpublish : COPY.admin.eventManagement.publish}
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => handleExportJson(event)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Download size={16} />
                                {COPY.admin.eventManagement.exportJson}
                              </button>
                              <button
                                onClick={() => handleCopyJson(event)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Download size={16} />
                                {COPY.admin.eventManagement.copyToClipboard}
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                {COPY.admin.eventManagement.deleteEvent}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <PreviewModal />
    </div>
  )
}

export default EventManagementPage
