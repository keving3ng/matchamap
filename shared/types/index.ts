/**
 * Shared TypeScript types for MatchaMap
 *
 * These types are used across both frontend and backend to ensure
 * type safety and consistency in the API contract.
 */

// ============================================================================
// DRINK TYPES
// ============================================================================

export interface Drink {
  id: number
  cafeId: number
  name?: string | null // Display name - defaults to "Iced Matcha Latte" if not provided
  score: number // Individual drink score (0-10) - REQUIRED
  priceAmount?: number | null // Price in cents - optional
  priceCurrency?: string | null // Currency code (CAD, USD, JPY) - optional
  gramsUsed?: number | null // Grams of matcha powder used
  isDefault: boolean // The primary drink reviewed/recommended
  notes?: string | null // Specific notes about this drink
  createdAt?: string
  updatedAt?: string
}

// ============================================================================
// CAFE TYPES
// ============================================================================

export interface Cafe {
  // Core identification
  id: number
  name: string
  slug: string

  // Location
  latitude: number
  longitude: number
  link: string // Google Maps link
  address?: string | null
  city: string // toronto, montreal, tokyo (for filtering/navigation only)

  // Ratings
  ambianceScore?: number | null // Cafe ambiance rating (0-10)
  displayScore?: number | null // Calculated from drinks (default OR highest)
  userRatingAvg?: number | null // Aggregated user rating average (0-10 scale)
  userRatingCount?: number // Count of user reviews

  // Menu & Pricing
  drinks?: Drink[] // All drink offerings
  chargeForAltMilk?: number | null // Price charged for alt milk (null if free, 0 if free explicitly)

  // Reviews & Description
  quickNote: string // Short tagline/summary - REQUIRED
  review?: string | null // Full review text
  source?: string | null // Source of cafe info (e.g., "Google", "Instagram", "Friend recommendation")
  reviewSnippets?: ReviewSnippet[] // Search result snippets (only when search is performed)

  // Contact & Social
  instagram?: string | null
  instagramPostLink?: string | null
  tiktokPostLink?: string | null
  hours?: string | null // JSON object from Google Maps API
  images?: string | null // Link/URL to images

  // Metadata
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface CafeWithDistance extends Cafe {
  distanceInfo?: {
    kilometers: number
    miles: number
    formattedKm: string
    formattedMiles: string
    walkTime: string
  } | null
}

// ============================================================================
// CITY TYPES
// ============================================================================

/**
 * Valid city keys that can be stored in the database
 * These must match the keys in the frontend CITIES constant
 *
 * To add a new city:
 * 1. Add the key here
 * 2. Add city details to frontend/src/stores/cityStore.ts CITIES constant
 * 3. Deploy and admin UI will automatically include the new city
 */
export const VALID_CITY_KEYS = [
  'toronto',
  'montreal',
  'new york',
  'mississauga',
  'scarborough',
  'tokyo',
  'kyoto',
  'osaka',
] as const

export type CityKey = typeof VALID_CITY_KEYS[number]

export interface CityWithCount {
  city: string
  cafe_count: number
}


// ============================================================================
// EVENT TYPES
// ============================================================================

export interface Event {
  id: number
  title: string
  date: string // ISO date format
  time: string
  location: string
  venue: string
  description: string
  link?: string | null // Instagram handle or post link
  price?: string | null
  featured: boolean
  published: boolean
  cafeId?: number | null // Optional reference to cafe
  createdAt?: string
  updatedAt?: string
}

// ============================================================================
// USER/AUTH TYPES
// ============================================================================

export type UserRole = 'admin' | 'user'

export interface User {
  id: number
  email: string
  username: string
  role: UserRole
  lastActiveAt?: string | null
  isEmailVerified?: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  role?: UserRole
}

export interface RegisterResponse {
  message: string
  user: User
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
}

export interface AuthError {
  error: string
}

// User Profile Types
export interface UserProfilePreferences {
  favoriteStyle?: 'hot' | 'iced' | 'blended'
  dietaryRestrictions?: string[]
}

export interface UserProfilePrivacySettings {
  isPublic: boolean
  showActivity: boolean
  showFollowers: boolean
}

export interface UserProfile {
  id: number
  userId: number
  displayName?: string | null
  bio?: string | null
  avatarUrl?: string | null
  location?: string | null
  instagram?: string | null
  tiktok?: string | null
  website?: string | null
  preferences?: UserProfilePreferences | null
  isPublic: boolean
  showActivity: boolean
  
  // Stats (denormalized for performance)
  totalReviews: number
  totalCheckins: number
  totalPhotos: number
  totalFavorites: number
  passportCompletion: number // 0-100 percentage
  reputationScore: number
  
  // Social stats (Phase 2D)
  followerCount: number
  followingCount: number
  
  // Privacy settings (JSON)
  privacySettings: UserProfilePrivacySettings
  
  createdAt: string
  updatedAt: string
}

export interface UserProfileStats {
  totalReviews: number
  totalCheckins: number
  totalPhotos: number
  totalFavorites: number
  passportCompletion: number // 0-100 percentage
  reputationScore: number
  followerCount: number
  followingCount: number
}

export interface PublicUserProfile {
  user: {
    id: number
    username: string
    displayName?: string | null
    bio?: string | null
    avatarUrl?: string | null
    location?: string | null
    joinedAt: string
    stats: UserProfileStats
    badges?: UserBadge[]
    social?: {
      instagram?: string | null
      tiktok?: string | null
      website?: string | null
    }
    // Privacy settings (for respecting visibility)
    showActivity?: boolean
  }
}

export interface UpdateProfileRequest {
  displayName?: string | null
  bio?: string | null
  location?: string | null
  instagram?: string | null
  tiktok?: string | null
  website?: string | null
  preferences?: UserProfilePreferences
  privacy?: Partial<UserProfilePrivacySettings>
}

export interface UpdatePrivacySettingsRequest {
  isPublic?: boolean
  showActivity?: boolean
  showFollowers?: boolean
}

export interface UserBadge {
  type: string
  name: string
  description: string
  iconUrl?: string
  earnedAt: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// USER REVIEW TYPES (Phase 2A)
// ============================================================================

// Review moderation status constants
export const REVIEW_MODERATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FLAGGED: 'flagged'
} as const

export type ReviewModerationStatus = typeof REVIEW_MODERATION_STATUS[keyof typeof REVIEW_MODERATION_STATUS]

// Photo moderation status constants (subset of review statuses)
export const PHOTO_MODERATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const

export type PhotoModerationStatus = typeof PHOTO_MODERATION_STATUS[keyof typeof PHOTO_MODERATION_STATUS]

export interface UserReview {
  id: number
  userId: number
  cafeId: number

  // Ratings (0-10 scale, matching expert system)
  overallRating: number
  matchaQualityRating?: number
  ambianceRating?: number
  serviceRating?: number
  valueRating?: number

  // Content
  title?: string
  content: string
  tags?: string[] // Parsed from JSON

  // Metadata
  visitDate?: string
  isPublic: boolean
  isFeatured: boolean

  // Moderation
  moderationStatus: ReviewModerationStatus
  moderationNotes?: string
  moderatedBy?: number
  moderatedAt?: string

  // Engagement
  helpfulCount: number
  flagCount: number

  // Timestamps
  createdAt: string
  updatedAt: string

  // Relations (populated by backend)
  user?: PublicUserProfile
  photos?: ReviewPhoto[]
}

// Review snippet for search results (truncated review data)
export interface ReviewSnippet {
  id: number
  content: string
  tags: string[] | null
  overallRating: number
  createdAt: string
}

export interface ReviewPhoto {
  id: number
  reviewId: number
  userId: number
  cafeId: number

  // R2 storage
  imageKey: string
  imageUrl: string
  thumbnailUrl?: string

  // Metadata
  caption?: string
  drinkType?: string
  width?: number
  height?: number
  fileSize?: number
  username?: string // Populated by backend when fetching photos

  // Moderation
  moderationStatus: PhotoModerationStatus
  moderatedBy?: number
  moderatedAt?: string

  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface ReviewHelpful {
  id: number
  reviewId: number
  userId: number
  createdAt: string
}

// ============================================================================
// REVIEW COMMENT TYPES (Phase 2F)
// ============================================================================

export interface ReviewComment {
  id: number
  reviewId: number
  userId: number
  parentCommentId?: number | null
  
  // Content
  content: string
  
