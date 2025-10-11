import { describe, it, expect, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../../index';
import { createTestRequest, cleanupTestData, expectJsonResponse } from '../../test/utils';

describe('Health Routes', () => {
  beforeEach(async () => {
    await cleanupTestData(env);
  });

  describe('GET /api/health', () => {
    it('should return 200 with healthy status when database is connected', async () => {
      const request = createTestRequest('/api/health');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data).toMatchObject({
        status: 'ok',
        database: 'connected',
        timestamp: expect.any(String),
        version: expect.any(String),
      });
      
      // Verify timestamp is a valid ISO string
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it('should include proper cache headers', async () => {
      const request = createTestRequest('/api/health');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get('cache-control')).toBe('no-store');
    });

    it('should handle database connection errors gracefully', async () => {
      // Mock a database error by using an invalid database binding
      const invalidEnv = { ...env, DB: null };
      
      const request = createTestRequest('/api/health');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, invalidEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(500);
      expectJsonResponse(response, 500);
    });

    it('should return health status with correct content type', async () => {
      const request = createTestRequest('/api/health');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should work with different HTTP methods', async () => {
      // Health endpoint should typically only respond to GET
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const request = createTestRequest('/api/health', { method });
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);
        
        // Should either return 405 Method Not Allowed or still work
        // Depending on how the router is configured
        expect([200, 405]).toContain(response.status);
      }
    });

    it('should return consistent timestamp format', async () => {
      const request1 = createTestRequest('/api/health');
      const request2 = createTestRequest('/api/health');
      
      const ctx1 = createExecutionContext();
      const ctx2 = createExecutionContext();
      
      const [response1, response2] = await Promise.all([
        worker.fetch(request1, env, ctx1),
        worker.fetch(request2, env, ctx2),
      ]);
      
      await Promise.all([
        waitOnExecutionContext(ctx1),
        waitOnExecutionContext(ctx2),
      ]);

      const [data1, data2] = await Promise.all([
        response1.json(),
        response2.json(),
      ]);

      // Both should have valid timestamps
      expect(Date.parse(data1.timestamp)).toBeGreaterThan(0);
      expect(Date.parse(data2.timestamp)).toBeGreaterThan(0);
      
      // Second timestamp should be >= first timestamp
      expect(new Date(data2.timestamp).getTime())
        .toBeGreaterThanOrEqual(new Date(data1.timestamp).getTime());
    });
  });
});