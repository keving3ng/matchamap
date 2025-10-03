/**
 * API client for MatchaMap backend
 * Handles all communication with Cloudflare Workers API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api'

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
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
  }): Promise<{ cafes: any[]; total: number; hasMore: boolean }> {
    const params = new URLSearchParams()
    if (filters?.city) params.append('city', filters.city)
    if (filters?.minScore) params.append('minScore', filters.minScore.toString())
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchAPI(`/cafes${query}`)
  },

  /**
   * Get single cafe by ID with drinks
   */
  async getById(id: number): Promise<{ cafe: any; drinks: any[] }> {
    return fetchAPI(`/cafes/${id}`)
  },

  /**
   * Create new cafe (admin only)
   */
  async create(cafe: any): Promise<{ cafe: any }> {
    return fetchAPI('/admin/cafes', {
      method: 'POST',
      body: JSON.stringify(cafe),
    })
  },

  /**
   * Update cafe (admin only)
   */
  async update(id: number, cafe: any): Promise<{ cafe: any }> {
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
}

/**
 * Feed API endpoints
 */
export const feedAPI = {
  /**
   * Get feed items with optional filtering
   */
  async getAll(filters?: {
    type?: string
    limit?: number
    offset?: number
  }): Promise<{ items: any[]; hasMore: boolean }> {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchAPI(`/feed${query}`)
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
  }): Promise<{ events: any[] }> {
    const params = new URLSearchParams()
    if (filters?.upcoming !== undefined) params.append('upcoming', filters.upcoming.toString())
    if (filters?.featured !== undefined) params.append('featured', filters.featured.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchAPI(`/events${query}`)
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
 * Places API endpoints (Google Maps lookup)
 */
export const placesAPI = {
  /**
   * Lookup place details from Google Maps URL
   */
  async lookup(googleMapsUrl: string): Promise<{ place: any }> {
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
  async getAll(cafeId: number): Promise<{ drinks: any[] }> {
    return fetchAPI(`/admin/cafes/${cafeId}/drinks`)
  },

  /**
   * Create new drink (admin only)
   */
  async create(cafeId: number, drink: any): Promise<{ drink: any }> {
    return fetchAPI(`/admin/cafes/${cafeId}/drinks`, {
      method: 'POST',
      body: JSON.stringify(drink),
    })
  },

  /**
   * Update drink (admin only)
   */
  async update(id: number, drink: any): Promise<{ drink: any }> {
    return fetchAPI(`/admin/drinks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(drink),
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
  async bulkImportCafes(data: { cafes: any[] }): Promise<{
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
 * Export all APIs
 */
export const api = {
  cafes: cafeAPI,
  feed: feedAPI,
  events: eventsAPI,
  health: healthAPI,
  places: placesAPI,
  drinks: drinksAPI,
  admin: adminAPI,
}

export default api
