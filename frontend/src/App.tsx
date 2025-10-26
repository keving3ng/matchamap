import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import BottomNavigation from './components/BottomNavigation'
import AppRoutes from './components/AppRoutes'
import ComingSoon from './components/ComingSoon'
import { SessionExpiredDialog } from './components/SessionExpiredDialog'
import { useAppFeatures } from './hooks/useAppFeatures'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'

const SESSION_KEY = 'matchamap_unlocked'

export const App: React.FC = () => {
  const { showComingSoon } = useAppFeatures()
  const { getCurrentUser, user, isAuthenticated } = useAuthStore()
  const { initialize: initializeTheme } = useThemeStore()
  const [hasEnteredPassword, setHasEnteredPassword] = useState(() => {
    // Check sessionStorage on mount
    return sessionStorage.getItem(SESSION_KEY) === 'true'
  })

  // Restore authentication session and initialize theme on app load
  useEffect(() => {
    // Initialize theme system
    initializeTheme()
    
    // Try to restore session from cookie
    getCurrentUser().catch(() => {
      // Silently fail - user is just not logged in
    })
  }, [initializeTheme])

  const handlePasswordCorrect = () => {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setHasEnteredPassword(true)
  }

  // Admin users bypass cover page
  const isAdmin = isAuthenticated && user?.role === 'admin'
  
  if (showComingSoon && !hasEnteredPassword && !isAdmin) {
    return <ComingSoon onPasswordCorrect={handlePasswordCorrect} />
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 dark:from-dark-bg-primary dark:to-dark-bg-secondary flex flex-col transition-colors duration-300">
      <Header />
      <AppRoutes />
      <BottomNavigation />
      <SessionExpiredDialog />
    </div>
  )
}

export default App