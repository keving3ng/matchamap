import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import { DetailView } from '../DetailView'
import { api } from '../../utils/api'
import type { CafeWithDistance, DrinkItem } from '../../types'

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

vi.mock('../../constants/copy', () => ({
  COPY: {
    detail: {
      getDirections: 'Get Directions',
      visited: 'Visited',
      markVisited: 'Mark as Visited',
      drinksMenu: 'Drinks Menu',
      featured: 'Featured',
      matchaAmount: (grams: number) => `${grams}g matcha`,
      cafeDetails: 'Cafe Details',
      ambiance: 'Ambiance',
      alternativeMilk: 'Alternative Milk',
      alternativeMilkUnknown: 'Unknown',
      alternativeMilkFree: 'Free',
      alternativeMilkCharge: (amount: number) => `$${amount.toFixed(2)}`,
      ourReview: 'Our Review',
      hours: 'Hours',
      today: 'Today',
      follow: 'Follow',
      ourReviews: 'Our Reviews',
      seeInstagramReel: 'See Instagram Reel',
      seeTikTokReview: 'See TikTok Review',
    },
    events: { title: 'Events', viewDetails: 'View Details' },
  },
}))

vi.mock('../../hooks/useAppFeatures', () => ({
  useAppFeatures: () => ({ isPassportEnabled: true, isUserAccountsEnabled: true }),
}))

vi.mock('../../utils/api', () => ({
  api: {
    events: { getAll: vi.fn() },
    stats: { trackCafeStat: vi.fn(), trackEventClick: vi.fn() },
  },
}))

vi.mock('../../stores/authStore', () => {
  const mockStore = { user: null }
  return {
    useAuthStore: Object.assign(() => mockStore, { getState: () => mockStore }),
  }
})

vi.mock('../../utils/analytics', () => ({
  trackCafeStat: vi.fn(),
}))

Object.defineProperty(window, 'open', { writable: true, value: vi.fn() })

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>)

const mockCafe: CafeWithDistance = {
  id: 1,
  name: 'Test Matcha Cafe',
  slug: 'test-matcha-cafe',
  latitude: 43.6532,
  longitude: -79.3832,
  lat: 43.6532,
  lng: -79.3832,
  link: 'https://maps.google.com/?q=Test+Matcha+Cafe',
  address: '123 Queen St W, Toronto, ON',
  city: 'Toronto',
  ambianceScore: 8.5,
  displayScore: 9.0,
  userRatingAvg: 8.8,
  userRatingCount: 12,
  chargeForAltMilk: 0.75,
  quickNote: 'A cozy matcha spot downtown',
  review: 'Amazing matcha lattes with perfect foam art. The space is small but cozy.',
  instagram: '@testmatchacafe',
  instagramPostLink: 'https://instagram.com/p/testpost',
  tiktokPostLink: 'https://tiktok.com/@test/video/123',
  hours: 'Mon-Fri: 8:00-18:00; Sat-Sun: 9:00-19:00',
  distanceInfo: {
    kilometers: 0.5,
    formattedKm: '0.5 km',
    walkTime: '6 min',
    miles: 0,
    formattedMiles: '',
  },
  drinks: [
    {
      id: 1,
      cafeId: 1,
      name: 'Signature Matcha Latte',
      score: 9.0,
      priceAmount: 5.5,
      priceCurrency: 'CAD',
      gramsUsed: 3,
      isDefault: true,
      notes: 'Their signature drink with perfect balance',
    },
  ] as DrinkItem[],
}

describe('DetailView', () => {
  const onToggleVisited = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.events.getAll).mockResolvedValue({ events: [] })
  })

  it('renders primary cafe content and directions link', () => {
    renderWithRouter(
      <DetailView cafe={mockCafe} visitedLocations={[]} onToggleVisited={onToggleVisited} />
    )
    expect(screen.getByText(mockCafe.name)).toBeInTheDocument()
    expect(screen.getByText(mockCafe.address!)).toBeInTheDocument()
    const directions = screen.getByText('Get Directions').closest('a')
    expect(directions).toHaveAttribute('href', expect.stringContaining('maps'))
  })

  it('lists drinks menu', () => {
    renderWithRouter(
      <DetailView cafe={mockCafe} visitedLocations={[]} onToggleVisited={onToggleVisited} />
    )
    expect(screen.getByText('Drinks Menu')).toBeInTheDocument()
    expect(screen.getByText('Signature Matcha Latte')).toBeInTheDocument()
  })
})
