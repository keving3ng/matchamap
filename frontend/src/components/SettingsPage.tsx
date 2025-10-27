import React, { useState } from 'react'
import { Settings, Bell, MapPin, Palette, Database, Shield, LogOut } from '@/components/icons'
import { ContentContainer } from './ContentContainer'
import { ThemeToggle } from '@/components/ui'
import { COPY } from '@/constants/copy'

export const SettingsPage: React.FC = () => {
  const [notifications, setNotifications] = useState(true)
  const [locationServices, setLocationServices] = useState(true)

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-dark-bg-elevated border-b-2 border-green-200 dark:border-dark-border-primary px-4 py-4 shadow-sm transition-colors duration-300">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">{COPY.settings.title}</h2>
        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">Manage your preferences and account</p>
      </div>

      <ContentContainer maxWidth="md">
        <div className="px-4 py-8 space-y-6">
          {/* Account Section */}
          <div className="bg-white dark:bg-dark-bg-elevated rounded-2xl shadow-md border-2 border-green-100 dark:border-dark-border-primary p-6 transition-colors duration-300">
            <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary mb-4 flex items-center gap-2">
              <Settings size={20} className="text-green-600 dark:text-dark-matcha-600" />
              {COPY.settings.account}
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors duration-200">
                <p className="font-semibold text-gray-800 dark:text-dark-text-primary">Edit Profile</p>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Update your name, email, and photo</p>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors duration-200">
                <p className="font-semibold text-gray-800 dark:text-dark-text-primary">Change Password</p>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Update your account password</p>
              </button>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white dark:bg-dark-bg-elevated rounded-2xl shadow-md border-2 border-green-100 dark:border-dark-border-primary p-6 transition-colors duration-300">
            <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary mb-4 flex items-center gap-2">
              <Palette size={20} className="text-green-600 dark:text-dark-matcha-600" />
              {COPY.settings.preferences}
            </h3>
            <div className="space-y-4">
              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Bell size={20} className="text-gray-600 dark:text-dark-text-secondary mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-dark-text-primary">Notifications</p>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Get updates about new cafes and events</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                    notifications ? 'bg-green-500 dark:bg-dark-matcha-600' : 'bg-gray-300 dark:bg-dark-border-secondary'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-dark-bg-elevated rounded-full transition-transform duration-300 ${
                      notifications ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Location Services Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-gray-600 dark:text-dark-text-secondary mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-dark-text-primary">Location Services</p>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Show distances to cafes near you</p>
                  </div>
                </div>
                <button
                  onClick={() => setLocationServices(!locationServices)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                    locationServices ? 'bg-green-500 dark:bg-dark-matcha-600' : 'bg-gray-300 dark:bg-dark-border-secondary'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-dark-bg-elevated rounded-full transition-transform duration-300 ${
                      locationServices ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle variant="menu" />
            </div>
          </div>

          {/* Data & Privacy Section */}
          <div className="bg-white dark:bg-dark-bg-elevated rounded-2xl shadow-md border-2 border-green-100 dark:border-dark-border-primary p-6 transition-colors duration-300">
            <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary mb-4 flex items-center gap-2">
              <Shield size={20} className="text-green-600 dark:text-dark-matcha-600" />
              Data & Privacy
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors duration-200">
                <div className="flex items-start gap-3">
                  <Database size={18} className="text-gray-600 dark:text-dark-text-secondary mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-dark-text-primary">Download Your Data</p>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Export your visited cafes and preferences</p>
                  </div>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors duration-200">
                <div className="flex items-start gap-3">
                  <Shield size={18} className="text-gray-600 dark:text-dark-text-secondary mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-dark-text-primary">Privacy Policy</p>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">View our privacy practices</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white dark:bg-dark-bg-elevated rounded-2xl shadow-md border-2 border-green-100 dark:border-dark-border-primary p-6 transition-colors duration-300">
            <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary mb-4">About</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-dark-text-secondary">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="font-semibold text-gray-800 dark:text-dark-text-primary">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span className="font-semibold text-gray-800 dark:text-dark-text-primary">March 2024</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border-primary space-y-2">
              <button className="w-full text-left text-green-600 dark:text-dark-matcha-600 hover:text-green-700 dark:hover:text-dark-matcha-700 font-semibold transition-colors duration-200">
                Terms of Service
              </button>
              <button className="w-full text-left text-green-600 dark:text-dark-matcha-600 hover:text-green-700 dark:hover:text-dark-matcha-700 font-semibold transition-colors duration-200">
                Contact Support
              </button>
              <button className="w-full text-left text-green-600 dark:text-dark-matcha-600 hover:text-green-700 dark:hover:text-dark-matcha-700 font-semibold transition-colors duration-200">
                Rate MatchaMap
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl shadow-md border-2 border-red-200 dark:border-red-800/30 p-6 transition-colors duration-300">
            <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-4">Danger Zone</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-white dark:bg-dark-bg-elevated border-2 border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-200 font-semibold flex items-center justify-center gap-2">
                <LogOut size={18} />
                Sign Out
              </button>
              <button className="w-full px-4 py-3 bg-white dark:bg-dark-bg-elevated border-2 border-red-300 dark:border-red-700/40 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-200 font-semibold">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </ContentContainer>
    </div>
  )
}

export default SettingsPage
