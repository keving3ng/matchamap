import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDataStore } from '../dataStore'
import { api } from '../../utils/api'
import type { Cafe, EventItem } from '../../../shared/types'

// Mock the API client
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

describe('dataStore', () => {
  const mockCafes: Cafe[] = [
    {
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
      tiktokPostLink: 'https://tiktok.com/@user/video/test1',
      hours: '9am-5pm',
      images: 'https://example.com/test1.jpg',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Test Cafe Two',
      slug: 'test-cafe-two',
      latitude: 43.6643,
      longitude: -79.3943,
      link: 'https://maps.google.com/?cid=2',
      address: '456 Test Ave',
      city: 'montreal',
      displayScore: 7.5,
      ambianceScore: 7.0,
      quickNote: 'Cozy test atmosphere',
      chargeForAltMilk: 50,
      review: 'Nice test place',
      source: 'Friend recommendation',
      instagram: '@testcafetwo',
      instagramPostLink: 'https://instagram.com/p/test2',
      tiktokPostLink: null,
      hours: '8am-6pm',
      images: 'https://example.com/test2.jpg',
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
    },
  ]


  const mockEvents: EventItem[] = [
    {
      id: 1,
      title: 'Matcha Tasting Event',
      date: '2023-06-01',
      time: '2:00 PM',
      location: 'Downtown Toronto',
      venue: 'Test Cafe One',
      description: 'Join us for a matcha tasting',
      image: 'https://example.com/event1.jpg',
      price: '$25',
      featured: true,
      published: true,
      cafeId: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      title: 'Latte Art Workshop',
      date: '2023-06-15',
      time: '10:00 AM',
      location: 'Montreal',
      venue: 'Test Cafe Two',
      description: 'Learn latte art techniques',
      image: 'https://example.com/event2.jpg',
      price: '$40',
      featured: false,
      published: true,
      cafeId: 2,
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
    },
  ]

  beforeEach(() => {
    // Reset store before each test
    useDataStore.setState({
      allCafes: [],
      eventItems: [],
      isLoading: false,
      error: null,
      cafesFetched: false,
      eventsFetched: false,
    })
    
    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useDataStore())
      
      expect(result.current.allCafes).toEqual([])
      expect(result.current.eventItems).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.cafesFetched).toBe(false)
      expect(result.current.eventsFetched).toBe(false)
    })
  })

  describe('fetchCafes', () => {
    it('should fetch cafes successfully', async () => {
      const { result } = renderHook(() => useDataStore())

      vi.mocked(api.cafes.getAll).mockResolvedValueOnce({
        cafes: mockCafes.map(cafe => ({
          ...cafe,
          drinks: [],
        })),
      })

      await act(async () => {
        await result.current.fetchCafes()
      })

      expect(result.current.allCafes).toHaveLength(2)
      expect(result.current.allCafes[0].name).toBe('Test Cafe One')
      expect(result.current.allCafes[1].name).toBe('Test Cafe Two')
      expect(result.current.cafesFetched).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()

      expect(vi.mocked(api.cafes.getAll)).toHaveBeenCalledWith(
        { city: undefined, limit: 500 },
        false
      )
    })

    it('should fetch cafes with city filter', async () => {
      const { result } = renderHook(() => useDataStore())

      vi.mocked(api.cafes.getAll).mockResolvedValueOnce({
        cafes: [mockCafes[0]], // Only Toronto cafe
      })

      await act(async () => {
        await result.current.fetchCafes('toronto')
      })

      expect(vi.mocked(api.cafes.getAll)).toHaveBeenCalledWith(
        { city: 'toronto', limit: 500 },
        false
      )
    })

    it('should skip fetch if already fetched (cache)', async () => {
      const { result } = renderHook(() => useDataStore())

      // Set cafes as already fetched
      act(() => {
        useDataStore.setState({ cafesFetched: true })
      })

      await act(async () => {
        await result.current.fetchCafes()
      })

      expect(vi.mocked(api.cafes.getAll)).not.toHaveBeenCalled()
    })

    it('should bust cache when explicitly requested', async () => {
      const { result } = renderHook(() => useDataStore())

      // Set cafes as already fetched
      act(() => {
        useDataStore.setState({ cafesFetched: true })
      })

      vi.mocked(api.cafes.getAll).mockResolvedValueOnce({
        cafes: mockCafes,
      })

      await act(async () => {
        await result.current.fetchCafes(undefined, true)
      })

      expect(vi.mocked(api.cafes.getAll)).toHaveBeenCalledWith(
        { city: undefined, limit: 500 },
        true
      )
    })

    it('should set loading state during fetch', async () => {
      const { result } = renderHook(() => useDataStore())

      vi.mocked(api.cafes.getAll).mockImplementationOnce(() => {
        // Check loading state while request is pending
        expect(result.current.isLoading).toBe(true)
        return Promise.resolve({ cafes: mockCafes })
      })

      await act(async () => {
        await result.current.fetchCafes()
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('should handle API error', async () => {
      const { result } = renderHook(() => useDataStore())

      vi.mocked(api.cafes.getAll).mockRejectedValueOnce(new Error('API Error'))

      await act(async () => {
        await result.current.fetchCafes()
      })

      expect(result.current.error).toBe('API Error')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.allCafes).toEqual([])
      expect(result.current.cafesFetched).toBe(false)
    })

    it('should transform API response to frontend format', async () => {
      const { result } = renderHook(() => useDataStore())

      const apiResponse = {
        cafes: [{
          id: 1,
          name: 'API Cafe',
          slug: 'api-cafe',
          latitude: 43.6532,
          longitude: -79.3832,
          link: 'https://maps.google.com/?cid=1',
          address: '123 API St',
          city: 'toronto',
          displayScore: 8.5,
          ambianceScore: 8.0,
          drinks: [{ id: 1, name: 'Matcha Latte', score: 8.5 }],
          chargeForAltMilk: 75,
          quickNote: 'Great API cafe',
          review: 'Excellent API review',
          source: 'Google',
          instagram: '@apicafe',
          instagramPostLink: 'https://instagram.com/p/api1',
          tiktokPostLink: 'https://tiktok.com/@user/video/api1',
          hours: '9am-5pm',
          images: 'https://example.com/api1.jpg',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          deletedAt: null,
        }],
      }

      vi.mocked(api.cafes.getAll).mockResolvedValueOnce(apiResponse)

      await act(async () => {
        await result.current.fetchCafes()
      })

      const cafe = result.current.allCafes[0]
      expect(cafe.id).toBe(1)
      expect(cafe.name).toBe('API Cafe')
      expect(cafe.latitude).toBe(43.6532)
      expect(cafe.lat).toBe(43.6532) // Backwards compatibility
      expect(cafe.longitude).toBe(-79.3832)
      expect(cafe.lng).toBe(-79.3832) // Backwards compatibility
      expect(cafe.drinks).toHaveLength(1)
      expect(cafe.chargeForAltMilk).toBe(75)
    })

    it('should handle missing optional fields', async () => {
      const { result } = renderHook(() => useDataStore())

      const minimalCafe = {
        id: 1,
        name: 'Minimal Cafe',
        slug: 'minimal-cafe',
        latitude: 43.6532,
        longitude: -79.3832,
        link: 'https://maps.google.com/?cid=1',
        city: 'toronto',
        quickNote: 'Minimal',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        // Missing optional fields
      }

      vi.mocked(api.cafes.getAll).mockResolvedValueOnce({
        cafes: [minimalCafe],
      })

      await act(async () => {
        await result.current.fetchCafes()
      })

      const cafe = result.current.allCafes[0]
      expect(cafe.address).toBeNull()
      expect(cafe.drinks).toEqual([])
      expect(cafe.review).toBe('')
      expect(cafe.instagram).toBe('')
      expect(cafe.hours).toBe('')
    })
  })


  describe('fetchEvents', () => {
    it('should fetch events successfully', async () => {
      const { result } = renderHook(() => useDataStore())

      vi.mocked(api.events.getAll).mockResolvedValueOnce({
        events: mockEvents,
      })

      await act(async () => {
        await result.current.fetchEvents()
      })

      expect(result.current.eventItems).toHaveLength(2)
      expect(result.current.eventItems[0].title).toBe('Matcha Tasting Event')
      expect(result.current.eventItems[1].title).toBe('Latte Art Workshop')
      expect(result.current.eventsFetched).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()

      expect(vi.mocked(api.events.getAll)).toHaveBeenCalledWith(
        { upcoming: true, limit: 50 },
        false
      )
    })

    it('should skip fetch if already fetched', async () => {
      const { result } = renderHook(() => useDataStore())

      act(() => {
        useDataStore.setState({ eventsFetched: true })
      })

      await act(async () => {
        await result.current.fetchEvents()
      })

      expect(vi.mocked(api.events.getAll)).not.toHaveBeenCalled()
    })

    it('should handle events API error', async () => {
      const { result } = renderHook(() => useDataStore())

      vi.mocked(api.events.getAll).mockRejectedValueOnce(new Error('Events API Error'))

      await act(async () => {
        await result.current.fetchEvents()
      })

      expect(result.current.error).toBe('Events API Error')
      expect(result.current.eventItems).toEqual([])
      expect(result.current.eventsFetched).toBe(false)
    })

    it('should transform events API response', async () => {
      const { result } = renderHook(() => useDataStore())

      const apiEvent = {
        id: 1,
        title: 'API Event',
        date: '2023-06-01',
        time: '2:00 PM',
        location: 'API Location',
        venue: 'API Venue',
        description: 'API description',
        image: 'https://example.com/api-event.jpg',
        price: '$30',
        featured: true,
        published: true,
      }

      vi.mocked(api.events.getAll).mockResolvedValueOnce({
        events: [apiEvent],
      })

      await act(async () => {
        await result.current.fetchEvents()
      })

      const event = result.current.eventItems[0]
      expect(event.title).toBe('API Event')
      expect(event.featured).toBe(true)
      expect(event.published).toBe(true)
    })

    it('should handle missing optional event fields', async () => {
      const { result } = renderHook(() => useDataStore())

      const minimalEvent = {
        id: 1,
        title: 'Minimal Event',
        date: '2023-06-01',
        time: '2:00 PM',
        location: 'Location',
        venue: 'Venue',
        description: 'Description',
        // Missing optional fields
      }

      vi.mocked(api.events.getAll).mockResolvedValueOnce({
        events: [minimalEvent],
      })

      await act(async () => {
        await result.current.fetchEvents()
      })

      const event = result.current.eventItems[0]
      // Mixed transformation - dataStore provides defaults for missing fields
      expect(event.image).toBeUndefined()
      expect(event.price).toBe('')
      expect(event.featured).toBe(false) // Defaults to false
      expect(event.published).toBe(true) // Defaults to true
    })
  })

  describe('fetchAll', () => {
    it('should fetch all data types in parallel', async () => {
      const { result } = renderHook(() => useDataStore())

      vi.mocked(api.cafes.getAll).mockResolvedValueOnce({ cafes: mockCafes })
      vi.mocked(api.events.getAll).mockResolvedValueOnce({ events: mockEvents })

      await act(async () => {
        await result.current.fetchAll()
      })

      expect(result.current.allCafes).toHaveLength(2)
      expect(result.current.eventItems).toHaveLength(2)
      expect(result.current.cafesFetched).toBe(true)
      expect(result.current.eventsFetched).toBe(true)

      expect(vi.mocked(api.cafes.getAll)).toHaveBeenCalledWith(
        { city: undefined, limit: 500 },
        false
      )
      expect(vi.mocked(api.events.getAll)).toHaveBeenCalledWith(
        { upcoming: true, limit: 50 },
        false
      )
    })

    it('should pass city and bustCache to all fetch methods', async () => {
      const { result } = renderHook(() => useDataStore())

      vi.mocked(api.cafes.getAll).mockResolvedValueOnce({ cafes: [] })
      vi.mocked(api.events.getAll).mockResolvedValueOnce({ events: [] })

      await act(async () => {
        await result.current.fetchAll('toronto', true)
      })

      expect(vi.mocked(api.cafes.getAll)).toHaveBeenCalledWith(
        { city: 'toronto', limit: 500 },
        true
      )
      expect(vi.mocked(api.events.getAll)).toHaveBeenCalledWith(
        { upcoming: true, limit: 50 },
        true
      )
    })

    it('should handle partial failures gracefully', async () => {
      const { result } = renderHook(() => useDataStore())

      vi.mocked(api.cafes.getAll).mockResolvedValueOnce({ cafes: mockCafes })
      vi.mocked(api.events.getAll).mockRejectedValueOnce(new Error('Events API Error'))

      await act(async () => {
        await result.current.fetchAll()
      })

      // Successful fetches should still work
      expect(result.current.allCafes).toHaveLength(2)
      expect(result.current.cafesFetched).toBe(true)

      // Failed fetch should not update state
      expect(result.current.eventItems).toEqual([])
      expect(result.current.eventsFetched).toBe(false)
      expect(result.current.error).toBe('Events API Error')
    })
  })

  describe('cache behavior', () => {
    it('should respect individual cache flags', async () => {
      const { result } = renderHook(() => useDataStore())

      // Set some flags as fetched
      act(() => {
        useDataStore.setState({
          cafesFetched: true,
          eventsFetched: false,
        })
      })

      vi.mocked(api.events.getAll).mockResolvedValueOnce({ events: mockEvents })

      await act(async () => {
        await result.current.fetchAll()
      })

      // Only events should be fetched (cafes are cached)
      expect(vi.mocked(api.cafes.getAll)).not.toHaveBeenCalled()
      expect(vi.mocked(api.events.getAll)).toHaveBeenCalled()
    })

    it('should bypass all caches when bustCache is true', async () => {
      const { result } = renderHook(() => useDataStore())

      // Set all as fetched
      act(() => {
        useDataStore.setState({
          cafesFetched: true,
          eventsFetched: true,
        })
      })

      vi.mocked(api.cafes.getAll).mockResolvedValueOnce({ cafes: [] })
      vi.mocked(api.events.getAll).mockResolvedValueOnce({ events: [] })

      await act(async () => {
        await result.current.fetchAll(undefined, true)
      })

      // All should be fetched despite cache flags
      expect(vi.mocked(api.cafes.getAll)).toHaveBeenCalled()
      expect(vi.mocked(api.events.getAll)).toHaveBeenCalled()
    })
  })

  describe('loading state management', () => {
    it('should manage loading state correctly for concurrent fetches', async () => {
      const { result } = renderHook(() => useDataStore())

      let resolvePromises: Array<() => void> = []

      // Create promises that we can resolve manually
      vi.mocked(api.cafes.getAll).mockReturnValueOnce(
        new Promise(resolve => {
          resolvePromises.push(() => resolve({ cafes: [] }))
        })
      )
      vi.mocked(api.events.getAll).mockReturnValueOnce(
        new Promise(resolve => {
          resolvePromises.push(() => resolve({ events: [] }))
        })
      )

      // Start fetchAll
      act(() => {
        result.current.fetchAll()
      })

      // Loading should be true while any request is pending
      expect(result.current.isLoading).toBe(true)

      // Resolve all promises
      await act(async () => {
        resolvePromises[0]()
        resolvePromises[1]()
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Now loading should be false
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should clear previous errors on successful fetch', async () => {
      const { result } = renderHook(() => useDataStore())

      // Set initial error state
      act(() => {
        useDataStore.setState({ error: 'Previous error' })
      })

      vi.mocked(api.cafes.getAll).mockResolvedValueOnce({ cafes: mockCafes })

      await act(async () => {
        await result.current.fetchCafes()
      })

      expect(result.current.error).toBeNull()
    })

    it('should preserve other data when one fetch fails', async () => {
      const { result } = renderHook(() => useDataStore())

      // Set existing data
      act(() => {
        useDataStore.setState({
          allCafes: mockCafes,
          eventItems: mockEvents,
        })
      })

      // Events fetch fails
      vi.mocked(api.events.getAll).mockRejectedValueOnce(new Error('Events Error'))

      await act(async () => {
        await result.current.fetchEvents()
      })

      // Existing data should be preserved
      expect(result.current.allCafes).toEqual(mockCafes)
      
      // Error should be set
      expect(result.current.error).toBe('Events Error')
      
      // Events should remain as they were before the failed fetch
      expect(result.current.eventItems).toEqual(mockEvents)
    })
  })
})