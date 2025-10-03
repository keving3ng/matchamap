import React, { useState } from 'react'
import Header from './components/Header'
import BottomNavigation from './components/BottomNavigation'
import AppRoutes from './components/AppRoutes'
import ComingSoon from './components/ComingSoon'
import { useFeatureStore } from './stores/featureStore'

export const App: React.FC = () => {
  const { showComingSoon } = useFeatureStore()
  const [hasEnteredPassword, setHasEnteredPassword] = useState(false)

  if (showComingSoon && !hasEnteredPassword) {
    return <ComingSoon onPasswordCorrect={() => setHasEnteredPassword(true)} />
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