import React from 'react'
import { useAdminStore } from '../../stores/adminStore'
import { getCurrentEnvironment } from '../../hooks/useFeatureToggle'
import featureConfig from '../../config/features.yaml'
import { RotateCcw, Info, Power } from '@/components/icons'

type FeatureKey = keyof typeof featureConfig

export const FeatureTogglesPage: React.FC = () => {
  const { adminModeActive, featureOverrides, setAdminModeActive, setFeatureOverride, clearAllOverrides } = useAdminStore()
  const currentEnv = getCurrentEnvironment()

  const features = Object.keys(featureConfig) as FeatureKey[]

  const getFeatureStatus = (featureName: FeatureKey) => {
    const hasOverride = featureOverrides[featureName] !== undefined
    const overrideValue = featureOverrides[featureName]
    const devValue = featureConfig[featureName].dev
    const prodValue = featureConfig[featureName].prod
    const configValue = featureConfig[featureName][currentEnv]

    return {
      hasOverride,
      overrideValue,
      configValue,
      devValue,
      prodValue,
      effectiveValue: hasOverride ? overrideValue : configValue,
    }
  }

  const handleToggle = (featureName: FeatureKey) => {
    const status = getFeatureStatus(featureName)
    if (status.hasOverride) {
      // Toggle the override value
      setFeatureOverride(featureName, !status.overrideValue)
    } else {
      // Create override with opposite of config value
      setFeatureOverride(featureName, !status.configValue)
    }
  }

  const applyEnvironmentSettings = (env: 'dev' | 'prod') => {
    // Clear all overrides first
    clearAllOverrides()

    // Apply all features from the selected environment (including menu)
    features.forEach((featureName) => {
      if (featureName !== 'ENABLE_ADMIN_PANEL') {
        const value = featureConfig[featureName][env]
        setFeatureOverride(featureName, value)
      }
    })
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-green-800 mb-2">Feature Toggles</h1>
              <p className="text-sm md:text-base text-gray-600">
                Override feature toggles for testing. Changes are saved in localStorage.
              </p>
            </div>

            {/* Admin Mode Toggle */}
            <button
              onClick={() => setAdminModeActive(!adminModeActive)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                adminModeActive
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <Power size={20} />
              <span className="hidden sm:inline">{adminModeActive ? 'Admin Mode: ON' : 'Admin Mode: OFF'}</span>
              <span className="sm:hidden">{adminModeActive ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {!adminModeActive && (
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
              <Info size={18} />
              <span>
                <strong>Admin mode is disabled.</strong> Toggle it on to activate the control banner and enable feature overrides.
              </span>
            </div>
          )}

          {adminModeActive && (
            <>
              {/* Environment Override Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                  <label className="font-medium text-gray-700 text-sm sm:text-base whitespace-nowrap">
                    Apply Environment:
                  </label>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => applyEnvironmentSettings('dev')}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm sm:text-base font-medium"
                    >
                      Dev Settings
                    </button>
                    <button
                      onClick={() => applyEnvironmentSettings('prod')}
                      className="flex-1 sm:flex-none px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm sm:text-base font-medium"
                    >
                      Prod Settings
                    </button>
                  </div>
                </div>
                <span className="text-xs sm:text-sm text-gray-500 self-start sm:self-center whitespace-nowrap">
                  Actual env: {currentEnv}
                </span>
              </div>

              {/* Clear All Button */}
              {Object.keys(featureOverrides).length > 0 && (
                <button
                  onClick={clearAllOverrides}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm sm:text-base w-full sm:w-auto"
                >
                  <RotateCcw size={16} />
                  Clear All Overrides ({Object.keys(featureOverrides).length})
                </button>
              )}
            </>
          )}
        </div>

        {/* Feature Toggle List */}
        {adminModeActive && (() => {
          const filteredFeatures = features.filter(featureName => featureName !== 'ENABLE_ADMIN_PANEL')

          // Sort features: ON/ON (dev and prod both enabled) go to bottom
          const sortedFeatures = filteredFeatures.sort((a, b) => {
            const aStatus = getFeatureStatus(a)
            const bStatus = getFeatureStatus(b)

            const aFullyEnabled = aStatus.devValue && aStatus.prodValue
            const bFullyEnabled = bStatus.devValue && bStatus.prodValue

            // If one is fully enabled and the other isn't, sort the non-enabled one first
            if (aFullyEnabled && !bFullyEnabled) return 1
            if (!aFullyEnabled && bFullyEnabled) return -1

            // Otherwise maintain original order
            return 0
          })

          const enabledFeatures = sortedFeatures.filter(f => {
            const status = getFeatureStatus(f)
            return status.devValue && status.prodValue
          })
          const otherFeatures = sortedFeatures.filter(f => {
            const status = getFeatureStatus(f)
            return !(status.devValue && status.prodValue)
          })

          return (
            <div className="space-y-6">
              {/* Other Features Section */}
              {otherFeatures.length > 0 && (
                <div className="space-y-3">
                  {otherFeatures.map((featureName) => {
                    const status = getFeatureStatus(featureName)
                    const { hasOverride, devValue, prodValue, effectiveValue } = status

                    return (
                      <div
                        key={featureName}
                        className={`bg-white rounded-lg shadow-md p-3 md:p-4 transition ${
                          hasOverride ? 'ring-2 ring-orange-400' : ''
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* Feature name and environment values */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 text-sm md:text-base mb-1 break-words">
                              {featureName}
                            </h3>
                            <div className="text-xs sm:text-sm text-gray-600">
                              <span className="font-medium">dev:</span>{' '}
                              <span className={devValue ? 'text-green-600' : 'text-gray-500'}>
                                {devValue ? 'ON' : 'OFF'}
                              </span>
                              <span className="mx-2">|</span>
                              <span className="font-medium">prod:</span>{' '}
                              <span className={prodValue ? 'text-green-600' : 'text-gray-500'}>
                                {prodValue ? 'ON' : 'OFF'}
                              </span>
                            </div>
                          </div>

                          {/* Toggle switch */}
                          <div className="flex items-center gap-3">
                            {hasOverride && (
                              <span className="text-xs text-orange-600 font-medium">Override</span>
                            )}
                            <button
                              onClick={() => handleToggle(featureName)}
                              aria-label={`Toggle ${featureName}`}
                              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                effectiveValue ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                  effectiveValue ? 'translate-x-7' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className={`text-sm font-medium ${effectiveValue ? 'text-green-600' : 'text-gray-500'}`}>
                              {effectiveValue ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Enabled Features Section */}
              {enabledFeatures.length > 0 && (
                <div>
                  <div className="mb-3">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <span>Enabled Features</span>
                      <span className="text-sm text-gray-500 font-normal">({enabledFeatures.length})</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Features enabled in both dev and prod</p>
                  </div>
                  <div className="space-y-3">
                    {enabledFeatures.map((featureName) => {
                      const status = getFeatureStatus(featureName)
                      const { hasOverride, devValue, prodValue, effectiveValue } = status

                      return (
                        <div
                          key={featureName}
                          className={`bg-white rounded-lg shadow-md p-3 md:p-4 transition ${
                            hasOverride ? 'ring-2 ring-orange-400' : ''
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            {/* Feature name and environment values */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-800 text-sm md:text-base mb-1 break-words">
                                {featureName}
                              </h3>
                              <div className="text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">dev:</span>{' '}
                                <span className={devValue ? 'text-green-600' : 'text-gray-500'}>
                                  {devValue ? 'ON' : 'OFF'}
                                </span>
                                <span className="mx-2">|</span>
                                <span className="font-medium">prod:</span>{' '}
                                <span className={prodValue ? 'text-green-600' : 'text-gray-500'}>
                                  {prodValue ? 'ON' : 'OFF'}
                                </span>
                              </div>
                            </div>

                            {/* Toggle switch */}
                            <div className="flex items-center gap-3">
                              {hasOverride && (
                                <span className="text-xs text-orange-600 font-medium">Override</span>
                              )}
                              <button
                                onClick={() => handleToggle(featureName)}
                                aria-label={`Toggle ${featureName}`}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                  effectiveValue ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                    effectiveValue ? 'translate-x-7' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                              <span className={`text-sm font-medium ${effectiveValue ? 'text-green-600' : 'text-gray-500'}`}>
                                {effectiveValue ? 'ON' : 'OFF'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* Info Box */}
        {adminModeActive && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Info size={18} />
              How it works
            </h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Use the banner to enable/disable admin mode</li>
              <li>Each feature shows its dev and prod settings from the YAML config</li>
              <li>Toggle any feature ON/OFF to create an override</li>
              <li>Click "Dev Settings" or "Prod Settings" to apply all settings from that environment (includes menu)</li>
              <li>Overrides are saved in localStorage and persist across sessions</li>
              <li>Orange ring indicates an active override</li>
              <li>Clear all overrides to restore default behavior</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeatureTogglesPage
