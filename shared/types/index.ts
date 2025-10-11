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

  // Menu & Pricing
  drinks?: Drink[] // All drink offerings
  chargeForAltMilk?: number | null // Price charged for alt milk (null if free, 0 if free explicitly)

  // Reviews & Description
  quickNote: string // Short tagline/summary - REQUIRED
  review?: string | null // Full review text
  source?: string | null // Source of cafe info (e.g., "Google", "Instagram", "Friend recommendation")

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
// FEED/NEWS TYPES
// ============================================================================

export type FeedItemType = 'new_location' | 'score_update' | 'announcement' | 'menu_update' | 'closure'

export interface FeedItem {
  id: number
  type: FeedItemType
  title: string
  date: string // ISO 8601 format for database storage
  preview: string // Short preview text - REQUIRED
  content?: string | null // Full article/announcement content

  // Related cafe (if applicable)
  cafeId?: number | null
  cafeName?: string | null

  // Score updates
  score?: number | null
  previousScore?: number | null

  // Location info
  neighborhood?: string | null

  // Media
  image?: string | null

  // Metadata
  author?: string | null
  tags?: string[] | null // JSON array
  published: boolean // For draft/published states
  createdAt?: string
  updatedAt?: string
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
  totalReviews: number
  totalCheckins: number
  totalPhotos: number
  passportCompletion: number
  reputationScore: number
  createdAt: string
  updatedAt: string
}

export interface UserProfileStats {
  totalReviews: number
  totalCheckins: number
  totalPhotos: number
  passportCompletion: number
  reputationScore: number
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
  privacy?: {
    isPublic?: boolean
    showActivity?: boolean
  }
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

export interface CafeFormData extends Omit<Cafe, 'id' | 'createdAt' | 'updatedAt' | 'displayScore' | 'drinks'> {
  id?: number
}

export interface FeedItemFormData extends Omit<FeedItem, 'id' | 'createdAt' | 'updatedAt'> {
  id?: number
}

export interface EventFormData extends Omit<Event, 'id' | 'createdAt' | 'updatedAt'> {
  id?: number
}
