/**
 * Hook to check user-related features with dependency validation
 *
 * User features have dependencies:
 * - All user features require ENABLE_USER_ACCOUNTS to be true
 * - ENABLE_USER_SOCIAL is a master toggle for all social features (check-ins, reviews, photos, following, etc.)
 */

import { useFeatureToggle } from './useFeatureToggle'

export const useUserFeatures = () => {
  const userAccountsEnabled = useFeatureToggle('ENABLE_USER_ACCOUNTS')
  const userProfilesEnabled = useFeatureToggle('ENABLE_USER_PROFILES')
  const userSocialEnabled = useFeatureToggle('ENABLE_USER_SOCIAL')

  // All social features are controlled by a single flag
  const socialFeaturesActive = userAccountsEnabled && userSocialEnabled

  return {
    // User accounts (base requirement)
    isUserAccountsEnabled: userAccountsEnabled,

    // User profiles (requires accounts)
    isUserProfilesEnabled: userAccountsEnabled && userProfilesEnabled,

    // Social features master toggle (requires accounts)
    // Includes: check-ins, reviews, ratings, photos, following, activity feed, badges, leaderboards, favorites, lists
    isUserSocialEnabled: socialFeaturesActive,

    // Individual feature checks (all use the same master toggle)
    isUserCheckinsEnabled: socialFeaturesActive,
    isUserReviewsEnabled: socialFeaturesActive,
    isUserPhotosEnabled: socialFeaturesActive,
    isUserFollowingEnabled: socialFeaturesActive,
    isUserFavoritesEnabled: socialFeaturesActive,
    isUserListsEnabled: socialFeaturesActive,

    // Combined check
    hasAnyUserFeatures: userAccountsEnabled && (userProfilesEnabled || userSocialEnabled),
  }
}
