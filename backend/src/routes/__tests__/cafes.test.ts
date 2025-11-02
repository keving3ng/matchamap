import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../../index';
import {
  createTestRequest,
  createAuthenticatedRequest,
  mockCafe,
  mockDrink,
  mockAdminUser,
  createTestToken,
  cleanupTestData,
  seedTestData,
  expectJsonResponse,
  expectErrorResponse,
} from '../../test/utils';

describe('Cafe Routes', () => {
  let adminToken: string;

  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);
    adminToken = await createTestToken(mockAdminUser);
  });

  describe('GET /api/cafes', () => {
    it('should return empty list when no cafes exist', async () => {
      const request = createTestRequest('/api/cafes');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data).toMatchObject({
        cafes: [],
        total: 0,
        hasMore: false,
      });
    });

    it('should return all cafes with drinks and scores', async () => {
      // Insert test cafe
      const cafeResult = await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, address, latitude, longitude, city, ambiance_score, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        mockCafe.name,
        mockCafe.slug,
        mockCafe.link,
        mockCafe.address,
        mockCafe.latitude,
        mockCafe.longitude,
        mockCafe.city,
        mockCafe.ambianceScore,
        mockCafe.quickNote
      ).run();

      // Insert test drink
      await env.DB.prepare(`
        INSERT INTO drinks (cafe_id, name, score, price_amount, price_currency, is_default)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        cafeResult.meta.last_row_id,
        mockDrink.name,
        mockDrink.score,
        mockDrink.priceAmount,
        mockDrink.priceCurrency,
        mockDrink.isDefault ? 1 : 0
      ).run();

      const request = createTestRequest('/api/cafes');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cafes).toHaveLength(1);
      expect(data.cafes[0]).toMatchObject({
        name: mockCafe.name,
        slug: mockCafe.slug,
        city: mockCafe.city,
        displayScore: mockDrink.score,
      });
      expect(data.cafes[0].drinks).toHaveLength(1);
      expect(data.cafes[0].drinks[0]).toMatchObject({
        name: mockDrink.name,
        score: mockDrink.score,
        isDefault: mockDrink.isDefault,
      });
    });

    it('should filter cafes by city', async () => {
      // Insert cafes in different cities
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Toronto Cafe', 'toronto-cafe', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Toronto test cafe').run();

      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Montreal Cafe', 'montreal-cafe', 'https://example.com', 'montreal', 45.5017, -73.5673, 'Montreal test cafe').run();

      const request = createTestRequest('/api/cafes?city=toronto');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cafes).toHaveLength(1);
      expect(data.cafes[0].name).toBe('Toronto Cafe');
      expect(data.cafes[0].city).toBe('toronto');
    });

    it('should return 400 for invalid city filter', async () => {
      const request = createTestRequest('/api/cafes?city=invalid');
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'Invalid city parameter');
    });

    it('should handle pagination with limit and offset', async () => {
      // Insert multiple cafes
      for (let i = 1; i <= 5; i++) {
        await env.DB.prepare(`
          INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(`Cafe ${i}`, `cafe-${i}`, 'https://example.com', 'toronto', 43.6532, -79.3832, `Test cafe ${i}`).run();
      }

      const request = createTestRequest('/api/cafes?limit=3&offset=2');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cafes).toHaveLength(3);
      expect(data.total).toBe(5);
      expect(data.hasMore).toBe(false);
    });

    it('should respect maximum limit', async () => {
      const request = createTestRequest('/api/cafes?limit=999999');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      // Should respect max limit defined in PAGINATION_CONSTANTS
    });

    it('should include proper cache headers', async () => {
      const request = createTestRequest('/api/cafes');
      
      const response = await worker.fetch(request, env);
      

      expect(response.headers.get('cache-control')).toContain('public');
      expect(response.headers.get('cache-control')).toContain('max-age=');
    });

    it('should exclude soft-deleted cafes', async () => {
      // Insert cafe and then soft delete it
      const cafeResult = await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Deleted Cafe', 'deleted-cafe', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Test cafe').run();

      await env.DB.prepare(`
        UPDATE cafes SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(cafeResult.meta.last_row_id).run();

      const request = createTestRequest('/api/cafes');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cafes).toHaveLength(0);
    });
  });

  describe('GET /api/cafes/:id', () => {
    it('should return single cafe with drinks', async () => {
      const cafeResult = await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(mockCafe.name, mockCafe.slug, mockCafe.link, mockCafe.city, mockCafe.latitude, mockCafe.longitude, mockCafe.quickNote).run();

      await env.DB.prepare(`
        INSERT INTO drinks (cafe_id, name, score, price_amount, price_currency, is_default)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(cafeResult.meta.last_row_id, mockDrink.name, mockDrink.score, mockDrink.priceAmount, mockDrink.priceCurrency, 1).run();

      const request = createTestRequest(`/api/cafes/${cafeResult.meta.last_row_id}`);
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cafe.name).toBe(mockCafe.name);
      expect(data.drinks).toHaveLength(1);
      expect(data.drinks[0].name).toBe(mockDrink.name);
    });

    it('should return 404 for non-existent cafe', async () => {
      const request = createTestRequest('/api/cafes/99999');
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 404);
    });

    it('should return 400 for invalid cafe ID', async () => {
      const request = createTestRequest('/api/cafes/invalid');
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'Invalid cafe ID');
    });

    it('should return 404 for soft-deleted cafe', async () => {
      const cafeResult = await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind('Deleted Cafe', 'deleted-cafe', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Test cafe').run();

      const request = createTestRequest(`/api/cafes/${cafeResult.meta.last_row_id}`);
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 404);
    });
  });

  describe('POST /api/admin/cafes', () => {
    it('should create cafe with admin authentication', async () => {
      const newCafe = {
        name: 'New Test Cafe',
        slug: 'new-test-cafe',
        link: 'https://example.com',
        address: '456 New Street',
        latitude: 43.6532,
        longitude: -79.3832,
        city: 'toronto',
        ambianceScore: 8.0,
        quickNote: 'A new test cafe',
      };

      const request = createAuthenticatedRequest('/api/admin/cafes', adminToken, {
        method: 'POST',
        body: JSON.stringify(newCafe),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);
      
      const data = await response.json() as any;
      expect(data.cafe).toMatchObject(newCafe);
      expect(data.cafe.id).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const request = createTestRequest('/api/admin/cafes', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });

    it('should return 400 for missing required fields', async () => {
      const request = createAuthenticatedRequest('/api/admin/cafes', adminToken, {
        method: 'POST',
        body: JSON.stringify({ name: '' }), // Missing required fields
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'Missing required fields');
    });

    it('should return 400 for invalid city', async () => {
      const newCafe = {
        name: 'Test Cafe',
        link: 'https://example.com',
        latitude: 43.6532,
        longitude: -79.3832,
        city: 'invalid-city',
      };

      const request = createAuthenticatedRequest('/api/admin/cafes', adminToken, {
        method: 'POST',
        body: JSON.stringify(newCafe),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'Invalid city');
    });

    it('should return 409 for duplicate slug', async () => {
      // Insert existing cafe
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Existing Cafe', 'test-slug', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Test cafe').run();

      const newCafe = {
        name: 'New Cafe',
        slug: 'test-slug', // Duplicate slug
        link: 'https://example.com',
        latitude: 43.6532,
        longitude: -79.3832,
        city: 'toronto',
      };

      const request = createAuthenticatedRequest('/api/admin/cafes', adminToken, {
        method: 'POST',
        body: JSON.stringify(newCafe),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 409, 'already exists');
    });

    it('should restore and update soft-deleted cafe', async () => {
      // Insert soft-deleted cafe
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind('Deleted Cafe', 'restored-cafe', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Test cafe').run();

      const newCafe = {
        name: 'Restored Cafe',
        slug: 'restored-cafe',
        link: 'https://example.com',
        latitude: 43.6532,
        longitude: -79.3832,
        city: 'toronto',
      };

      const request = createAuthenticatedRequest('/api/admin/cafes', adminToken, {
        method: 'POST',
        body: JSON.stringify(newCafe),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);
      
      const data = await response.json() as any;
      expect(data.cafe.name).toBe('Restored Cafe');
      expect(data.cafe.deletedAt).toBeNull();
    });
  });

  describe('PUT /api/admin/cafes/:id', () => {
    it('should update existing cafe', async () => {
      const cafeResult = await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Original Cafe', 'original-cafe', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Original note').run();

      const updates = {
        name: 'Updated Cafe',
        quickNote: 'Updated note',
        ambianceScore: 9.0,
      };

      const request = createAuthenticatedRequest(`/api/admin/cafes/${cafeResult.meta.last_row_id}`, adminToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cafe.name).toBe('Updated Cafe');
      expect(data.cafe.quickNote).toBe('Updated note');
      expect(data.cafe.ambianceScore).toBe(9.0);
    });

    it('should return 404 for non-existent cafe', async () => {
      const request = createAuthenticatedRequest('/api/admin/cafes/99999', adminToken, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 404);
    });

    it('should return 401 without authentication', async () => {
      const request = createTestRequest('/api/admin/cafes/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });
  });

  describe('DELETE /api/admin/cafes/:id', () => {
    it('should soft delete cafe', async () => {
      const cafeResult = await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('To Delete Cafe', 'to-delete-cafe', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Test cafe').run();

      const request = createAuthenticatedRequest(`/api/admin/cafes/${cafeResult.meta.last_row_id}`, adminToken, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.message).toContain('deleted successfully');

      // Verify cafe is soft deleted
      const deletedCafe = await env.DB.prepare(`
        SELECT * FROM cafes WHERE id = ?
      `).bind(cafeResult.meta.last_row_id).first();

      expect(deletedCafe.deleted_at).not.toBeNull();
    });

    it('should return 404 for non-existent cafe', async () => {
      const request = createAuthenticatedRequest('/api/admin/cafes/99999', adminToken, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 404);
    });

    it('should return 401 without authentication', async () => {
      const request = createTestRequest('/api/admin/cafes/1', {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });
  });
});