import { describe, it, expect, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../../index';
import {
  createTestRequest,
  mockCafe,
  mockDrink,
  cleanupTestData,
  seedTestData,
  expectJsonResponse,
  expectErrorResponse,
} from '../../test/utils';

describe('Drinks Routes', () => {
  let cafeId: number;

  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);

    // Create test cafe
    const cafeResult = await env.DB.prepare(`
      INSERT INTO cafes (name, slug, link, city, latitude, longitude) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      mockCafe.name,
      mockCafe.slug,
      mockCafe.link,
      mockCafe.city,
      mockCafe.latitude,
      mockCafe.longitude
    ).run();
    cafeId = cafeResult.lastInsertRowid as number;
  });

  describe('GET /api/drinks', () => {
    it('should return empty list when no drinks exist', async () => {
      const request = createTestRequest('/api/drinks');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data).toMatchObject({
        drinks: [],
        total: 0,
        hasMore: false,
      });
    });

    it('should return all drinks with cafe information', async () => {
      // Insert test drinks
      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, description, score, price, isDefault) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(cafeId, 'Matcha Latte', 'Traditional matcha latte', 8.5, 5.99, true).run();

      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, description, score, price, isDefault) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(cafeId, 'Iced Matcha', 'Refreshing iced matcha', 8.0, 6.49, false).run();

      const request = createTestRequest('/api/drinks');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.drinks).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.drinks[0]).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        score: expect.any(Number),
        price: expect.any(Number),
        cafeId: cafeId,
        cafe: expect.objectContaining({
          name: mockCafe.name,
          slug: mockCafe.slug,
        }),
      });
    });

    it('should filter drinks by cafe', async () => {
      // Create another cafe
      const cafe2Result = await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind('Cafe 2', 'cafe-2', 'https://example.com', 'toronto', 43.6532, -79.3832).run();
      const cafe2Id = cafe2Result.lastInsertRowid as number;

      // Insert drinks for both cafes
      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price) 
        VALUES (?, ?, ?, ?)
      `).bind(cafeId, 'Drink 1', 8.0, 5.00).run();

      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price) 
        VALUES (?, ?, ?, ?)
      `).bind(cafe2Id, 'Drink 2', 7.5, 4.50).run();

      const request = createTestRequest(`/api/drinks?cafeId=${cafeId}`);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.drinks).toHaveLength(1);
      expect(data.drinks[0].cafeId).toBe(cafeId);
      expect(data.drinks[0].name).toBe('Drink 1');
    });

    it('should filter drinks by minimum score', async () => {
      // Insert drinks with different scores
      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price) 
        VALUES (?, ?, ?, ?)
      `).bind(cafeId, 'High Score Drink', 9.0, 6.00).run();

      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price) 
        VALUES (?, ?, ?, ?)
      `).bind(cafeId, 'Low Score Drink', 6.5, 4.00).run();

      const request = createTestRequest('/api/drinks?minScore=8.0');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.drinks).toHaveLength(1);
      expect(data.drinks[0].name).toBe('High Score Drink');
      expect(data.drinks[0].score).toBeGreaterThanOrEqual(8.0);
    });

    it('should filter drinks by maximum price', async () => {
      // Insert drinks with different prices
      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price) 
        VALUES (?, ?, ?, ?)
      `).bind(cafeId, 'Expensive Drink', 8.0, 8.99).run();

      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price) 
        VALUES (?, ?, ?, ?)
      `).bind(cafeId, 'Affordable Drink', 7.5, 4.99).run();

      const request = createTestRequest('/api/drinks?maxPrice=6.00');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.drinks).toHaveLength(1);
      expect(data.drinks[0].name).toBe('Affordable Drink');
      expect(data.drinks[0].price).toBeLessThanOrEqual(6.00);
    });

    it('should handle pagination', async () => {
      // Insert multiple drinks
      for (let i = 1; i <= 5; i++) {
        await env.DB.prepare(`
          INSERT INTO drinks (cafeId, name, score, price) 
          VALUES (?, ?, ?, ?)
        `).bind(cafeId, `Drink ${i}`, 8.0, 5.00 + i).run();
      }

      const request = createTestRequest('/api/drinks?limit=3&offset=2');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.drinks).toHaveLength(3);
      expect(data.total).toBe(5);
      expect(data.hasMore).toBe(false);
    });

    it('should sort drinks by score (highest first)', async () => {
      // Insert drinks with different scores
      const drinks = [
        { name: 'Average Drink', score: 7.0 },
        { name: 'Best Drink', score: 9.5 },
        { name: 'Good Drink', score: 8.2 },
      ];

      for (const drink of drinks) {
        await env.DB.prepare(`
          INSERT INTO drinks (cafeId, name, score, price) 
          VALUES (?, ?, ?, ?)
        `).bind(cafeId, drink.name, drink.score, 5.00).run();
      }

      const request = createTestRequest('/api/drinks?sort=score&order=desc');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.drinks).toHaveLength(3);
      expect(data.drinks[0].name).toBe('Best Drink');
      expect(data.drinks[1].name).toBe('Good Drink');
      expect(data.drinks[2].name).toBe('Average Drink');
    });

    it('should include proper cache headers', async () => {
      const request = createTestRequest('/api/drinks');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get('cache-control')).toContain('public');
      expect(response.headers.get('cache-control')).toContain('max-age=');
    });

    it('should handle invalid filter parameters gracefully', async () => {
      const invalidRequests = [
        '/api/drinks?cafeId=invalid',
        '/api/drinks?minScore=invalid',
        '/api/drinks?maxPrice=invalid',
        '/api/drinks?limit=invalid',
        '/api/drinks?offset=invalid',
      ];

      for (const url of invalidRequests) {
        const request = createTestRequest(url);
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        await expectErrorResponse(response, 400);
      }
    });

    it('should return drinks with null values for optional fields', async () => {
      // Insert drink with minimal data
      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price) 
        VALUES (?, ?, ?, ?)
      `).bind(cafeId, 'Minimal Drink', 8.0, 5.00).run();

      const request = createTestRequest('/api/drinks');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.drinks[0]).toMatchObject({
        name: 'Minimal Drink',
        description: null,
        isDefault: false,
      });
    });
  });

  describe('GET /api/drinks/:id', () => {
    let drinkId: number;

    beforeEach(async () => {
      // Insert test drink
      const drinkResult = await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, description, score, price, isDefault) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        cafeId,
        mockDrink.name,
        mockDrink.description,
        mockDrink.score,
        mockDrink.price,
        mockDrink.isDefault
      ).run();
      drinkId = drinkResult.lastInsertRowid as number;
    });

    it('should return single drink with cafe information', async () => {
      const request = createTestRequest(`/api/drinks/${drinkId}`);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.drink).toMatchObject({
        id: drinkId,
        name: mockDrink.name,
        description: mockDrink.description,
        score: mockDrink.score,
        price: mockDrink.price,
        isDefault: mockDrink.isDefault,
        cafeId: cafeId,
      });
      expect(data.drink.cafe).toMatchObject({
        name: mockCafe.name,
        slug: mockCafe.slug,
      });
    });

    it('should return 404 for non-existent drink', async () => {
      const request = createTestRequest('/api/drinks/99999');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 404, 'Drink not found');
    });

    it('should return 400 for invalid drink ID', async () => {
      const request = createTestRequest('/api/drinks/invalid');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400, 'Invalid drink ID');
    });

    it('should include proper cache headers', async () => {
      const request = createTestRequest(`/api/drinks/${drinkId}`);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get('cache-control')).toContain('public');
      expect(response.headers.get('cache-control')).toContain('max-age=');
    });
  });

  describe('GET /api/cafes/:cafeId/drinks', () => {
    it('should return all drinks for a specific cafe', async () => {
      // Insert drinks for the cafe
      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price, isDefault) 
        VALUES (?, ?, ?, ?, ?)
      `).bind(cafeId, 'Default Drink', 8.5, 5.99, true).run();

      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price, isDefault) 
        VALUES (?, ?, ?, ?, ?)
      `).bind(cafeId, 'Special Drink', 9.0, 7.99, false).run();

      const request = createTestRequest(`/api/cafes/${cafeId}/drinks`);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.drinks).toHaveLength(2);
      expect(data.drinks.every((drink: any) => drink.cafeId === cafeId)).toBe(true);
      
      // Default drink should be first
      expect(data.drinks[0].isDefault).toBe(true);
      expect(data.drinks[0].name).toBe('Default Drink');
    });

    it('should return empty array for cafe with no drinks', async () => {
      const request = createTestRequest(`/api/cafes/${cafeId}/drinks`);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.drinks).toEqual([]);
    });

    it('should return 404 for non-existent cafe', async () => {
      const request = createTestRequest('/api/cafes/99999/drinks');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 404, 'Cafe not found');
    });

    it('should return 400 for invalid cafe ID', async () => {
      const request = createTestRequest('/api/cafes/invalid/drinks');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400, 'Invalid cafe ID');
    });

    it('should sort drinks with default drink first', async () => {
      // Insert multiple drinks, with default not being the first inserted
      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price, isDefault) 
        VALUES (?, ?, ?, ?, ?)
      `).bind(cafeId, 'Regular Drink 1', 7.0, 4.99, false).run();

      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price, isDefault) 
        VALUES (?, ?, ?, ?, ?)
      `).bind(cafeId, 'Default Drink', 8.5, 5.99, true).run();

      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price, isDefault) 
        VALUES (?, ?, ?, ?, ?)
      `).bind(cafeId, 'Regular Drink 2', 8.0, 6.99, false).run();

      const request = createTestRequest(`/api/cafes/${cafeId}/drinks`);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.drinks).toHaveLength(3);
      expect(data.drinks[0].isDefault).toBe(true);
      expect(data.drinks[0].name).toBe('Default Drink');
    });
  });

  describe('Drinks API Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error by corrupting env
      const invalidEnv = { ...env, DB: null };

      const request = createTestRequest('/api/drinks');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, invalidEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(500);
    });

    it('should validate numeric parameters properly', async () => {
      const testCases = [
        { param: 'minScore', value: '-1' },
        { param: 'minScore', value: '11' }, // Assuming max score is 10
        { param: 'maxPrice', value: '-1' },
        { param: 'limit', value: '0' },
        { param: 'limit', value: '1001' }, // Assuming max limit
        { param: 'offset', value: '-1' },
      ];

      for (const testCase of testCases) {
        const request = createTestRequest(`/api/drinks?${testCase.param}=${testCase.value}`);
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should handle edge cases in filtering', async () => {
      // Insert edge case drinks
      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price) 
        VALUES (?, ?, ?, ?)
      `).bind(cafeId, 'Zero Price Drink', 8.0, 0.00).run();

      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price) 
        VALUES (?, ?, ?, ?)
      `).bind(cafeId, 'Min Score Drink', 0.0, 5.00).run();

      await env.DB.prepare(`
        INSERT INTO drinks (cafeId, name, score, price) 
        VALUES (?, ?, ?, ?)
      `).bind(cafeId, 'Max Score Drink', 10.0, 10.00).run();

      // Test edge case filters
      const edgeCases = [
        '/api/drinks?minScore=0',
        '/api/drinks?maxPrice=0',
        '/api/drinks?minScore=10',
        '/api/drinks?maxPrice=10',
      ];

      for (const url of edgeCases) {
        const request = createTestRequest(url);
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        expectJsonResponse(response, 200);
      }
    });
  });
});