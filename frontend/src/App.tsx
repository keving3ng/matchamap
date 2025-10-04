import React, { useState } from 'react'
import Header from './components/Header'
import BottomNavigation from './components/BottomNavigation'
import AppRoutes from './components/AppRoutes'
import ComingSoon from './components/ComingSoon'
import { useAppFeatures } from './hooks/useAppFeatures'

const SESSION_KEY = 'matchamap_unlocked'

export const App: React.FC = () => {
  const { showComingSoon } = useAppFeatures()
  const [hasEnteredPassword, setHasEnteredPassword] = useState(() => {
    // Check sessionStorage on mount
    return sessionStorage.getItem(SESSION_KEY) === 'true'
  })

  const handlePasswordCorrect = () => {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setHasEnteredPassword(true)
  }

  if (showComingSoon && !hasEnteredPassword) {
    return <ComingSoon onPasswordCorrect={handlePasswordCorrect} />
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">
      <Header />
      <AppRoutes />
      <BottomNavigation />
    </div>
  )
}

export default App