import { useFeatureToggle } from './useFeatureToggle'

/**
 * Centralized hook for all app-level feature toggles
 * Abstracts away individual useFeatureToggle calls to keep App.tsx clean
 */
export const useAppFeatures = () => {
  const isPassportEnabled = useFeatureToggle('ENABLE_PASSPORT')
  const isEventsEnabled = useFeatureToggle('ENABLE_EVENTS')
  const isMenuEnabled = useFeatureToggle('ENABLE_MENU')
  const isCitySelectorEnabled = useFeatureToggle('ENABLE_CITY_SELECTOR')
  const showComingSoon = useFeatureToggle('SHOW_COMING_SOON')

  return {
    isPassportEnabled,
    isEventsEnabled,
    isMenuEnabled,
    isCitySelectorEnabled,
    showComingSoon,
  }
}
