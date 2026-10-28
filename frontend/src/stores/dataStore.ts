// Store initialization and background cache callbacks run outside React renders.
'use no memo'

import { create } from 'zustand'
import { api } from '../utils/api'
import type { Cafe, EventItem } from '../types'
import { useCityStore } from './cityStore'
import { cafeRequest, CAFE_CACHE_LIMITS, CafeCacheExpiredError, clearOfflineCafeCache, subscribeCafeInvalidation } from '../offline/cafeCache'
import type { CafeFilters, CafePage, CafePageResult } from '../offline/cafeCache'

const CLEAR_PREFERENCE = 'matchamap-offline-cafes-cleared'
function wasCleared() {
  try { return localStorage.getItem(CLEAR_PREFERENCE) === 'true' } catch { return false }
}
function rememberClear(cleared: boolean) {
  try { if (cleared) localStorage.setItem(CLEAR_PREFERENCE, 'true'); else localStorage.removeItem(CLEAR_PREFERENCE) } catch { /* optional storage may be denied */ }
}
let requestSequence = 0
let expiryTimer: ReturnType<typeof setTimeout> | undefined
let lastFilters: CafeFilters = {}
let lastMode: 'public' | 'admin' = 'public'


interface DataStore {
  allCafes: Cafe[]
  eventItems: EventItem[]
  isLoading: boolean
  error: string | null

  // Cache flags to prevent unnecessary refetches
  cafesFetched: boolean
  eventsFetched: boolean

  // Actions
  cafeRequestKey: string | null
  cafeCity: string | null
  cafeLoading: boolean
  cafeSource: 'network' | 'saved' | null
  cafesObservedAt: number | null
  cafesTotal: number | null
  cafesHasMore: boolean
  cafeStatus: 'idle' | 'loading' | 'fresh' | 'saved' | 'expired' | 'error' | 'cleared'
  fetchCafes: (filters?: CafeFilters, bustCache?: boolean, mode?: 'public' | 'admin') => Promise<void>
  clearOfflineCafes: () => Promise<void>
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

  cafeRequestKey: null,
  cafeCity: null,
  cafeLoading: false,
  cafeSource: null,
  cafesObservedAt: null,
  cafesTotal: null,
  cafesHasMore: false,
  cafeStatus: wasCleared() ? 'cleared' : 'idle',

