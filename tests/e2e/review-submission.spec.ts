import { test, expect } from '@playwright/test'
import { setupAuthenticatedPage } from './helpers/auth'
import { submitReview, editReview, deleteReview, TEST_REVIEWS } from './helpers/review'
import { navigateToCafe } from './helpers/cafe'

test.describe('Review Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page)
  })

  test('submit review with photo upload', async ({ page }) => {
    const cafeId = '1' // Assuming cafe ID 1 exists
    
    // Navigate to cafe
    await navigateToCafe(page, cafeId)
    
    // Submit review with photo
    await submitReview(page, cafeId, TEST_REVIEWS.withPhoto)
    
    // Verify review appears with photo
    const reviewElement = page.locator('[data-testid="review"]').first()
    await expect(reviewElement).toContainText(TEST_REVIEWS.withPhoto.text)
    
    // Verify photo is displayed
    await expect(reviewElement.locator('[data-testid="review-photo"]')).toBeVisible()
    
    // Verify rating is displayed correctly
    const ratingElement = reviewElement.locator('[data-testid="review-rating"]')
    await expect(ratingElement).toContainText(TEST_REVIEWS.withPhoto.rating.toString())
  })

  test('submit text-only review', async ({ page }) => {
    const cafeId = '1'
    
    await navigateToCafe(page, cafeId)
    await submitReview(page, cafeId, TEST_REVIEWS.positive)
    
    // Verify review appears
    const reviewElement = page.locator(`[data-testid="review"]:has-text("${TEST_REVIEWS.positive.text}")`)
    await expect(reviewElement).toBeVisible()
    
    // Should not have photo
    await expect(reviewElement.locator('[data-testid="review-photo"]')).not.toBeVisible()
  })

  test('edit existing review', async ({ page }) => {
    const cafeId = '1'
    
    // First submit a review
    await navigateToCafe(page, cafeId)
    await submitReview(page, cafeId, TEST_REVIEWS.positive)
    
    // Then edit it
    const updatedReview = {
      rating: 7,
      text: 'Updated my review - still good but not as amazing as I initially thought.'
    }
    
    await editReview(page, TEST_REVIEWS.positive.text, updatedReview)
    
    // Verify updated content
    await expect(page.locator(`[data-testid="review"]:has-text("${updatedReview.text}")`)).toBeVisible()
    
    // Original text should be gone
    await expect(page.locator(`[data-testid="review"]:has-text("${TEST_REVIEWS.positive.text}")`)).not.toBeVisible()
  })

  test('delete review', async ({ page }) => {
    const cafeId = '1'
    
    // Submit a review to delete
    await navigateToCafe(page, cafeId)
    await submitReview(page, cafeId, TEST_REVIEWS.negative)
    
    // Delete the review
    await deleteReview(page, TEST_REVIEWS.negative.text)
    
    // Verify review is gone
    await expect(page.locator(`[data-testid="review"]:has-text("${TEST_REVIEWS.negative.text}")`)).not.toBeVisible()
  })

  test('review validation errors', async ({ page }) => {
    await navigateToCafe(page, '1')
    
    // Click write review
    await page.click('[data-testid="write-review-button"]')
    
    // Try to submit empty review
    await page.click('[data-testid="submit-review"]')
    
    // Should see validation errors
    await expect(page.locator('text=rating is required')).toBeVisible()
    await expect(page.locator('text=review text is required')).toBeVisible()
    
    // Fill only rating
    await page.selectOption('[data-testid="rating-select"]', '5')
    await page.click('[data-testid="submit-review"]')
    
    // Should still see text error
    await expect(page.locator('text=review text is required')).toBeVisible()
    
    // Fill text that's too short
    await page.fill('[data-testid="review-text"]', 'Bad')
    await page.click('[data-testid="submit-review"]')
    
    // Should see minimum length error
    await expect(page.locator('text=review must be at least')).toBeVisible()
  })

  test('photo upload validation', async ({ page }) => {
    await navigateToCafe(page, '1')
    await page.click('[data-testid="write-review-button"]')
    
    // Try to upload non-image file
    await page.setInputFiles('[data-testid="photo-upload"]', './package.json')
    
    // Should see error
    await expect(page.locator('text=only image files')).toBeVisible()
    
    // Try to upload large file (if test file exists)
    // This would need a large test file created
    // await page.setInputFiles('[data-testid="photo-upload"]', './tests/e2e/fixtures/large-image.jpg')
    // await expect(page.locator('text=file too large')).toBeVisible()
  })

  test('review moderation workflow', async ({ page }) => {
    // This test assumes admin functionality exists
    const cafeId = '1'
    
    // Submit a review that might need moderation
    await navigateToCafe(page, cafeId)
    await submitReview(page, cafeId, {
      rating: 1,
      text: 'This cafe is terrible and the staff was rude!'
    })
    
    // Review should appear (or be pending moderation)
    // The exact behavior depends on your moderation settings
    
    // Switch to admin view (if current user is admin)
    await page.goto('/admin/reviews')
    
    // Should see moderation queue
    await expect(page.locator('[data-testid="pending-reviews"]')).toBeVisible()
  })

  test('review sorting and filtering', async ({ page }) => {
    await navigateToCafe(page, '1')
    
    // Should see review sorting options
    await expect(page.locator('[data-testid="review-sort"]')).toBeVisible()
    
    // Sort by newest
    await page.selectOption('[data-testid="review-sort"]', 'newest')
    await page.waitForTimeout(1000) // Wait for sorting
    
    // Sort by rating
    await page.selectOption('[data-testid="review-sort"]', 'rating')
    await page.waitForTimeout(1000)
    
    // Filter by rating
    await page.click('[data-testid="filter-high-rating"]')
    
    // Should only show high-rated reviews
    const visibleReviews = page.locator('[data-testid="review"]')
    const reviewCount = await visibleReviews.count()
    
    if (reviewCount > 0) {
      const ratings = await page.locator('[data-testid="review-rating"]').allTextContents()
      for (const rating of ratings) {
        const numericRating = parseFloat(rating)
        expect(numericRating).toBeGreaterThanOrEqual(7)
      }
    }
  })

  test('review interaction - likes and replies', async ({ page }) => {
    await navigateToCafe(page, '1')
    
    // Assuming there's at least one review visible
    const firstReview = page.locator('[data-testid="review"]').first()
    await expect(firstReview).toBeVisible()
    
    // Like the review
    const likeButton = firstReview.locator('[data-testid="like-review"]')
    const initialLikes = await firstReview.locator('[data-testid="like-count"]').textContent()
    
    await likeButton.click()
    
    // Wait for like count to update
    await page.waitForTimeout(1000)
    
    const newLikes = await firstReview.locator('[data-testid="like-count"]').textContent()
    expect(parseInt(newLikes || '0')).toBeGreaterThan(parseInt(initialLikes || '0'))
    
    // Unlike the review
    await likeButton.click()
    await page.waitForTimeout(1000)
    
    const finalLikes = await firstReview.locator('[data-testid="like-count"]').textContent()
    expect(finalLikes).toBe(initialLikes)
  })
})