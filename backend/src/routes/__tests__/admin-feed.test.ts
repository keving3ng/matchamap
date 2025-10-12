import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../../index';
import {
  createTestRequest,
  createAuthenticatedRequest,
  mockUser,
  mockAdminUser,
  mockFeedItem,
  createTestToken,
  cleanupTestData,
  seedTestData,
  expectJsonResponse,
  expectErrorResponse,
} from '../../test/utils';

describe('Admin Feed Routes', () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);
    userToken = await createTestToken(mockUser);
    adminToken = await createTestToken(mockAdminUser);
  });

  describe('POST /api/admin/feed', () => {
    it('should create feed item when authenticated as admin', async () => {
      const newFeedItem = {
        title: 'New Feed Item',
        content: 'This is a new feed item content',
        link: 'https://example.com/feed-item',
        isPriority: true,
      };

      const request = createAuthenticatedRequest('/api/admin/feed', adminToken, {
        method: 'POST',
        body: JSON.stringify(newFeedItem),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);
      
      const data = await response.json() as any;
      expect(data.feedItem).toMatchObject(newFeedItem);
      expect(data.feedItem.id).toBeDefined();
      expect(data.feedItem.createdAt).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest('/api/admin/feed', {
        method: 'POST',
        body: JSON.stringify(mockFeedItem),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest('/api/admin/feed', userToken, {
        method: 'POST',
        body: JSON.stringify(mockFeedItem),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 403);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteFeedItem = {
        title: 'Incomplete Feed Item',
        // missing content field
      };

      const request = createAuthenticatedRequest('/api/admin/feed', adminToken, {
        method: 'POST',
        body: JSON.stringify(incompleteFeedItem),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400);
    });

    it('should return 400 for invalid URL', async () => {
      const invalidFeedItem = {
        ...mockFeedItem,
        link: 'not-a-valid-url',
      };

      const request = createAuthenticatedRequest('/api/admin/feed', adminToken, {
        method: 'POST',
        body: JSON.stringify(invalidFeedItem),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'Invalid URL');
    });

    it('should set default values for optional fields', async () => {
      const minimalFeedItem = {
        title: 'Minimal Feed Item',
        content: 'Minimal content',
      };

      const request = createAuthenticatedRequest('/api/admin/feed', adminToken, {
        method: 'POST',
        body: JSON.stringify(minimalFeedItem),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);
      
      const data = await response.json() as any;
      expect(data.feedItem.isPriority).toBe(false);
      expect(data.feedItem.link).toBeNull();
    });

    it('should validate content length', async () => {
      const longContentFeedItem = {
        title: 'Long Content Item',
        content: 'a'.repeat(10001), // Assuming 10000 char limit
      };

      const request = createAuthenticatedRequest('/api/admin/feed', adminToken, {
        method: 'POST',
        body: JSON.stringify(longContentFeedItem),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'too long');
    });

    it('should validate title length', async () => {
      const longTitleFeedItem = {
        title: 'a'.repeat(256), // Assuming 255 char limit
        content: 'Valid content',
      };

      const request = createAuthenticatedRequest('/api/admin/feed', adminToken, {
        method: 'POST',
        body: JSON.stringify(longTitleFeedItem),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'too long');
    });

    it('should log audit trail for feed item creation', async () => {
      const request = createAuthenticatedRequest('/api/admin/feed', adminToken, {
        method: 'POST',
        body: JSON.stringify(mockFeedItem),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);
      
      const data = await response.json() as any;
      const feedItemId = data.feedItem.id;

      // Verify audit log entry
      const auditLog = await env.DB.prepare(`
        SELECT * FROM admin_audit_log 
        WHERE resourceType = 'feed' AND resourceId = ? AND action = 'CREATE'
      `).bind(feedItemId).first();

      expect(auditLog).toBeTruthy();
      expect(auditLog.userId).toBe(mockAdminUser.id);
    });
  });

  describe('PUT /api/admin/feed/:id', () => {
    let feedItemId: number;

    beforeEach(async () => {
      // Create test feed item
      const result = await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority) 
        VALUES (?, ?, ?, ?)
      `).bind(
        mockFeedItem.title,
        mockFeedItem.content,
        mockFeedItem.link,
        mockFeedItem.isPriority
      ).run();
      feedItemId = result.lastInsertRowid as number;
    });

    it('should update feed item when authenticated as admin', async () => {
      const updates = {
        title: 'Updated Feed Title',
        content: 'Updated feed content',
        isPriority: true,
      };

      const request = createAuthenticatedRequest(`/api/admin/feed/${feedItemId}`, adminToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feedItem.title).toBe(updates.title);
      expect(data.feedItem.content).toBe(updates.content);
      expect(data.feedItem.isPriority).toBe(updates.isPriority);
    });

    it('should return 404 for non-existent feed item', async () => {
      const request = createAuthenticatedRequest('/api/admin/feed/99999', adminToken, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 404);
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest(`/api/admin/feed/${feedItemId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest(`/api/admin/feed/${feedItemId}`, userToken, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 403);
    });

    it('should validate updated fields', async () => {
      const invalidUpdates = [
        { link: 'not-a-url' },
        { title: '' },
        { title: 'a'.repeat(256) }, // Too long
        { content: 'a'.repeat(10001) }, // Too long
      ];

      for (const updates of invalidUpdates) {
        const request = createAuthenticatedRequest(`/api/admin/feed/${feedItemId}`, adminToken, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        
        const response = await worker.fetch(request, env);
        

        await expectErrorResponse(response, 400);
      }
    });

    it('should allow partial updates', async () => {
      const partialUpdates = {
        title: 'Partially Updated Title',
        // Other fields should remain unchanged
      };

      const request = createAuthenticatedRequest(`/api/admin/feed/${feedItemId}`, adminToken, {
        method: 'PUT',
        body: JSON.stringify(partialUpdates),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feedItem.title).toBe(partialUpdates.title);
      expect(data.feedItem.content).toBe(mockFeedItem.content); // Unchanged
    });

    it('should allow clearing optional fields', async () => {
      const updates = {
        link: null,
      };

      const request = createAuthenticatedRequest(`/api/admin/feed/${feedItemId}`, adminToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feedItem.link).toBeNull();
    });

    it('should log audit trail for feed item updates', async () => {
      const updates = { title: 'Audit Test Update' };

      const request = createAuthenticatedRequest(`/api/admin/feed/${feedItemId}`, adminToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);

      // Verify audit log entry
      const auditLog = await env.DB.prepare(`
        SELECT * FROM admin_audit_log 
        WHERE resourceType = 'feed' AND resourceId = ? AND action = 'UPDATE'
      `).bind(feedItemId).first();

      expect(auditLog).toBeTruthy();
      expect(auditLog.userId).toBe(mockAdminUser.id);
    });
  });

  describe('DELETE /api/admin/feed/:id', () => {
    let feedItemId: number;

    beforeEach(async () => {
      // Create test feed item
      const result = await env.DB.prepare(`
        INSERT INTO feed (title, content, link, isPriority) 
        VALUES (?, ?, ?, ?)
      `).bind(
        mockFeedItem.title,
        mockFeedItem.content,
        mockFeedItem.link,
        mockFeedItem.isPriority
      ).run();
      feedItemId = result.lastInsertRowid as number;
    });

    it('should delete feed item when authenticated as admin', async () => {
      const request = createAuthenticatedRequest(`/api/admin/feed/${feedItemId}`, adminToken, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.message).toContain('deleted successfully');

      // Verify feed item is deleted
      const deletedFeedItem = await env.DB.prepare(`
        SELECT * FROM feed WHERE id = ?
      `).bind(feedItemId).first();
      expect(deletedFeedItem).toBeNull();
    });

    it('should return 404 for non-existent feed item', async () => {
      const request = createAuthenticatedRequest('/api/admin/feed/99999', adminToken, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 404);
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest(`/api/admin/feed/${feedItemId}`, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest(`/api/admin/feed/${feedItemId}`, userToken, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 403);
    });

    it('should return 400 for invalid feed item ID', async () => {
      const request = createAuthenticatedRequest('/api/admin/feed/invalid', adminToken, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'Invalid feed item ID');
    });

    it('should log audit trail for feed item deletion', async () => {
      const request = createAuthenticatedRequest(`/api/admin/feed/${feedItemId}`, adminToken, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);

      // Verify audit log entry
      const auditLog = await env.DB.prepare(`
        SELECT * FROM admin_audit_log 
        WHERE resourceType = 'feed' AND resourceId = ? AND action = 'DELETE'
      `).bind(feedItemId).first();

      expect(auditLog).toBeTruthy();
      expect(auditLog.userId).toBe(mockAdminUser.id);
    });
  });

  describe('GET /api/admin/feed', () => {
    beforeEach(async () => {
      // Create multiple test feed items
      const feedItems = [
        { ...mockFeedItem, title: 'Feed Item 1', isPriority: true },
        { ...mockFeedItem, title: 'Feed Item 2', isPriority: false },
        { ...mockFeedItem, title: 'Feed Item 3', isPriority: false },
      ];

      for (const item of feedItems) {
        await env.DB.prepare(`
          INSERT INTO feed (title, content, link, isPriority) 
          VALUES (?, ?, ?, ?)
        `).bind(
          item.title,
          item.content,
          item.link,
          item.isPriority
        ).run();
      }
    });

    it('should list all feed items when authenticated as admin', async () => {
      const request = createAuthenticatedRequest('/api/admin/feed', adminToken);
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed).toHaveLength(3);
      expect(data.total).toBe(3);
      expect(data.feed[0]).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        content: expect.any(String),
      });
    });

    it('should support pagination', async () => {
      const request = createAuthenticatedRequest('/api/admin/feed?limit=2&offset=1', adminToken);
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed).toHaveLength(2);
      expect(data.total).toBe(3);
      expect(data.hasMore).toBe(false);
    });

    it('should filter by priority', async () => {
      const request = createAuthenticatedRequest('/api/admin/feed?priority=true', adminToken);
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed).toHaveLength(1);
      expect(data.feed[0].isPriority).toBe(true);
    });

    it('should search feed items by title and content', async () => {
      const request = createAuthenticatedRequest('/api/admin/feed?search=Feed Item 2', adminToken);
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed).toHaveLength(1);
      expect(data.feed[0].title).toBe('Feed Item 2');
    });

    it('should sort feed items by creation date (newest first)', async () => {
      const request = createAuthenticatedRequest('/api/admin/feed?sort=createdAt&order=desc', adminToken);
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.feed).toHaveLength(3);
      // Most recent first
      expect(new Date(data.feed[0].createdAt).getTime())
        .toBeGreaterThanOrEqual(new Date(data.feed[1].createdAt).getTime());
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest('/api/admin/feed');
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest('/api/admin/feed', userToken);
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 403);
    });
  });

  describe('Feed Management Security', () => {
    it('should sanitize feed content to prevent XSS', async () => {
      const maliciousFeedItem = {
        title: '<script>alert("xss")</script>',
        content: 'javascript:alert("xss")',
        link: 'https://example.com',
      };

      const request = createAuthenticatedRequest('/api/admin/feed', adminToken, {
        method: 'POST',
        body: JSON.stringify(maliciousFeedItem),
      });
      
      const response = await worker.fetch(request, env);
      

      // Should either reject malicious input or sanitize it
      if (response.ok) {
        const data = await response.json() as any;
        expect(data.feedItem.title).not.toContain('<script>');
        expect(data.feedItem.content).not.toContain('javascript:');
      } else {
        await expectErrorResponse(response, 400);
      }
    });

    it('should validate admin permissions on all admin endpoints', async () => {
      const adminEndpoints = [
        { method: 'POST', path: '/api/admin/feed', body: mockFeedItem },
        { method: 'GET', path: '/api/admin/feed' },
        { method: 'PUT', path: '/api/admin/feed/1', body: { title: 'Updated' } },
        { method: 'DELETE', path: '/api/admin/feed/1' },
      ];

      for (const endpoint of adminEndpoints) {
        const request = createAuthenticatedRequest(endpoint.path, userToken, {
          method: endpoint.method,
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        });
        
        const response = await worker.fetch(request, env);
        

        expect(response.status).toBe(403);
      }
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = createAuthenticatedRequest('/api/admin/feed', adminToken, {
        method: 'POST',
        body: 'invalid json{',
      });
      
      const response = await worker.fetch(request, env);
      

      expect(response.status).toBe(500);
    });

    it('should prevent SQL injection in search parameters', async () => {
      const maliciousSearch = "'; DROP TABLE feed; --";
      
      const request = createAuthenticatedRequest(`/api/admin/feed?search=${encodeURIComponent(maliciousSearch)}`, adminToken);
      
      const response = await worker.fetch(request, env);
      

      // Should not cause an error and feed table should still exist
      expectJsonResponse(response, 200);
      
      // Verify feed table still exists by trying to query it
      const testQuery = await env.DB.prepare('SELECT COUNT(*) as count FROM feed').first();
      expect(testQuery).toBeTruthy();
    });

    it('should handle very large payloads gracefully', async () => {
      const largeFeedItem = {
        title: 'a'.repeat(10000),
        content: 'b'.repeat(100000),
      };

      const request = createAuthenticatedRequest('/api/admin/feed', adminToken, {
        method: 'POST',
        body: JSON.stringify(largeFeedItem),
      });
      
      const response = await worker.fetch(request, env);
      

      // Should reject oversized payloads
      await expectErrorResponse(response, 400);
    });
  });
});