import { SignJWT } from 'jose';
import { expect, describe, beforeEach } from 'vitest';

// Test data factories
export const mockCafe = {
  id: 1,
  name: 'Test Cafe',
  slug: 'test-cafe',
  link: 'https://example.com',
  address: '123 Test Street',
  latitude: 43.6532,
  longitude: -79.3832,
  city: 'toronto' as const,
  ambianceScore: 8.5,
  chargeForAltMilk: false,
  quickNote: 'Great test cafe',
  review: 'A wonderful place for testing',
  source: 'test',
  hours: 'Mon-Fri 8am-6pm',
  instagram: 'testcafe',
  instagramPostLink: 'https://instagram.com/p/test',
  tiktokPostLink: null,
  images: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  deletedAt: null,
};

export const mockDrink = {
  id: 1,
  cafeId: 1,
  name: 'Test Matcha Latte',
  score: 8.5,
  priceAmount: 599, // in cents
  priceCurrency: 'CAD',
  gramsUsed: 3,
  isDefault: true,
  notes: 'A test matcha latte',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockUser = {
  id: 1,
  email: 'test@example.com',
  hashedPassword: '$2a$10$test.hash.here',
  displayName: 'Test User',
  bio: null,
  avatar: null,
  role: 'user' as const,
  isEmailVerified: true,
  emailVerificationToken: null,
  passwordResetToken: null,
  passwordResetExpires: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockAdminUser = {
  ...mockUser,
  id: 2,
  email: 'admin@example.com',
  displayName: 'Admin User',
  role: 'admin' as const,
};

export const mockEvent = {
  id: 1,
  title: 'Test Event',
  description: 'A test event',
  date: '2024-12-01',
  link: 'https://example.com/event',
  location: 'Test Location',
  featured: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockCity = {
  id: 1,
  name: 'Toronto',
  key: 'toronto' as const,
  displayName: 'Toronto, ON',
  lat: 43.6532,
  lng: -79.3832,
  zoom: 11,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// JWT secret for testing (this should match your test environment)
const TEST_JWT_SECRET = new TextEncoder().encode('test-jwt-secret-key-for-testing-only');

// Helper to create JWT tokens for testing
export async function createTestToken(user: typeof mockUser | typeof mockAdminUser): Promise<string> {
  return await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(TEST_JWT_SECRET);
}

// Helper to create test requests
export function createTestRequest(
  url: string,
  options: RequestInit = {}
): Request {
  const baseURL = 'https://api.matchamap.com';
  return new Request(`${baseURL}${url}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
}

// Helper to create authenticated requests
export function createAuthenticatedRequest(
  url: string,
  token: string,
  options: RequestInit = {}
): Request {
  return createTestRequest(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// Helper to create multipart form requests
export function createMultipartRequest(
  url: string,
  formData: FormData,
  token?: string
): Request {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return new Request(`https://api.matchamap.com${url}`, {
    method: 'POST',
    headers,
    body: formData,
  });
}

// Database test helpers
export async function cleanupTestData(env: any) {
  // Clean up in reverse dependency order
  // Note: feed_items table was removed in migration 0015
  // Note: cities table never existed - city is a column in cafes table
  try {
    await env.DB.exec('DELETE FROM review_helpful');
    await env.DB.exec('DELETE FROM user_reviews');
    await env.DB.exec('DELETE FROM user_favorites');
    await env.DB.exec('DELETE FROM user_photos');
    await env.DB.exec('DELETE FROM drinks');
    await env.DB.exec('DELETE FROM check_ins');
    await env.DB.exec('DELETE FROM page_views');
    await env.DB.exec('DELETE FROM search_queries');
    await env.DB.exec('DELETE FROM cafes');
    await env.DB.exec('DELETE FROM events');
    await env.DB.exec('DELETE FROM sessions');
    await env.DB.exec('DELETE FROM users');
    await env.DB.exec('DELETE FROM waitlist');
  } catch (error) {
    // Ignore errors for tables that don't exist in test environment
    console.warn('Cleanup warning:', error);
  }
}

export async function seedTestData(env: any) {
  // Note: No cities table - city is a column in cafes table
  // The mockCity data is still available for tests to create cafes with city values

  // Insert test users
  await env.DB.prepare(`
    INSERT INTO users (id, email, hashedPassword, displayName, role, isEmailVerified) 
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    mockUser.id,
    mockUser.email,
    mockUser.hashedPassword,
    mockUser.displayName,
    mockUser.role,
    mockUser.isEmailVerified
  ).run();

  await env.DB.prepare(`
    INSERT INTO users (id, email, hashedPassword, displayName, role, isEmailVerified) 
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    mockAdminUser.id,
    mockAdminUser.email,
    mockAdminUser.hashedPassword,
    mockAdminUser.displayName,
    mockAdminUser.role,
    mockAdminUser.isEmailVerified
  ).run();
}

// Response assertion helpers
export function expectJsonResponse(response: Response, expectedStatus: number = 200) {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers.get('content-type')).toContain('application/json');
}

export async function getJsonResponseData(response: Response): Promise<any> {
  expectJsonResponse(response);
  return await response.json() as any;
}

export async function expectErrorResponse(response: Response, expectedStatus: number, expectedMessage?: string): Promise<any> {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers.get('content-type')).toContain('application/json');

  if (expectedMessage) {
    const data = await response.json() as any;
    expect(data.error).toContain(expectedMessage);
    return data;
  }

  return await response.json() as any;
}

// Common test patterns
export function describeRouteTests(routeName: string, tests: () => void) {
  // Placeholder for common test patterns - using vitest describe directly in tests
}

// Rate limiting test helpers
export async function testRateLimit(
  createRequest: () => Request,
  worker: any,
  env: any,
  maxRequests: number = 100
) {
  const requests = Array.from({ length: maxRequests + 1 }, createRequest);
  const responses = await Promise.all(
    requests.map(async (request) => {
      return worker.fetch(request, env);
    })
  );

  // First maxRequests should succeed, last one should be rate limited
  for (let i = 0; i < maxRequests; i++) {
    expect(responses[i].status).not.toBe(429);
  }
  expect(responses[maxRequests].status).toBe(429);
}