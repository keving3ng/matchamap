// Enums for tight type safety
export enum City {
  TORONTO = 'toronto',
  MONTREAL = 'montreal',
  TOKYO = 'tokyo',
}

export enum PriceRange {
  BUDGET = '$',
  MODERATE = '$$',
  EXPENSIVE = '$$$',
}

export enum DrinkType {
  MATCHA_LATTE = 'matcha_latte',
  ICED_MATCHA_LATTE = 'iced_matcha_latte',
  CEREMONIAL_MATCHA = 'ceremonial_matcha',
  MATCHA_ESPRESSO = 'matcha_espresso',
  MATCHA_SOFT_SERVE = 'matcha_soft_serve',
  OTHER = 'other',
}

export interface DrinkItem {
  id: number
  cafeId: number
  name: string // Display name (e.g., "Matcha Latte", "Ceremonial Matcha")
  score: number // Individual drink score (0-10)
  priceAmount: number // Price amount
  priceCurrency: string // Currency code (CAD, USD, JPY)
  gramsUsed?: number | null // Grams of matcha powder used
  isDefault: boolean // The primary drink reviewed/recommended
  notes?: string | null // Specific notes about this drink
  createdAt?: string
  updatedAt?: string
}

export interface Cafe {
  // Core identification
  id: number
  name: string
  slug: string

  // Location
  latitude: number
  longitude: number
  link: string // Google Maps link
  city: string

  // Ratings
  ambianceScore?: number | null // Cafe ambiance rating (0-10)
  displayScore?: number | null // Calculated from drinks (default OR highest)

  // Menu & Pricing
  drinks?: DrinkItem[] // All drink offerings
  chargeForAltMilk?: number | null // Price charged for alt milk (null if free)

  // Reviews & Description
  quickNote: string // Short tagline/summary
  review?: string | null // Full review text
  source?: string | null // Source of cafe info

  // Contact & Info
  instagram?: string | null
  instagramPostLink?: string | null
  tiktokPostLink?: string | null
  hours?: string | null
  images?: string | null

  // Metadata
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

// Re-export distance types for convenience
export type { DistanceResult, Coordinates } from '../utils/distance'

// Extended cafe with dynamic distance calculation
export interface CafeWithDistance extends Cafe {
  distanceInfo: import('../utils/distance').DistanceResult | null
}

export enum FeedItemType {
  NEW_LOCATION = 'new_location',
  SCORE_UPDATE = 'score_update',
  ANNOUNCEMENT = 'announcement',
  MENU_UPDATE = 'menu_update',
  CLOSURE = 'closure',
}

export interface FeedItem {
  id: number
  type: FeedItemType
  title: string
  date: string // ISO 8601 format for database storage
  preview: string // Short preview text
  content?: string // Full article/announcement content

  // Related cafe (if applicable)
  cafeId?: number
  cafeName?: string

  // Score updates
  score?: number
  previousScore?: number

  // Location info
  neighborhood?: string

  // Media
  image?: string

  // Metadata
  author?: string
  tags?: string[]
  published: boolean // For draft/published states
}

export interface EventItem {
  id: number
  title: string
  date: string
  time: string
  location: string
  venue: string
  description: string
  image: string
  price: string
  featured: boolean
  published?: boolean
}

export interface CafeData {
  cafes: Cafe[]
  feed: FeedItem[]
  events: EventItem[]
  last_updated: string
}

export type ViewType = 'map' | 'list' | 'detail' | 'feed' | 'passport' | 'events'

// Component Props Types
export interface MapViewProps {
  cafes: CafeWithDistance[]
  showPopover: boolean
  selectedCafe: CafeWithDistance | null
  onPinClick: (cafe: CafeWithDistance) => void
  onViewDetails: (cafe: CafeWithDistance) => void
  onClosePopover: () => void
}

export interface ListViewProps {
  cafes: CafeWithDistance[]
  expandedCard: number | null
  onToggleExpand: (id: number | null) => void
  onViewDetails: (cafe: CafeWithDistance) => void
}

export interface DetailViewProps {
  cafe: CafeWithDistance
  visitedLocations: number[]
  onToggleVisited: (id: number) => void
}

export interface FeedViewProps {
  feedItems: FeedItem[]
}

export interface PassportViewProps {
  cafes: Cafe[]
  visitedStamps: number[]
  onToggleStamp: (id: number) => void
}

export interface EventsViewProps {
  eventItems: EventItem[]
}