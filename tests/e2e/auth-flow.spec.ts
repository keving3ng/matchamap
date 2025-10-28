import { test, expect } from '@playwright/test'
import { registerUser, loginUser, logoutUser, TEST_USERS } from './helpers/auth'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
    await page.goto('/')
  })

  test('user registration → email verification → first login', async ({ page }) => {
    const newUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'E2E',
      lastName: 'Test'
    }

    // Step 1: Register new user
    await registerUser(page, newUser)
    
    // Should see verification message
    await expect(page.locator('text=verification email')).toBeVisible()
    
    // For E2E testing, we'll assume email verification is bypassed in test mode
    // In a real scenario, you'd need to check test email or have a test bypass
    
    // Step 2: First login attempt
    await loginUser(page, newUser)
    
    // Should be redirected to onboarding or home page
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
    
    // Step 3: Verify user is properly authenticated
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Check that user profile shows correct information
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Profile')
    
    await expect(page.locator(`text=${newUser.firstName}`)).toBeVisible()
    await expect(page.locator(`text=${newUser.email}`)).toBeVisible()
  })

  test('login with existing user credentials', async ({ page }) => {
    // Use predefined test user
    await loginUser(page, TEST_USERS.regular)
    
    // Verify successful login
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Should be on home page
    expect(page.url()).toBe('/')
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    
    // Enter invalid credentials
    await page.fill('[name="email"]', 'invalid@example.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=invalid credentials')).toBeVisible()
    
    // Should remain on login page
    expect(page.url()).toContain('/login')
  })

  test('logout process works correctly', async ({ page }) => {
    // First login
    await loginUser(page, TEST_USERS.regular)
    
    // Verify logged in state
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Logout
    await logoutUser(page)
    
    // Should be redirected to home or login
    await page.waitForURL(/\/(login)?$/)
    
    // User menu should not be visible
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible()
    
    // Try to access protected route
    await page.goto('/profile')
    
    // Should be redirected to login
    await page.waitForURL('/login')
  })

  test('session persistence across page refresh', async ({ page }) => {
    // Login
    await loginUser(page, TEST_USERS.regular)
    
    // Verify logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Refresh page
    await page.reload()
    
    // Should still be logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    const protectedRoutes = ['/profile', '/admin', '/settings']
    
    for (const route of protectedRoutes) {
      await page.goto(route)
      
      // Should redirect to login
      await page.waitForURL('/login')
      
      // Should see login form
      await expect(page.locator('form')).toBeVisible()
    }
  })

  test('password reset flow', async ({ page }) => {
    await page.goto('/login')
    
    // Click forgot password
    await page.click('text=Forgot password')
    
    // Should navigate to reset page
    await page.waitForURL('/reset-password')
    
    // Enter email
    await page.fill('[name="email"]', TEST_USERS.regular.email)
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text=reset email sent')).toBeVisible()
  })
})