  // Engagement
  likeCount: number
  
  // Moderation
  moderationStatus: ReviewModerationStatus
  moderatedBy?: number
  moderatedAt?: string
  moderationNotes?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Relations (populated by backend)
  user?: {
    id: number
    username: string
    displayName?: string | null
    avatarUrl?: string | null
  }
  replies?: ReviewComment[] // For nested display
}

export interface ReviewCommentLike {
  id: number
  commentId: number
  userId: number
  createdAt: string
}

// ============================================================================
// USER FAVORITES TYPES (Phase 2A - Foundation)
// ============================================================================

export interface UserFavorite {
  id: number
  userId: number
  cafeId: number
  notes?: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  
  // Populated by JOIN in API responses
  cafe?: Cafe
}

export interface AddFavoriteRequest {
  cafeId: number
  notes?: string
}

export interface UpdateFavoriteNotesRequest {
  notes?: string
}

export interface FavoritesResponse {
  favorites: UserFavorite[]
}

// ============================================================================
// WAITLIST TYPES
// ============================================================================

export interface Waitlist {
  id: number
  email: string
  referralSource?: string | null
  converted: boolean
  userId?: number | null
  isFlaggedFraud: boolean
  fraudScore: number
  fraudReason?: string | null
  signupIp?: string | null
  createdAt: string
  convertedAt?: string | null
}

export interface WaitlistAnalytics {
  totalSignups: number
  dailySignups: number
  weeklySignups: number
  conversionRate: number
  suspectedFraud: number
}

export interface WaitlistResponse {
  waitlist: Waitlist[]
  total: number
  hasMore: boolean
  analytics: WaitlistAnalytics
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export type CafeStat = 'view' | 'directions' | 'passport' | 'instagram' | 'tiktok'

export interface CafeStats {
  cafeId: number
  views: number
  directions: number
  passportMarks: number
  instagramClicks: number
  tiktokClicks: number
  updatedAt: string
}

export interface CheckInRequest {
  cafeId: number
  notes?: string
}

export interface CheckInResponse {
  success: boolean
}

// ============================================================================
// BADGE TYPES
// ============================================================================

export type BadgeCategory = 'passport' | 'reviews' | 'photos' | 'special'

export interface BadgeDefinition {
  key: string
  category: BadgeCategory
  name: string
  description: string
  icon: string // Emoji or icon identifier
  threshold?: number // For progress-based badges
  isSpecial?: boolean // For special/unique badges
}

export interface UserBadge {
  id: number
  userId: number
  badgeKey: string
  badgeCategory: BadgeCategory
  earnedAt: string
  progressValue?: number | null
  createdAt: string
  definition?: BadgeDefinition // Enriched on API responses
}

export interface BadgeProgress {
  badge: BadgeDefinition
  currentValue: number
  targetValue: number
  progress: number // 0-1
  isEligible: boolean
}

export interface BadgesResponse {
  badges: UserBadge[]
}

export interface BadgeCheckResponse {
  newBadges: UserBadge[]
  totalEarned: number
}

export interface BadgeProgressResponse {
  progress: BadgeProgress[]
}

export interface BadgeDefinitionsResponse {
  allBadges: BadgeDefinition[]
  byCategory: Record<BadgeCategory, BadgeDefinition[]>
}

// ============================================================================
// FOLLOWING SYSTEM TYPES (Phase 2D)
// ============================================================================

export interface FollowUser {
  id: number
  username: string
  displayName: string
  avatarUrl?: string | null
  followedAt: string
}

export interface FollowersResponse {
  followers: FollowUser[]
  total: number
}

export interface FollowingResponse {
  following: FollowUser[]
  total: number
}

export interface FollowStatusResponse {
  isFollowing: boolean
  canFollow: boolean
}

export interface FollowActionResponse {
  success: boolean
  message: string
}

// ============================================================================
// CAFE SUGGESTION TYPES
// ============================================================================

export interface CafeSuggestion {
  id: number
  userId: number
  name: string
  address: string
  city: string
  neighborhood?: string | null
  description?: string | null
  googleMapsUrl?: string | null
  instagram?: string | null
  website?: string | null
  status: 'pending' | 'approved' | 'rejected'
  cafeId?: number | null
  adminNotes?: string | null
  moderatedBy?: number | null
  moderatedAt?: string | null
  createdAt: string
  updatedAt: string
  user?: {
    username: string
    email: string
  }
}

export interface CreateSuggestionRequest {
  name: string
  address: string
  city: string
  neighborhood?: string
  description?: string
  googleMapsUrl?: string
  instagram?: string
  website?: string
}

export interface SuggestionsResponse {
  suggestions: CafeSuggestion[]
}

export interface ApproveSuggestionRequest {
  adminNotes?: string
  cafeId?: number
}

export interface RejectSuggestionRequest {
  adminNotes?: string
}

// ============================================================================
// USER LISTS TYPES (Phase 2E)
// ============================================================================

export interface UserList {
  id: number
  userId: number
  name: string
  description?: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string

