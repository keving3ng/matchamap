import { useMemo } from 'react'
import featureConfig from '../config/features.yaml';

type Environment = 'dev' | 'prod'
type FeatureKey = keyof typeof featureConfig

/**
 * Determines the current environment based on Vite's mode
 * @returns 'dev' for development, 'prod' for production
 */
const getEnvironment = (): Environment => {
  // Vite uses import.meta.env.MODE
  // 'development' or 'production'
  return import.meta.env.MODE === 'production' ? 'prod' : 'dev'
}

/**
 * Hook to check if a feature is enabled based on the current environment
 * @param featureName - The feature key from features.json
 * @returns boolean indicating if the feature is enabled
 */
export const useFeatureToggle = (featureName: FeatureKey): boolean => {
  const isEnabled = useMemo(() => {
    const env = getEnvironment()
    const feature = featureConfig[featureName]

    if (!feature) {
      console.warn(`Feature "${featureName}" not found in feature config`)
      return false
    }

    return feature[env] ?? false
  }, [featureName])

  return isEnabled
}

/**
 * Utility function to check feature toggle without React hook
 * Useful for non-component contexts
 */
export const isFeatureEnabled = (featureName: FeatureKey): boolean => {
  const env = getEnvironment()
  const feature = featureConfig[featureName]

  if (!feature) {
    console.warn(`Feature "${featureName}" not found in feature config`)
    return false
  }

  return feature[env] ?? false
}

/**
 * Get all enabled features for the current environment
 * Useful for debugging or admin panels
 */
export const getEnabledFeatures = (): FeatureKey[] => {
  const env = getEnvironment()
  return Object.entries(featureConfig)
    .filter(([_, config]) => config[env])
    .map(([key, _]) => key as FeatureKey)
}

/**
 * Get current environment
 */
export const getCurrentEnvironment = (): Environment => {
  return getEnvironment()
}
