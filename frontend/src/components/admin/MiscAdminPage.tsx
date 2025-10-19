import React from 'react'
import { Wrench, AlertCircle, Database, FileText, Bell, Globe, Palette } from '@/components/icons'

export const MiscAdminPage: React.FC = () => {
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
          <h1 className="text-xl md:text-2xl font-bold text-green-800 mb-2 flex items-center gap-2">
            <Wrench size={28} />
            Miscellaneous Admin
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Additional system settings and configurations
          </p>
        </div>

        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Database Management */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">Database</h3>
                <p className="text-sm text-gray-600">Backup & maintenance</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                Create Backup
              </button>
              <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                View Backup History
              </button>
            </div>
          </div>

          {/* Site Settings */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Globe size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">Site Settings</h3>
                <p className="text-sm text-gray-600">General configuration</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm">
                Edit Settings
              </button>
              <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                View Analytics
              </button>
            </div>
          </div>

          {/* Content Management */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText size={24} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">Content</h3>
                <p className="text-sm text-gray-600">Pages & SEO</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm">
                Manage Pages
              </button>
              <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                SEO Settings
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Bell size={24} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">Notifications</h3>
                <p className="text-sm text-gray-600">Email & alerts</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm">
                Configure Alerts
              </button>
              <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                Email Templates
              </button>
            </div>
          </div>

          {/* Theme & Branding */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Palette size={24} className="text-pink-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">Theme</h3>
                <p className="text-sm text-gray-600">Appearance & branding</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition text-sm">
                Customize Theme
              </button>
              <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                Upload Logo
              </button>
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FileText size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">System Logs</h3>
                <p className="text-sm text-gray-600">Error tracking</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm">
                View Logs
              </button>
              <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                Clear Old Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MiscAdminPage
