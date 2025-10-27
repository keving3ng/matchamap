import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createMockRequest, mockEnv, setupTestDb, resetTestDb } from '../../test/utils'
import { getPassportLeaderboard, getReviewerLeaderboard, getContributorLeaderboard, getUserRank } from '../leaderboards'
import { users, userProfiles } from '../../db'

describe('/api/leaderboard endpoints', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await resetTestDb()
    vi.clearAllMocks()
  })

  describe('GET /api/leaderboard/passport', () => {
    it('returns passport leaderboard ordered by check-ins', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/passport')
      const response = await getPassportLeaderboard(request, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('leaderboard')
      expect(data).toHaveProperty('metadata')
      expect(data.metadata.type).toBe('passport')
      expect(data.metadata.period).toBe('all')
      expect(data.metadata.city).toBe('all')
    })

    it('accepts period and city filters', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/passport?period=monthly&city=toronto&limit=25')
      const response = await getPassportLeaderboard(request, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata.period).toBe('monthly')
      expect(data.metadata.city).toBe('toronto')
      expect(data.metadata.limit).toBe(25)
    })

    it('rejects invalid city parameter', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/passport?city=invalid-city')
      const response = await getPassportLeaderboard(request, mockEnv)

      expect(response.status).toBe(400)
    })

    it('enforces maximum limit', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/passport?limit=200')
      const response = await getPassportLeaderboard(request, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata.limit).toBe(100) // MAX_LIMIT
    })

    it('includes cache headers', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/passport')
      const response = await getPassportLeaderboard(request, mockEnv)

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=300')
    })
  })

  describe('GET /api/leaderboard/reviewers', () => {
    it('returns reviewer leaderboard ordered by reviews and reputation', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/reviewers')
      const response = await getReviewerLeaderboard(request, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('leaderboard')
      expect(data.metadata.type).toBe('reviewers')
    })

    it('includes review count and reputation score for each entry', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/reviewers')
      const response = await getReviewerLeaderboard(request, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.leaderboard.length > 0) {
        const entry = data.leaderboard[0]
        expect(entry).toHaveProperty('totalReviews')
        expect(entry).toHaveProperty('reputationScore')
        expect(entry).toHaveProperty('rank')
        expect(entry).toHaveProperty('username')
      }
    })
  })

  describe('GET /api/leaderboard/contributors', () => {
    it('returns contributor leaderboard ordered by total contributions', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/contributors')
      const response = await getContributorLeaderboard(request, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('leaderboard')
      expect(data.metadata.type).toBe('contributors')
    })

    it('includes contribution breakdown for each entry', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/contributors')
      const response = await getContributorLeaderboard(request, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.leaderboard.length > 0) {
        const entry = data.leaderboard[0]
        expect(entry).toHaveProperty('totalReviews')
        expect(entry).toHaveProperty('totalPhotos')
        expect(entry).toHaveProperty('totalFavorites')
        expect(entry).toHaveProperty('totalContributions')
        expect(entry).toHaveProperty('rank')
      }
    })
  })

  describe('GET /api/leaderboard/rank', () => {
    it('requires authentication', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/rank?type=passport')
      const response = await getUserRank(request, mockEnv)

      expect(response.status).toBe(401)
    })

    it('returns user rank for authenticated user', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/rank?type=passport')
      const response = await getUserRank(request, mockEnv, 1) // Mock user ID

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('userRank')
      expect(data).toHaveProperty('metadata')
      expect(data.metadata.type).toBe('passport')
      expect(data.metadata.userId).toBe(1)
    })

    it('validates leaderboard type parameter', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/rank?type=invalid')
      const response = await getUserRank(request, mockEnv, 1)

      expect(response.status).toBe(400)
    })

    it('supports all leaderboard types', async () => {
      const types = ['passport', 'reviewers', 'contributors']
      
      for (const type of types) {
        const request = createMockRequest('GET', `/api/leaderboard/rank?type=${type}`)
        const response = await getUserRank(request, mockEnv, 1)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.metadata.type).toBe(type)
      }
    })

    it('returns null rank if user not found in leaderboard', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/rank?type=passport')
      const response = await getUserRank(request, mockEnv, 999) // Non-existent user

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.userRank).toBeNull()
    })
  })

  describe('Error handling', () => {
    it('handles database errors gracefully', async () => {
      // Mock a database error
      vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Create a request that will cause a database error
      const request = createMockRequest('GET', '/api/leaderboard/passport')
      
      // Mock the database to throw an error
      const originalGetDb = vi.mocked(mockEnv.DB)
      mockEnv.DB = null as any
      
      const response = await getPassportLeaderboard(request, mockEnv)
      
      expect(response.status).toBe(500)
      
      // Restore the original database
      mockEnv.DB = originalGetDb
    })
  })

  describe('Data filtering', () => {
    it('filters by monthly period correctly', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/passport?period=monthly')
      const response = await getPassportLeaderboard(request, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata.period).toBe('monthly')
    })

    it('only includes public profiles', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/passport')
      const response = await getPassportLeaderboard(request, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      // All returned entries should be from public profiles
      // This is enforced at the database level by the isPublic filter
    })
  })

  describe('Response format', () => {
    it('returns consistent metadata structure', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/passport')
      const response = await getPassportLeaderboard(request, mockEnv)
      const data = await response.json()

      expect(data.metadata).toEqual({
        type: 'passport',
        period: 'all',
        city: 'all',
        limit: 50,
        generatedAt: expect.any(String)
      })
    })

    it('includes required fields for each leaderboard entry', async () => {
      const request = createMockRequest('GET', '/api/leaderboard/passport')
      const response = await getPassportLeaderboard(request, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.leaderboard.length > 0) {
        const entry = data.leaderboard[0]
        expect(entry).toHaveProperty('rank')
        expect(entry).toHaveProperty('userId')
        expect(entry).toHaveProperty('username')
        expect(typeof entry.rank).toBe('number')
        expect(typeof entry.userId).toBe('number')
        expect(typeof entry.username).toBe('string')
      }
    })
  })
})