  fetchCafes: async (filters = {}, bustCache = false, mode = 'public') => {
    if (mode === 'public' && get().cafeStatus === 'cleared' && !bustCache) return
    if (mode === 'public' && bustCache) rememberClear(false)
    let key: string
    let publicFilters: CafeFilters = filters
    try {
      if (mode === 'public') {
        const request = cafeRequest(import.meta.env.VITE_API_URL || '', { ...filters, city: filters.city ?? useCityStore.getState().selectedCity })
        key = request.key
        publicFilters = request.filters
      } else key = `admin:${JSON.stringify(filters)}`
    } catch (error) {
      requestSequence++
      if (expiryTimer) clearTimeout(expiryTimer)
      set({ allCafes: [], cafesFetched: false, cafeRequestKey: null, cafeCity: mode === 'public' ? (filters.city?.toLowerCase() ?? useCityStore.getState().selectedCity) : null, cafeLoading: false, isLoading: false,
        cafeSource: null, cafesObservedAt: null, cafeStatus: 'error', error: (error as Error).message })
      return
    }
    const state = get()
    const age = state.cafesObservedAt === null ? Infinity : Date.now() - state.cafesObservedAt
    if (!bustCache && state.cafeRequestKey === key && (state.cafeLoading || state.cafesFetched && age >= 0 && age < CAFE_CACHE_LIMITS.refreshAge)) return
    const sequence = ++requestSequence
    lastFilters = publicFilters
    lastMode = mode
    const changed = state.cafeRequestKey !== key || age >= CAFE_CACHE_LIMITS.maxAge
    if (changed && expiryTimer) clearTimeout(expiryTimer)
    set({ cafeRequestKey: key, cafeCity: mode === 'public' ? publicFilters.city! : null,
      cafeLoading: true, isLoading: true, cafeStatus: 'loading', error: null,
      ...(changed ? { allCafes: [], cafesFetched: false, cafeSource: null, cafesObservedAt: null, cafesTotal: null, cafesHasMore: false } : {}) })
    try {
      const response: CafePage & { cacheInfo?: CafePageResult['cacheInfo'] } = mode === 'admin' ? await api.cafes.getAll(filters, true) : await api.cafes.getPublicPage(publicFilters)
      if (sequence !== requestSequence) return
      const info = response.cacheInfo
      const observedAt = info?.observedAt ?? Date.now()
      set({ allCafes: response.cafes.map((cafe: Cafe) => ({ ...cafe, lat: cafe.latitude, lng: cafe.longitude, drinks: cafe.drinks || [] })),
        isLoading: false, cafeLoading: false, cafesFetched: true, cafeSource: info?.source ?? null,
        cafesObservedAt: observedAt, cafesTotal: response.total, cafesHasMore: response.hasMore,
        cafeStatus: info?.source === 'saved' ? 'saved' : 'fresh' })
      if (mode === 'public') {
        if (expiryTimer) clearTimeout(expiryTimer)
        expiryTimer = setTimeout(() => {
          if (get().cafeRequestKey !== key || get().cafesObservedAt !== observedAt) return
          set({ allCafes: [], cafesFetched: false, cafeSource: null, cafeStatus: 'expired' })
          if (!get().cafeLoading && navigator.onLine !== false) void get().fetchCafes(lastFilters, true)
        }, Math.max(0, observedAt + CAFE_CACHE_LIMITS.maxAge - Date.now()))
      }
    } catch (error) {
      if (sequence !== requestSequence) return
      // Auth/schema failures must not leave a previously saved page visible as success.
      set({ allCafes: [], cafesFetched: false, cafeLoading: false, cafeSource: null,
        cafesObservedAt: null, cafesTotal: null, cafesHasMore: false,
        error: (error as Error).message, isLoading: false, cafeStatus: error instanceof CafeCacheExpiredError ? 'expired' : 'error' })
    }
  },
  clearOfflineCafes: clearOfflineCafeCache,

  fetchEvents: async (bustCache = false) => {
    // Skip if already fetched (unless cache busting)
    if (!bustCache && get().eventsFetched) return

    try {
      set({ isLoading: true, error: null })
      const response = await api.events.getAll({ upcoming: true, limit: 50 }, bustCache)

      // Transform API response to frontend format
      const eventItems = response.events.map((event: EventItem) => ({
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
      fetchCafes(city ? { city } : undefined, bustCache),
      fetchEvents(bustCache),
    ])
  },
}))

// Clear all visible results before refetching after edits, including other tabs.
subscribeCafeInvalidation(reason => {
  requestSequence++
  if (expiryTimer) clearTimeout(expiryTimer)
  const state = useDataStore.getState()
  if (reason === 'clear') rememberClear(true)
  useDataStore.setState({ allCafes: [], cafesFetched: false, cafeLoading: false, cafeSource: null,
    cafesObservedAt: null, cafesTotal: null, cafesHasMore: false, cafeStatus: reason === 'clear' || state.cafeStatus === 'cleared' ? 'cleared' : 'idle', error: null })
  if (reason === 'edit' && state.cafeStatus !== 'cleared' && state.cafeRequestKey && navigator.onLine !== false) void state.fetchCafes(lastFilters, true, lastMode)
})

if (typeof window !== 'undefined') {
  const refresh = (force = false) => {
    const state = useDataStore.getState()
    if (lastMode === 'public' && state.cafeStatus !== 'cleared' && state.cafeRequestKey && !state.cafeLoading &&
      (force || state.cafesObservedAt === null || Date.now() - state.cafesObservedAt >= CAFE_CACHE_LIMITS.refreshAge)) {
      void state.fetchCafes(lastFilters, true)
    }
  }
  window.addEventListener('online', () => refresh(true))
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh() })
}
