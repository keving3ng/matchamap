import React from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'
import { getCurrentEnvironment } from '../hooks/useFeatureToggle'
import { useNavigate } from 'react-router'
import { Settings, AlertTriangle, LogOut, User } from '@/components/icons'
import { COPY } from '../constants/copy'

interface AdminWrapperProps {
  children: React.ReactNode
}

export const ADMIN_BANNER_HEIGHT = 44 // Fixed height in pixels

export const AdminWrapper: React.FC<AdminWrapperProps> = ({ children }) => {
  const { adminModeActive, environment, setEnvironment, setFeatureOverride, featureOverrides } = useAdminStore()
  const { isAuthenticated, user, logout } = useAuthStore()
  const currentEnv = getCurrentEnvironment()
  const navigate = useNavigate()

  // Show banner if in dev mode with admin mode active, or if authenticated as admin
  const showBanner = (currentEnv === 'dev' && adminModeActive) || (isAuthenticated && user?.role === 'admin')


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

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Admin Control Bar - Part of document flow, amber warning color for admin mode */}
      <div
        className={`w-full ${isAuthenticated ? 'bg-amber-600' : isProdMode ? 'bg-red-600' : 'bg-purple-600'} text-white px-4 shadow-lg flex items-center justify-between flex-shrink-0`}
        style={{ 
          height: `${ADMIN_BANNER_HEIGHT}px`,
        }}
      >
        <div className="flex items-center gap-4">
          {/* Authenticated User Info */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-200" />
              <User size={16} />
              <span className="font-semibold text-sm">
                {COPY.admin.mode}
              </span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                {user.username} ({user.role})
              </span>
            </div>
          ) : (
            <>
              {/* Environment Badge (dev mode only) */}
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
            </>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {!isAuthenticated && isProdMode && (
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

          {isAuthenticated && user?.role === 'admin' && (
            <>
              <button
                onClick={handleGoToAdmin}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition flex items-center gap-1"
              >
                <Settings size={14} />
                Admin Panel
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition flex items-center gap-1"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          )}

          {!isAuthenticated && (
            <button
              onClick={handleGoToAdmin}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition flex items-center gap-1"
            >
              <Settings size={14} />
              Admin Panel
            </button>
          )}
        </div>
      </div>

      {/* App Content - Takes remaining space */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
}

export default AdminWrapper
