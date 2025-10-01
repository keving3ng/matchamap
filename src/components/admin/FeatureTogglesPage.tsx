import React from 'react'
import { useAdminStore } from '../../stores/adminStore'
import { getCurrentEnvironment } from '../../hooks/useFeatureToggle'
import featureConfig from '../../config/features.yaml'
import { RotateCcw, Info, Power } from 'lucide-react'

type FeatureKey = keyof typeof featureConfig

export const FeatureTogglesPage: React.FC = () => {
  const { adminModeActive, featureOverrides, environment, setAdminModeActive, setFeatureOverride, clearFeatureOverride, clearAllOverrides, setEnvironment } = useAdminStore()
  const currentEnv = getCurrentEnvironment()

  const features = Object.keys(featureConfig) as FeatureKey[]

  const getFeatureStatus = (featureName: FeatureKey) => {
    const hasOverride = featureOverrides[featureName] !== undefined
    const overrideValue = featureOverrides[featureName]
    const configValue = featureConfig[featureName][environment]
    const actualEnv = environment || currentEnv

    return {
      hasOverride,
      overrideValue,
      configValue,
      effectiveValue: hasOverride ? overrideValue : configValue,
      actualEnv,
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

  const handleClearOverride = (featureName: FeatureKey) => {
    clearFeatureOverride(featureName)
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
            <div className="mb-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
              <Info size={18} />
              <span>
                <strong>Admin mode is disabled.</strong> Toggle it on to activate the control banner and enable feature overrides.
              </span>
            </div>
          )}

          {adminModeActive && (
            <>
              {/* Environment Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                <label className="font-medium text-gray-700 text-sm sm:text-base">Environment:</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as 'dev' | 'prod')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="dev">Development</option>
                  <option value="prod">Production</option>
                </select>
                <span className="text-xs sm:text-sm text-gray-500">
                  (Actual: {currentEnv})
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
        {adminModeActive && (
          <div className="space-y-3">
            {features.filter(featureName => featureName !== 'ENABLE_ADMIN_PANEL').map((featureName) => {
              const status = getFeatureStatus(featureName)
              const { hasOverride, overrideValue, configValue, effectiveValue } = status
              const isMenu = featureName === 'ENABLE_MENU'
              const isProtected = isMenu
              const isLocked = isMenu && !effectiveValue

              return (
                <div
                key={featureName}
                className={`bg-white rounded-lg shadow-md p-3 md:p-4 transition ${
                  hasOverride ? 'ring-2 ring-orange-400' : ''
                } ${isLocked ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2 flex flex-wrap items-center gap-2 text-sm md:text-base">
                      <span className="break-all">{featureName}</span>
                      {isProtected && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded whitespace-nowrap">
                          Protected
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm">
                      <span className="text-gray-600">
                        Config ({environment}):
                      </span>
                      <span
                        className={`px-2 py-1 rounded inline-block ${
                          configValue
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {configValue ? 'Enabled' : 'Disabled'}
                      </span>

                      {hasOverride && (
                        <>
                          <span className="text-gray-400 hidden sm:inline">→</span>
                          <span className="text-orange-600 font-medium">
                            Override:
                          </span>
                          <span
                            className={`px-2 py-1 rounded inline-block ${
                              overrideValue
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {overrideValue ? 'Enabled' : 'Disabled'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Current Status Indicator */}
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        effectiveValue ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      title={effectiveValue ? 'Active' : 'Inactive'}
                    />

                    {/* Toggle Button */}
                    <button
                      onClick={() => handleToggle(featureName)}
                      disabled={isLocked}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition text-xs sm:text-sm ${
                        isLocked
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : hasOverride
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                      title={isLocked ? 'Cannot disable admin panel' : ''}
                    >
                      {hasOverride ? 'Toggle Override' : 'Add Override'}
                    </button>

                    {/* Clear Override Button */}
                    {hasOverride && !isLocked && (
                      <button
                        onClick={() => handleClearOverride(featureName)}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {isProtected && effectiveValue && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded">
                    <Info size={14} />
                    <span>
                      Menu cannot be disabled (needed to access admin panel)
                    </span>
                  </div>
                )}

                {hasOverride && !isProtected && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded">
                    <Info size={14} />
                    <span>
                      This feature is currently overridden and will be{' '}
                      {overrideValue ? 'enabled' : 'disabled'} regardless of config
                    </span>
                  </div>
                )}
              </div>
              )
            })}
          </div>
        )}

        {/* Info Box */}
        {adminModeActive && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Info size={18} />
              How it works
            </h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Admin mode activates the control banner and override system</li>
              <li>Overrides are saved in localStorage and persist across sessions</li>
              <li>Overrides take precedence over the YAML config file</li>
              <li>Change the environment selector to test different configs</li>
              <li>Clear individual overrides or all at once to restore defaults</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeatureTogglesPage
