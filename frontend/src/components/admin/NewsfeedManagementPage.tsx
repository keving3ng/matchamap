import React, { useState, useEffect } from 'react'
import { Newspaper, Plus, Search, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { api } from '../../utils/api'
import type { FeedItem } from '../../../../shared/types'

export const NewsfeedManagementPage: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null)
  const [formData, setFormData] = useState<Partial<FeedItem>>({
    type: 'announcement' as any,
    title: '',
    preview: '',
    content: '',
    published: false,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadFeedItems()
  }, [])

  const loadFeedItems = async () => {
    try {
      setLoading(true)
      const response = await api.feed.getAllAdmin({ limit: 100 })
      setFeedItems(response.items)
    } catch (error) {
      console.error('Failed to load feed items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingItem(null)
    setFormData({
      type: 'announcement' as any,
      title: '',
      preview: '',
      content: '',
      published: false,
      date: new Date().toISOString().split('T')[0],
    })
    setShowEditor(true)
  }

  const handleEdit = (item: FeedItem) => {
    setEditingItem(item)
    setFormData(item)
    setShowEditor(true)
  }

  const handleSave = async () => {
    try {
      if (editingItem) {
        await api.feed.update(editingItem.id, formData)
      } else {
        await api.feed.create(formData)
      }
      await loadFeedItems()
      setShowEditor(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Failed to save feed item:', error)
      alert('Failed to save feed item: ' + (error as Error).message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this feed item?')) return

    try {
      await api.feed.delete(id)
      await loadFeedItems()
    } catch (error) {
      console.error('Failed to delete feed item:', error)
      alert('Failed to delete feed item: ' + (error as Error).message)
    }
  }

  const handleTogglePublished = async (item: FeedItem) => {
    try {
      await api.feed.update(item.id, { published: !item.published })
      await loadFeedItems()
    } catch (error) {
      console.error('Failed to toggle published status:', error)
    }
  }

  const filteredItems = feedItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.preview.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (showEditor) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              {editingItem ? 'Edit Feed Item' : 'Create Feed Item'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="new_location">New Location</option>
                  <option value="score_update">Score Update</option>
                  <option value="announcement">Announcement</option>
                  <option value="menu_update">Menu Update</option>
                  <option value="closure">Closure</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter title..."
                />
              </div>

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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Preview Text</label>
                <textarea
                  value={formData.preview}
                  onChange={(e) => setFormData({ ...formData, preview: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Short preview text..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Content (Optional)</label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={6}
                  placeholder="Full article content..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cafe Name (Optional)</label>
                <input
                  type="text"
                  value={formData.cafeName || ''}
                  onChange={(e) => setFormData({ ...formData, cafeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Related cafe name..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Score (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.score || ''}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Previous Score (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.previousScore || ''}
                    onChange={(e) => setFormData({ ...formData, previousScore: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.0"
                  />
                </div>
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
                <Newspaper size={28} />
                Newsfeed Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Manage news updates, announcements, and blog posts
              </p>
            </div>

            <button
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
            >
              <Plus size={20} />
              Add News Item
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search news items..."
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
            <p className="mt-4 text-gray-600">Loading feed items...</p>
          </div>
        )}

        {/* News Feed Items */}
        {!loading && (
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No feed items found</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.type === 'new_location' ? 'bg-green-100 text-green-700' :
                          item.type === 'score_update' ? 'bg-blue-100 text-blue-700' :
                          item.type === 'menu_update' ? 'bg-orange-100 text-orange-700' :
                          item.type === 'closure' ? 'bg-red-100 text-red-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {item.type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">{item.date}</span>
                        {!item.published && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                            Draft
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.preview}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTogglePublished(item)}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                          item.published
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                        title={item.published ? 'Unpublish' : 'Publish'}
                      >
                        {item.published ? <EyeOff size={16} /> : <Eye size={16} />}
                        {item.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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

export default NewsfeedManagementPage
