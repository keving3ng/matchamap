import { describe, it, expect, beforeEach, afterEach } from 'vitest'

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8787/api'

interface TestResponse {
  success: boolean
  message?: string
  error?: string
}

describe('Database Constraints & Integrity', () => {
  let authToken: string
  let testUserId: string
  let testCafeId: string

  beforeEach(async () => {
    // Setup authenticated user for tests
    const testEmail = `test-${Date.now()}@example.com`
    
    // Register and login
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      })
    })

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!'
      })
    })

    const loginData = await loginResponse.json()
    authToken = loginData.token
    testUserId = loginData.user.id

    // Assume cafe ID 1 exists for testing
    testCafeId = '1'
  })

  afterEach(async () => {
    // Cleanup test user
    if (authToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/delete-account`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      } catch (error) {
        console.warn('Failed to cleanup test user:', error)
      }
    }
  })

  it('should enforce foreign key constraints on reviews', async () => {
    // Try to create review for non-existent cafe
    const invalidReviewResponse = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cafeId: '99999', // Non-existent cafe ID
        rating: 8,
        text: 'This should fail due to foreign key constraint'
      })
    })

    expect(invalidReviewResponse.status).toBe(400)
    
    const errorData: TestResponse = await invalidReviewResponse.json()
    expect(errorData.success).toBe(false)
    expect(errorData.message || errorData.error).toMatch(/cafe.*not found|foreign key/i)
  })

  it('should enforce unique constraints properly', async () => {
    // Create a check-in
    const firstCheckinResponse = await fetch(`${API_BASE_URL}/stats/checkin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cafeId: testCafeId
      })
    })

    expect(firstCheckinResponse.status).toBe(201)

    // Try to create duplicate check-in (same user, same cafe, same day)
    const duplicateCheckinResponse = await fetch(`${API_BASE_URL}/stats/checkin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cafeId: testCafeId
      })
    })

    // Should either succeed (if multiple check-ins per day allowed) or fail with constraint error
    if (duplicateCheckinResponse.status === 409) {
      const errorData: TestResponse = await duplicateCheckinResponse.json()
      expect(errorData.success).toBe(false)
      expect(errorData.message || errorData.error).toMatch(/already checked in|unique constraint/i)
    } else {
      // If multiple check-ins are allowed, this should succeed
      expect(duplicateCheckinResponse.status).toBe(201)
    }
  })

  it('should handle cascade deletes correctly', async () => {
    // Create a review
    const reviewResponse = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cafeId: testCafeId,
        rating: 7,
        text: 'Test review for cascade delete'
      })
    })

    expect(reviewResponse.status).toBe(201)
    const reviewData = await reviewResponse.json()
    const reviewId = reviewData.id

    // Verify review exists
    const getReviewResponse = await fetch(`${API_BASE_URL}/reviews/${reviewId}`)
    expect(getReviewResponse.status).toBe(200)

    // Delete user account (this should cascade delete the review)
    const deleteUserResponse = await fetch(`${API_BASE_URL}/auth/delete-account`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    })

    expect(deleteUserResponse.status).toBe(200)

    // Verify review is deleted due to cascade
    const getDeletedReviewResponse = await fetch(`${API_BASE_URL}/reviews/${reviewId}`)
    expect(getDeletedReviewResponse.status).toBe(404)

    // Clear authToken so afterEach doesn't try to delete again
    authToken = ''
  })

  it('should enforce NOT NULL constraints', async () => {
    // Try to create review without required fields
    const invalidReviewResponse = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cafeId: testCafeId,
        // Missing rating and text (required fields)
      })
    })

    expect(invalidReviewResponse.status).toBe(400)
    
    const errorData: TestResponse = await invalidReviewResponse.json()
    expect(errorData.success).toBe(false)
    expect(errorData.message || errorData.error).toMatch(/required|not null/i)
  })

  it('should enforce check constraints on ratings', async () => {
    // Try to create review with invalid rating (outside 1-10 range)
    const invalidRatingResponse = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cafeId: testCafeId,
        rating: 15, // Invalid rating (should be 1-10)
        text: 'This rating is too high'
      })
    })

    expect(invalidRatingResponse.status).toBe(400)
    
    const errorData: TestResponse = await invalidRatingResponse.json()
    expect(errorData.success).toBe(false)
    expect(errorData.message || errorData.error).toMatch(/rating|check constraint/i)

    // Try negative rating
    const negativeRatingResponse = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cafeId: testCafeId,
        rating: -1, // Invalid negative rating
        text: 'This rating is negative'
      })
    })

    expect(negativeRatingResponse.status).toBe(400)
  })

  it('should handle database transaction rollbacks', async () => {
    // This test attempts to trigger a transaction rollback scenario
    // For example, trying to create multiple related records where one fails
    
    const initialReviewsResponse = await fetch(`${API_BASE_URL}/cafes/${testCafeId}/reviews`)
    const initialReviews = await initialReviewsResponse.json()
    const initialCount = initialReviews.length

    // Try to create a review with invalid data that should cause rollback
    // This depends on your specific implementation
    const invalidTransactionResponse = await fetch(`${API_BASE_URL}/reviews/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reviews: [
          {
            cafeId: testCafeId,
            rating: 8,
            text: 'Valid review'
          },
          {
            cafeId: '99999', // Invalid cafe ID - should cause rollback
            rating: 7,
            text: 'Invalid review'
          }
        ]
      })
    })

    // Should fail due to invalid cafe ID
    expect(invalidTransactionResponse.status).toBe(400)

    // Verify no reviews were created (transaction rolled back)
    const finalReviewsResponse = await fetch(`${API_BASE_URL}/cafes/${testCafeId}/reviews`)
    const finalReviews = await finalReviewsResponse.json()
    const finalCount = finalReviews.length

    expect(finalCount).toBe(initialCount) // No change in review count
  })

  it('should maintain referential integrity on updates', async () => {
    // Create a review
    const reviewResponse = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cafeId: testCafeId,
        rating: 6,
        text: 'Original review'
      })
    })

    const reviewData = await reviewResponse.json()
    const reviewId = reviewData.id

    // Try to update review to reference non-existent cafe
    const invalidUpdateResponse = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cafeId: '99999', // Non-existent cafe
        rating: 8,
        text: 'Updated review'
      })
    })

    expect(invalidUpdateResponse.status).toBe(400)

    // Verify original review is unchanged
    const getReviewResponse = await fetch(`${API_BASE_URL}/reviews/${reviewId}`)
    const unchangedReview = await getReviewResponse.json()
    expect(unchangedReview.cafeId).toBe(testCafeId) // Should still reference original cafe
    expect(unchangedReview.text).toBe('Original review') // Should be unchanged
  })

  it('should handle concurrent modifications correctly', async () => {
    // Create a review
    const reviewResponse = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cafeId: testCafeId,
        rating: 5,
        text: 'Review for concurrent test'
      })
    })

    const reviewData = await reviewResponse.json()
    const reviewId = reviewData.id

    // Simulate concurrent updates
    const update1Promise = fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rating: 8,
        text: 'Updated by process 1'
      })
    })

    const update2Promise = fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rating: 9,
        text: 'Updated by process 2'
      })
    })

    const [update1Response, update2Response] = await Promise.all([update1Promise, update2Promise])

    // At least one should succeed
    const successfulUpdates = [update1Response, update2Response].filter(r => r.status === 200)
    expect(successfulUpdates.length).toBeGreaterThan(0)

    // Verify final state is consistent
    const finalReviewResponse = await fetch(`${API_BASE_URL}/reviews/${reviewId}`)
    const finalReview = await finalReviewResponse.json()
    
    // Should contain one of the update texts
    expect(['Updated by process 1', 'Updated by process 2']).toContain(finalReview.text)
  })
})