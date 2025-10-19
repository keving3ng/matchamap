import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import BottomNavigation from './components/BottomNavigation'
import AppRoutes from './components/AppRoutes'
import ComingSoon from './components/ComingSoon'
import { SessionExpiredDialog } from './components/SessionExpiredDialog'
import { useAppFeatures } from './hooks/useAppFeatures'
import { useAuthStore } from './stores/authStore'

const SESSION_KEY = 'matchamap_unlocked'

export const App: React.FC = () => {
  const { showComingSoon } = useAppFeatures()
  const { getCurrentUser, user, isAuthenticated } = useAuthStore()
  const [hasEnteredPassword, setHasEnteredPassword] = useState(() => {
    // Check sessionStorage on mount
    return sessionStorage.getItem(SESSION_KEY) === 'true'
  })

  // Restore authentication session on app load
  useEffect(() => {
    // Try to restore session from cookie
    getCurrentUser().catch(() => {
      // Silently fail - user is just not logged in
    })
  }, [])

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
    <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 flex flex-col">
      <Header />
      <AppRoutes />
      <BottomNavigation />
      <SessionExpiredDialog />
    </div>
  )
}

export default App