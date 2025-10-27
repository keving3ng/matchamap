import { describe, it, expect, beforeEach, afterEach } from 'vitest'

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8787/api'

interface AuthResponse {
  success: boolean
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
  token?: string
  message?: string
}

describe('Authentication API Integration', () => {
  let testUserEmail: string
  let authToken: string

  beforeEach(() => {
    testUserEmail = `test-${Date.now()}@example.com`
  })

  afterEach(async () => {
    // Cleanup: delete test user if created
    if (authToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/delete-account`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })
      } catch (error) {
        console.warn('Failed to cleanup test user:', error)
      }
    }
  })

  it('should register new user successfully', async () => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      })
    })

    expect(response.status).toBe(201)
    
    const data: AuthResponse = await response.json()
    expect(data.success).toBe(true)
    expect(data.user?.email).toBe(testUserEmail)
    expect(data.user?.firstName).toBe('Test')
    expect(data.user?.lastName).toBe('User')
  })

  it('should reject duplicate email registration', async () => {
    // First registration
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      })
    })

    // Second registration with same email
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'AnotherPassword123!',
        firstName: 'Another',
        lastName: 'User'
      })
    })

    expect(response.status).toBe(409)
    
    const data: AuthResponse = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toContain('already exists')
  })

  it('should login with valid credentials', async () => {
    // First register
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      })
    })

    // Then login
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'TestPassword123!'
      })
    })

    expect(loginResponse.status).toBe(200)
    
    const loginData: AuthResponse = await loginResponse.json()
    expect(loginData.success).toBe(true)
    expect(loginData.user?.email).toBe(testUserEmail)
    expect(loginData.token).toBeDefined()
    
    authToken = loginData.token!
  })

  it('should reject login with invalid credentials', async () => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
    })

    expect(response.status).toBe(401)
    
    const data: AuthResponse = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toContain('Invalid credentials')
  })

  it('should validate authentication token', async () => {
    // Register and login first
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      })
    })

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'TestPassword123!'
      })
    })

    const loginData: AuthResponse = await loginResponse.json()
    authToken = loginData.token!

    // Test token validation
    const validateResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    expect(validateResponse.status).toBe(200)
    
    const userData = await validateResponse.json()
    expect(userData.user.email).toBe(testUserEmail)
  })

  it('should reject invalid authentication token', async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    })

    expect(response.status).toBe(401)
  })

  it('should refresh authentication token', async () => {
    // Register and login first
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      })
    })

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'TestPassword123!'
      })
    })

    const loginData: AuthResponse = await loginResponse.json()
    authToken = loginData.token!

    // Test token refresh
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    expect(refreshResponse.status).toBe(200)
    
    const refreshData = await refreshResponse.json()
    expect(refreshData.token).toBeDefined()
    expect(refreshData.token).not.toBe(authToken) // Should be a new token
  })

  it('should logout and invalidate session', async () => {
    // Register and login first
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      })
    })

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'TestPassword123!'
      })
    })

    const loginData: AuthResponse = await loginResponse.json()
    authToken = loginData.token!

    // Logout
    const logoutResponse = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    expect(logoutResponse.status).toBe(200)

    // Try to use token after logout
    const testResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    expect(testResponse.status).toBe(401) // Token should be invalid
  })
})