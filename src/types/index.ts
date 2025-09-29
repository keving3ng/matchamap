export interface Cafe {
  id: number
  name: string
  score: number
  lat: number
  lng: number
  neighborhood: string
  address: string
  distance: string
  walkTime: string
  quickNote: string
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

export interface NewsItem {
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

export interface CafeData {
  cafes: Cafe[]
  news: NewsItem[]
  last_updated: string
}

export type ViewType = 'map' | 'list' | 'detail' | 'news' | 'passport'

// Component Props Types
export interface MapViewProps {
  cafes: Cafe[]
  showPopover: boolean
  selectedCafe: Cafe | null
  onPinClick: (cafe: Cafe) => void
  onViewDetails: (cafe: Cafe) => void
  onClosePopover: () => void
}

export interface ListViewProps {
  cafes: Cafe[]
  expandedCard: number | null
  onToggleExpand: (id: number | null) => void
  onViewDetails: (cafe: Cafe) => void
}

export interface DetailViewProps {
  cafe: Cafe
  visitedLocations: number[]
  onToggleVisited: (id: number) => void
}

export interface NewsViewProps {
  newsItems: NewsItem[]
}

export interface PassportViewProps {
  cafes: Cafe[]
  visitedStamps: number[]
  onToggleStamp: (id: number) => void
}