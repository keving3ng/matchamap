import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDataStore } from '../dataStore'
import { api } from '../../utils/api'
import type { Cafe } from '../../types'

vi.mock('../../utils/api', () => ({
  api: {
    cafes: {
      getAll: vi.fn(),
    },
    events: {
      getAll: vi.fn(),
    },
  },
}))

const baseCafe = (overrides: Partial<Cafe> = {}): Cafe => ({
  id: 1,
  name: 'Test Cafe One',
  slug: 'test-cafe-one',
  latitude: 43.6532,
  longitude: -79.3832,
  link: 'https://maps.google.com/?cid=1',
  address: '123 Test St',
  city: 'toronto',
  displayScore: 8.5,
  ambianceScore: 8.0,
  quickNote: 'Great test cafe',
  chargeForAltMilk: 75,
  review: 'Excellent test review',
  source: 'Google',
  instagram: '@testcafe',
  instagramPostLink: 'https://instagram.com/p/test1',
  tiktokPostLink: null,
  hours: '9am-5pm',
  images: 'https://example.com/test1.jpg',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  ...overrides,
})

describe('dataStore', () => {
  beforeEach(() => {
    useDataStore.setState({
      allCafes: [],
      eventItems: [],
      isLoading: false,
      error: null,
      cafesFetched: false,
      eventsFetched: false,
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes empty', () => {
    const { result } = renderHook(() => useDataStore())
    expect(result.current.allCafes).toEqual([])
    expect(result.current.cafesFetched).toBe(false)
  })

  it('fetchCafes loads, maps lat/lng, and respects cache / bust', async () => {
    const cafe = baseCafe({ drinks: [] })
    vi.mocked(api.cafes.getAll).mockResolvedValue({ cafes: [cafe] })

    const { result } = renderHook(() => useDataStore())

    await act(async () => {
      await result.current.fetchCafes()
    })

    expect(result.current.allCafes).toHaveLength(1)
    expect(result.current.allCafes[0].lat).toBe(cafe.latitude)
    expect(result.current.cafesFetched).toBe(true)
    expect(vi.mocked(api.cafes.getAll)).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.fetchCafes()
    })
    expect(vi.mocked(api.cafes.getAll)).toHaveBeenCalledTimes(1)

    vi.mocked(api.cafes.getAll).mockResolvedValue({ cafes: [cafe] })
    await act(async () => {
      await result.current.fetchCafes(undefined, true)
    })
    expect(vi.mocked(api.cafes.getAll)).toHaveBeenCalledTimes(2)
  })

  it('fetchCafes passes city string as filter', async () => {
    vi.mocked(api.cafes.getAll).mockResolvedValue({ cafes: [] })
    const { result } = renderHook(() => useDataStore())
    await act(async () => {
      await result.current.fetchCafes('toronto')
    })
    expect(vi.mocked(api.cafes.getAll)).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'toronto' }),
      false
    )
  })

  it('fetchCafes records errors', async () => {
    vi.mocked(api.cafes.getAll).mockRejectedValue(new Error('API Error'))
    const { result } = renderHook(() => useDataStore())
    await act(async () => {
      await result.current.fetchCafes()
    })
    expect(result.current.error).toBe('API Error')
    expect(result.current.cafesFetched).toBe(false)
  })

  it('fetchEvents loads and skips when cached unless bust', async () => {
    vi.mocked(api.events.getAll).mockResolvedValue({
      events: [
        {
          id: 1,
          title: 'E',
          date: '2023-06-01',
          time: '2:00 PM',
          location: 'Here',
          venue: 'There',
          description: 'D',
          image: '',
          price: '$25',
          featured: true,
          published: true,
          cafeId: 1,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ],
    })

    const { result } = renderHook(() => useDataStore())
    await act(async () => {
      await result.current.fetchEvents()
    })
    expect(result.current.eventItems).toHaveLength(1)
    expect(result.current.eventsFetched).toBe(true)

    await act(async () => {
      await result.current.fetchEvents()
    })
    expect(vi.mocked(api.events.getAll)).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.fetchEvents(true)
    })
    expect(vi.mocked(api.events.getAll)).toHaveBeenCalledTimes(2)
  })

  it('fetchAll runs cafes and events', async () => {
    vi.mocked(api.cafes.getAll).mockResolvedValue({ cafes: [baseCafe()] })
    vi.mocked(api.events.getAll).mockResolvedValue({ events: [] })

    const { result } = renderHook(() => useDataStore())
    await act(async () => {
      await result.current.fetchAll('montreal')
    })
    expect(vi.mocked(api.cafes.getAll)).toHaveBeenCalled()
    expect(vi.mocked(api.events.getAll)).toHaveBeenCalled()
  })
})
