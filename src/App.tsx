import React from 'react'
import Header from './components/Header'
import BottomNavigation from './components/BottomNavigation'
import AppRoutes from './components/AppRoutes'
import ComingSoon from './components/ComingSoon'
import { useAuthStore } from './stores/authStore'
import { useFeatureStore } from './stores/featureStore'

export const App: React.FC = () => {
  const { showComingSoon } = useFeatureStore()
  const { isAuthenticated, authenticate } = useAuthStore()

  if (showComingSoon && !isAuthenticated) {
    return <ComingSoon onPasswordCorrect={authenticate} />
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