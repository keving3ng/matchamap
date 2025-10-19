import React from 'react'
import { Code, Key, Plus, Copy, Trash2, AlertCircle, Activity } from '@/components/icons'

export const ApiManagementPage: React.FC = () => {
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-green-800 mb-2 flex items-center gap-2">
                <Code size={28} />
                API Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Manage API keys and monitor usage
              </p>
            </div>

            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition">
              <Plus size={20} />
              Generate API Key
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Key size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Keys</p>
                <p className="text-2xl font-bold text-gray-800">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">API Calls Today</p>
                <p className="text-2xl font-bold text-gray-800">1,234</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Code size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-800">45.6K</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Keys List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">API Keys</h2>
          {[
            { name: 'Production Key', created: '2024-01-01', lastUsed: '2 hours ago', status: 'active' },
            { name: 'Development Key', created: '2024-01-15', lastUsed: '1 day ago', status: 'active' },
            { name: 'Testing Key', created: '2024-02-01', lastUsed: 'Never', status: 'inactive' },
          ].map((key, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-800">{key.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        key.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {key.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>Created: {key.created}</span>
                      <span>•</span>
                      <span>Last used: {key.lastUsed}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                      <Copy size={16} />
                      Copy
                    </button>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                      <Trash2 size={16} />
                      Revoke
                    </button>
                  </div>
                </div>

                {/* API Key Display */}
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-600 break-all">
                  mk_prod_********************************{i}abc
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ApiManagementPage
