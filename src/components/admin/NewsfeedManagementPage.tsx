import React from 'react'
import { Newspaper, Plus, Search, Edit, Trash2, AlertCircle } from 'lucide-react'

export const NewsfeedManagementPage: React.FC = () => {
  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Not Implemented Banner */}
        <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={24} className="text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-800">Not Yet Implemented</h3>
            <p className="text-sm text-yellow-700">This page is a visual mockup. Backend integration coming soon.</p>
          </div>
        </div>

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

            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* News Feed Items */}
        <div className="space-y-3">
          {[
            { type: 'new_location', title: 'New Matcha Spot in Downtown', date: '2024-01-15' },
            { type: 'score_update', title: 'Updated Score: Cafe ABC', date: '2024-01-10' },
            { type: 'announcement', title: 'Welcome to MatchaMap!', date: '2024-01-01' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.type === 'new_location' ? 'bg-green-100 text-green-700' :
                      item.type === 'score_update' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">{item.date}</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">Sample preview text for this news item...</p>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                    <Edit size={16} />
                    Edit
                  </button>
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NewsfeedManagementPage
