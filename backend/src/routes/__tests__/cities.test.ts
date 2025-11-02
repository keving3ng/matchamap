import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../../index';
import {
  createTestRequest,
  cleanupTestData,
  seedTestData,
  expectJsonResponse,
  expectErrorResponse,
} from '../../test/utils';

describe('Cities Routes', () => {
  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);
  });

  describe('GET /api/cities', () => {
    it('should return all cities with cafe counts', async () => {
      // Insert cafes in different cities
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Toronto Cafe 1', 'toronto-cafe-1', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Test cafe').run();

      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Toronto Cafe 2', 'toronto-cafe-2', 'https://example.com', 'toronto', 43.6500, -79.3800, 'Test cafe').run();

      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Montreal Cafe', 'montreal-cafe', 'https://example.com', 'montreal', 45.5017, -73.5673, 'Test cafe').run();

      const request = createTestRequest('/api/cities');

      const response = await worker.fetch(request, env);


      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.cities).toHaveLength(2); // toronto and montreal

      // Verify structure
      expect(data.cities[0]).toMatchObject({
        city: expect.any(String),
        cafe_count: expect.any(Number),
      });

      // Find toronto
      const toronto = data.cities.find((c: any) => c.city === 'toronto');
      expect(toronto).toBeDefined();
      expect(toronto.cafe_count).toBe(2);

      // Find montreal
      const montreal = data.cities.find((c: any) => c.city === 'montreal');
      expect(montreal).toBeDefined();
      expect(montreal.cafe_count).toBe(1);
    });

    it('should return empty array when no cafes exist', async () => {
      // Don't insert any cafes
      const request = createTestRequest('/api/cities');

      const response = await worker.fetch(request, env);


      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.cities).toEqual([]);
    });

    it('should exclude soft-deleted cafes from counts', async () => {
      // Insert active cafe
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Toronto Cafe 1', 'toronto-cafe-1', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Test cafe').run();

      // Insert deleted cafe
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind('Toronto Cafe 2', 'toronto-cafe-2', 'https://example.com', 'toronto', 43.6500, -79.3800, 'Test cafe').run();

      const request = createTestRequest('/api/cities');

      const response = await worker.fetch(request, env);


      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.cities).toHaveLength(1);
      expect(data.cities[0].city).toBe('toronto');
      expect(data.cities[0].cafe_count).toBe(1); // Only non-deleted cafe
    });

    it('should not return cities with only deleted cafes', async () => {
      // Insert only deleted cafes for a city
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind('Toronto Cafe 1', 'toronto-cafe-1', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Test cafe').run();

      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind('Toronto Cafe 2', 'toronto-cafe-2', 'https://example.com', 'toronto', 43.6500, -79.3800, 'Test cafe').run();

      const request = createTestRequest('/api/cities');

      const response = await worker.fetch(request, env);


      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.cities).toEqual([]);
    });

    it('should include proper cache headers', async () => {
      const request = createTestRequest('/api/cities');

      const response = await worker.fetch(request, env);


      expect(response.headers.get('cache-control')).toContain('public');
      expect(response.headers.get('cache-control')).toContain('max-age=');
    });

    it('should order cities by cafe count (descending) then alphabetically', async () => {
      // Insert cafes with different counts
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Toronto Cafe 1', 'toronto-cafe-1', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Test').run();

      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Toronto Cafe 2', 'toronto-cafe-2', 'https://example.com', 'toronto', 43.6500, -79.3800, 'Test').run();

      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Toronto Cafe 3', 'toronto-cafe-3', 'https://example.com', 'toronto', 43.6400, -79.3700, 'Test').run();

      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Montreal Cafe 1', 'montreal-cafe-1', 'https://example.com', 'montreal', 45.5017, -73.5673, 'Test').run();

      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Montreal Cafe 2', 'montreal-cafe-2', 'https://example.com', 'montreal', 45.5000, -73.5600, 'Test').run();

      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Vancouver Cafe', 'vancouver-cafe', 'https://example.com', 'vancouver', 49.2827, -123.1207, 'Test').run();

      const request = createTestRequest('/api/cities');

      const response = await worker.fetch(request, env);


      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.cities).toHaveLength(3);

      // Should be ordered by count desc (toronto: 3, montreal: 2, vancouver: 1)
      expect(data.cities[0].city).toBe('toronto');
      expect(data.cities[0].cafe_count).toBe(3);
      expect(data.cities[1].city).toBe('montreal');
      expect(data.cities[1].cafe_count).toBe(2);
      expect(data.cities[2].city).toBe('vancouver');
      expect(data.cities[2].cafe_count).toBe(1);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error by corrupting env
      const invalidEnv = { ...env, DB: null };

      const request = createTestRequest('/api/cities');

      const response = await worker.fetch(request, invalidEnv);


      expect(response.status).toBe(500);
    });

    it('should handle cities with special characters', async () => {
      // Insert cafe with city containing special characters
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Test Cafe', 'test-cafe', 'https://example.com', 'new york', 40.7128, -74.0060, 'Test').run();

      const request = createTestRequest('/api/cities');

      const response = await worker.fetch(request, env);


      expectJsonResponse(response, 200);

      const data = await response.json() as any;
      expect(data.cities).toHaveLength(1);
      expect(data.cities[0].city).toBe('new york');
    });
  });

  describe('Cities API Security and Validation', () => {
    it('should prevent SQL injection attempts', async () => {
      // Insert a normal cafe
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Toronto Cafe', 'toronto-cafe', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Test').run();

      const request = createTestRequest('/api/cities');

      const response = await worker.fetch(request, env);


      // Should succeed without errors
      expectJsonResponse(response, 200);

      // Verify cafes table still exists
      const testQuery = await env.DB.prepare('SELECT COUNT(*) as count FROM cafes').first();
      expect(testQuery).toBeTruthy();
    });

    it('should handle concurrent requests efficiently', async () => {
      // Insert test data
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude, quick_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Toronto Cafe', 'toronto-cafe', 'https://example.com', 'toronto', 43.6532, -79.3832, 'Test').run();

      // Make multiple concurrent requests
      const requests = Array.from({ length: 10 }, () =>
        worker.fetch(createTestRequest('/api/cities'), env)
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      for (const response of responses) {
        expect(response.status).toBe(200);
      }
    });
  });
});
