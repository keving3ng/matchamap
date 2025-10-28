import { Page, expect } from '@playwright/test'

export interface TestUser {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export const TEST_USERS = {
  regular: {
    email: 'test@matchamap.app',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  },
  admin: {
    email: 'admin@matchamap.app', 
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User'
  }
} as const

/**
 * Register a new user account
 */
export async function registerUser(page: Page, user: TestUser) {
  await page.goto('/register')
  
  // Fill registration form
  await page.fill('[name="email"]', user.email)
  await page.fill('[name="password"]', user.password)
  await page.fill('[name="confirmPassword"]', user.password)
  
  if (user.firstName) {
    await page.fill('[name="firstName"]', user.firstName)
  }
  if (user.lastName) {
    await page.fill('[name="lastName"]', user.lastName)
  }
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for success or verification message
  await expect(page.locator('text=account created')).toBeVisible({ timeout: 10000 })
}

/**
 * Login with existing credentials
 */
export async function loginUser(page: Page, user: TestUser) {
  await page.goto('/login')
  
  // Fill login form
  await page.fill('[name="email"]', user.email)
  await page.fill('[name="password"]', user.password)
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for navigation to dashboard/home
  await page.waitForURL('/', { timeout: 10000 })
  
  // Verify user is logged in
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
}

/**
 * Logout current user
 */
export async function logoutUser(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]')
  
  // Click logout
  await page.click('text=Logout')
  
  // Verify redirect to login or home
  await page.waitForURL(/\/(login)?$/, { timeout: 5000 })
}

/**
 * Setup authenticated page context
 */
export async function setupAuthenticatedPage(page: Page, userType: keyof typeof TEST_USERS = 'regular') {
  const user = TEST_USERS[userType]
  await loginUser(page, user)
  return user
}