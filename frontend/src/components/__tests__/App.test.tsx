import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../App'
import { useDataStore } from '../../stores/dataStore'
import { useCafeStore } from '../../stores/cafeStore'
import { useCityStore } from '../../stores/cityStore'
import type { CafeWithDistance } from '../../types'

vi.mock('../../hooks/useAppFeatures', () => ({
  useAppFeatures: () => ({
    showComingSoon: false,
    isPassportEnabled: true,
    isEventsEnabled: true,
    isMenuEnabled: true,
    isCitySelectorEnabled: true,
    isUserAccountsEnabled: false,
  }),
}))

vi.mock('../../stores/authStore', () => {
  const state = {
    isAuthenticated: false,
    user: null,
    getCurrentUser: () => Promise.resolve(undefined),
  }
  return {
    useAuthStore: Object.assign(() => state, { getState: () => state }),
  }
})

const sampleCafe: CafeWithDistance = {
  id: 1,
  name: 'Queen West Matcha',
  slug: 'queen-west-matcha',
  latitude: 43.6532,
  longitude: -79.3832,
  lat: 43.6532,
  lng: -79.3832,
  link: 'https://maps.google.com',
  address: '123 Queen St W',
  city: 'toronto',
  displayScore: 9.1,
  quickNote: 'Ceremonial grade whisked to order',
  distanceInfo: null,
}

describe('App public route smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCityStore.setState({
      selectedCity: 'toronto',
      availableCities: ['toronto'],
      availableCitiesLoaded: true,
    })
    useDataStore.setState({
      allCafes: [sampleCafe],
      cafesFetched: true,
      cafeLoading: false,
      cafeCity: 'toronto',
      cafeStatus: 'fresh',
      cafeSource: 'network',
      cafesObservedAt: Date.now(),
      fetchCafes: vi.fn().mockResolvedValue(undefined),
      fetchEvents: vi.fn().mockResolvedValue(undefined),
    })
    useCafeStore.setState({
      cafesWithDistance: [sampleCafe],
      selectedCafe: null,
    })
  })

  it('renders header, bottom navigation, and /list route with cafes', async () => {
    render(
      <MemoryRouter initialEntries={['/list']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('MatchaMap')).toBeInTheDocument()
    expect(screen.getByText('Map')).toBeInTheDocument()
    expect(screen.getByText('List')).toBeInTheDocument()
    expect(await screen.findByText('Queen West Matcha')).toBeInTheDocument()
  })

  it('renders cafe detail route /tor/queen-west-matcha', async () => {
    render(
      <MemoryRouter initialEntries={['/tor/queen-west-matcha']}>
        <App />
      </MemoryRouter>
    )

    expect(await screen.findByText('Queen West Matcha')).toBeInTheDocument()
    expect(screen.getByText('123 Queen St W')).toBeInTheDocument()
  })

  it('renders offline & install help route /install', async () => {
    render(
      <MemoryRouter initialEntries={['/install']}>
        <App />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: /Install and offline help/i })).toBeInTheDocument()
  })
})
