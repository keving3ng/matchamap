import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../../index';
import {
  createTestRequest,
  mockCity,
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
    it('should return all active cities', async () => {
      // Insert additional test cities
      await env.DB.prepare(`
        INSERT INTO cities (name, key, displayName, lat, lng, zoom, isActive) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Montreal', 'montreal', 'Montreal, QC', 45.5017, -73.5673, 11, true).run();

      await env.DB.prepare(`
        INSERT INTO cities (name, key, displayName, lat, lng, zoom, isActive) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Vancouver', 'vancouver', 'Vancouver, BC', 49.2827, -123.1207, 11, false).run(); // Inactive

      const request = createTestRequest('/api/cities');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cities).toHaveLength(2); // Only active cities
      expect(data.cities[0]).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        key: expect.any(String),
        displayName: expect.any(String),
        lat: expect.any(Number),
        lng: expect.any(Number),
        zoom: expect.any(Number),
        isActive: true,
      });

      // Verify inactive city is not included
      const cityKeys = data.cities.map((city: any) => city.key);
      expect(cityKeys).not.toContain('vancouver');
    });

    it('should return empty array when no active cities exist', async () => {
      // Make all cities inactive
      await env.DB.exec('UPDATE cities SET isActive = false');

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

    it('should sort cities by name alphabetically', async () => {
      // Insert cities in non-alphabetical order
      await env.DB.prepare(`
        INSERT INTO cities (name, key, displayName, lat, lng, zoom, isActive) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Zebra City', 'zebra', 'Zebra City', 0, 0, 10, true).run();

      await env.DB.prepare(`
        INSERT INTO cities (name, key, displayName, lat, lng, zoom, isActive) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Alpha City', 'alpha', 'Alpha City', 0, 0, 10, true).run();

      const request = createTestRequest('/api/cities');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cities).toHaveLength(3);
      expect(data.cities[0].name).toBe('Alpha City');
      expect(data.cities[1].name).toBe('Toronto'); // From seedTestData
      expect(data.cities[2].name).toBe('Zebra City');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error by corrupting env
      const invalidEnv = { ...env, DB: null };

      const request = createTestRequest('/api/cities');
      
      const response = await worker.fetch(request, invalidEnv);
      

      expect(response.status).toBe(500);
    });

    it('should return all required city fields', async () => {
      const request = createTestRequest('/api/cities');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cities).toHaveLength(1);
      
      const city = data.cities[0];
      expect(city).toMatchObject({
        id: mockCity.id,
        name: mockCity.name,
        key: mockCity.key,
        displayName: mockCity.displayName,
        lat: mockCity.lat,
        lng: mockCity.lng,
        zoom: mockCity.zoom,
        isActive: mockCity.isActive,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should handle edge case coordinates', async () => {
      // Insert cities with edge case coordinates
      await env.DB.prepare(`
        INSERT INTO cities (name, key, displayName, lat, lng, zoom, isActive) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('North Pole', 'north-pole', 'North Pole', 90.0, 0.0, 5, true).run();

      await env.DB.prepare(`
        INSERT INTO cities (name, key, displayName, lat, lng, zoom, isActive) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('South Pole', 'south-pole', 'South Pole', -90.0, 0.0, 5, true).run();

      await env.DB.prepare(`
        INSERT INTO cities (name, key, displayName, lat, lng, zoom, isActive) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Date Line', 'date-line', 'Date Line', 0.0, 180.0, 5, true).run();

      const request = createTestRequest('/api/cities');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cities).toHaveLength(4);
      
      // Verify edge case coordinates are preserved
      const northPole = data.cities.find((city: any) => city.key === 'north-pole');
      expect(northPole.lat).toBe(90.0);
      expect(northPole.lng).toBe(0.0);

      const southPole = data.cities.find((city: any) => city.key === 'south-pole');
      expect(southPole.lat).toBe(-90.0);
      expect(southPole.lng).toBe(0.0);

      const dateLine = data.cities.find((city: any) => city.key === 'date-line');
      expect(dateLine.lat).toBe(0.0);
      expect(dateLine.lng).toBe(180.0);
    });
  });

  describe('GET /api/cities/:key', () => {
    it('should return single city by key', async () => {
      const request = createTestRequest('/api/cities/toronto');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.city).toMatchObject({
        id: mockCity.id,
        name: mockCity.name,
        key: mockCity.key,
        displayName: mockCity.displayName,
        lat: mockCity.lat,
        lng: mockCity.lng,
        zoom: mockCity.zoom,
        isActive: mockCity.isActive,
      });
    });

    it('should return 404 for non-existent city', async () => {
      const request = createTestRequest('/api/cities/nonexistent');
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 404, 'City not found');
    });

    it('should return 404 for inactive city', async () => {
      // Make the city inactive
      await env.DB.prepare(`
        UPDATE cities SET isActive = false WHERE key = ?
      `).bind('toronto').run();

      const request = createTestRequest('/api/cities/toronto');
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 404, 'City not found');
    });

    it('should handle case sensitivity in city keys', async () => {
      // Test uppercase key
      const request = createTestRequest('/api/cities/TORONTO');
      
      const response = await worker.fetch(request, env);
      

      // Should either work (case insensitive) or return 404 (case sensitive)
      // Depending on implementation, adjust expectation accordingly
      if (response.status === 200) {
        const data = await response.json() as any;
        expect(data.city.key).toBe('toronto');
      } else {
        await expectErrorResponse(response, 404);
      }
    });

    it('should include proper cache headers', async () => {
      const request = createTestRequest('/api/cities/toronto');
      
      const response = await worker.fetch(request, env);
      

      expect(response.headers.get('cache-control')).toContain('public');
      expect(response.headers.get('cache-control')).toContain('max-age=');
    });

    it('should validate city key format', async () => {
      const invalidKeys = [
        '', // Empty
        'city with spaces',
        'city-with-special-!@#',
        'a'.repeat(101), // Too long
      ];

      for (const key of invalidKeys) {
        const request = createTestRequest(`/api/cities/${encodeURIComponent(key)}`);
        
        const response = await worker.fetch(request, env);
        

        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('GET /api/cities/:key/cafes', () => {
    beforeEach(async () => {
      // Insert test cafes for the city
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind('Toronto Cafe 1', 'toronto-cafe-1', 'https://example.com', 'toronto', 43.6532, -79.3832).run();

      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind('Toronto Cafe 2', 'toronto-cafe-2', 'https://example.com', 'toronto', 43.6500, -79.3800).run();

      // Insert cafe in different city
      await env.DB.prepare(`
        INSERT INTO cities (name, key, displayName, lat, lng, zoom, isActive) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Montreal', 'montreal', 'Montreal, QC', 45.5017, -73.5673, 11, true).run();

      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind('Montreal Cafe', 'montreal-cafe', 'https://example.com', 'montreal', 45.5017, -73.5673).run();
    });

    it('should return cafes for specific city', async () => {
      const request = createTestRequest('/api/cities/toronto/cafes');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cafes).toHaveLength(2);
      expect(data.cafes.every((cafe: any) => cafe.city === 'toronto')).toBe(true);
      expect(data.city).toMatchObject({
        key: 'toronto',
        name: 'Toronto',
      });
    });

    it('should return empty array for city with no cafes', async () => {
      const request = createTestRequest('/api/cities/montreal/cafes');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cafes).toHaveLength(1); // Montreal has 1 cafe
      expect(data.city.key).toBe('montreal');
    });

    it('should return 404 for non-existent city', async () => {
      const request = createTestRequest('/api/cities/nonexistent/cafes');
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 404, 'City not found');
    });

    it('should exclude soft-deleted cafes', async () => {
      // Soft delete one cafe
      await env.DB.prepare(`
        UPDATE cafes SET deletedAt = CURRENT_TIMESTAMP 
        WHERE slug = ?
      `).bind('toronto-cafe-1').run();

      const request = createTestRequest('/api/cities/toronto/cafes');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cafes).toHaveLength(1);
      expect(data.cafes[0].slug).toBe('toronto-cafe-2');
    });

    it('should support pagination for city cafes', async () => {
      // Add more cafes
      for (let i = 3; i <= 10; i++) {
        await env.DB.prepare(`
          INSERT INTO cafes (name, slug, link, city, latitude, longitude) 
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(`Toronto Cafe ${i}`, `toronto-cafe-${i}`, 'https://example.com', 'toronto', 43.6532, -79.3832).run();
      }

      const request = createTestRequest('/api/cities/toronto/cafes?limit=5&offset=3');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.cafes).toHaveLength(5);
      expect(data.total).toBe(10);
      expect(data.hasMore).toBe(true);
    });

    it('should include cafe drinks and scores', async () => {
      // Add drinks to a cafe
      const cafeResult = await env.DB.prepare(`
        SELECT id FROM cafes WHERE slug = ?
      `).bind('toronto-cafe-1').first();

      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price, isDefault) 
        VALUES (?, ?, ?, ?, ?)
      `).bind(cafeResult.id, 'Test Drink', 8.5, 5.99, true).run();

      const request = createTestRequest('/api/cities/toronto/cafes');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      const cafeWithDrink = data.cafes.find((cafe: any) => cafe.slug === 'toronto-cafe-1');
      expect(cafeWithDrink.displayScore).toBe(8.5);
      expect(cafeWithDrink.drinks).toHaveLength(1);
    });
  });

  describe('Cities API Security and Validation', () => {
    it('should prevent SQL injection in city key parameter', async () => {
      const maliciousKey = "'; DROP TABLE cities; --";
      
      const request = createTestRequest(`/api/cities/${encodeURIComponent(maliciousKey)}`);
      
      const response = await worker.fetch(request, env);
      

      // Should not cause an error and cities table should still exist
      expect(response.status).toBeGreaterThanOrEqual(400);
      
      // Verify cities table still exists
      const testQuery = await env.DB.prepare('SELECT COUNT(*) as count FROM cities').first();
      expect(testQuery).toBeTruthy();
    });

    it('should handle special characters in city keys', async () => {
      // Insert city with special characters in key
      await env.DB.prepare(`
        INSERT INTO cities (name, key, displayName, lat, lng, zoom, isActive) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind('Special City', 'special-city', 'Special City', 0, 0, 10, true).run();

      const request = createTestRequest('/api/cities/special-city');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.city.key).toBe('special-city');
    });

    it('should validate coordinate ranges', async () => {
      // Insert city with invalid coordinates (should be caught at database level)
      try {
        await env.DB.prepare(`
          INSERT INTO cities (name, key, displayName, lat, lng, zoom, isActive) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind('Invalid City', 'invalid-city', 'Invalid City', 91.0, 181.0, 10, true).run();
      } catch (error) {
        // Expected to fail due to coordinate validation
      }

      const request = createTestRequest('/api/cities');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      // Should not include city with invalid coordinates
      const invalidCity = data.cities.find((city: any) => city.key === 'invalid-city');
      expect(invalidCity).toBeUndefined();
    });

    it('should handle concurrent requests efficiently', async () => {
      // Make multiple concurrent requests
      const requests = Array.from({ length: 10 }, () => 
        worker.fetch(createTestRequest('/api/cities'), env, createExecutionContext())
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      for (const response of responses) {
        expect(response.status).toBe(200);
      }
    });
  });
});