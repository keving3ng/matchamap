import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api } from '../api'
import type { UserFavorite, AddFavoriteRequest, UpdateFavoriteNotesRequest } from '../../../../shared/types'
import { createMockCafe } from '../../test/helpers'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('favoritesAPI', () => {
  const mockFavorite: UserFavorite = {
    id: 1,
    userId: 1,
    cafeId: 123,
    notes: 'Great matcha!',
    sortOrder: 0,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    cafe: createMockCafe({ id: 123, name: 'Test Cafe' }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMyFavorites', () => {
    it('should fetch user favorites with cafe data', async () => {
      const mockResponse = {
        favorites: [mockFavorite],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.favorites.getMyFavorites()

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/me/favorites'),
        expect.objectContaining({
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should handle empty favorites list', async () => {
      const mockResponse = {
        favorites: [],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.favorites.getMyFavorites()

      expect(result).toEqual(mockResponse)
      expect(result.favorites).toHaveLength(0)
    })

    it('should handle 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Not authenticated' }),
      })

      await expect(api.favorites.getMyFavorites()).rejects.toThrow()
    })
  })

  describe('addFavorite', () => {
    it('should add cafe to favorites without notes', async () => {
      const request: AddFavoriteRequest = {
        cafeId: 123,
      }

      const mockResponse = {
        success: true,
        favorite: mockFavorite,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.favorites.addFavorite(request)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/me/favorites'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(request),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should add cafe to favorites with notes', async () => {
      const request: AddFavoriteRequest = {
        cafeId: 123,
        notes: 'Best matcha in town!',
      }

      const mockResponse = {
        success: true,
        favorite: { ...mockFavorite, notes: 'Best matcha in town!' },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.favorites.addFavorite(request)

      expect(result).toEqual(mockResponse)
      expect(result.favorite.notes).toBe('Best matcha in town!')
    })

    it('should handle invalid cafeId error', async () => {
      const request: AddFavoriteRequest = {
        cafeId: 999999,
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Cafe not found' }),
      })

      await expect(api.favorites.addFavorite(request)).rejects.toThrow()
    })

    it('should handle upsert behavior (updating existing favorite)', async () => {
      const request: AddFavoriteRequest = {
        cafeId: 123,
        notes: 'Updated notes',
      }

      const mockResponse = {
        success: true,
        favorite: { ...mockFavorite, notes: 'Updated notes', updatedAt: '2023-12-31T00:00:00Z' },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.favorites.addFavorite(request)

      expect(result.success).toBe(true)
      expect(result.favorite.notes).toBe('Updated notes')
    })

    it('should handle notes length validation error', async () => {
      const request: AddFavoriteRequest = {
        cafeId: 123,
        notes: 'a'.repeat(501), // Exceeds 500 character limit
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Notes must be a string with max 500 characters' }),
      })

      await expect(api.favorites.addFavorite(request)).rejects.toThrow()
    })

    it('should handle 401 unauthorized error', async () => {
      const request: AddFavoriteRequest = {
        cafeId: 123,
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Not authenticated' }),
      })

      await expect(api.favorites.addFavorite(request)).rejects.toThrow()
    })
  })

  describe('removeFavorite', () => {
    it('should remove favorite successfully', async () => {
      const mockResponse = {
        success: true,
        removed: true,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.favorites.removeFavorite(123)

      expect(result).toEqual(mockResponse)
      expect(result.removed).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/me/favorites/123'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should be idempotent (removing non-existent favorite)', async () => {
      const mockResponse = {
        success: true,
        removed: false,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.favorites.removeFavorite(999)

      expect(result.success).toBe(true)
      expect(result.removed).toBe(false)
    })

    it('should handle invalid cafeId parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Valid cafeId is required' }),
      })

      await expect(api.favorites.removeFavorite(NaN as any)).rejects.toThrow()
    })

    it('should handle 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Not authenticated' }),
      })

      await expect(api.favorites.removeFavorite(123)).rejects.toThrow()
    })
  })

  describe('updateFavoriteNotes', () => {
    it('should update notes successfully', async () => {
      const request: UpdateFavoriteNotesRequest = {
        notes: 'Updated notes',
      }

      const mockResponse = {
        success: true,
        favorite: { ...mockFavorite, notes: 'Updated notes', updatedAt: '2023-12-31T00:00:00Z' },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.favorites.updateFavoriteNotes(123, request)

      expect(result).toEqual(mockResponse)
      expect(result.favorite.notes).toBe('Updated notes')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/me/favorites/123/notes'),
        expect.objectContaining({
          method: 'PUT',
          credentials: 'include',
          body: JSON.stringify(request),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should clear notes when set to empty string', async () => {
      const request: UpdateFavoriteNotesRequest = {
        notes: '',
      }

      const mockResponse = {
        success: true,
        favorite: { ...mockFavorite, notes: null },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.favorites.updateFavoriteNotes(123, request)

      expect(result.favorite.notes).toBeNull()
    })

    it('should handle favorite not found error', async () => {
      const request: UpdateFavoriteNotesRequest = {
        notes: 'New notes',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Favorite not found' }),
      })

      await expect(api.favorites.updateFavoriteNotes(999, request)).rejects.toThrow()
    })

    it('should handle notes length validation error', async () => {
      const request: UpdateFavoriteNotesRequest = {
        notes: 'a'.repeat(501),
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Notes must be a string with max 500 characters' }),
      })

      await expect(api.favorites.updateFavoriteNotes(123, request)).rejects.toThrow()
    })

    it('should handle 401 unauthorized error', async () => {
      const request: UpdateFavoriteNotesRequest = {
        notes: 'New notes',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Not authenticated' }),
      })

      await expect(api.favorites.updateFavoriteNotes(123, request)).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(api.favorites.getMyFavorites()).rejects.toThrow('Network error')
    })

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(api.favorites.getMyFavorites()).rejects.toThrow()
    })

    it('should handle rate limiting (429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Too many requests' }),
      })

      await expect(api.favorites.addFavorite({ cafeId: 123 })).rejects.toThrow()
    })
  })

  describe('type safety', () => {
    it('should properly type the response from getMyFavorites', async () => {
      const mockResponse = {
        favorites: [mockFavorite],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.favorites.getMyFavorites()

      // Type assertions to verify compile-time type safety
      expect(result.favorites).toBeDefined()
      expect(Array.isArray(result.favorites)).toBe(true)

      if (result.favorites.length > 0) {
        const favorite = result.favorites[0]
        expect(favorite.id).toBeDefined()
        expect(favorite.userId).toBeDefined()
        expect(favorite.cafeId).toBeDefined()
        expect(favorite.cafe).toBeDefined()
      }
    })

    it('should properly type the request for addFavorite', async () => {
      const request: AddFavoriteRequest = {
        cafeId: 123,
        notes: 'Test notes',
      }

      const mockResponse = {
        success: true,
        favorite: mockFavorite,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.favorites.addFavorite(request)

      expect(result.success).toBeDefined()
      expect(result.favorite).toBeDefined()
    })
  })
})
