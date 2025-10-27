import { Page, expect } from '@playwright/test'
import { navigateToCafe } from './cafe'

export interface TestReview {
  rating: number
  text: string
  photoPath?: string
}

export const TEST_REVIEWS = {
  positive: {
    rating: 9,
    text: 'Amazing matcha latte with perfect foam art! The atmosphere is cozy and the staff is knowledgeable about their tea selection.'
  },
  negative: {
    rating: 4,
    text: 'Matcha was a bit bitter and the service was slow. Nice location though.'
  },
  withPhoto: {
    rating: 8,
    text: 'Great matcha experience! Check out this beautiful presentation.',
    photoPath: './tests/e2e/fixtures/matcha-photo.jpg'
  }
} as const

/**
 * Submit a review for a cafe
 */
export async function submitReview(page: Page, cafeId: string | number, review: TestReview) {
  await navigateToCafe(page, cafeId)
  
  // Click write review button
  await page.click('[data-testid="write-review-button"]')
  
  // Wait for review form to open
  await page.waitForSelector('[data-testid="review-form"]', { timeout: 5000 })
  
  // Fill review form
  await page.selectOption('[data-testid="rating-select"]', review.rating.toString())
  await page.fill('[data-testid="review-text"]', review.text)
  
  // Upload photo if provided
  if (review.photoPath) {
    await page.setInputFiles('[data-testid="photo-upload"]', review.photoPath)
    
    // Wait for photo upload to complete
    await expect(page.locator('[data-testid="photo-preview"]')).toBeVisible({ timeout: 10000 })
  }
  
  // Submit review
  await page.click('[data-testid="submit-review"]')
  
  // Wait for success message
  await expect(page.locator('text=review submitted')).toBeVisible({ timeout: 10000 })
  
  // Wait for review to appear in list
  await page.waitForSelector(`[data-testid="review"]:has-text("${review.text}")`, { timeout: 5000 })
}

/**
 * Edit an existing review
 */
export async function editReview(page: Page, reviewText: string, newReview: TestReview) {
  // Find the review by text and click edit
  await page.click(`[data-testid="review"]:has-text("${reviewText}") [data-testid="edit-review"]`)
  
  // Wait for edit form
  await page.waitForSelector('[data-testid="review-form"]', { timeout: 5000 })
  
  // Update review
  await page.selectOption('[data-testid="rating-select"]', newReview.rating.toString())
  await page.fill('[data-testid="review-text"]', newReview.text)
  
  // Save changes
  await page.click('[data-testid="save-review"]')
  
  // Wait for success
  await expect(page.locator('text=review updated')).toBeVisible({ timeout: 5000 })
}

/**
 * Delete a review
 */
export async function deleteReview(page: Page, reviewText: string) {
  // Find the review by text and click delete
  await page.click(`[data-testid="review"]:has-text("${reviewText}") [data-testid="delete-review"]`)
  
  // Confirm deletion
  await page.click('[data-testid="confirm-delete"]')
  
  // Wait for review to be removed
  await expect(page.locator(`[data-testid="review"]:has-text("${reviewText}")`)).not.toBeVisible({ timeout: 5000 })
}

/**
 * Like/unlike a review
 */
export async function toggleReviewLike(page: Page, reviewText: string) {
  await page.click(`[data-testid="review"]:has-text("${reviewText}") [data-testid="like-review"]`)
  
  // Wait for like count to update
  await page.waitForTimeout(1000)
}