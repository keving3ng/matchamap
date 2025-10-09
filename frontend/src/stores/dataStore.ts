import { create } from 'zustand'
import { api } from '../utils/api'
import type { Cafe, FeedItem, EventItem } from '../types'

interface DataStore {
  allCafes: Cafe[]
  feedItems: FeedItem[]
  eventItems: EventItem[]
  isLoading: boolean
  error: string | null

  // Cache flags to prevent unnecessary refetches
  cafesFetched: boolean
  feedFetched: boolean
  eventsFetched: boolean

  // Actions
  fetchCafes: (city?: string, bustCache?: boolean) => Promise<void>
  fetchFeed: (bustCache?: boolean) => Promise<void>
  fetchEvents: (bustCache?: boolean) => Promise<void>
  fetchAll: (city?: string, bustCache?: boolean) => Promise<void>
}

/**
 * Store for data loaded from API
 * Replaces static JSON loading with dynamic API calls
 */
export const useDataStore = create<DataStore>((set, get) => ({
  allCafes: [],
  feedItems: [],
  eventItems: [],
  isLoading: false,
  error: null,
  cafesFetched: false,
  feedFetched: false,
  eventsFetched: false,

  fetchCafes: async (city?: string, bustCache = false) => {
    // Skip if already fetched (unless cache busting)
    if (!bustCache && get().cafesFetched) return

    try {
      set({ isLoading: true, error: null })
      const response = await api.cafes.getAll({ city, limit: 500 }, bustCache)

      // Transform API response to frontend format
      const cafes = response.cafes.map((cafe: any) => ({
        id: cafe.id,
        name: cafe.name,
        slug: cafe.slug,
        latitude: cafe.latitude,
        longitude: cafe.longitude,
        lat: cafe.latitude, // Backwards compatibility
        lng: cafe.longitude, // Backwards compatibility
        link: cafe.link,
        address: cafe.address || null,
        city: cafe.city,
        displayScore: cafe.displayScore, // Calculated from drinks
        ambianceScore: cafe.ambianceScore,
        drinks: cafe.drinks || [], // Include drinks from API
        chargeForAltMilk: cafe.chargeForAltMilk, // Number or null
        quickNote: cafe.quickNote || '',
        review: cafe.review || '',
        source: cafe.source || '',
        instagram: cafe.instagram || '',
        instagramPostLink: cafe.instagramPostLink || '',
        tiktokPostLink: cafe.tiktokPostLink || '',
        hours: cafe.hours || '',
        images: cafe.images || '',
        createdAt: cafe.createdAt,
        updatedAt: cafe.updatedAt,
        deletedAt: cafe.deletedAt,
      }))

      set({ allCafes: cafes, isLoading: false, cafesFetched: true })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchFeed: async (bustCache = false) => {
    // Skip if already fetched (unless cache busting)
    if (!bustCache && get().feedFetched) return

    try {
      set({ isLoading: true, error: null })
      const response = await api.feed.getAll({ limit: 100 }, bustCache)

      // Transform API response to frontend format
      const feedItems = response.items.map((item: any) => ({
        id: item.id,
        type: item.type as any, // API returns string, type system expects enum
        title: item.title,
        date: item.date,
        preview: item.preview,
        content: item.content || '',
        cafeId: item.cafeId,
        cafeName: item.cafeName,
        score: item.score,
        previousScore: item.previousScore,
        neighborhood: item.neighborhood,
        image: item.image || '',
        author: item.author,
        tags: item.tags ? (typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags) : [],
        published: item.published,
      }))

      set({ feedItems, isLoading: false, feedFetched: true })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchEvents: async (bustCache = false) => {
    // Skip if already fetched (unless cache busting)
    if (!bustCache && get().eventsFetched) return

    try {
      set({ isLoading: true, error: null })
      const response = await api.events.getAll({ upcoming: true, limit: 50 }, bustCache)

      // Transform API response to frontend format
      const eventItems = response.events.map((event: any) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        venue: event.venue,
        description: event.description,
        image: event.image || '',
        price: event.price || '',
        featured: event.featured || false,
        published: event.published !== false, // Default to true if not specified
      }))

      set({ eventItems, isLoading: false, eventsFetched: true })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchAll: async (city?: string, bustCache = false) => {
    const { fetchCafes, fetchFeed, fetchEvents } = get()
    await Promise.all([
      fetchCafes(city, bustCache),
      fetchFeed(bustCache),
      fetchEvents(bustCache),
    ])
  },
}))
