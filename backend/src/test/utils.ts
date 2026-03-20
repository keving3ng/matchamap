import { SignJWT } from 'jose';
import { expect, describe, beforeEach } from 'vitest';
import { TEST_SCHEMA } from './schema';

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
  time: '19:00',
  venue: 'Test Venue',
  link: 'https://example.com/event',
  location: 'Test Location',
  price: '$10',
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

// JWT secret for testing (must match .dev.vars JWT_SECRET)
const TEST_JWT_SECRET = new TextEncoder().encode('dev-secret-change-in-production-use-wrangler-secret');

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
      'Cookie': `access_token=${token}`,
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
    headers['Cookie'] = `access_token=${token}`;
  }

  return new Request(`https://api.matchamap.com${url}`, {
    method: 'POST',
    headers,
    body: formData,
  });
}

// Database test helpers

export async function initTestDatabase(env: any) {
  // Check if database is already initialized by checking for users table
  try {
    const result = await env.DB.prepare('SELECT name FROM sqlite_master WHERE type="table" AND name="users"').first();
    if (result) {
      // Database already initialized
      return;
    }
  } catch (error: any) {
    // If check fails, proceed with initialization
    console.log('Database check failed, initializing...');
  }

  // Split schema into individual statements
  // Split by semicolon, but keep multiline statements together
  const statements = TEST_SCHEMA
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    .map(stmt => stmt + ';'); // Re-add semicolon

  // Execute statements sequentially to ensure proper table creation
  for (const statement of statements) {
    if (!statement || statement === ';') continue;

    try {
      await env.DB.prepare(statement).run();
    } catch (execError: any) {
      // Ignore "already exists" and "duplicate" errors
      if (!execError.message?.includes('already exists') &&
          !execError.message?.includes('duplicate column') &&
          !execError.message?.includes('duplicate table') &&
          !execError.message?.includes('duplicate index')) {
        console.error('Schema init error:', execError.message, '\nStatement:', statement.substring(0, 150));
        // Don't throw, continue with next statement
      }
    }
  }
}

export async function cleanupTestData(env: any) {
  // Initialize database schema if not already done
  await initTestDatabase(env);

  // Clean up in reverse dependency order
  // Note: feed_items table was removed in migration 0015
  // Note: cities table never existed - city is a column in cafes table

  // List of tables to clean in dependency order (children first, parents last)
  const tables = [
    'user_activity_stats',
    'drinks',
    'cafe_stats',
    'event_stats',
    'cafes',
    'events',
    'sessions',
    'user_profiles',
    'admin_audit_log',
    'users',
    'waitlist',
  ];

  for (const table of tables) {
    try {
      await env.DB.exec(`DELETE FROM ${table}`);
    } catch (error: any) {
      // Silently ignore "no such table" errors
      if (!error.message?.includes('no such table')) {
        console.warn(`Cleanup warning for table ${table}:`, error.message);
      }
    }
  }
}

export async function seedTestData(env: any) {
  // Note: No cities table - city is a column in cafes table
  // The mockCity data is still available for tests to create cafes with city values

  // Insert test users (using snake_case column names to match schema)
  await env.DB.prepare(`
    INSERT INTO users (id, email, username, password_hash, role, is_email_verified)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    mockUser.id,
    mockUser.email,
    'testuser', // username field is required in schema
    mockUser.hashedPassword,
    mockUser.role,
    mockUser.isEmailVerified ? 1 : 0 // Convert boolean to integer
  ).run();

  await env.DB.prepare(`
    INSERT INTO users (id, email, username, password_hash, role, is_email_verified)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    mockAdminUser.id,
    mockAdminUser.email,
    'adminuser', // username field is required in schema
    mockAdminUser.hashedPassword,
    mockAdminUser.role,
    mockAdminUser.isEmailVerified ? 1 : 0 // Convert boolean to integer
  ).run();
}

// Helper function to insert a test cafe with proper column names
export async function insertTestCafe(env: any, cafe: Partial<typeof mockCafe> = {}) {
  const cafeData = { ...mockCafe, ...cafe };

  const result = await env.DB.prepare(`
    INSERT INTO cafes (
      name, slug, link, address, latitude, longitude, city,
      ambiance_score, charge_for_alt_milk, quick_note, review,
      source, hours, instagram, instagram_post_link, tiktok_post_link,
      images, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    cafeData.name,
    cafeData.slug,
    cafeData.link,
    cafeData.address,
    cafeData.latitude,
    cafeData.longitude,
    cafeData.city,
    cafeData.ambianceScore,
    cafeData.chargeForAltMilk,
    cafeData.quickNote,
    cafeData.review,
    cafeData.source,
    cafeData.hours,
    cafeData.instagram,
    cafeData.instagramPostLink,
    cafeData.tiktokPostLink,
    cafeData.images,
    cafeData.deletedAt
  ).run();

  return result.meta.last_row_id;
}

// Helper function to insert a test drink with proper column names
export async function insertTestDrink(env: any, cafeId: number, drink: Partial<typeof mockDrink> = {}) {
  const drinkData = { ...mockDrink, ...drink };

  const result = await env.DB.prepare(`
    INSERT INTO drinks (
      cafe_id, name, score, price_amount, price_currency,
      grams_used, is_default, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    cafeId,
    drinkData.name,
    drinkData.score,
    drinkData.priceAmount,
    drinkData.priceCurrency,
    drinkData.gramsUsed,
    drinkData.isDefault ? 1 : 0,
    drinkData.notes
  ).run();

  return result.meta.last_row_id;
}

// Helper function to insert a test event with proper column names
export async function insertTestEvent(env: any, event: Partial<typeof mockEvent> = {}) {
  const eventData = { ...mockEvent, ...event };

  const result = await env.DB.prepare(`
    INSERT INTO events (
      title, description, date, time, venue, location, link,
      price, featured, published
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    eventData.title,
    eventData.description,
    eventData.date,
    eventData.time,
    eventData.venue,
    eventData.location,
    eventData.link,
    eventData.price || null,
    eventData.featured ? 1 : 0,
    1 // published defaults to true
  ).run();

  return result.meta.last_row_id;
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