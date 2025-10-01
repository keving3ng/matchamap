import React, { createContext, useContext, ReactNode } from 'react'
import { useAppFeatures } from '../hooks/useAppFeatures'

interface FeatureContextType {
  isPassportEnabled: boolean
  isEventsEnabled: boolean
  isMenuEnabled: boolean
  isCitySelectorEnabled: boolean
  showComingSoon: boolean
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined)

interface FeatureProviderProps {
  children: ReactNode
}

export const FeatureProvider: React.FC<FeatureProviderProps> = ({ children }) => {
  const features = useAppFeatures()

  return (
    <FeatureContext.Provider value={features}>
      {children}
    </FeatureContext.Provider>
  )
}

/**
 * Hook to access feature flags from anywhere in the app
 * No need to pass feature flags as props anymore
 */
export const useFeatures = () => {
  const context = useContext(FeatureContext)
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider')
  }
  return context
}
