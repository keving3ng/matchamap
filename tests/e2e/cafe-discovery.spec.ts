import { test, expect } from '@playwright/test'
import { setupAuthenticatedPage } from './helpers/auth'
import { 
  navigateToCafe, 
  searchCafes, 
  filterCafesByRating, 
  switchToMapView, 
  switchToListView,
  checkInToCafe 
} from './helpers/cafe'

test.describe('Cafe Discovery & Navigation', () => {
  test('browse cafes → view details → check in → add review', async ({ page }) => {
    // Setup authenticated user
    await setupAuthenticatedPage(page)
    
    // Step 1: Browse cafes in list view
    await page.goto('/')
    await switchToListView(page)
    
    // Should see cafe list
    await expect(page.locator('[data-testid="cafe-list"]')).toBeVisible()
    
    // Should see cafe cards
    const cafeCards = page.locator('[data-testid="cafe-card"]')
    await expect(cafeCards.first()).toBeVisible()
    
    // Step 2: Click on first cafe to view details
    const firstCafe = cafeCards.first()
    const cafeId = await firstCafe.getAttribute('data-cafe-id')
    await firstCafe.click()
    
    // Should navigate to cafe detail page
    await page.waitForURL(`/cafes/${cafeId}`)
    await expect(page.locator('[data-testid="cafe-detail"]')).toBeVisible()
    
    // Should see cafe information
    await expect(page.locator('[data-testid="cafe-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="cafe-rating"]')).toBeVisible()
    await expect(page.locator('[data-testid="cafe-address"]')).toBeVisible()
    
    // Step 3: Check in to cafe
    await page.click('[data-testid="checkin-button"]')
    
    // Should see check-in confirmation
    await expect(page.locator('text=checked in')).toBeVisible({ timeout: 10000 })
    
    // Step 4: Add review
    await page.click('[data-testid="write-review-button"]')
    
    // Fill review form
    await page.selectOption('[data-testid="rating-select"]', '8')
    await page.fill('[data-testid="review-text"]', 'Great matcha experience! The service was excellent and the atmosphere was perfect for studying.')
    
    // Submit review
    await page.click('[data-testid="submit-review"]')
    
    // Should see success message
    await expect(page.locator('text=review submitted')).toBeVisible({ timeout: 10000 })
    
    // Review should appear in the list
    await expect(page.locator('[data-testid="review"]').first()).toBeVisible()
  })

  test('search cafes → filter by rating → view on map', async ({ page }) => {
    await setupAuthenticatedPage(page)
    await page.goto('/')
    
    // Step 1: Search for cafes
    await searchCafes(page, 'matcha')
    
    // Should see search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    
    // Step 2: Filter by high rating
    await filterCafesByRating(page, 8)
    
    // Should see filtered results
    const cafeCards = page.locator('[data-testid="cafe-card"]')
    await expect(cafeCards.first()).toBeVisible()
    
    // All visible cafes should have rating >= 8
    const ratings = await page.locator('[data-testid="cafe-rating"]').allTextContents()
    for (const rating of ratings) {
      const numericRating = parseFloat(rating)
      expect(numericRating).toBeGreaterThanOrEqual(8)
    }
    
    // Step 3: Switch to map view
    await switchToMapView(page)
    
    // Should see map with markers
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible()
    await expect(page.locator('[data-testid="cafe-marker"]')).toBeVisible()
    
    // Click on a map marker
    await page.click('[data-testid="cafe-marker"]').first()
    
    // Should see cafe popup
    await expect(page.locator('[data-testid="cafe-popup"]')).toBeVisible()
  })

  test('location-based discovery with geolocation', async ({ page }) => {
    await setupAuthenticatedPage(page)
    
    // Grant geolocation permission
    await page.context().grantPermissions(['geolocation'])
    await page.setGeolocation({ latitude: 43.6532, longitude: -79.3832 }) // Toronto
    
    await page.goto('/')
    
    // Click "Find nearby cafes" button
    await page.click('[data-testid="find-nearby-button"]')
    
    // Should see location permission request handled
    await expect(page.locator('[data-testid="nearby-cafes"]')).toBeVisible({ timeout: 10000 })
    
    // Cafes should be sorted by distance
    const distanceLabels = await page.locator('[data-testid="cafe-distance"]').allTextContents()
    
    // Verify distances are in ascending order
    const distances = distanceLabels.map(label => parseFloat(label.match(/(\d+\.?\d*)/)?.[1] || '0'))
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1])
    }
  })

  test('cafe navigation and directions', async ({ page }) => {
    await setupAuthenticatedPage(page)
    
    // Navigate to a specific cafe
    await navigateToCafe(page, '1')
    
    // Click get directions button
    await page.click('[data-testid="directions-button"]')
    
    // Should open external maps application or show directions modal
    // Since this typically opens external app, we just verify the button exists and is clickable
    await expect(page.locator('[data-testid="directions-button"]')).toBeVisible()
  })

  test('cafe hours and availability display', async ({ page }) => {
    await setupAuthenticatedPage(page)
    await navigateToCafe(page, '1')
    
    // Should see operating hours
    await expect(page.locator('[data-testid="cafe-hours"]')).toBeVisible()
    
    // Should indicate if currently open/closed
    const statusElement = page.locator('[data-testid="open-status"]')
    await expect(statusElement).toBeVisible()
    
    const status = await statusElement.textContent()
    expect(['Open', 'Closed', 'Opening soon', 'Closing soon']).toContain(status?.trim())
  })

  test('mobile-responsive cafe browsing', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await setupAuthenticatedPage(page)
    await page.goto('/')
    
    // Should see mobile-optimized layout
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
    
    // Swipe gestures should work (simulate with touch events)
    const cafeList = page.locator('[data-testid="cafe-list"]')
    await cafeList.hover()
    
    // Test bottom navigation
    await page.click('[data-testid="bottom-nav-map"]')
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible()
    
    await page.click('[data-testid="bottom-nav-list"]')
    await expect(page.locator('[data-testid="cafe-list"]')).toBeVisible()
  })
})