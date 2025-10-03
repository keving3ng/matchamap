import { create } from 'zustand'
import { api } from '../utils/api'
import type { Cafe, FeedItem, EventItem } from '../types'

interface DataStore {
  allCafes: Cafe[]
  feedItems: FeedItem[]
  eventItems: EventItem[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchCafes: (city?: string) => Promise<void>
  fetchFeed: () => Promise<void>
  fetchEvents: () => Promise<void>
  fetchAll: (city?: string) => Promise<void>
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

  fetchCafes: async (city?: string) => {
    try {
      set({ isLoading: true, error: null })
      const response = await api.cafes.getAll({ city, limit: 500 })

      // Transform API response to frontend format
      const cafes = response.cafes.map((cafe: any) => ({
        id: cafe.id,
        name: cafe.name,
        lat: cafe.latitude,
        lng: cafe.longitude,
        neighborhood: '', // Not in new schema
        address: '', // Not in new schema
        city: cafe.city,
        score: cafe.score,
        secondaryScores: {
          value: 0, // Not in new schema
          ambiance: cafe.ambianceScore || 0,
          otherDrinks: cafe.otherDrinksScore || 0,
        },
        drinks: [], // Will be fetched separately if needed
        priceRange: (cafe.price ? (cafe.price < 6 ? '$' : cafe.price < 8 ? '$$' : '$$$') : '$$') as any,
        price: cafe.price,
        chargeForAltMilk: cafe.chargeForAltMilk || false,
        gramsUsed: cafe.gramsUsed,
        menuHighlights: '',
        quickNote: cafe.quickNote || '',
        review: cafe.review || '',
        comments: '',
        instagram: cafe.instagram || '',
        instagramPostLink: cafe.instagramPostLink || '',
        tiktok: '', // Not in new schema
        tiktokPostLink: cafe.tiktokPostLink || '',
        hours: cafe.hours || '',
        googleMapsUrl: cafe.link || '',
        images: cafe.images || '',
        emoji: '🍵', // Default emoji
        color: '#7cb342', // Default color
      }))

      set({ allCafes: cafes, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchFeed: async () => {
    try {
      set({ isLoading: true, error: null })
      const response = await api.feed.getAll({ limit: 100 })

      // Transform API response to frontend format
      const feedItems = response.items.map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        date: item.date,
        preview: item.preview,
        content: item.content,
        cafeId: item.cafe_id,
        cafeName: item.cafe_name,
        score: item.score,
        previousScore: item.previous_score,
        neighborhood: item.neighborhood,
        image: item.image,
        author: item.author,
        tags: item.tags ? JSON.parse(item.tags) : [],
        published: item.published,
      }))

      set({ feedItems, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchEvents: async () => {
    try {
      set({ isLoading: true, error: null })
      const response = await api.events.getAll({ upcoming: true, limit: 50 })

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
      }))

      set({ eventItems, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchAll: async (city?: string) => {
    const { fetchCafes, fetchFeed, fetchEvents } = get()
    await Promise.all([
      fetchCafes(city),
      fetchFeed(),
      fetchEvents(),
    ])
  },
}))
