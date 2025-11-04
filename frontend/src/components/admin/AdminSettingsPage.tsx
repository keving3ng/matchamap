import React from 'react'
import FeatureTogglesPage from './FeatureTogglesPage'
import { COPY } from '../../constants/copy'

export const AdminSettingsPage: React.FC = () => {
  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Settings Header */}
        <div className="bg-white rounded-lg shadow-xs p-4 md:p-6 mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-green-800 mb-2">
            {COPY.admin.settings}
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Configure system settings and development tools
          </p>
        </div>

        {/* Feature Toggles Section */}
        <FeatureTogglesPage />
      </div>
    </div>
  )
}

export default AdminSettingsPage