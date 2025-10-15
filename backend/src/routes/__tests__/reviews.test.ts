import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../../index';
import {
  createTestRequest,
  createAuthenticatedRequest,
  mockUser,
  mockAdminUser,
  createTestToken,
  cleanupTestData,
  seedTestData,
  expectJsonResponse,
  expectErrorResponse,
} from '../../test/utils';

describe('Review Routes', () => {
  let userToken: string;
  let adminToken: string;
  let testCafeId: number;
  let testReviewId: number;

  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);
    userToken = await createTestToken(mockUser);
    adminToken = await createTestToken(mockAdminUser);

    // Create a test cafe for reviews
    const cafeResult = await env.DB.prepare(`
      INSERT INTO cafes (name, slug, city, address, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind('Test Cafe', 'test-cafe', 'Toronto', '123 Test St', 43.6532, -79.3832).run();
    testCafeId = cafeResult.meta.last_row_id as number;
  });

  describe('POST /api/cafes/:id/reviews', () => {
    it('should create a new review successfully', async () => {
      const reviewData = {
        overallRating: 8.5,
        matchaQualityRating: 9.0,
        ambianceRating: 7.5,
        serviceRating: 8.0,
        valueRating: 7.0,
        title: 'Great matcha experience',
        content: 'The matcha quality was excellent with rich flavor and beautiful presentation. The atmosphere was cozy.',
        tags: ['premium-matcha', 'cozy-atmosphere'],
        visitDate: '2024-01-15',
        isPublic: true,
      };

      const request = createAuthenticatedRequest(`/api/cafes/${testCafeId}/reviews`, userToken, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 201);

      const data = await response.json() as any;
      expect(data.review).toMatchObject({
        userId: mockUser.id,
        cafeId: testCafeId,
        overallRating: reviewData.overallRating,
        title: reviewData.title,
        content: reviewData.content,
        moderationStatus: 'approved',
      });
      expect(data.review.id).toBeDefined();
      testReviewId = data.review.id;
    });

    it('should return 401 when not authenticated', async () => {
      const reviewData = {
        overallRating: 8.5,
        content: 'Great matcha experience',
        isPublic: true,
      };

      const request = createTestRequest(`/api/cafes/${testCafeId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 401);
    });

    it('should return 400 for invalid cafe ID', async () => {
      const reviewData = {
        overallRating: 8.5,
        content: 'Great matcha experience',
        isPublic: true,
      };

      const request = createAuthenticatedRequest('/api/cafes/invalid/reviews', userToken, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 400, 'Invalid cafe ID');
    });

    it('should return 404 for non-existent cafe', async () => {
      const reviewData = {
        overallRating: 8.5,
        content: 'Great matcha experience',
        isPublic: true,
      };

      const request = createAuthenticatedRequest('/api/cafes/99999/reviews', userToken, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 404);
    });

    it('should return 409 for duplicate review from same user', async () => {
      const reviewData = {
        overallRating: 8.5,
        content: 'Great matcha experience',
        isPublic: true,
      };

      // Create first review
      await worker.fetch(createAuthenticatedRequest(`/api/cafes/${testCafeId}/reviews`, userToken, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      }), env);

      // Try to create second review from same user
      const request = createAuthenticatedRequest(`/api/cafes/${testCafeId}/reviews`, userToken, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 409, 'already reviewed');
    });

    it('should validate required fields', async () => {
      const invalidReviewData = {
        // Missing overallRating, content, and isPublic
        title: 'Great matcha',
      };

      const request = createAuthenticatedRequest(`/api/cafes/${testCafeId}/reviews`, userToken, {
        method: 'POST',
        body: JSON.stringify(invalidReviewData),
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 400, 'Validation error');
    });

    it('should validate rating bounds', async () => {
      const invalidReviewData = {
        overallRating: 11, // Invalid: > 10
        content: 'Great matcha experience',
        isPublic: true,
      };

      const request = createAuthenticatedRequest(`/api/cafes/${testCafeId}/reviews`, userToken, {
        method: 'POST',
        body: JSON.stringify(invalidReviewData),
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 400, 'Validation error');
    });

    it('should validate content length', async () => {
      const invalidReviewData = {
        overallRating: 8.5,
        content: 'Too short', // Invalid: < 50 characters
        isPublic: true,
      };

      const request = createAuthenticatedRequest(`/api/cafes/${testCafeId}/reviews`, userToken, {
        method: 'POST',
        body: JSON.stringify(invalidReviewData),
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 400, 'Validation error');
    });

    it('should validate future visit dates', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      const invalidReviewData = {
        overallRating: 8.5,
        content: 'This is a long enough review content that meets the minimum character requirement for validation.',
        visitDate: futureDate, // Invalid: future date
        isPublic: true,
      };

      const request = createAuthenticatedRequest(`/api/cafes/${testCafeId}/reviews`, userToken, {
        method: 'POST',
        body: JSON.stringify(invalidReviewData),
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 400, 'cannot be in the future');
    });
  });

  describe('GET /api/cafes/:id/reviews', () => {
    beforeEach(async () => {
      // Create multiple test reviews
      const reviews = [
        { rating: 9.0, content: 'Excellent matcha quality and wonderful service. The atmosphere was perfect for a relaxing afternoon.', helpful: 5, created: '2024-01-15' },
        { rating: 7.5, content: 'Good matcha but could be better. The service was friendly but the atmosphere was a bit noisy.', helpful: 2, created: '2024-01-14' },
        { rating: 8.5, content: 'Great experience overall. The matcha was high quality and the presentation was beautiful.', helpful: 8, created: '2024-01-13' },
      ];

      for (const review of reviews) {
        const result = await env.DB.prepare(`
          INSERT INTO user_reviews (userId, cafeId, overallRating, content, helpfulCount, createdAt, moderationStatus, isPublic)
          VALUES (?, ?, ?, ?, ?, ?, 'approved', true)
        `).bind(mockUser.id, testCafeId, review.rating, review.content, review.helpful, review.created).run();
        
        if (!testReviewId) {
          testReviewId = result.meta.last_row_id as number;
        }
      }
    });

    it('should get cafe reviews successfully', async () => {
      const request = createTestRequest(`/api/cafes/${testCafeId}/reviews`);

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.reviews).toBeInstanceOf(Array);
      expect(data.reviews.length).toBe(3);
      expect(data.pagination).toMatchObject({
        limit: 20,
        offset: 0,
        hasMore: false,
      });

      // Check that reviews are sorted by recent (default)
      expect(new Date(data.reviews[0].createdAt) >= new Date(data.reviews[1].createdAt)).toBe(true);
    });

    it('should return 404 for non-existent cafe', async () => {
      const request = createTestRequest('/api/cafes/99999/reviews');

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 404);
    });

    it('should support pagination', async () => {
      const request = createTestRequest(`/api/cafes/${testCafeId}/reviews?limit=2&offset=1`);

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.reviews).toHaveLength(2);
      expect(data.pagination).toMatchObject({
        limit: 2,
        offset: 1,
        hasMore: false,
      });
    });

    it('should support sorting by rating', async () => {
      const request = createTestRequest(`/api/cafes/${testCafeId}/reviews?sortBy=rating`);

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.reviews).toHaveLength(3);
      expect(data.reviews[0].overallRating).toBe(9.0);
      expect(data.reviews[2].overallRating).toBe(7.5);
    });

    it('should support sorting by helpful count', async () => {
      const request = createTestRequest(`/api/cafes/${testCafeId}/reviews?sortBy=helpful`);

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.reviews).toHaveLength(3);
      expect(data.reviews[0].helpfulCount).toBe(8);
      expect(data.reviews[2].helpfulCount).toBe(2);
    });

    it('should validate query parameters', async () => {
      const request = createTestRequest(`/api/cafes/${testCafeId}/reviews?limit=invalid`);

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 400, 'Invalid query parameters');
    });
  });

  describe('PUT /api/reviews/:id', () => {
    beforeEach(async () => {
      // Create a test review to update
      const result = await env.DB.prepare(`
        INSERT INTO user_reviews (userId, cafeId, overallRating, content, moderationStatus, isPublic)
        VALUES (?, ?, ?, ?, 'approved', true)
      `).bind(mockUser.id, testCafeId, 8.0, 'Original review content that meets the minimum character requirement for validation.').run();
      testReviewId = result.meta.last_row_id as number;
    });

    it('should update own review successfully', async () => {
      const updateData = {
        overallRating: 9.0,
        title: 'Updated title',
        content: 'Updated review content that is longer and meets all the validation requirements for content.',
      };

      const request = createAuthenticatedRequest(`/api/reviews/${testReviewId}`, userToken, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      // Verify the update in database
      const updatedReview = await env.DB.prepare(`
        SELECT * FROM user_reviews WHERE id = ?
      `).bind(testReviewId).first();

      expect(updatedReview.overallRating).toBe(9.0);
      expect(updatedReview.title).toBe('Updated title');
      expect(updatedReview.content).toBe(updateData.content);
    });

    it('should return 401 when not authenticated', async () => {
      const updateData = {
        overallRating: 9.0,
        content: 'Updated review content that meets the minimum character requirement validation rules.',
      };

      const request = createTestRequest(`/api/reviews/${testReviewId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 401);
    });

    it('should return 404 for non-existent review', async () => {
      const updateData = {
        overallRating: 9.0,
        content: 'Updated review content that meets the minimum character requirement validation rules.',
      };

      const request = createAuthenticatedRequest('/api/reviews/99999', userToken, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 404);
    });

    it('should return 403 when trying to update another user\'s review', async () => {
      // Create review by admin user
      const adminReviewResult = await env.DB.prepare(`
        INSERT INTO user_reviews (userId, cafeId, overallRating, content, moderationStatus, isPublic)
        VALUES (?, ?, ?, ?, 'approved', true)
      `).bind(mockAdminUser.id, testCafeId, 7.0, 'Admin review content that meets the minimum character requirement for validation.').run();
      const adminReviewId = adminReviewResult.meta.last_row_id as number;

      const updateData = {
        overallRating: 9.0,
        content: 'Trying to update someone elses review which should fail with appropriate error message.',
      };

      const request = createAuthenticatedRequest(`/api/reviews/${adminReviewId}`, userToken, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 403, 'can only edit your own');
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    beforeEach(async () => {
      // Create a test review to delete
      const result = await env.DB.prepare(`
        INSERT INTO user_reviews (userId, cafeId, overallRating, content, moderationStatus, isPublic)
        VALUES (?, ?, ?, ?, 'approved', true)
      `).bind(mockUser.id, testCafeId, 8.0, 'Review to be deleted that meets the minimum character requirement for validation.').run();
      testReviewId = result.meta.last_row_id as number;
    });

    it('should delete own review successfully', async () => {
      const request = createAuthenticatedRequest(`/api/reviews/${testReviewId}`, userToken, {
        method: 'DELETE',
      });

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      // Verify the review was deleted
      const deletedReview = await env.DB.prepare(`
        SELECT * FROM user_reviews WHERE id = ?
      `).bind(testReviewId).first();

      expect(deletedReview).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest(`/api/reviews/${testReviewId}`, {
        method: 'DELETE',
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 401);
    });

    it('should return 404 for non-existent review', async () => {
      const request = createAuthenticatedRequest('/api/reviews/99999', userToken, {
        method: 'DELETE',
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 404);
    });

    it('should return 403 when trying to delete another user\'s review', async () => {
      // Create review by admin user
      const adminReviewResult = await env.DB.prepare(`
        INSERT INTO user_reviews (userId, cafeId, overallRating, content, moderationStatus, isPublic)
        VALUES (?, ?, ?, ?, 'approved', true)
      `).bind(mockAdminUser.id, testCafeId, 7.0, 'Admin review content that meets the minimum character requirement for validation.').run();
      const adminReviewId = adminReviewResult.meta.last_row_id as number;

      const request = createAuthenticatedRequest(`/api/reviews/${adminReviewId}`, userToken, {
        method: 'DELETE',
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 403, 'can only delete your own');
    });
  });

  describe('POST /api/reviews/:id/helpful', () => {
    beforeEach(async () => {
      // Create a test review for helpful voting
      const result = await env.DB.prepare(`
        INSERT INTO user_reviews (userId, cafeId, overallRating, content, helpfulCount, moderationStatus, isPublic)
        VALUES (?, ?, ?, ?, 0, 'approved', true)
      `).bind(mockAdminUser.id, testCafeId, 8.0, 'Review for helpful voting test that meets the minimum character requirement.').run();
      testReviewId = result.meta.last_row_id as number;
    });

    it('should mark review as helpful successfully', async () => {
      const request = createAuthenticatedRequest(`/api/reviews/${testReviewId}/helpful`, userToken, {
        method: 'POST',
      });

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      // Verify helpful count was incremented
      const updatedReview = await env.DB.prepare(`
        SELECT helpfulCount FROM user_reviews WHERE id = ?
      `).bind(testReviewId).first();

      expect(updatedReview.helpfulCount).toBe(1);

      // Verify helpful vote was recorded
      const helpfulVote = await env.DB.prepare(`
        SELECT * FROM review_helpful WHERE reviewId = ? AND userId = ?
      `).bind(testReviewId, mockUser.id).first();

      expect(helpfulVote).toBeTruthy();
    });

    it('should handle duplicate helpful votes gracefully', async () => {
      // First vote
      await worker.fetch(createAuthenticatedRequest(`/api/reviews/${testReviewId}/helpful`, userToken, {
        method: 'POST',
      }), env);

      // Second vote from same user
      const request = createAuthenticatedRequest(`/api/reviews/${testReviewId}/helpful`, userToken, {
        method: 'POST',
      });

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      // Verify helpful count is still 1 (not incremented twice)
      const updatedReview = await env.DB.prepare(`
        SELECT helpfulCount FROM user_reviews WHERE id = ?
      `).bind(testReviewId).first();

      expect(updatedReview.helpfulCount).toBe(1);
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest(`/api/reviews/${testReviewId}/helpful`, {
        method: 'POST',
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 401);
    });

    it('should return 404 for non-existent review', async () => {
      const request = createAuthenticatedRequest('/api/reviews/99999/helpful', userToken, {
        method: 'POST',
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 404);
    });
  });

  describe('DELETE /api/reviews/:id/helpful', () => {
    beforeEach(async () => {
      // Create a test review and add helpful vote
      const result = await env.DB.prepare(`
        INSERT INTO user_reviews (userId, cafeId, overallRating, content, helpfulCount, moderationStatus, isPublic)
        VALUES (?, ?, ?, ?, 1, 'approved', true)
      `).bind(mockAdminUser.id, testCafeId, 8.0, 'Review for helpful voting removal test that meets minimum character requirement.', 1).run();
      testReviewId = result.meta.last_row_id as number;

      // Add helpful vote
      await env.DB.prepare(`
        INSERT INTO review_helpful (reviewId, userId)
        VALUES (?, ?)
      `).bind(testReviewId, mockUser.id).run();
    });

    it('should remove helpful vote successfully', async () => {
      const request = createAuthenticatedRequest(`/api/reviews/${testReviewId}/helpful`, userToken, {
        method: 'DELETE',
      });

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      // Verify helpful count was decremented
      const updatedReview = await env.DB.prepare(`
        SELECT helpfulCount FROM user_reviews WHERE id = ?
      `).bind(testReviewId).first();

      expect(updatedReview.helpfulCount).toBe(0);

      // Verify helpful vote was removed
      const helpfulVote = await env.DB.prepare(`
        SELECT * FROM review_helpful WHERE reviewId = ? AND userId = ?
      `).bind(testReviewId, mockUser.id).first();

      expect(helpfulVote).toBeNull();
    });

    it('should handle removing non-existent vote gracefully', async () => {
      // Remove the vote first
      await env.DB.prepare(`
        DELETE FROM review_helpful WHERE reviewId = ? AND userId = ?
      `).bind(testReviewId, mockUser.id).run();

      const request = createAuthenticatedRequest(`/api/reviews/${testReviewId}/helpful`, userToken, {
        method: 'DELETE',
      });

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      // Helpful count should remain 1 (not decremented)
      const updatedReview = await env.DB.prepare(`
        SELECT helpfulCount FROM user_reviews WHERE id = ?
      `).bind(testReviewId).first();

      expect(updatedReview.helpfulCount).toBe(1);
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest(`/api/reviews/${testReviewId}/helpful`, {
        method: 'DELETE',
      });

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 401);
    });
  });

  describe('GET /api/users/:username/reviews', () => {
    beforeEach(async () => {
      // Update mock user with username
      await env.DB.prepare(`
        UPDATE users SET username = ? WHERE id = ?
      `).bind('testuser', mockUser.id).run();

      // Create multiple reviews for the user across different cafes
      const cafe2Result = await env.DB.prepare(`
        INSERT INTO cafes (name, slug, city, address, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind('Test Cafe 2', 'test-cafe-2', 'Toronto', '456 Test Ave', 43.6532, -79.3832).run();
      const testCafe2Id = cafe2Result.meta.last_row_id as number;

      const reviews = [
        { cafeId: testCafeId, rating: 8.5, content: 'Great matcha experience at the first location with excellent service and quality.', created: '2024-01-15' },
        { cafeId: testCafe2Id, rating: 7.0, content: 'Decent matcha at the second location but could use some improvements in service.', created: '2024-01-14' },
      ];

      for (const review of reviews) {
        await env.DB.prepare(`
          INSERT INTO user_reviews (userId, cafeId, overallRating, content, createdAt, moderationStatus, isPublic)
          VALUES (?, ?, ?, ?, ?, 'approved', true)
        `).bind(mockUser.id, review.cafeId, review.rating, review.content, review.created).run();
      }
    });

    it('should get user reviews successfully', async () => {
      const request = createTestRequest('/api/users/testuser/reviews');

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.reviews).toBeInstanceOf(Array);
      expect(data.reviews).toHaveLength(2);
      expect(data.pagination).toMatchObject({
        limit: 20,
        offset: 0,
        hasMore: false,
      });

      // Check that reviews include cafe information
      expect(data.reviews[0]).toHaveProperty('cafeName');
      expect(data.reviews[0]).toHaveProperty('cafeSlug');
      expect(data.reviews[0]).toHaveProperty('cafeCity');
    });

    it('should return 404 for non-existent user', async () => {
      const request = createTestRequest('/api/users/nonexistent/reviews');

      const response = await worker.fetch(request, env);

      await expectErrorResponse(response, 404);
    });

    it('should support pagination for user reviews', async () => {
      const request = createTestRequest('/api/users/testuser/reviews?limit=1&offset=1');

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.reviews).toHaveLength(1);
      expect(data.pagination).toMatchObject({
        limit: 1,
        offset: 1,
        hasMore: false,
      });
    });

    it('should support sorting by rating for user reviews', async () => {
      const request = createTestRequest('/api/users/testuser/reviews?sortBy=rating');

      const response = await worker.fetch(request, env);

      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.reviews).toHaveLength(2);
      expect(data.reviews[0].overallRating).toBe(8.5);
      expect(data.reviews[1].overallRating).toBe(7.0);
    });
  });
});