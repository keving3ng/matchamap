import { useFeatureToggle } from './useFeatureToggle'

/**
 * Centralized hook for all app-level feature toggles
 * Abstracts away individual useFeatureToggle calls to keep components clean
 * Supports admin runtime overrides via useFeatureToggle
 */
export const useAppFeatures = () => {
  const isPassportEnabled = useFeatureToggle('ENABLE_PASSPORT')
  const isEventsEnabled = useFeatureToggle('ENABLE_EVENTS')
  const isMenuEnabled = useFeatureToggle('ENABLE_MENU')
  const isCitySelectorEnabled = useFeatureToggle('ENABLE_CITY_SELECTOR')
  const isUserAccountsEnabled = useFeatureToggle('ENABLE_USER_ACCOUNTS')
  const showComingSoon = useFeatureToggle('SHOW_COMING_SOON')

  return {
    isPassportEnabled,
    isEventsEnabled,
    isMenuEnabled,
    isCitySelectorEnabled,
    isUserAccountsEnabled,
    showComingSoon,
  }
}
