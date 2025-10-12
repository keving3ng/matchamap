import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../../index';
import {
  createTestRequest,
  mockFeedItem,
  cleanupTestData,
  seedTestData,
  expectJsonResponse,
  expectErrorResponse,
} from '../../test/utils';

describe('Feed Routes', () => {
  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);
  });

  describe('GET /api/feed', () => {
    it('should return empty list when no feed items exist', async () => {
      const request = createTestRequest('/api/feed');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data).toMatchObject({
        feed: [],
        total: 0,
        hasMore: false,
      });
    });

    it('should return all feed items ordered by creation date (newest first)', async () => {
      // Insert multiple feed items
      const feedItems = [
        { ...mockFeedItem, title: 'First Item', createdAt: '2024-12-01T10:00:00Z' },
        { ...mockFeedItem, title: 'Second Item', createdAt: '2024-12-01T12:00:00Z' },
        { ...mockFeedItem, title: 'Third Item', createdAt: '2024-12-01T08:00:00Z' },
      ];

      for (const item of feedItems) {
        await env.DB.prepare(`
          INSERT INTO feed (title, content, link, isPriority, createdAt) 
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          item.title,
          item.content,
          item.link,
          item.isPriority,
          item.createdAt
        ).run();
      }

      const request = createTestRequest('/api/feed');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed).toHaveLength(3);
      expect(data.total).toBe(3);
      
      // Feed should be ordered by creation date (newest first)
      expect(data.feed[0].title).toBe('Second Item'); // 12:00:00
      expect(data.feed[1].title).toBe('First Item');  // 10:00:00
      expect(data.feed[2].title).toBe('Third Item');  // 08:00:00
    });

    it('should handle pagination with limit and offset', async () => {
      // Insert multiple feed items
      for (let i = 1; i <= 5; i++) {
        await env.DB.prepare(`
          INSERT INTO feed (title, content, link, isPriority) 
          VALUES (?, ?, ?, ?)
        `).bind(
          `Feed Item ${i}`,
          `Content for item ${i}`,
          'https://example.com',
          false
        ).run();
      }

      const request = createTestRequest('/api/feed?limit=3&offset=2');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed).toHaveLength(3);
      expect(data.total).toBe(5);
      expect(data.hasMore).toBe(false);
    });

    it('should respect maximum limit', async () => {
      const request = createTestRequest('/api/feed?limit=999999');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      // Should respect max limit defined in PAGINATION_CONSTANTS
    });

    it('should filter by priority items only', async () => {
      // Insert regular and priority feed items
      await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority) 
        VALUES (?, ?, ?, ?)
      `).bind('Regular Item', 'Regular content', 'https://example.com', false).run();

      await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority) 
        VALUES (?, ?, ?, ?)
      `).bind('Priority Item', 'Priority content', 'https://example.com', true).run();

      const request = createTestRequest('/api/feed?priority=true');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed).toHaveLength(1);
      expect(data.feed[0].title).toBe('Priority Item');
      expect(data.feed[0].isPriority).toBe(true);
    });

    it('should include proper cache headers', async () => {
      const request = createTestRequest('/api/feed');
      
      const response = await worker.fetch(request, env);
      

      expect(response.headers.get('cache-control')).toContain('public');
      expect(response.headers.get('cache-control')).toContain('max-age=');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error by corrupting env
      const invalidEnv = { ...env, DB: null };

      const request = createTestRequest('/api/feed');
      
      const response = await worker.fetch(request, invalidEnv);
      

      expect(response.status).toBe(500);
    });

    it('should return feed items with all required fields', async () => {
      await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority) 
        VALUES (?, ?, ?, ?)
      `).bind(
        mockFeedItem.title,
        mockFeedItem.content,
        mockFeedItem.link,
        mockFeedItem.isPriority
      ).run();

      const request = createTestRequest('/api/feed');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed[0]).toMatchObject({
        id: expect.any(Number),
        title: mockFeedItem.title,
        content: mockFeedItem.content,
        link: mockFeedItem.link,
        isPriority: mockFeedItem.isPriority,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should handle feed items with missing optional fields', async () => {
      await env.DB.prepare(`
        INSERT INTO feed (title, content) 
        VALUES (?, ?)
      `).bind('Minimal Feed Item', 'Minimal content').run();

      const request = createTestRequest('/api/feed');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed[0]).toMatchObject({
        title: 'Minimal Feed Item',
        content: 'Minimal content',
        link: null,
        isPriority: false,
      });
    });

    it('should handle search functionality', async () => {
      // Insert feed items with different content
      await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority) 
        VALUES (?, ?, ?, ?)
      `).bind('Matcha News', 'Latest updates about matcha cafes', 'https://example.com', false).run();

      await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority) 
        VALUES (?, ?, ?, ?)
      `).bind('Coffee Update', 'Information about coffee shops', 'https://example.com', false).run();

      const request = createTestRequest('/api/feed?search=matcha');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed).toHaveLength(1);
      expect(data.feed[0].title).toBe('Matcha News');
    });

    it('should handle empty search results', async () => {
      await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority) 
        VALUES (?, ?, ?, ?)
      `).bind('Test Item', 'Test content', 'https://example.com', false).run();

      const request = createTestRequest('/api/feed?search=nonexistent');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed).toHaveLength(0);
      expect(data.total).toBe(0);
    });

    it('should handle date range filtering', async () => {
      // Insert feed items with different dates
      await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority, createdAt) 
        VALUES (?, ?, ?, ?, ?)
      `).bind('Old Item', 'Old content', 'https://example.com', false, '2024-10-01T00:00:00Z').run();

      await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority, createdAt) 
        VALUES (?, ?, ?, ?, ?)
      `).bind('Recent Item', 'Recent content', 'https://example.com', false, '2024-12-01T00:00:00Z').run();

      const request = createTestRequest('/api/feed?startDate=2024-11-01');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed).toHaveLength(1);
      expect(data.feed[0].title).toBe('Recent Item');
    });

    it('should handle invalid date parameters gracefully', async () => {
      const request = createTestRequest('/api/feed?startDate=invalid-date');
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'Invalid date');
    });

    it('should handle combined filters', async () => {
      // Insert multiple feed items with different properties
      await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority) 
        VALUES (?, ?, ?, ?)
      `).bind('Priority Matcha News', 'Priority matcha content', 'https://example.com', true).run();

      await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority) 
        VALUES (?, ?, ?, ?)
      `).bind('Regular Matcha News', 'Regular matcha content', 'https://example.com', false).run();

      await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority) 
        VALUES (?, ?, ?, ?)
      `).bind('Priority Coffee News', 'Priority coffee content', 'https://example.com', true).run();

      const request = createTestRequest('/api/feed?priority=true&search=matcha');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed).toHaveLength(1);
      expect(data.feed[0].title).toBe('Priority Matcha News');
      expect(data.feed[0].isPriority).toBe(true);
    });
  });
});