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
  name?: string | null // Display name - defaults to "Iced Matcha Latte" if not provided
  score: number // Individual drink score (0-10) - REQUIRED
  priceAmount?: number | null // Price amount - optional
  priceCurrency?: string | null // Currency code (CAD, USD, JPY) - optional
  gramsUsed?: number | null // Grams of matcha powder used
  isDefault: boolean // The primary drink reviewed/recommended
  notes?: string | null // Specific notes about this drink
  createdAt?: string
  updatedAt?: string
}

export interface ReviewSnippet {
  id: number
  content: string
  tags: string[] | null
  overallRating: number
  createdAt: string
}

export interface Cafe {
  // Core identification
  id: number
  name: string
  slug: string

  // Location
  latitude: number
  longitude: number
  lat?: number // Backwards compatibility with distance calculations
  lng?: number // Backwards compatibility with distance calculations
  link: string // Google Maps link
  address?: string | null
  city: string

  // Ratings
  ambianceScore?: number | null // Cafe ambiance rating (0-10)
  displayScore?: number | null // Calculated from drinks (default OR highest)
  userRatingAvg?: number | null // Average user rating (0-10) - aggregated from reviews
  userRatingCount?: number // Number of user reviews

  // Menu & Pricing
  drinks?: DrinkItem[] // All drink offerings
  chargeForAltMilk?: number | null // Price charged for alt milk (null if free)

  // Reviews & Description
  quickNote: string // Short tagline/summary
  review?: string | null // Full review text
  source?: string | null // Source of cafe info
  reviewSnippets?: ReviewSnippet[] // Search result snippets (only when search is performed)

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


export interface EventItem {
  id: number
  title: string
  date: string
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

export interface CafeData {
  cafes: Cafe[]
  events: EventItem[]
  last_updated: string
}

export type ViewType = 'map' | 'list' | 'detail' | 'passport' | 'events'

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


export interface PassportViewProps {
  cafes: Cafe[]
  visitedStamps: number[]
  onToggleStamp: (id: number) => void
}

export interface EventsViewProps {
  eventItems: EventItem[]
}