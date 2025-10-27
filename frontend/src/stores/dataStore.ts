import { create } from 'zustand'
import { api } from '../utils/api'
import type { Cafe, EventItem } from '../types'

interface DataStore {
  allCafes: Cafe[]
  eventItems: EventItem[]
  isLoading: boolean
  error: string | null

  // Cache flags to prevent unnecessary refetches
  cafesFetched: boolean
  eventsFetched: boolean

  // Actions
  fetchCafes: (filters?: {
    city?: string
    search?: string
    userMinRating?: number
    userMaxRating?: number
    minScore?: number
    maxPrice?: number
    limit?: number
    offset?: number
  }, bustCache?: boolean) => Promise<void>
  fetchEvents: (bustCache?: boolean) => Promise<void>
  fetchAll: (city?: string, bustCache?: boolean) => Promise<void>
}

/**
 * Store for data loaded from API
 * Replaces static JSON loading with dynamic API calls
 */
export const useDataStore = create<DataStore>((set, get) => ({
  allCafes: [],
  eventItems: [],
  isLoading: false,
  error: null,
  cafesFetched: false,
  eventsFetched: false,

  fetchCafes: async (filters?: {
    city?: string
    search?: string
    userMinRating?: number
    userMaxRating?: number
    minScore?: number
    maxPrice?: number
    limit?: number
    offset?: number
  }, bustCache = false) => {
    // Skip if already fetched (unless cache busting) and no filters provided
    if (!bustCache && get().cafesFetched && !filters?.search && !filters?.userMinRating && !filters?.userMaxRating) return

    try {
      set({ isLoading: true, error: null })
      const response = await api.cafes.getAll({ 
        city: filters?.city, 
        search: filters?.search,
        userMinRating: filters?.userMinRating,
        userMaxRating: filters?.userMaxRating,
        minScore: filters?.minScore,
        maxPrice: filters?.maxPrice,
        limit: filters?.limit || 500,
        offset: filters?.offset || 0
      }, bustCache)

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
        userRatingAvg: cafe.userRatingAvg, // User review average
        userRatingCount: cafe.userRatingCount, // User review count
        drinks: cafe.drinks || [], // Include drinks from API
        chargeForAltMilk: cafe.chargeForAltMilk, // Number or null
        quickNote: cafe.quickNote || '',
        review: cafe.review || '',
        source: cafe.source || '',
        reviewSnippets: cafe.reviewSnippets || [], // Search result snippets
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
        link: event.link || '',
        price: event.price || '',
        cafeId: event.cafeId || null,
        featured: event.featured || false,
        published: event.published !== false, // Default to true if not specified
      }))

      set({ eventItems, isLoading: false, eventsFetched: true })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchAll: async (city?: string, bustCache = false) => {
    const { fetchCafes, fetchEvents } = get()
    await Promise.all([
      fetchCafes(city, bustCache),
      fetchEvents(bustCache),
    ])
  },
}))
