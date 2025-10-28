import { Page, expect } from '@playwright/test'

export interface TestCafe {
  name: string
  address: string
  city: string
  rating?: number
}

export const TEST_CAFES = {
  toronto: {
    name: 'Test Matcha Cafe',
    address: '123 Queen St W, Toronto',
    city: 'toronto',
    rating: 8.5
  }
} as const

/**
 * Navigate to a cafe detail page
 */
export async function navigateToCafe(page: Page, cafeId: string | number) {
  await page.goto(`/cafes/${cafeId}`)
  await page.waitForSelector('[data-testid="cafe-detail"]', { timeout: 10000 })
}

/**
 * Search for cafes by name
 */
export async function searchCafes(page: Page, searchTerm: string) {
  // Open search (assuming it's in header)
  await page.click('[data-testid="search-button"]')
  
  // Fill search input
  await page.fill('[data-testid="search-input"]', searchTerm)
  
  // Wait for search results
  await page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 })
}

/**
 * Check in to a cafe
 */
export async function checkInToCafe(page: Page, cafeId: string | number) {
  await navigateToCafe(page, cafeId)
  
  // Click check-in button
  await page.click('[data-testid="checkin-button"]')
  
  // Wait for check-in confirmation
  await expect(page.locator('text=checked in')).toBeVisible({ timeout: 5000 })
}

/**
 * Filter cafes by rating
 */
export async function filterCafesByRating(page: Page, minRating: number) {
  // Open filters (assuming in list view)
  await page.click('[data-testid="filters-button"]')
  
  // Set minimum rating
  await page.fill('[data-testid="rating-filter"]', minRating.toString())
  
  // Apply filters
  await page.click('[data-testid="apply-filters"]')
  
  // Wait for filtered results
  await page.waitForSelector('[data-testid="cafe-list"]', { timeout: 5000 })
}

/**
 * Switch between map and list views
 */
export async function switchToMapView(page: Page) {
  await page.click('[data-testid="map-view-button"]')
  await page.waitForSelector('[data-testid="map-container"]', { timeout: 5000 })
}

export async function switchToListView(page: Page) {
  await page.click('[data-testid="list-view-button"]')
  await page.waitForSelector('[data-testid="cafe-list"]', { timeout: 5000 })
}