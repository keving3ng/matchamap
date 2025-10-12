import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../../index';
import {
  createTestRequest,
  createAuthenticatedRequest,
  mockUser,
  mockAdminUser,
  mockEvent,
  createTestToken,
  cleanupTestData,
  seedTestData,
  expectJsonResponse,
  expectErrorResponse,
} from '../../test/utils';

describe('Admin Events Routes', () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);
    userToken = await createTestToken(mockUser);
    adminToken = await createTestToken(mockAdminUser);
  });

  describe('POST /api/admin/events', () => {
    it('should create event when authenticated as admin', async () => {
      const newEvent = {
        title: 'New Test Event',
        description: 'A new test event description',
        date: '2024-12-25',
        link: 'https://example.com/event',
        location: 'Test Venue',
        isPriority: true,
      };

      const request = createAuthenticatedRequest('/api/admin/events', adminToken, {
        method: 'POST',
        body: JSON.stringify(newEvent),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);
      
      const data = await response.json() as any;
      expect(data.event).toMatchObject(newEvent);
      expect(data.event.id).toBeDefined();
      expect(data.event.createdAt).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest('/api/admin/events', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest('/api/admin/events', userToken, {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 403);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteEvent = {
        title: 'Incomplete Event',
        // missing required fields like date, link
      };

      const request = createAuthenticatedRequest('/api/admin/events', adminToken, {
        method: 'POST',
        body: JSON.stringify(incompleteEvent),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400);
    });

    it('should return 400 for invalid date format', async () => {
      const invalidEvent = {
        ...mockEvent,
        date: 'invalid-date',
      };

      const request = createAuthenticatedRequest('/api/admin/events', adminToken, {
        method: 'POST',
        body: JSON.stringify(invalidEvent),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'Invalid date');
    });

    it('should return 400 for invalid URL', async () => {
      const invalidEvent = {
        ...mockEvent,
        link: 'not-a-valid-url',
      };

      const request = createAuthenticatedRequest('/api/admin/events', adminToken, {
        method: 'POST',
        body: JSON.stringify(invalidEvent),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'Invalid URL');
    });

    it('should set default values for optional fields', async () => {
      const minimalEvent = {
        title: 'Minimal Event',
        date: '2024-12-25',
        link: 'https://example.com',
      };

      const request = createAuthenticatedRequest('/api/admin/events', adminToken, {
        method: 'POST',
        body: JSON.stringify(minimalEvent),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);
      
      const data = await response.json() as any;
      expect(data.event.isPriority).toBe(false);
      expect(data.event.description).toBeNull();
      expect(data.event.location).toBeNull();
    });

    it('should log audit trail for event creation', async () => {
      const request = createAuthenticatedRequest('/api/admin/events', adminToken, {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);
      
      const data = await response.json() as any;
      const eventId = data.event.id;

      // Verify audit log entry
      const auditLog = await env.DB.prepare(`
        SELECT * FROM admin_audit_log 
        WHERE resourceType = 'event' AND resourceId = ? AND action = 'CREATE'
      `).bind(eventId).first();

      expect(auditLog).toBeTruthy();
      expect(auditLog.userId).toBe(mockAdminUser.id);
    });
  });

  describe('PUT /api/admin/events/:id', () => {
    let eventId: number;

    beforeEach(async () => {
      // Create test event
      const result = await env.DB.prepare(`
        INSERT INTO events (title, description, date, link, location, isPriority) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        mockEvent.title,
        mockEvent.description,
        mockEvent.date,
        mockEvent.link,
        mockEvent.location,
        mockEvent.isPriority
      ).run();
      eventId = result.lastInsertRowid as number;
    });

    it('should update event when authenticated as admin', async () => {
      const updates = {
        title: 'Updated Event Title',
        description: 'Updated description',
        isPriority: true,
      };

      const request = createAuthenticatedRequest(`/api/admin/events/${eventId}`, adminToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.event.title).toBe(updates.title);
      expect(data.event.description).toBe(updates.description);
      expect(data.event.isPriority).toBe(updates.isPriority);
    });

    it('should return 404 for non-existent event', async () => {
      const request = createAuthenticatedRequest('/api/admin/events/99999', adminToken, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 404);
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest(`/api/admin/events/${eventId}`, userToken, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 403);
    });

    it('should validate updated fields', async () => {
      const invalidUpdates = [
        { date: 'invalid-date' },
        { link: 'not-a-url' },
        { title: '' },
        { title: 'a'.repeat(256) }, // Too long
      ];

      for (const updates of invalidUpdates) {
        const request = createAuthenticatedRequest(`/api/admin/events/${eventId}`, adminToken, {
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

      const request = createAuthenticatedRequest(`/api/admin/events/${eventId}`, adminToken, {
        method: 'PUT',
        body: JSON.stringify(partialUpdates),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.event.title).toBe(partialUpdates.title);
      expect(data.event.description).toBe(mockEvent.description); // Unchanged
    });

    it('should log audit trail for event updates', async () => {
      const updates = { title: 'Audit Test Update' };

      const request = createAuthenticatedRequest(`/api/admin/events/${eventId}`, adminToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);

      // Verify audit log entry
      const auditLog = await env.DB.prepare(`
        SELECT * FROM admin_audit_log 
        WHERE resourceType = 'event' AND resourceId = ? AND action = 'UPDATE'
      `).bind(eventId).first();

      expect(auditLog).toBeTruthy();
      expect(auditLog.userId).toBe(mockAdminUser.id);
    });
  });

  describe('DELETE /api/admin/events/:id', () => {
    let eventId: number;

    beforeEach(async () => {
      // Create test event
      const result = await env.DB.prepare(`
        INSERT INTO events (title, description, date, link, location, isPriority) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        mockEvent.title,
        mockEvent.description,
        mockEvent.date,
        mockEvent.link,
        mockEvent.location,
        mockEvent.isPriority
      ).run();
      eventId = result.lastInsertRowid as number;
    });

    it('should delete event when authenticated as admin', async () => {
      const request = createAuthenticatedRequest(`/api/admin/events/${eventId}`, adminToken, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.message).toContain('deleted successfully');

      // Verify event is deleted
      const deletedEvent = await env.DB.prepare(`
        SELECT * FROM events WHERE id = ?
      `).bind(eventId).first();
      expect(deletedEvent).toBeNull();
    });

    it('should return 404 for non-existent event', async () => {
      const request = createAuthenticatedRequest('/api/admin/events/99999', adminToken, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 404);
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest(`/api/admin/events/${eventId}`, userToken, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 403);
    });

    it('should return 400 for invalid event ID', async () => {
      const request = createAuthenticatedRequest('/api/admin/events/invalid', adminToken, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'Invalid event ID');
    });

    it('should log audit trail for event deletion', async () => {
      const request = createAuthenticatedRequest(`/api/admin/events/${eventId}`, adminToken, {
        method: 'DELETE',
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);

      // Verify audit log entry
      const auditLog = await env.DB.prepare(`
        SELECT * FROM admin_audit_log 
        WHERE resourceType = 'event' AND resourceId = ? AND action = 'DELETE'
      `).bind(eventId).first();

      expect(auditLog).toBeTruthy();
      expect(auditLog.userId).toBe(mockAdminUser.id);
    });
  });

  describe('GET /api/admin/events', () => {
    beforeEach(async () => {
      // Create multiple test events
      const events = [
        { ...mockEvent, title: 'Event 1', isPriority: true },
        { ...mockEvent, title: 'Event 2', isPriority: false },
        { ...mockEvent, title: 'Event 3', isPriority: false },
      ];

      for (const event of events) {
        await env.DB.prepare(`
          INSERT INTO events (title, description, date, link, location, isPriority) 
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          event.title,
          event.description,
          event.date,
          event.link,
          event.location,
          event.isPriority
        ).run();
      }
    });

    it('should list all events when authenticated as admin', async () => {
      const request = createAuthenticatedRequest('/api/admin/events', adminToken);
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.events).toHaveLength(3);
      expect(data.total).toBe(3);
      expect(data.events[0]).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        date: expect.any(String),
      });
    });

    it('should support pagination', async () => {
      const request = createAuthenticatedRequest('/api/admin/events?limit=2&offset=1', adminToken);
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.events).toHaveLength(2);
      expect(data.total).toBe(3);
      expect(data.hasMore).toBe(false);
    });

    it('should filter by priority', async () => {
      const request = createAuthenticatedRequest('/api/admin/events?priority=true', adminToken);
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.events).toHaveLength(1);
      expect(data.events[0].isPriority).toBe(true);
    });

    it('should search events by title', async () => {
      const request = createAuthenticatedRequest('/api/admin/events?search=Event 2', adminToken);
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.events).toHaveLength(1);
      expect(data.events[0].title).toBe('Event 2');
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest('/api/admin/events');
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest('/api/admin/events', userToken);
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 403);
    });
  });

  describe('Event Management Security', () => {
    it('should sanitize event input to prevent XSS', async () => {
      const maliciousEvent = {
        title: '<script>alert("xss")</script>',
        description: 'javascript:alert("xss")',
        location: '<img src=x onerror=alert("xss")>',
        link: 'https://example.com',
        date: '2024-12-25',
      };

      const request = createAuthenticatedRequest('/api/admin/events', adminToken, {
        method: 'POST',
        body: JSON.stringify(maliciousEvent),
      });
      
      const response = await worker.fetch(request, env);
      

      // Should either reject malicious input or sanitize it
      if (response.ok) {
        const data = await response.json() as any;
        expect(data.event.title).not.toContain('<script>');
        expect(data.event.description).not.toContain('javascript:');
        expect(data.event.location).not.toContain('<img');
      } else {
        await expectErrorResponse(response, 400);
      }
    });

    it('should validate admin permissions on all admin endpoints', async () => {
      const adminEndpoints = [
        { method: 'POST', path: '/api/admin/events', body: mockEvent },
        { method: 'GET', path: '/api/admin/events' },
        { method: 'PUT', path: '/api/admin/events/1', body: { title: 'Updated' } },
        { method: 'DELETE', path: '/api/admin/events/1' },
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
      const request = createAuthenticatedRequest('/api/admin/events', adminToken, {
        method: 'POST',
        body: 'invalid json{',
      });
      
      const response = await worker.fetch(request, env);
      

      expect(response.status).toBe(500);
    });

    it('should prevent SQL injection in search parameters', async () => {
      const maliciousSearch = "'; DROP TABLE events; --";
      
      const request = createAuthenticatedRequest(`/api/admin/events?search=${encodeURIComponent(maliciousSearch)}`, adminToken);
      
      const response = await worker.fetch(request, env);
      

      // Should not cause an error and events table should still exist
      expectJsonResponse(response, 200);
      
      // Verify events table still exists by trying to query it
      const testQuery = await env.DB.prepare('SELECT COUNT(*) as count FROM events').first();
      expect(testQuery).toBeTruthy();
    });
  });
});