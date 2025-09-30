export interface Cafe {
  id: number
  name: string
  score: number
  lat: number
  lng: number
  neighborhood: string
  address: string
  quickNote: string
  city: 'toronto' | 'montreal' | 'tokyo'
  review?: string
  instagram?: string
  tiktok?: string
  hours?: string
  priceRange?: string
  menuHighlights?: string
  secondaryScores?: {
    value: number
    ambiance: number
    otherDrinks: number
  }
  emoji: string
  color: string
}

// Re-export distance types for convenience
export type { DistanceResult, Coordinates } from '../utils/distance'

// Extended cafe with dynamic distance calculation
export interface CafeWithDistance extends Cafe {
  distanceInfo: import('../utils/distance').DistanceResult | null
}

export interface FeedItem {
  id: number
  type: 'new_location' | 'score_update' | 'announcement'
  title: string
  date: string
  preview: string
  score?: number
  previousScore?: number
  neighborhood?: string
  image: string
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
  onLocationChange?: (coordinates: GeolocationCoordinates | null) => void
}

export interface ListViewProps {
  cafes: CafeWithDistance[]
  expandedCard: number | null
  onToggleExpand: (id: number | null) => void
  onViewDetails: (cafe: CafeWithDistance) => void
  onLocationChange?: (coordinates: GeolocationCoordinates | null) => void
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