/**
 * API client for MatchaMap backend
 * Handles all communication with Cloudflare Workers API
 */

import { useAuthStore } from '../stores/authStore'
import { useSessionExpiry } from '../hooks/useSessionExpiry'
import type { Cafe, Drink, Event, PublicUserProfile, UpdateProfileRequest, UserProfile, CityWithCount, User, UserFavorite, FavoritesResponse, AddFavoriteRequest, UpdateFavoriteNotesRequest, UserReview, ReviewPhoto, ReviewComment, BadgesResponse, BadgeCheckResponse, BadgeProgressResponse, BadgeDefinitionsResponse, FollowersResponse, FollowingResponse, FollowStatusResponse, FollowActionResponse, WaitlistResponse, CafeSuggestion, CreateSuggestionRequest, SuggestionsResponse, ApproveSuggestionRequest, RejectSuggestionRequest, UserList, UserListItem, CreateListRequest, UpdateListRequest, AddListItemRequest, ListsResponse, ListDetailResponse } from '../../../shared/types'

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
export const adminAPI = {

  /**
   * Get photos pending moderation (admin only)
   */
  async getPhotosForModeration(filters?: {
    limit?: number
    offset?: number
  }): Promise<{ photos: ReviewPhoto[]; total: number; hasMore: boolean }> {
    const query = filters ? buildQueryParams(filters) : ''
    return fetchAPI(`/admin/photos${query}`)
  },

  /**
   * Moderate a photo (approve/reject) (admin only)
   */
  async moderatePhoto(photoId: number, data: {
    status: 'approved' | 'rejected'
    notes?: string
  }): Promise<{ photo: ReviewPhoto; message: string }> {
    return fetchAPI(`/admin/photos/${photoId}/moderate`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get moderation queue (all pending items) (admin only)
   */
  async getModerationQueue(): Promise<{
    photos: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    reviews: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    comments: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    stats: {
      photos: { pending: number; total: number };
      reviews: { pending: number; total: number };
      comments: { pending: number; total: number };
    };
  }> {
    return fetchAPI('/admin/moderation/queue')
  },

  /**
   * Bulk moderate items (admin only)
   */
  async bulkModerate(data: {
    items: Array<{ id: number; type: 'photo' | 'review' | 'comment' }>;
    status: 'approved' | 'rejected';
    notes?: string;
  }): Promise<{
    results: { success: number; failed: number; errors: string[] };
    message: string;
  }> {
    return fetchAPI('/admin/moderation/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get moderation statistics (admin only)
   */
  async getModerationStats(): Promise<{
    photos: Record<string, number>;
    reviews: Record<string, number>;
    comments: Record<string, number>;
    total: {
      pending: number;
      approved: number;
      rejected: number;
      flagged: number;
    };
  }> {
    return fetchAPI('/admin/moderation/stats')
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
  }): Promise<WaitlistResponse> {
    const query = filters ? buildQueryParams(filters) : ''
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
    const query = filters ? buildQueryParams(filters) : ''
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

  /**
   * Check in to a cafe (authenticated users only)
   */
  async checkIn(cafeId: number, notes?: string): Promise<void> {
    await fetchAPI('/checkins', {
      method: 'POST',
      body: JSON.stringify({ cafeId, notes }),
    })
  },

  /**
   * Get my check-ins (authenticated users only)
   */
  async getMyCheckins(): Promise<{ checkins: Array<{
    id: number
    cafeId: number
    visitedAt: string
    notes: string | null
    cafe: {
      id: number
      name: string
      slug: string
      address: string | null
      latitude: number
      longitude: number
      city: string
      quickNote: string
      instagram: string | null
      tiktokPostLink: string | null
      instagramPostLink: string | null
    } | null
  }> }> {
    return fetchAPI('/users/me/checkins')
  },

  /**
   * Get my passport (detailed statistics and achievements)
   */
  async getMyPassport(): Promise<{ passport: {
    stats: {
      totalCafes: number
      visitedCafes: number
      completionPercentage: number
      visitedCafeIds: number[]
    }
    achievements: {
      milestones: Array<{
        threshold: number
        name: string
        achieved: boolean
      }>
      nextMilestone: {
        name: string
        threshold: number
        progress: number
        remaining: number
      } | null
    }
    cityBreakdown: Record<string, number>
    recentCheckins: Array<{
      id: number
      cafeId: number
      visitedAt: string
      notes: string | null
      cafe: {
        id: number
        name: string
        slug: string
        city: string
      } | null
    }>
    lastUpdated: string
  } }> {
    return fetchAPI('/users/me/passport')
  },

  /**
   * Get my passport (simplified - just visited cafe IDs)
   */
  async getMyPassportSimple(): Promise<{
    visitedCafeIds: number[]
    visitedCount: number
  }> {
    return fetchAPI('/users/me/passport/simple')
  },
}

/**
 * User Favorites API endpoints
 */
export const favoritesAPI = {
  /**
   * Get my favorites with cafe data
   */
  async getMyFavorites(): Promise<FavoritesResponse> {
    return fetchAPI('/users/me/favorites')
  },

  /**
   * Add cafe to favorites
   */
  async addFavorite(data: AddFavoriteRequest): Promise<{ success: boolean; favorite: UserFavorite }> {
    return fetchAPI('/users/me/favorites', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Remove cafe from favorites
   */
  async removeFavorite(cafeId: number): Promise<{ success: boolean; removed: boolean }> {
    return fetchAPI(`/users/me/favorites/${cafeId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Update favorite notes
   */
  async updateFavoriteNotes(cafeId: number, data: UpdateFavoriteNotesRequest): Promise<{ success: boolean; favorite: UserFavorite }> {
    return fetchAPI(`/users/me/favorites/${cafeId}/notes`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

/**
 * Lists API endpoints (Phase 2E)
 */
export const listsAPI = {
  /**
   * Get my lists
   */
  async getMyLists(): Promise<ListsResponse> {
    return fetchAPI('/lists/me')
  },

  /**
   * Create a new list
   */
  async createList(data: CreateListRequest): Promise<{ list: UserList }> {
    return fetchAPI('/lists', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get list details with items
   */
  async getListById(id: number): Promise<ListDetailResponse> {
    return fetchAPI(`/lists/${id}`)
  },

  /**
   * Update list
   */
  async updateList(id: number, data: UpdateListRequest): Promise<{ list: UserList }> {
    return fetchAPI(`/lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete list
   */
  async deleteList(id: number): Promise<{ message: string }> {
    return fetchAPI(`/lists/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Add cafe to list
   */
  async addListItem(listId: number, data: AddListItemRequest): Promise<{ item: UserListItem }> {
    return fetchAPI(`/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Remove cafe from list
   */
  async removeListItem(listId: number, cafeId: number): Promise<{ message: string }> {
    return fetchAPI(`/lists/${listId}/items/${cafeId}`, {
      method: 'DELETE',
    })
  },
}

/**
 * Reviews API endpoints (Phase 2B)
 */
export interface CreateReviewRequest {
  overallRating: number
  matchaQualityRating?: number | null
  ambianceRating?: number | null
  serviceRating?: number | null
  valueRating?: number | null
  title?: string
  content: string
  tags?: string[]
  visitDate?: string
  isPublic: boolean
  photoIds?: number[]
}

export const reviewsAPI = {
  /**
   * Create a new review for a cafe
   */
  async create(cafeId: number, data: CreateReviewRequest): Promise<{ review: UserReview }> {
    return fetchAPI(`/cafes/${cafeId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get reviews for a cafe
   */
  async getForCafe(cafeId: number, filters?: {
    page?: number
    limit?: number
    offset?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    minRating?: number
    maxRating?: number
  }): Promise<{ reviews: UserReview[]; total: number; hasMore: boolean }> {
    const query = filters ? buildQueryParams(filters) : ''
    return fetchAPI(`/cafes/${cafeId}/reviews${query}`)
  },

  /**
   * Get reviews for a cafe (legacy method name for compatibility)
   */
  async getByCafe(cafeId: number, filters?: {
    limit?: number
    offset?: number
    sortBy?: 'newest' | 'oldest' | 'rating_high' | 'rating_low'
  }): Promise<{ reviews: UserReview[]; total: number; hasMore: boolean }> {
    return this.getForCafe(cafeId, filters)
  },

  /**
   * Get my reviews (authenticated)
   */
  async getMyReviews(filters?: {
    limit?: number
    offset?: number
  }): Promise<{ reviews: UserReview[]; total: number; hasMore: boolean }> {
    const query = filters ? buildQueryParams(filters) : ''
    return fetchAPI(`/users/me/reviews${query}`)
  },

  /**
   * Update my review
   */
  async update(reviewId: number, data: Partial<CreateReviewRequest>): Promise<{ review: UserReview }> {
    return fetchAPI(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete my review
   */
  async delete(reviewId: number): Promise<{ success: boolean; message: string }> {
    return fetchAPI(`/reviews/${reviewId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Vote on a review (helpful/unhelpful)
   */
  async vote(reviewId: number, isHelpful: boolean): Promise<{ success: boolean; newCount: number }> {
    return fetchAPI(`/reviews/${reviewId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ isHelpful }),
    })
  },
}

/**
 * Request/Response types for comments
 */
interface CreateCommentRequest {
  content: string
  parentCommentId?: number
}

interface UpdateCommentRequest {
  content: string
}

/**
 * Comments API endpoints (Phase 2F)
 */
export const commentsAPI = {
  /**
   * Get comments for a review
   */
  async getForReview(reviewId: number, filters?: {
    limit?: number
    offset?: number
    sortBy?: 'recent' | 'likes'
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ comments: ReviewComment[]; total: number; hasMore: boolean }> {
    const params = new URLSearchParams()
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchAPI(`/reviews/${reviewId}/comments${query}`)
  },

  /**
   * Create a new comment on a review
   */
  async create(reviewId: number, data: CreateCommentRequest): Promise<{ comment: ReviewComment }> {
    return fetchAPI(`/reviews/${reviewId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update a comment (user's own)
   */
  async update(commentId: number, data: UpdateCommentRequest): Promise<{ success: boolean }> {
    return fetchAPI(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete a comment (user's own)
   */
  async delete(commentId: number): Promise<{ success: boolean }> {
    return fetchAPI(`/comments/${commentId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Like a comment
   */
  async like(commentId: number): Promise<{ success: boolean }> {
    return fetchAPI(`/comments/${commentId}/like`, {
      method: 'POST',
    })
  },

  /**
   * Unlike a comment
   */
  async unlike(commentId: number): Promise<{ success: boolean }> {
    return fetchAPI(`/comments/${commentId}/like`, {
      method: 'DELETE',
    })
  },
}

/**
 * Photos API endpoints (Phase 2C)
 */
export const photosAPI = {
  /**
   * Upload a photo with associated metadata
   */
  async upload(formData: FormData): Promise<{ photo: ReviewPhoto }> {
    // Don't use fetchAPI for file uploads - need special handling
    const response = await fetch(`${API_BASE_URL}/api/photos/upload`, {
      method: 'POST',
      credentials: 'include', // Include auth cookies
      body: formData, // Don't set Content-Type for FormData
    })

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        useAuthStore.getState().clearAuth()
        const currentPath = window.location.pathname + window.location.search
        useSessionExpiry.getState().showSessionExpiredDialog(currentPath)
        throw new Error('Authentication required')
      }

      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * Get photos for a cafe
   */
  async getByCafe(cafeId: number, filters?: {
    limit?: number
    offset?: number
  }): Promise<{ photos: ReviewPhoto[]; total: number; hasMore: boolean }> {
    const query = filters ? buildQueryParams(filters) : ''
    return fetchAPI(`/cafes/${cafeId}/photos${query}`)
  },

  /**
   * Get my photos (authenticated)
   */
  async getMyPhotos(filters?: {
    limit?: number
    offset?: number
  }): Promise<{ photos: ReviewPhoto[]; total: number; hasMore: boolean }> {
    const query = filters ? buildQueryParams(filters) : ''
    return fetchAPI(`/users/me/photos${query}`)
  },

  /**
   * Delete my photo
   */
  async delete(photoId: number): Promise<{ success: boolean; message: string }> {
    return fetchAPI(`/photos/${photoId}`, {
      method: 'DELETE',
    })
  },
}

/**
 * Badges API endpoints (Phase 2C)
 */
export const badgesAPI = {
  /**
   * Get my earned badges (authenticated)
   */
  async getMyBadges(): Promise<BadgesResponse> {
    return fetchAPI('/users/me/badges')
  },

  /**
   * Check for new badges and award them (authenticated)
   */
  async checkAndAward(): Promise<BadgeCheckResponse> {
    return fetchAPI('/users/me/badges/check', {
      method: 'POST',
    })
  },

  /**
   * Get my badge progress (authenticated)
   */
  async getMyProgress(): Promise<BadgeProgressResponse> {
    return fetchAPI('/users/me/badges/progress')
  },

  /**
   * Get all badge definitions (public)
   */
  async getDefinitions(): Promise<BadgeDefinitionsResponse> {
    return fetchAPI('/badges/definitions')
  },
}

/**
 * Following API endpoints (Phase 2D)
 */
export const followingAPI = {
  /**
   * Follow a user (authenticated)
   */
  async followUser(username: string): Promise<FollowActionResponse> {
    return fetchAPI(`/users/${username}/follow`, {
      method: 'POST',
    })
  },

  /**
   * Unfollow a user (authenticated)
   */
  async unfollowUser(username: string): Promise<FollowActionResponse> {
    return fetchAPI(`/users/${username}/follow`, {
      method: 'DELETE',
    })
  },

  /**
   * Get user's followers (public, respects privacy settings)
   */
  async getFollowers(username: string): Promise<FollowersResponse> {
    return fetchAPI(`/users/${username}/followers`)
  },

  /**
   * Get users that user is following (public, respects privacy settings)
   */
  async getFollowing(username: string): Promise<FollowingResponse> {
    return fetchAPI(`/users/${username}/following`)
  },

  /**
   * Get follow status for a user (authenticated)
   */
  async getFollowStatus(username: string): Promise<FollowStatusResponse> {
    return fetchAPI(`/users/${username}/follow-status`)
  },
}

/**
 * Leaderboard API endpoints
 */
export const leaderboardAPI = {
  /**
   * Get passport leaderboard (most cafes visited)
   */
  async getPassportLeaderboard(params?: {
    period?: 'all' | 'monthly'
    city?: string
    limit?: number
  }): Promise<{
    leaderboard: Array<{
      rank: number
      userId: number
      username: string
      displayName?: string | null
      avatarUrl?: string | null
      totalCheckins: number
      passportCompletion: number
      location?: string | null
    }>
    metadata: {
      type: 'passport'
      period: string
      city: string
      limit: number
      generatedAt: string
    }
  }> {
    const query = new URLSearchParams()
    if (params?.period) query.append('period', params.period)
    if (params?.city) query.append('city', params.city)
    if (params?.limit) query.append('limit', params.limit.toString())

    const queryString = query.toString() ? `?${query.toString()}` : ''
    return fetchAPI(`/leaderboard/passport${queryString}`)
  },

  /**
   * Get reviewer leaderboard (most helpful reviews)
   */
  async getReviewerLeaderboard(params?: {
    period?: 'all' | 'monthly'
    city?: string
    limit?: number
  }): Promise<{
    leaderboard: Array<{
      rank: number
      userId: number
      username: string
      displayName?: string | null
      avatarUrl?: string | null
      totalReviews: number
      reputationScore: number
      location?: string | null
    }>
    metadata: {
      type: 'reviewers'
      period: string
      city: string
      limit: number
      generatedAt: string
    }
  }> {
    const query = new URLSearchParams()
    if (params?.period) query.append('period', params.period)
    if (params?.city) query.append('city', params.city)
    if (params?.limit) query.append('limit', params.limit.toString())

    const queryString = query.toString() ? `?${query.toString()}` : ''
    return fetchAPI(`/leaderboard/reviewers${queryString}`)
  },

  /**
   * Get contributor leaderboard (total contributions)
   */
  async getContributorLeaderboard(params?: {
    period?: 'all' | 'monthly'
    city?: string
    limit?: number
  }): Promise<{
    leaderboard: Array<{
      rank: number
      userId: number
      username: string
      displayName?: string | null
      avatarUrl?: string | null
      totalReviews: number
      totalPhotos: number
      totalFavorites: number
      totalContributions: number
      reputationScore: number
      location?: string | null
    }>
    metadata: {
      type: 'contributors'
      period: string
      city: string
      limit: number
      generatedAt: string
    }
  }> {
    const query = new URLSearchParams()
    if (params?.period) query.append('period', params.period)
    if (params?.city) query.append('city', params.city)
    if (params?.limit) query.append('limit', params.limit.toString())

    const queryString = query.toString() ? `?${query.toString()}` : ''
    return fetchAPI(`/leaderboard/contributors${queryString}`)
  },

  /**
   * Get user's rank in specified leaderboard
   */
  async getUserRank(params: {
    type: 'passport' | 'reviewers' | 'contributors'
    period?: 'all' | 'monthly'
    city?: string
  }): Promise<{
    userRank: {
      rank: number
      userId: number
      totalCheckins?: number
      totalReviews?: number
      reputationScore?: number
      totalContributions?: number
    } | null
    metadata: {
      type: string
      period: string
      city: string
      userId: number
      generatedAt: string
    }
  }> {
    const query = new URLSearchParams()
    query.append('type', params.type)
    if (params?.period) query.append('period', params.period)
    if (params?.city) query.append('city', params.city)

    return fetchAPI(`/leaderboard/rank?${query.toString()}`)
  },
}

/**
 * Cafe Suggestions API endpoints
 */
export const suggestionsAPI = {
  /**
   * Submit a new cafe suggestion
   */
  async create(data: CreateSuggestionRequest): Promise<{ success: boolean; suggestion: CafeSuggestion }> {
    return fetchAPI('/cafe-suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get current user's cafe suggestions
   */
  async getMySuggestions(): Promise<SuggestionsResponse> {
    return fetchAPI('/users/me/suggestions')
  },

  /**
   * Admin: Get all pending cafe suggestions
   */
  async getPendingSuggestions(): Promise<SuggestionsResponse> {
    return fetchAPI('/admin/cafe-suggestions')
  },

  /**
   * Admin: Approve a cafe suggestion
   */
  async approve(id: number, data: ApproveSuggestionRequest): Promise<{ success: boolean; suggestion: CafeSuggestion }> {
    return fetchAPI(`/admin/cafe-suggestions/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Admin: Reject a cafe suggestion
   */
  async reject(id: number, data: RejectSuggestionRequest): Promise<{ success: boolean; suggestion: CafeSuggestion }> {
    return fetchAPI(`/admin/cafe-suggestions/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
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
  profile: profileAPI,
  userAdmin: userAdminAPI,
  stats: statsAPI,
  favorites: favoritesAPI,
  lists: listsAPI,
  reviews: reviewsAPI,
  comments: commentsAPI,
  photos: photosAPI,
  badges: badgesAPI,
  following: followingAPI,
  leaderboard: leaderboardAPI,
  suggestions: suggestionsAPI,
}

export default api
