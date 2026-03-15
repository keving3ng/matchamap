/**
 * API client for MatchaMap backend
 * Handles all communication with Cloudflare Workers API
 */

import { useAuthStore } from '../stores/authStore'
import { useSessionExpiry } from '../hooks/useSessionExpiry'
import type { Cafe, Drink, Event, CityWithCount, WaitlistResponse, CafeStats } from '../../../shared/types'

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Helper to build query parameters from filters
 * Consolidates duplicate pagination and filtering logic across API endpoints
 *
 * @param filters - Object containing filter parameters
 * @returns Query string with leading '?' or empty string if no params
 */
function buildQueryParams(filters: Record<string, string | number | boolean | undefined | null>): string {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString())
    }
  })

  return params.toString() ? `?${params.toString()}` : ''
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit & { bustCache?: boolean }): Promise<T> {
  let url = `${API_BASE_URL}/api${endpoint}`

  // Add cache-busting parameter for GET requests when bustCache is true
  if (options?.bustCache && (!options?.method || options.method === 'GET')) {
    const separator = url.includes('?') ? '&' : '?'
    url += `${separator}_=${Date.now()}`
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Always include cookies
    headers,
  })

  if (!response.ok) {
    // Handle authentication errors (401/403)
    if (response.status === 401 || response.status === 403) {
      // Clear expired tokens from auth store
      useAuthStore.getState().clearAuth()

      // Show session expired dialog with current path for redirect
      const currentPath = window.location.pathname + window.location.search
      useSessionExpiry.getState().showSessionExpiredDialog(currentPath)

      // Return a specific error for auth failures
      throw new Error('Authentication required')
    }

    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

/**
 * Cafe API endpoints
 */
export const cafeAPI = {
  /**
   * Get all cafes with optional filtering and search
   */
  async getAll(filters?: {
    city?: string
    minScore?: number
    maxPrice?: number
    search?: string
    userMinRating?: number
    limit?: number
    offset?: number
  }, bustCache = false): Promise<{ cafes: Cafe[]; total: number; hasMore: boolean }> {
    const query = filters ? buildQueryParams(filters) : ''
    return fetchAPI(`/cafes${query}`, { bustCache })
  },

  /**
   * Get single cafe by ID with drinks
   */
  async getById(id: number): Promise<{ cafe: Cafe; drinks: Drink[] }> {
    return fetchAPI(`/cafes/${id}`)
  },

  /**
   * Create new cafe (admin only)
   */
  async create(cafe: Partial<Cafe>): Promise<{ cafe: Cafe }> {
    return fetchAPI('/admin/cafes', {
      method: 'POST',
      body: JSON.stringify(cafe),
    })
  },

  /**
   * Update cafe (admin only)
   */
  async update(id: number, cafe: Partial<Cafe>): Promise<{ cafe: Cafe }> {
    return fetchAPI(`/admin/cafes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cafe),
    })
  },

  /**
   * Delete cafe (admin only - soft delete)
   */
  async delete(id: number): Promise<{ message: string }> {
    return fetchAPI(`/admin/cafes/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Export all cafes and drinks (admin only)
   */
  async export(): Promise<{ cafes: Cafe[] }> {
    return fetchAPI('/admin/export/cafes')
  },

  /**
   * Import cafes and drinks (admin only)
   */
  async import(data: { cafes: Partial<Cafe>[] }): Promise<{
    success: number
    failed: number
    message: string
    errors?: string[]
  }> {
    return fetchAPI('/admin/import/cafes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}


/**
 * Events API endpoints
 */
export const eventsAPI = {
  /**
   * Get events with optional filtering
   */
  async getAll(filters?: {
    upcoming?: boolean
    featured?: boolean
    cafeId?: number
    limit?: number
  }, bustCache = false): Promise<{ events: Event[] }> {
    const query = filters ? buildQueryParams(filters) : ''
    return fetchAPI(`/events${query}`, { bustCache })
  },

  /**
   * Get all events including unpublished (admin only)
   */
  async getAllAdmin(filters?: {
    published?: boolean
    limit?: number
    offset?: number
  }, bustCache = false): Promise<{ events: Event[]; hasMore: boolean }> {
    const query = filters ? buildQueryParams(filters) : ''
    return fetchAPI(`/admin/events${query}`, { bustCache })
  },

  /**
   * Get single event by ID (admin only)
   */
  async getById(id: number): Promise<Event> {
    return fetchAPI(`/admin/events/${id}`)
  },

  /**
   * Create new event (admin only)
   */
  async create(event: Partial<Event>): Promise<Event> {
    return fetchAPI('/admin/events', {
      method: 'POST',
      body: JSON.stringify(event),
    })
  },

  /**
   * Update event (admin only)
   */
  async update(id: number, event: Partial<Event>): Promise<Event> {
    return fetchAPI(`/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    })
  },

  /**
   * Delete event (admin only)
   */
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    return fetchAPI(`/admin/events/${id}`, {
      method: 'DELETE',
    })
  },
}

/**
 * Health check endpoint
 */
export const healthAPI = {
  async check(): Promise<{ status: string; database: string; timestamp: string; version: string }> {
    return fetchAPI('/health')
  },
}

/**
 * Cities API endpoints
 */
export const citiesAPI = {
  /**
   * Get all cities with their cafe counts
   * Only returns cities that have at least one cafe
   */
  async getAll(bustCache = false): Promise<{ cities: CityWithCount[] }> {
    return fetchAPI('/cities', { bustCache })
  },
}

/**
 * Places API endpoints (Google Maps lookup)
 */
interface PlaceData {
  name: string
  address: string
  latitude: number
  longitude: number
  hours?: string
}

export const placesAPI = {
  /**
   * Lookup place details from Google Maps URL
   */
  async lookup(googleMapsUrl: string): Promise<{ place: PlaceData }> {
    return fetchAPI('/admin/places/lookup', {
      method: 'POST',
      body: JSON.stringify({ googleMapsUrl }),
    })
  },
}

/**
 * Drinks API endpoints
 */
export const drinksAPI = {
  /**
   * Get all drinks for a cafe
   */
  async getAll(cafeId: number): Promise<{ drinks: Drink[] }> {
    return fetchAPI(`/admin/cafes/${cafeId}/drinks`)
  },

  /**
   * Create new drink (admin only)
   */
  async create(cafeId: number, drink: Partial<Drink>): Promise<{ drink: Drink }> {
    return fetchAPI(`/admin/cafes/${cafeId}/drinks`, {
      method: 'POST',
      body: JSON.stringify(drink),
    })
  },

  /**
   * Update drink (admin only)
   */
  async update(id: number, drink: Partial<Drink>): Promise<{ drink: Drink }> {
    return fetchAPI(`/admin/drinks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(drink),
    })
  },

  /**
   * Set drink as default (admin only)
   */
  async setAsDefault(cafeId: number, drinkId: number): Promise<{ message: string; drink: Drink; drinks: Drink[] }> {
    return fetchAPI(`/admin/cafes/${cafeId}/drinks/${drinkId}/set-default`, {
      method: 'PUT',
    })
  },

  /**
   * Delete drink (admin only)
   */
  async delete(id: number): Promise<{ message: string }> {
    return fetchAPI(`/admin/drinks/${id}`, {
      method: 'DELETE',
    })
  },
}

/**
 * Admin API endpoints
 */
export const adminAPI = {}

/**
 * Waitlist API endpoints
 */
export const waitlistAPI = {
  /**
   * Join the waitlist
   */
  async join(email: string, referralSource?: string): Promise<{
    success: boolean
    message: string
  }> {
    return fetchAPI('/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email, referralSource }),
    })
  },

  /**
   * Get all waitlist entries (admin only)
   */
  async getAll(filters?: {
    limit?: number
    offset?: number
    sortBy?: 'email' | 'created_at'
    sortOrder?: 'asc' | 'desc'
  }): Promise<WaitlistResponse> {
    const query = filters ? buildQueryParams(filters) : ''
    return fetchAPI(`/admin/waitlist${query}`)
  },
}

/**
 * Stats/Analytics API endpoints
 */
export const statsAPI = {
  /**
   * Track cafe statistic (view, directions, passport mark, social click)
   */
  async trackCafeStat(
    cafeId: number,
    stat: 'view' | 'directions' | 'passport' | 'instagram' | 'tiktok',
    userId?: number | null
  ): Promise<void> {
    // Use fetchAPI but ignore response (fire-and-forget)
    await fetchAPI(`/stats/cafe/${cafeId}/${stat}`, {
      method: 'POST',
      body: JSON.stringify({ userId: userId ?? null }),
    }).catch(() => {}) // Ignore errors silently
  },


  /**
   * Track event click
   */
  async trackEventClick(eventId: number, userId?: number | null): Promise<void> {
    await fetchAPI(`/stats/event/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({ userId: userId ?? null }),
    }).catch(() => {})
  },
}

/**
 * Admin Analytics API endpoints
 */
export const adminAnalyticsAPI = {
  /**
   * Get cafe performance statistics (admin only)
   */
  async getCafeStats(): Promise<{
    stats: CafeStats[]
  }> {
    return fetchAPI('/admin/cafe-stats')
  },
}

/**
 * Export all APIs
 */
export const api = {
  cafes: cafeAPI,
  cities: citiesAPI,
  events: eventsAPI,
  health: healthAPI,
  places: placesAPI,
  drinks: drinksAPI,
  admin: adminAPI,
  waitlist: waitlistAPI,
  stats: statsAPI,
  adminAnalytics: adminAnalyticsAPI,
}

export default api
