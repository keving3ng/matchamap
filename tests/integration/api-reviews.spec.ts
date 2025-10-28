import { describe, it, expect, beforeEach, afterEach } from 'vitest'

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8787/api'

interface AuthData {
  token: string
  userId: string
}

interface Review {
  id?: string
  cafeId: string
  userId?: string
  rating: number
  text: string
  photoUrl?: string
  createdAt?: string
  updatedAt?: string
}

describe('Review API Integration', () => {
  let authData: AuthData
  let testReviewId: string

  beforeEach(async () => {
    // Setup authenticated user for tests
    const testEmail = `test-${Date.now()}@example.com`
    
    // Register user
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

    // Login to get token
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!'
      })
    })

    const loginData = await loginResponse.json()
    authData = {
      token: loginData.token,
      userId: loginData.user.id
    }
  })

  afterEach(async () => {
    // Cleanup: delete test review if created
    if (testReviewId && authData?.token) {
      try {
        await fetch(`${API_BASE_URL}/reviews/${testReviewId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        })
      } catch (error) {
        console.warn('Failed to cleanup test review:', error)
      }
    }

    // Cleanup: delete test user
    if (authData?.token) {
      try {
        await fetch(`${API_BASE_URL}/auth/delete-account`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        })
      } catch (error) {
        console.warn('Failed to cleanup test user:', error)
      }
    }
  })

  it('should create a new review', async () => {
    const reviewData = {
      cafeId: '1', // Assuming cafe ID 1 exists
      rating: 8,
      text: 'Great matcha latte! The service was excellent and the atmosphere was perfect for working.'
    }

    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    })

    expect(response.status).toBe(201)

    const review: Review = await response.json()
    expect(review.id).toBeDefined()
    expect(review.cafeId).toBe(reviewData.cafeId)
    expect(review.rating).toBe(reviewData.rating)
    expect(review.text).toBe(reviewData.text)
    expect(review.userId).toBe(authData.userId)
    expect(review.createdAt).toBeDefined()

    testReviewId = review.id!
  })

  it('should reject review with invalid rating', async () => {
    const invalidReviewData = {
      cafeId: '1',
      rating: 11, // Invalid rating (should be 1-10)
      text: 'This rating is too high'
    }

    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidReviewData)
    })

    expect(response.status).toBe(400)

    const error = await response.json()
    expect(error.message).toContain('rating')
  })

  it('should reject review with missing required fields', async () => {
    const incompleteReviewData = {
      cafeId: '1',
      // Missing rating and text
    }

    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(incompleteReviewData)
    })

    expect(response.status).toBe(400)

    const error = await response.json()
    expect(error.message).toMatch(/rating|text/)
  })

  it('should get reviews for a cafe', async () => {
    // First create a review
    const reviewData = {
      cafeId: '1',
      rating: 7,
      text: 'Decent matcha, could be better.'
    }

    const createResponse = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    })

    const createdReview = await createResponse.json()
    testReviewId = createdReview.id

    // Then get reviews for the cafe
    const getResponse = await fetch(`${API_BASE_URL}/cafes/1/reviews`)

    expect(getResponse.status).toBe(200)

    const reviews: Review[] = await getResponse.json()
    expect(Array.isArray(reviews)).toBe(true)
    expect(reviews.length).toBeGreaterThan(0)

    const ourReview = reviews.find(r => r.id === testReviewId)
    expect(ourReview).toBeDefined()
    expect(ourReview?.text).toBe(reviewData.text)
  })

  it('should update existing review', async () => {
    // Create review first
    const originalData = {
      cafeId: '1',
      rating: 6,
      text: 'Original review text'
    }

    const createResponse = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(originalData)
    })

    const createdReview = await createResponse.json()
    testReviewId = createdReview.id

    // Update the review
    const updatedData = {
      rating: 9,
      text: 'Updated review - much better than I initially thought!'
    }

    const updateResponse = await fetch(`${API_BASE_URL}/reviews/${testReviewId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    })

    expect(updateResponse.status).toBe(200)

    const updatedReview: Review = await updateResponse.json()
    expect(updatedReview.id).toBe(testReviewId)
    expect(updatedReview.rating).toBe(updatedData.rating)
    expect(updatedReview.text).toBe(updatedData.text)
    expect(updatedReview.updatedAt).toBeDefined()
    expect(updatedReview.updatedAt).not.toBe(updatedReview.createdAt)
  })

  it('should prevent updating another users review', async () => {
    // Create review with first user
    const reviewData = {
      cafeId: '1',
      rating: 5,
      text: 'Review by first user'
    }

    const createResponse = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    })

    const createdReview = await createResponse.json()
    testReviewId = createdReview.id

    // Create second user
    const secondUserEmail = `test2-${Date.now()}@example.com`
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: secondUserEmail,
        password: 'TestPassword123!',
        firstName: 'Test2',
        lastName: 'User2'
      })
    })

    const secondLoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: secondUserEmail,
        password: 'TestPassword123!'
      })
    })

    const secondUserData = await secondLoginResponse.json()

    // Try to update first user's review with second user's token
    const updateResponse = await fetch(`${API_BASE_URL}/reviews/${testReviewId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${secondUserData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rating: 1,
        text: 'Trying to hijack this review'
      })
    })

    expect(updateResponse.status).toBe(403) // Forbidden
  })

  it('should delete review', async () => {
    // Create review first
    const reviewData = {
      cafeId: '1',
      rating: 3,
      text: 'Review to be deleted'
    }

    const createResponse = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    })

    const createdReview = await createResponse.json()
    testReviewId = createdReview.id

    // Delete the review
    const deleteResponse = await fetch(`${API_BASE_URL}/reviews/${testReviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authData.token}`
      }
    })

    expect(deleteResponse.status).toBe(200)

    // Verify review is deleted
    const getResponse = await fetch(`${API_BASE_URL}/reviews/${testReviewId}`)
    expect(getResponse.status).toBe(404)

    testReviewId = '' // Clear so cleanup doesn't fail
  })

  it('should require authentication for creating reviews', async () => {
    const reviewData = {
      cafeId: '1',
      rating: 8,
      text: 'Trying to review without auth'
    }

    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    })

    expect(response.status).toBe(401) // Unauthorized
  })

  it('should handle review with photo upload', async () => {
    // This test would require multipart form data handling
    // For now, we'll test the review creation with a photo URL
    const reviewData = {
      cafeId: '1',
      rating: 9,
      text: 'Amazing presentation! See photo.',
      photoUrl: 'https://example.com/test-photo.jpg'
    }

    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    })

    expect(response.status).toBe(201)

    const review: Review = await response.json()
    expect(review.photoUrl).toBe(reviewData.photoUrl)

    testReviewId = review.id!
  })
})