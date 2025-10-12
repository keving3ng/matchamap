import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../../index';
import {
  createTestRequest,
  mockEvent,
  cleanupTestData,
  seedTestData,
  expectJsonResponse,
  expectErrorResponse,
} from '../../test/utils';

describe('Events Routes', () => {
  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);
  });

  describe('GET /api/events', () => {
    it('should return empty list when no events exist', async () => {
      const request = createTestRequest('/api/events');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data).toMatchObject({
        events: [],
        total: 0,
        hasMore: false,
      });
    });

    it('should return all events ordered by date', async () => {
      // Insert multiple events with different dates
      const events = [
        { ...mockEvent, title: 'Event 1', date: '2024-12-01' },
        { ...mockEvent, title: 'Event 2', date: '2024-11-15' },
        { ...mockEvent, title: 'Event 3', date: '2024-12-15' },
      ];

      for (const event of events) {
        await env.DB.prepare(`
          INSERT INTO events (title, description, date, link, location, featured) 
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          event.title,
          event.description,
          event.date,
          event.link,
          event.location,
          event.featured
        ).run();
      }

      const request = createTestRequest('/api/events');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.events).toHaveLength(3);
      expect(data.total).toBe(3);
      
      // Events should be ordered by date (assuming ascending order)
      expect(data.events[0].title).toBe('Event 2'); // 2024-11-15
      expect(data.events[1].title).toBe('Event 1'); // 2024-12-01
      expect(data.events[2].title).toBe('Event 3'); // 2024-12-15
    });

    it('should handle pagination with limit and offset', async () => {
      // Insert multiple events
      for (let i = 1; i <= 5; i++) {
        await env.DB.prepare(`
          INSERT INTO events (title, description, date, link, location, featured) 
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          `Event ${i}`,
          `Description ${i}`,
          `2024-12-${i.toString().padStart(2, '0')}`,
          'https://example.com',
          'Test Location',
          false
        ).run();
      }

      const request = createTestRequest('/api/events?limit=3&offset=2');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.events).toHaveLength(3);
      expect(data.total).toBe(5);
      expect(data.hasMore).toBe(false);
    });

    it('should respect maximum limit', async () => {
      const request = createTestRequest('/api/events?limit=999999');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      // Should respect max limit defined in PAGINATION_CONSTANTS
    });

    it('should filter by featured events only', async () => {
      // Insert regular and priority events
      await env.DB.prepare(`
        INSERT INTO events (title, description, date, link, location, featured) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind('Regular Event', 'Regular description', '2024-12-01', 'https://example.com', 'Location', false).run();

      await env.DB.prepare(`
        INSERT INTO events (title, description, date, link, location, featured) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind('Featured Event', 'Featured description', '2024-12-02', 'https://example.com', 'Location', true).run();

      const request = createTestRequest('/api/events?featured=true');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.events).toHaveLength(1);
      expect(data.events[0].title).toBe('Featured Event');
      expect(data.events[0].featured).toBe(true);
    });

    it('should filter by date range', async () => {
      // Insert events with different dates
      const events = [
        { title: 'Old Event', date: '2024-10-01' },
        { title: 'Current Event', date: '2024-12-01' },
        { title: 'Future Event', date: '2024-12-31' },
      ];

      for (const event of events) {
        await env.DB.prepare(`
          INSERT INTO events (title, description, date, link, location, featured) 
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(event.title, 'Description', event.date, 'https://example.com', 'Location', false).run();
      }

      const request = createTestRequest('/api/events?startDate=2024-11-01&endDate=2024-12-15');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.events).toHaveLength(1);
      expect(data.events[0].title).toBe('Current Event');
    });

    it('should include proper cache headers', async () => {
      const request = createTestRequest('/api/events');
      
      const response = await worker.fetch(request, env);
      

      expect(response.headers.get('cache-control')).toContain('public');
      expect(response.headers.get('cache-control')).toContain('max-age=');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error by corrupting env
      const invalidEnv = { ...env, DB: null };

      const request = createTestRequest('/api/events');
      
      const response = await worker.fetch(request, invalidEnv);
      

      expect(response.status).toBe(500);
    });

    it('should return events with all required fields', async () => {
      await env.DB.prepare(`
        INSERT INTO events (title, description, date, link, location, featured) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        mockEvent.title,
        mockEvent.description,
        mockEvent.date,
        mockEvent.link,
        mockEvent.location,
        mockEvent.featured
      ).run();

      const request = createTestRequest('/api/events');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.events[0]).toMatchObject({
        id: expect.any(Number),
        title: mockEvent.title,
        description: mockEvent.description,
        date: mockEvent.date,
        link: mockEvent.link,
        location: mockEvent.location,
        featured: mockEvent.featured,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should handle invalid date filter parameters', async () => {
      const request = createTestRequest('/api/events?startDate=invalid-date');
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'Invalid date');
    });

    it('should handle future events correctly', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      await env.DB.prepare(`
        INSERT INTO events (title, description, date, link, location, featured) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind('Future Event', 'Future description', futureDateStr, 'https://example.com', 'Location', false).run();

      const request = createTestRequest('/api/events');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.events).toHaveLength(1);
      expect(data.events[0].title).toBe('Future Event');
    });

    it('should handle events with missing optional fields', async () => {
      await env.DB.prepare(`
        INSERT INTO events (title, date, link) 
        VALUES (?, ?, ?)
      `).bind('Minimal Event', '2024-12-01', 'https://example.com').run();

      const request = createTestRequest('/api/events');
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.events[0]).toMatchObject({
        title: 'Minimal Event',
        date: '2024-12-01',
        link: 'https://example.com',
        description: null,
        location: null,
        featured: false,
      });
    });
  });
});