import React, { useEffect } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { getCurrentEnvironment } from '../hooks/useFeatureToggle'
import { useNavigate } from 'react-router-dom'
import { Settings, AlertTriangle } from 'lucide-react'

interface AdminWrapperProps {
  children: React.ReactNode
}

export const ADMIN_BANNER_HEIGHT = 44 // Fixed height in pixels

export const AdminWrapper: React.FC<AdminWrapperProps> = ({ children }) => {
  const { adminModeActive, environment, setEnvironment, setFeatureOverride, featureOverrides } = useAdminStore()
  const currentEnv = getCurrentEnvironment()
  const navigate = useNavigate()

  const showBanner = currentEnv === 'dev' && adminModeActive

  // Add CSS variable to document root for banner height
  useEffect(() => {
    if (showBanner) {
      document.documentElement.style.setProperty('--admin-banner-height', `${ADMIN_BANNER_HEIGHT}px`)
    } else {
      document.documentElement.style.setProperty('--admin-banner-height', '0px')
    }

    return () => {
      document.documentElement.style.setProperty('--admin-banner-height', '0px')
    }
  }, [showBanner])

  // Only show wrapper in actual dev environment (not simulated prod mode)
  if (!showBanner) {
    return <>{children}</>
  }

  const overrideCount = Object.keys(featureOverrides).length
  const isProdMode = environment === 'prod'

  const handleSwitchToDev = () => {
    setEnvironment('dev')
    setFeatureOverride('ENABLE_ADMIN_PANEL', true)
    setFeatureOverride('ENABLE_MENU', true)
  }

  const handleGoToAdmin = () => {
    // Ensure admin is accessible
    setFeatureOverride('ENABLE_ADMIN_PANEL', true)
    setFeatureOverride('ENABLE_MENU', true)
    navigate('/admin')
  }

  return (
    <>
      {/* Admin Control Bar - Fixed at top with exact height */}
      <div
        className={`fixed top-0 left-0 right-0 w-full ${isProdMode ? 'bg-red-600' : 'bg-purple-600'} text-white px-4 shadow-lg z-[10000] flex items-center justify-between`}
        style={{ height: `${ADMIN_BANNER_HEIGHT}px` }}
      >
        <div className="flex items-center gap-4">
          {/* Environment Badge */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isProdMode ? 'bg-red-300 animate-pulse' : 'bg-purple-300'}`} />
            <span className="font-semibold text-sm uppercase tracking-wide">
              {environment} Mode
            </span>
            {currentEnv !== environment && (
              <span className="text-xs opacity-75">
                (actual: {currentEnv})
              </span>
            )}
          </div>

          {/* Override Count */}
          {overrideCount > 0 && (
            <div className="text-xs bg-white/20 px-2 py-1 rounded">
              {overrideCount} override{overrideCount !== 1 ? 's' : ''} active
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {isProdMode && (
            <>
              <AlertTriangle size={16} className="text-yellow-300" />
              <button
                onClick={handleSwitchToDev}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition"
              >
                Switch to Dev
              </button>
            </>
          )}

          <button
            onClick={handleGoToAdmin}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition flex items-center gap-1"
          >
            <Settings size={14} />
            Admin Panel
          </button>
        </div>
      </div>

      {/* Spacer for fixed bar with exact height */}
      <div style={{ height: `${ADMIN_BANNER_HEIGHT}px` }} />

      {/* App Content */}
      {children}
    </>
  )
}

export default AdminWrapper
