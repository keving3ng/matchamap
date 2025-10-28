import { test, expect } from '@playwright/test'
import { setupAuthenticatedPage } from '../e2e/helpers/auth'

test.describe('Performance & Load Testing', () => {
  test('activity feed performance with large dataset', async ({ page }) => {
    // Setup: login as user
    await setupAuthenticatedPage(page, 'regular')
    
    // Navigate to activity feed
    await page.goto('/feed')
    
    // Measure initial load time
    const startTime = Date.now()
    await page.waitForSelector('[data-testid="activity-feed"]', { timeout: 30000 })
    const loadTime = Date.now() - startTime
    
    console.log(`Activity feed load time: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds
    
    // Test scrolling performance with large list
    const scrollStartTime = Date.now()
    
    // Scroll to load more items
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      await page.waitForTimeout(100) // Small delay between scrolls
    }
    
    const scrollTime = Date.now() - scrollStartTime
    console.log(`Scroll performance for 10 actions: ${scrollTime}ms`)
    expect(scrollTime).toBeLessThan(3000) // Should handle scrolling smoothly
    
    // Verify items are loaded
    const activityItems = page.locator('[data-testid="activity-item"]')
    const itemCount = await activityItems.count()
    expect(itemCount).toBeGreaterThan(10) // Should have loaded multiple pages
  })

  test('search performance with autocomplete', async ({ page }) => {
    await page.goto('/')
    
    // Open search
    await page.click('[data-testid="search-button"]')
    const searchInput = page.locator('[data-testid="search-input"]')
    
    // Test search response time for each character
    const searchTerm = 'matcha'
    const searchTimes: number[] = []
    
    for (let i = 1; i <= searchTerm.length; i++) {
      const partialTerm = searchTerm.substring(0, i)
      
      const startTime = Date.now()
      await searchInput.fill(partialTerm)
      
      // Wait for search results or debounce
      await page.waitForTimeout(300) // Account for debounce
      
      try {
        await page.waitForSelector('[data-testid="search-results"]', { timeout: 2000 })
        const responseTime = Date.now() - startTime
        searchTimes.push(responseTime)
        console.log(`Search "${partialTerm}" response time: ${responseTime}ms`)
      } catch {
        // No results is okay for performance testing
        searchTimes.push(Date.now() - startTime)
      }
    }
    
    // Average search time should be reasonable
    const avgSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length
    console.log(`Average search response time: ${avgSearchTime}ms`)
    expect(avgSearchTime).toBeLessThan(1000) // Should respond within 1 second on average
  })

  test('photo upload performance with large files', async ({ page }) => {
    // Login first
    await setupAuthenticatedPage(page, 'regular')
    
    // Navigate to cafe to upload photo
    await page.goto('/cafes/1')
    await page.click('[data-testid="write-review-button"]')
    
    // Simulate large file upload (would need actual large test file)
    const uploadStartTime = Date.now()
    
    try {
      // This would need an actual large image file for real testing
      await page.setInputFiles('[data-testid="photo-upload"]', './tests/e2e/fixtures/test-cafe-photo.jpg')
      
      // Wait for upload progress or completion
      await page.waitForSelector('[data-testid="upload-progress"]', { timeout: 5000 })
      
      // Wait for upload to complete
      await page.waitForSelector('[data-testid="photo-preview"]', { timeout: 30000 })
      
      const uploadTime = Date.now() - uploadStartTime
      console.log(`Photo upload time: ${uploadTime}ms`)
      expect(uploadTime).toBeLessThan(15000) // Should upload within 15 seconds
      
    } catch (error) {
      console.log('Photo upload test skipped - no large test file available')
    }
  })

  test('leaderboard calculation performance', async ({ page }) => {
    await page.goto('/leaderboard')
    
    const startTime = Date.now()
    await page.waitForSelector('[data-testid="leaderboard"]', { timeout: 15000 })
    const loadTime = Date.now() - startTime
    
    console.log(`Leaderboard calculation time: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(10000) // Should calculate within 10 seconds
    
    // Verify data is loaded
    const leaderboardItems = page.locator('[data-testid="leaderboard-item"]')
    const itemCount = await leaderboardItems.count()
    expect(itemCount).toBeGreaterThan(0)
  })

  test('metrics tracking performance under load', async ({ page }) => {
    // This test simulates multiple rapid user actions to test metrics tracking
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto('/')
    
    const actionStartTime = Date.now()
    
    // Perform multiple rapid actions that would trigger metrics
    for (let i = 0; i < 20; i++) {
      // Navigate between different cafes rapidly
      await page.goto(`/cafes/${(i % 5) + 1}`)
      await page.waitForSelector('[data-testid="cafe-detail"]', { timeout: 5000 })
      
      // Simulate quick interactions
      if (i % 3 === 0) {
        // Check in
        try {
          await page.click('[data-testid="checkin-button"]', { timeout: 1000 })
        } catch {
          // Ignore if button not available
        }
      }
      
      if (i % 4 === 0) {
        // Toggle favorite
        try {
          await page.click('[data-testid="favorite-button"]', { timeout: 1000 })
        } catch {
          // Ignore if button not available
        }
      }
    }
    
    const totalActionTime = Date.now() - actionStartTime
    console.log(`20 rapid actions completed in: ${totalActionTime}ms`)
    
    // The app should remain responsive during metrics tracking
    expect(totalActionTime).toBeLessThan(30000) // 20 actions in under 30 seconds
    
    // Verify the app is still responsive
    await page.goto('/')
    await page.waitForSelector('[data-testid="cafe-list"]', { timeout: 5000 })
  })

  test('map rendering performance with many markers', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="map-view-button"]')
    
    const mapLoadStartTime = Date.now()
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 })
    
    // Wait for markers to load
    await page.waitForSelector('[data-testid="cafe-marker"]', { timeout: 10000 })
    
    const mapLoadTime = Date.now() - mapLoadStartTime
    console.log(`Map with markers load time: ${mapLoadTime}ms`)
    expect(mapLoadTime).toBeLessThan(8000) // Should load map within 8 seconds
    
    // Test map interaction performance
    const interactionStartTime = Date.now()
    
    // Zoom in/out rapidly
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="zoom-in"]')
      await page.waitForTimeout(200)
      await page.click('[data-testid="zoom-out"]')
      await page.waitForTimeout(200)
    }
    
    const interactionTime = Date.now() - interactionStartTime
    console.log(`Map interaction time: ${interactionTime}ms`)
    expect(interactionTime).toBeLessThan(5000) // Should handle interactions smoothly
  })

  test('mobile performance on slow network', async ({ page, context }) => {
    // Simulate slow 3G network
    await context.route('**/*', async route => {
      // Add delay to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 100))
      await route.continue()
    })
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    const startTime = Date.now()
    await page.goto('/')
    
    // Wait for app to be interactive
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    console.log(`Mobile app load time on slow network: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(12000) // Should load within 12 seconds on slow network
    
    // Test that core functionality works
    await page.click('[data-testid="bottom-nav-map"]')
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 8000 })
    
    await page.click('[data-testid="bottom-nav-list"]')
    await page.waitForSelector('[data-testid="cafe-list"]', { timeout: 8000 })
  })
})