  // Populated by backend
  itemCount?: number
  items?: UserListItem[]
  user?: PublicUserProfile
}

export interface UserListItem {
  id: number
  listId: number
  cafeId: number
  notes?: string | null
  createdAt: string

  // Populated by backend
  cafe?: Cafe
}

export interface CreateListRequest {
  name: string
  description?: string
  isPublic?: boolean
}

export interface UpdateListRequest {
  name?: string
  description?: string
  isPublic?: boolean
}

export interface AddListItemRequest {
  cafeId: number
  notes?: string
}

export interface ListsResponse {
  lists: UserList[]
  total: number
}

export interface ListDetailResponse {
  list: UserList
  items: (UserListItem & { cafe: Cafe })[]
}

// ============================================================================
// NOTIFICATION TYPES (Phase 2F)
// ============================================================================

export interface Notification {
  id: number
  type: 'follower' | 'comment' | 'helpful' | 'badge' | 'comment_like'
  message: string
  resourceType?: 'review' | 'comment' | 'badge' | 'user'
  resourceId?: number
  isRead: boolean
  createdAt: string
  actorId?: number
  actorUsername?: string
  actorDisplayName?: string
  actorAvatarUrl?: string
}

export interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
  hasMore: boolean
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface CafeFormData extends Omit<Cafe, 'id' | 'createdAt' | 'updatedAt' | 'displayScore' | 'drinks' | 'userRatingAvg' | 'userRatingCount'> {
  id?: number
}


export interface EventFormData extends Omit<Event, 'id' | 'createdAt' | 'updatedAt'> {
  id?: number
}

// ============================================================================
// ADMIN ANALYTICS TYPES
// ============================================================================

/**
 * Cafe performance statistics for admin analytics dashboard
 * Combines anonymous metrics (cafe_stats) and authenticated check-ins
 */
export interface CafeStats {
  id: number
  name: string
  city: string
  neighborhood: string
  slug: string
  views: number
  directions_clicks: number
  anonymous_passport_marks: number
  instagram_clicks: number
  tiktok_clicks: number
  authenticated_checkins: number
}

/**
 * User activity summary for admin analytics dashboard
 * Aggregated metrics about user engagement
 */
export interface UserActivitySummary {
  total_users: number
  active_users_7d: number
  active_users_30d: number
  total_checkins: number
  repeat_visitors: number
}

/**
 * Feed engagement statistics for admin analytics dashboard
 */
export interface FeedStats {
  id: number
  title: string
  type: string
  clicks: number
  published_at: string | null
}

/**
 * Event engagement statistics for admin analytics dashboard
 */
export interface EventStats {
  id: number
  name: string
  date: string
  clicks: number
  featured: boolean
}

/**
 * API response types for admin analytics endpoints
 */
export interface AdminCafeStatsResponse {
  stats: CafeStats[]
}

export interface AdminUserActivityResponse {
  total_users: number
  active_users_7d: number
  active_users_30d: number
  total_checkins: number
  repeat_visitors: number
}

export interface AdminFeedStatsResponse {
  stats: FeedStats[]
}

export interface AdminEventStatsResponse {
  stats: EventStats[]
}

// ============================================================================
// RECOMMENDATION TYPES
// ============================================================================

export interface RecommendationScore {
  cafeId: number
  score: number
  reasons: string[]
  components: {
    similar: number
    collaborative: number
    preferences: number
    proximity: number
    trending: number
  }
}

export interface UserLocation {
  latitude: number
  longitude: number
}
