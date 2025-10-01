import { create } from 'zustand'
import featureConfig from '../config/features.yaml'

type Environment = 'dev' | 'prod'
type FeatureKey = keyof typeof featureConfig

interface FeatureStore {
  isPassportEnabled: boolean
  isEventsEnabled: boolean
  isMenuEnabled: boolean
  isCitySelectorEnabled: boolean
  isUserAccountsEnabled: boolean
  showComingSoon: boolean
}

/**
 * Determines the current environment based on Vite's mode
 */
const getEnvironment = (): Environment => {
  return import.meta.env.MODE === 'production' ? 'prod' : 'dev'
}

/**
 * Gets the value of a feature flag from config
 */
const getFeatureValue = (featureName: FeatureKey): boolean => {
  const env = getEnvironment()
  const feature = featureConfig[featureName]

  if (!feature) {
    console.warn(`Feature "${featureName}" not found in feature config`)
    return false
  }

  return feature[env] ?? false
}

/**
 * Store for feature flags
 * Replaces FeatureContext - no provider needed, just import and use
 *
 * Note: This store provides the base config values.
 * For runtime overrides, use useFeatureToggle hook which checks adminStore
 */
export const useFeatureStore = create<FeatureStore>(() => ({
  isPassportEnabled: getFeatureValue('ENABLE_PASSPORT'),
  isEventsEnabled: getFeatureValue('ENABLE_EVENTS'),
  isMenuEnabled: getFeatureValue('ENABLE_MENU'),
  isCitySelectorEnabled: getFeatureValue('ENABLE_CITY_SELECTOR'),
  isUserAccountsEnabled: getFeatureValue('ENABLE_USER_ACCOUNTS'),
  showComingSoon: getFeatureValue('SHOW_COMING_SOON'),
}))
