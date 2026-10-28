import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDataStore } from '../dataStore'
import { api } from '../../utils/api'
import type { Cafe } from '../../types'
import { CAFE_CACHE_LIMITS, publicCafeCache } from '../../offline/cafeCache'

vi.mock('../../utils/api', () => ({
  api: {
    cafes: {
      getAll: vi.fn(),
      getPublicPage: vi.fn(),
    },
    events: {
      getAll: vi.fn(),
    },
  },
}))

const response = (cafes: Cafe[]) => ({ cafes, total: cafes.length, hasMore: false, cacheInfo: { key: 'test', source: 'network' as const, observedAt: Date.now() } })

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
      eventsFetched: false, cafeRequestKey: null, cafeCity: null, cafeLoading: false, cafeSource: null, cafesObservedAt: null, cafesTotal: null, cafesHasMore: false, cafeStatus: 'idle',
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('initializes empty', () => {
    const { result } = renderHook(() => useDataStore())
    expect(result.current.allCafes).toEqual([])
    expect(result.current.cafesFetched).toBe(false)
  })

  it('fetchCafes loads, maps lat/lng, and respects cache / bust', async () => {
    const cafe = baseCafe({ drinks: [] })
    vi.mocked(api.cafes.getPublicPage).mockResolvedValue(response([cafe]))

    const { result } = renderHook(() => useDataStore())

    await act(async () => {
      await result.current.fetchCafes()
    })

    expect(result.current.allCafes).toHaveLength(1)
    expect(result.current.allCafes[0].lat).toBe(cafe.latitude)
    expect(result.current.cafesFetched).toBe(true)
    expect(vi.mocked(api.cafes.getPublicPage)).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.fetchCafes()
    })
    expect(vi.mocked(api.cafes.getPublicPage)).toHaveBeenCalledTimes(1)

    vi.mocked(api.cafes.getPublicPage).mockResolvedValue(response([cafe]))
    await act(async () => {
      await result.current.fetchCafes(undefined, true)
    })
    expect(vi.mocked(api.cafes.getPublicPage)).toHaveBeenCalledTimes(2)
  })

  it('fetchCafes passes city in filter object', async () => {
    vi.mocked(api.cafes.getPublicPage).mockResolvedValue(response([]))
    const { result } = renderHook(() => useDataStore())
    await act(async () => {
      await result.current.fetchCafes({ city: 'toronto' })
    })
    expect(vi.mocked(api.cafes.getPublicPage)).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'toronto' })
    )
  })

  it('fetchCafes records errors', async () => {
    vi.mocked(api.cafes.getPublicPage).mockRejectedValue(new Error('API Error'))
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
    vi.mocked(api.cafes.getPublicPage).mockResolvedValue(response([baseCafe()]))
    vi.mocked(api.events.getAll).mockResolvedValue({ events: [] })

    const { result } = renderHook(() => useDataStore())
    await act(async () => {
      await result.current.fetchAll('montreal')
    })
    expect(vi.mocked(api.cafes.getPublicPage)).toHaveBeenCalled()
    expect(vi.mocked(api.events.getAll)).toHaveBeenCalled()
  })
  it('clears a previous city immediately and ignores its late response', async () => {
    let finish!: (value: ReturnType<typeof response>) => void
    vi.mocked(api.cafes.getPublicPage).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
      .mockResolvedValueOnce(response([baseCafe({ city: 'montreal', name: 'Montreal Café' })]))
    const first = useDataStore.getState().fetchCafes({ city: 'toronto' })
    useDataStore.setState({ allCafes: [baseCafe()] })
    const second = useDataStore.getState().fetchCafes({ city: 'montreal' })
    expect(useDataStore.getState().allCafes).toEqual([])
    await second
    finish(response([baseCafe()]))
    await first
    expect(useDataStore.getState().allCafes[0].city).toBe('montreal')
  })

  it('does not skip a different query, filter or page and retains pagination/fallback metadata', async () => {
    vi.mocked(api.cafes.getPublicPage).mockResolvedValue({ ...response([baseCafe()]), total: 100, hasMore: true,
      cacheInfo: { key: 'saved', source: 'saved', observedAt: Date.now() - 60000 } })
    for (const filters of [{}, { minScore: 5 }, { maxPrice: 10 }, { search: 'matcha' }, { offset: 20 }]) {
      await useDataStore.getState().fetchCafes({ city: 'toronto', ...filters })
    }
    expect(api.cafes.getPublicPage).toHaveBeenCalledTimes(5)
    expect(useDataStore.getState()).toMatchObject({ cafesTotal: 100, cafesHasMore: true, cafeSource: 'saved', cafeStatus: 'saved' })
  })

  it('keeps editor reads outside the public persistent cache', async () => {
    vi.mocked(api.cafes.getAll).mockResolvedValue({ cafes: [baseCafe()], total: 1, hasMore: false })
    await useDataStore.getState().fetchCafes(undefined, true, 'admin')
    expect(api.cafes.getPublicPage).not.toHaveBeenCalled()
    expect(useDataStore.getState().allCafes[0].images).toContain('test1.jpg')
    expect(useDataStore.getState().cafeSource).toBeNull()
  })

  it('clears a saved page on auth/schema errors and refreshes after reconnect and another-tab edit', async () => {
    vi.mocked(api.cafes.getPublicPage).mockResolvedValue(response([baseCafe()]))
    await useDataStore.getState().fetchCafes()
    vi.mocked(api.cafes.getPublicPage).mockRejectedValueOnce(new Error('Authentication required'))
    await useDataStore.getState().fetchCafes(undefined, true)
    expect(useDataStore.getState()).toMatchObject({ allCafes: [], cafesFetched: false, cafeStatus: 'error' })
    await act(async () => { window.dispatchEvent(new Event('online')) })
    expect(useDataStore.getState().cafesFetched).toBe(true)
    vi.mocked(api.cafes.getPublicPage).mockResolvedValue(response([]))
    await act(async () => { window.dispatchEvent(new StorageEvent('storage', { key: 'matchamap-public-cafe-invalidation', newValue: 'edited' })) })
    expect(useDataStore.getState()).toMatchObject({ allCafes: [], cafesFetched: true, cafesTotal: 0 })
  })

  it('expires visible saved data at seven days, including while the page stays open offline', async () => {
    vi.useFakeTimers()
    vi.mocked(api.cafes.getPublicPage).mockResolvedValue({ ...response([baseCafe()]),
      cacheInfo: { key: 'old', source: 'saved', observedAt: Date.now() - CAFE_CACHE_LIMITS.maxAge + 100 } })
    await useDataStore.getState().fetchCafes()
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    await vi.advanceTimersByTimeAsync(100)
    expect(useDataStore.getState()).toMatchObject({ allCafes: [], cafesFetched: false, cafeStatus: 'expired' })
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
  })

  it('does not keep expired saved data visible while a replacement refresh is pending', async () => {
    vi.useFakeTimers()
    vi.mocked(api.cafes.getPublicPage).mockResolvedValueOnce({ ...response([baseCafe()]),
      cacheInfo: { key: 'old', source: 'saved', observedAt: Date.now() - CAFE_CACHE_LIMITS.maxAge + 100 } })
    await useDataStore.getState().fetchCafes()
    let finish!: (value: ReturnType<typeof response>) => void
    vi.mocked(api.cafes.getPublicPage).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const pending = useDataStore.getState().fetchCafes(undefined, true)
    await vi.advanceTimersByTimeAsync(100)
    expect(useDataStore.getState()).toMatchObject({ allCafes: [], cafesFetched: false, cafeLoading: true })
    finish(response([baseCafe()])); await pending
    expect(useDataStore.getState().cafesFetched).toBe(true)
  })

  it('clears offline data without immediately recreating it through a background refetch', async () => {
    const invalidateSpy = vi.spyOn(publicCafeCache, 'invalidate').mockResolvedValue(undefined)
    vi.mocked(api.cafes.getPublicPage).mockResolvedValue(response([baseCafe()]))
    await useDataStore.getState().fetchCafes()
    await useDataStore.getState().clearOfflineCafes()
    expect(api.cafes.getPublicPage).toHaveBeenCalledTimes(1)
    expect(useDataStore.getState()).toMatchObject({ allCafes: [], cafesFetched: false, cafeStatus: 'cleared' })
    await act(async () => {
      window.dispatchEvent(new Event('online'))
      document.dispatchEvent(new Event('visibilitychange'))
      await useDataStore.getState().fetchCafes() // route remount
    })
    expect(api.cafes.getPublicPage).toHaveBeenCalledTimes(1)
    await useDataStore.getState().fetchCafes(undefined, true)
    expect(api.cafes.getPublicPage).toHaveBeenCalledTimes(2)
    invalidateSpy.mockRestore()
  })

  it('revalidates foreground data after five minutes', async () => {
    vi.useFakeTimers()
    vi.mocked(api.cafes.getPublicPage).mockResolvedValue(response([baseCafe()]))
    await useDataStore.getState().fetchCafes()
    await vi.advanceTimersByTimeAsync(CAFE_CACHE_LIMITS.refreshAge)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(api.cafes.getPublicPage).toHaveBeenCalledTimes(2)
  })

})

it('another-tab clear fences pending results and suppresses automatic foreground and reconnect reads', async () => {
  let finish!: (value: ReturnType<typeof response>) => void
  vi.mocked(api.cafes.getPublicPage).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  const pending = useDataStore.getState().fetchCafes(undefined, true)
  window.dispatchEvent(new StorageEvent('storage', { key: 'matchamap-public-cafe-invalidation', newValue: 'clear:other-tab' }))
  finish(response([baseCafe()]))
  await pending
  expect(useDataStore.getState()).toMatchObject({ allCafes: [], cafeStatus: 'cleared', cafeLoading: false })
  window.dispatchEvent(new Event('online'))
  document.dispatchEvent(new Event('visibilitychange'))
  await useDataStore.getState().fetchCafes()
  expect(api.cafes.getPublicPage).toHaveBeenCalledTimes(1)
})
