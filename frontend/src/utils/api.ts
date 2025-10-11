/**
 * API client for MatchaMap backend
 * Handles all communication with Cloudflare Workers API
 */

import { useAuthStore } from '../stores/authStore'
import { useSessionExpiry } from '../hooks/useSessionExpiry'
import type { Cafe, Drink, FeedItem, Event, PublicUserProfile, UpdateProfileRequest, UserProfile, CityWithCount, User } from '../../../shared/types'

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit & { bustCache?: boolean }): Promise<T> {
  try {
    let url = `${API_BASE_URL}/api${endpoint}`

    // Add cache-busting parameter for GET requests when bustCache is true
    if (options?.bustCache && (!options?.method || options.method === 'GET')) {
      const separator = url.includes('?') ? '&' : '?'
      url += `${separator}_=${Date.now()}`
    }

    // Get auth token from store
    const token = useAuthStore.getState().accessToken

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers as Record<string, string>,
    }

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
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
  } catch (error) {
    throw error
  }
}

/**
 * Cafe API endpoints
 */
export const cafeAPI = {
  /**
   * Get all cafes with optional filtering
   */
  async getAll(filters?: {
    city?: string
    minScore?: number
    maxPrice?: number
    limit?: number
    offset?: number
  }, bustCache = false): Promise<{ cafes: Cafe[]; total: number; hasMore: boolean }> {
    const params = new URLSearchParams()
    if (filters?.city) params.append('city', filters.city)
    if (filters?.minScore) params.append('minScore', filters.minScore.toString())
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
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
 * Feed API endpoints (Legacy - Deprecated)
 * 
 * TODO(Phase 2): Replace with activity_feed system
 * See: docs/feed-refactoring-plan.md
 */
export const feedAPI = {
  /**
   * Get feed items with optional filtering
   */
  async getAll(filters?: {
    type?: string
    limit?: number
    offset?: number
  }, bustCache = false): Promise<{ items: FeedItem[]; hasMore: boolean }> {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchAPI(`/feed${query}`, { bustCache })
  },

  /**
   * Get all feed items including unpublished (admin only)
   */
  async getAllAdmin(filters?: {
    published?: boolean
    limit?: number
    offset?: number
  }): Promise<{ items: FeedItem[]; hasMore: boolean }> {
    const params = new URLSearchParams()
    if (filters?.published !== undefined) params.append('published', filters.published.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchAPI(`/admin/feed${query}`)
  },

  /**
   * Get single feed item by ID (admin only)
   */
  async getById(id: number): Promise<FeedItem> {
    return fetchAPI(`/admin/feed/${id}`)
  },

  /**
   * Create new feed item (admin only)
   */
  async create(feedItem: Partial<FeedItem>): Promise<FeedItem> {
    return fetchAPI('/admin/feed', {
      method: 'POST',
      body: JSON.stringify(feedItem),
    })
  },

  /**
   * Update feed item (admin only)
   */
  async update(id: number, feedItem: Partial<FeedItem>): Promise<FeedItem> {
    return fetchAPI(`/admin/feed/${id}`, {
      method: 'PUT',
      body: JSON.stringify(feedItem),
    })
  },

  /**
   * Delete feed item (admin only)
   */
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    return fetchAPI(`/admin/feed/${id}`, {
      method: 'DELETE',
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
    limit?: number
  }, bustCache = false): Promise<{ events: Event[] }> {
    const params = new URLSearchParams()
    if (filters?.upcoming !== undefined) params.append('upcoming', filters.upcoming.toString())
    if (filters?.featured !== undefined) params.append('featured', filters.featured.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchAPI(`/events${query}`, { bustCache })
  },

  /**
   * Get all events including unpublished (admin only)
   */
  async getAllAdmin(filters?: {
    published?: boolean
    limit?: number
    offset?: number
  }): Promise<{ events: Event[]; hasMore: boolean }> {
    const params = new URLSearchParams()
    if (filters?.published !== undefined) params.append('published', filters.published.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchAPI(`/admin/events${query}`)
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
export const adminAPI = {
  /**
   * Bulk import cafes and drinks from CSV
   */
  async bulkImportCafes(data: { cafes: Partial<Cafe>[] }): Promise<{
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
  }): Promise<{
    waitlist: Array<{
      id: number
      email: string
      referralSource?: string
      converted: boolean
      userId?: number
      createdAt: string
      convertedAt?: string
    }>
    total: number
    hasMore: boolean
    analytics: {
      totalSignups: number
      dailySignups: number
      weeklySignups: number
      conversionRate: number
    }
  }> {
    const params = new URLSearchParams()
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchAPI(`/admin/waitlist${query}`)
  },
}

/**
 * User Profile API endpoints
 */
export const profileAPI = {
  /**
   * Get public user profile by username
   */
  async getUserProfile(username: string): Promise<PublicUserProfile> {
    return fetchAPI(`/users/${username}/profile`)
  },

  /**
   * Get own profile (authenticated)
   */
  async getMyProfile(): Promise<UserProfile> {
    return fetchAPI('/users/me/profile')
  },

  /**
   * Update own profile (authenticated)
   */
  async updateMyProfile(updates: UpdateProfileRequest): Promise<UserProfile> {
    return fetchAPI('/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  /**
   * Upload avatar (authenticated)
   * TODO: Implement Cloudflare Images upload
   */
  async uploadAvatar(_file: File): Promise<{ avatarUrl: string }> {
    // TODO: Implement multipart upload
    throw new Error('Avatar upload not yet implemented')
  },
}

/**
 * User Admin API endpoints (admin only)
 */
export interface AdminUserListItem {
  id: number
  email: string
  username: string
  role: 'admin' | 'user'
  isEmailVerified: boolean
  lastActiveAt: string | null
  createdAt: string
  displayName: string | null
  avatarUrl: string | null
  totalCheckins: number
  totalReviews: number
  reputationScore: number
}

export interface AdminUserStats {
  totalUsers: number
  adminUsers: number
  regularUsers: number
  activeThisWeek: number
  newThisMonth: number
}

export const userAdminAPI = {
  /**
   * List all users (admin only)
   */
  async listUsers(filters?: {
    limit?: number
    offset?: number
    search?: string
    role?: 'admin' | 'user'
  }): Promise<{
    users: AdminUserListItem[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }> {
    const params = new URLSearchParams()
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    if (filters?.search) params.append('search', filters.search)
    if (filters?.role) params.append('role', filters.role)

    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchAPI(`/admin/users${query}`)
  },

  /**
   * Get user statistics (admin only)
   */
  async getStats(): Promise<AdminUserStats> {
    return fetchAPI('/admin/users/stats')
  },

  /**
   * Get single user details (admin only)
   */
  async getUser(id: number): Promise<{
    user: User
    profile: UserProfile | null
    stats: { totalCheckins: number }
  }> {
    return fetchAPI(`/admin/users/${id}`)
  },

  /**
   * Update user role (admin only)
   */
  async updateUserRole(id: number, role: 'admin' | 'user'): Promise<{ user: User }> {
    return fetchAPI(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    })
  },

  /**
   * Delete user (admin only)
   */
  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    return fetchAPI(`/admin/users/${id}`, {
      method: 'DELETE',
    })
  },
}

/**
 * Export all APIs
 */
export const api = {
  cafes: cafeAPI,
  cities: citiesAPI,
  feed: feedAPI,
  events: eventsAPI,
  health: healthAPI,
  places: placesAPI,
  drinks: drinksAPI,
  admin: adminAPI,
  waitlist: waitlistAPI,
  profile: profileAPI,
  userAdmin: userAdminAPI,
}

export default api
