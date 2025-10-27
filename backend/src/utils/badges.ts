/**
 * Badge definitions and achievement logic for MatchaMap
 * Handles badge checking, earning, and management
 */

// Badge categories
export const BADGE_CATEGORIES = {
  PASSPORT: 'passport',
  REVIEWS: 'reviews', 
  PHOTOS: 'photos',
  SPECIAL: 'special',
} as const;

export type BadgeCategory = typeof BADGE_CATEGORIES[keyof typeof BADGE_CATEGORIES];

// Badge definition interface
export interface BadgeDefinition {
  key: string;
  category: BadgeCategory;
  name: string;
  description: string;
  icon: string; // Emoji or icon identifier
  threshold?: number; // For progress-based badges
  isSpecial?: boolean; // For special/unique badges
}

// All badge definitions
export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  // Passport badges (cafe visits)
  passport_5: {
    key: 'passport_5',
    category: BADGE_CATEGORIES.PASSPORT,
    name: 'Explorer',
    description: 'Visited 5 cafes',
    icon: '🗺️',
    threshold: 5,
  },
  passport_10: {
    key: 'passport_10',
    category: BADGE_CATEGORIES.PASSPORT,
    name: 'Adventurer',
    description: 'Visited 10 cafes',
    icon: '🧭',
    threshold: 10,
  },
  passport_25: {
    key: 'passport_25',
    category: BADGE_CATEGORIES.PASSPORT,
    name: 'Neighborhood Expert',
    description: 'Visited 25 cafes',
    icon: '🏙️',
    threshold: 25,
  },
  passport_50: {
    key: 'passport_50',
    category: BADGE_CATEGORIES.PASSPORT,
    name: 'City Explorer',
    description: 'Visited 50 cafes',
    icon: '🌃',
    threshold: 50,
  },
  passport_100: {
    key: 'passport_100',
    category: BADGE_CATEGORIES.PASSPORT,
    name: 'Matcha Master',
    description: 'Visited 100 cafes',
    icon: '👑',
    threshold: 100,
  },

  // Review badges
  reviews_10: {
    key: 'reviews_10',
    category: BADGE_CATEGORIES.REVIEWS,
    name: 'Reviewer',
    description: 'Written 10 reviews',
    icon: '✍️',
    threshold: 10,
  },
  reviews_25: {
    key: 'reviews_25',
    category: BADGE_CATEGORIES.REVIEWS,
    name: 'Critic',
    description: 'Written 25 reviews',
    icon: '📝',
    threshold: 25,
  },
  reviews_50: {
    key: 'reviews_50',
    category: BADGE_CATEGORIES.REVIEWS,
    name: 'Expert Reviewer',
    description: 'Written 50 reviews',
    icon: '📚',
    threshold: 50,
  },
  reviews_100: {
    key: 'reviews_100',
    category: BADGE_CATEGORIES.REVIEWS,
    name: 'Review Master',
    description: 'Written 100 reviews',
    icon: '📖',
    threshold: 100,
  },

  // Photo badges
  photos_10: {
    key: 'photos_10',
    category: BADGE_CATEGORIES.PHOTOS,
    name: 'Photographer',
    description: 'Uploaded 10 photos',
    icon: '📸',
    threshold: 10,
  },
  photos_50: {
    key: 'photos_50',
    category: BADGE_CATEGORIES.PHOTOS,
    name: 'Visual Storyteller',
    description: 'Uploaded 50 photos',
    icon: '📷',
    threshold: 50,
  },
  photos_100: {
    key: 'photos_100',
    category: BADGE_CATEGORIES.PHOTOS,
    name: 'Photo Master',
    description: 'Uploaded 100 photos',
    icon: '🎨',
    threshold: 100,
  },

  // Special badges
  early_adopter: {
    key: 'early_adopter',
    category: BADGE_CATEGORIES.SPECIAL,
    name: 'Early Adopter',
    description: 'Joined during the beta phase',
    icon: '🚀',
    isSpecial: true,
  },
};

// User stats interface for badge checking
export interface UserStats {
  totalCheckins: number;
  totalReviews: number;
  totalPhotos: number;
  registrationDate: string;
}

// Check which badges a user should earn based on their stats
export function checkEligibleBadges(userStats: UserStats): BadgeDefinition[] {
  const eligibleBadges: BadgeDefinition[] = [];

  // Check passport badges
  for (const [key, badge] of Object.entries(BADGE_DEFINITIONS)) {
    if (badge.category === BADGE_CATEGORIES.PASSPORT && badge.threshold) {
      if (userStats.totalCheckins >= badge.threshold) {
        eligibleBadges.push(badge);
      }
    }
  }

  // Check review badges
  for (const [key, badge] of Object.entries(BADGE_DEFINITIONS)) {
    if (badge.category === BADGE_CATEGORIES.REVIEWS && badge.threshold) {
      if (userStats.totalReviews >= badge.threshold) {
        eligibleBadges.push(badge);
      }
    }
  }

  // Check photo badges
  for (const [key, badge] of Object.entries(BADGE_DEFINITIONS)) {
    if (badge.category === BADGE_CATEGORIES.PHOTOS && badge.threshold) {
      if (userStats.totalPhotos >= badge.threshold) {
        eligibleBadges.push(badge);
      }
    }
  }

  // Check special badges
  if (BADGE_DEFINITIONS.early_adopter && isEarlyAdopter(userStats.registrationDate)) {
    eligibleBadges.push(BADGE_DEFINITIONS.early_adopter);
  }

  return eligibleBadges;
}

// Helper function to check if user is early adopter
function isEarlyAdopter(registrationDate: string): boolean {
  // Consider users who registered before Dec 1, 2024 as early adopters
  const earlyAdopterCutoff = new Date('2024-12-01');
  const userRegistration = new Date(registrationDate);
  return userRegistration < earlyAdopterCutoff;
}

// Get badge definition by key
export function getBadgeDefinition(badgeKey: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS[badgeKey];
}

// Get all badges in a category
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS).filter(badge => badge.category === category);
}

// Check if a badge is a milestone badge (has threshold)
export function isMilestoneBadge(badge: BadgeDefinition): boolean {
  return badge.threshold !== undefined;
}

// Check if a badge is special (no threshold)
export function isSpecialBadge(badge: BadgeDefinition): boolean {
  return badge.isSpecial === true;
}