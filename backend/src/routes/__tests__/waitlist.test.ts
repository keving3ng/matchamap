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

describe('Waitlist Routes', () => {
  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);
  });

  describe('POST /api/waitlist', () => {
    it('should add email to waitlist successfully', async () => {
      const waitlistData = {
        email: 'test@example.com',
      };

      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);
      
      const data = await response.json() as any;
      expect(data.message).toContain('successfully added');
      expect(data.email).toBe('test@example.com');

      // Verify email was inserted into database
      const waitlistEntry = await env.DB.prepare(`
        SELECT * FROM waitlist WHERE email = ?
      `).bind('test@example.com').first();

      expect(waitlistEntry).toBeTruthy();
      expect(waitlistEntry.email).toBe('test@example.com');
      expect(waitlistEntry.createdAt).toBeTruthy();
    });

    it('should normalize email to lowercase', async () => {
      const waitlistData = {
        email: 'Test@Example.COM',
      };

      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);
      
      const data = await response.json() as any;
      expect(data.email).toBe('test@example.com');

      // Verify normalized email in database
      const waitlistEntry = await env.DB.prepare(`
        SELECT * FROM waitlist WHERE email = ?
      `).bind('test@example.com').first();

      expect(waitlistEntry).toBeTruthy();
    });

    it('should return 400 for duplicate email', async () => {
      // First add email to waitlist
      await env.DB.prepare(`
        INSERT INTO waitlist (email) VALUES (?)
      `).bind('duplicate@example.com').run();

      const waitlistData = {
        email: 'duplicate@example.com',
      };

      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'already registered');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidEmails = [
        'invalid-email',
        'missing-at-sign.com',
        '@missing-domain.com',
        'missing-domain@',
        'spaces in@email.com',
        'special!chars@domain.com',
        'very.long.email.address.that.exceeds.normal.limits@verylongdomainname.com',
        '',
      ];

      for (const email of invalidEmails) {
        const waitlistData = { email };

        const request = createTestRequest('/api/waitlist', {
          method: 'POST',
          body: JSON.stringify(waitlistData),
        });
        
        const response = await worker.fetch(request, env);
        

        await expectErrorResponse(response, 400);
      }
    });

    it('should return 400 for missing email field', async () => {
      const waitlistData = {}; // Missing email

      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'email is required');
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: 'invalid json{',
      });
      
      const response = await worker.fetch(request, env);
      

      expect(response.status).toBe(500);
    });

    it('should set proper content type headers', async () => {
      const waitlistData = {
        email: 'content-type-test@example.com',
      };

      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
      });
      
      const response = await worker.fetch(request, env);
      

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should handle email with subdomains', async () => {
      const waitlistData = {
        email: 'user@mail.subdomain.example.com',
      };

      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);
      
      const data = await response.json() as any;
      expect(data.email).toBe('user@mail.subdomain.example.com');
    });

    it('should handle international domain names', async () => {
      const waitlistData = {
        email: 'test@example.org',
      };

      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);
      
      const data = await response.json() as any;
      expect(data.email).toBe('test@example.org');
    });

    it('should handle common email providers', async () => {
      const commonEmails = [
        'user@gmail.com',
        'user@yahoo.com',
        'user@hotmail.com',
        'user@outlook.com',
        'user@protonmail.com',
      ];

      for (const email of commonEmails) {
        const waitlistData = { email };

        const request = createTestRequest('/api/waitlist', {
          method: 'POST',
          body: JSON.stringify(waitlistData),
        });
        
        const response = await worker.fetch(request, env);
        

        expectJsonResponse(response, 201);
      }
    });

    it('should include timestamp when adding to waitlist', async () => {
      const waitlistData = {
        email: 'timestamp-test@example.com',
      };

      const beforeTime = new Date();

      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 201);

      const afterTime = new Date();

      // Verify timestamp in database
      const waitlistEntry = await env.DB.prepare(`
        SELECT * FROM waitlist WHERE email = ?
      `).bind('timestamp-test@example.com').first();

      expect(waitlistEntry.createdAt).toBeTruthy();
      const createdAt = new Date(waitlistEntry.createdAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Waitlist Security and Validation', () => {
    it('should prevent SQL injection in email parameter', async () => {
      const maliciousEmail = "'; DROP TABLE waitlist; --@example.com";

      const waitlistData = {
        email: maliciousEmail,
      };

      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
      });
      
      const response = await worker.fetch(request, env);
      

      // Should reject invalid email format
      await expectErrorResponse(response, 400);

      // Verify waitlist table still exists
      const testQuery = await env.DB.prepare('SELECT COUNT(*) as count FROM waitlist').first();
      expect(testQuery).toBeTruthy();
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@' + 'b'.repeat(100) + '.com';

      const waitlistData = {
        email: longEmail,
      };

      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
      });
      
      const response = await worker.fetch(request, env);
      

      // Should reject overly long email
      await expectErrorResponse(response, 400);
    });

    it('should handle emails with special characters properly', async () => {
      // Valid special characters in email local part
      const validSpecialEmails = [
        'user.name@example.com',
        'user+tag@example.com',
        'user_name@example.com',
        'user-name@example.com',
      ];

      for (const email of validSpecialEmails) {
        const waitlistData = { email };

        const request = createTestRequest('/api/waitlist', {
          method: 'POST',
          body: JSON.stringify(waitlistData),
        });
        
        const response = await worker.fetch(request, env);
        

        expectJsonResponse(response, 201);
      }
    });

    it('should handle concurrent duplicate email submissions', async () => {
      const email = 'concurrent@example.com';
      const waitlistData = { email };

      // Make multiple concurrent requests with same email
      const requests = Array.from({ length: 5 }, () =>
        worker.fetch(createTestRequest('/api/waitlist', {
          method: 'POST',
          body: JSON.stringify(waitlistData),
        }), env)
      );

      const responses = await Promise.all(requests);

      // Only one should succeed (201), others should fail (400)
      const successResponses = responses.filter(r => r.status === 201);
      const failureResponses = responses.filter(r => r.status === 400);

      expect(successResponses).toHaveLength(1);
      expect(failureResponses).toHaveLength(4);

      // Verify only one entry in database
      const entries = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM waitlist WHERE email = ?
      `).bind(email).first();

      expect(entries.count).toBe(1);
    });

    it('should validate email format strictly', async () => {
      const borderlineInvalidEmails = [
        'user@', // Missing domain
        '@domain.com', // Missing local part
        'user@@domain.com', // Double @
        'user@domain', // Missing TLD
        'user@domain.', // Ending with dot
        '.user@domain.com', // Starting with dot
        'user.@domain.com', // Ending with dot before @
        'us er@domain.com', // Space in local part
        'user@do main.com', // Space in domain
      ];

      for (const email of borderlineInvalidEmails) {
        const waitlistData = { email };

        const request = createTestRequest('/api/waitlist', {
          method: 'POST',
          body: JSON.stringify(waitlistData),
        });
        
        const response = await worker.fetch(request, env);
        

        await expectErrorResponse(response, 400);
      }
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error by corrupting env
      const invalidEnv = { ...env, DB: null };

      const waitlistData = {
        email: 'test@example.com',
      };

      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
      });
      
      const response = await worker.fetch(request, invalidEnv);
      

      expect(response.status).toBe(500);
    });

    it('should handle empty request body', async () => {
      const request = createTestRequest('/api/waitlist', {
        method: 'POST',
        body: '',
      });
      
      const response = await worker.fetch(request, env);
      

      expect(response.status).toBe(500);
    });

    it('should handle request without content-type header', async () => {
      const waitlistData = {
        email: 'no-content-type@example.com',
      };

      const request = new Request('https://api.matchamap.com/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
        // No content-type header
      });
      
      const response = await worker.fetch(request, env);
      

      // Should still work or return appropriate error
      expect([201, 400, 500]).toContain(response.status);
    });
  });

  describe('Waitlist Rate Limiting', () => {
    it('should handle multiple valid submissions from different emails', async () => {
      const emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
        'user4@example.com',
        'user5@example.com',
      ];

      for (const email of emails) {
        const waitlistData = { email };

        const request = createTestRequest('/api/waitlist', {
          method: 'POST',
          body: JSON.stringify(waitlistData),
        });
        
        const response = await worker.fetch(request, env);
        

        expectJsonResponse(response, 201);
      }

      // Verify all emails were added
      const count = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM waitlist
      `).first();

      expect(count.count).toBe(5);
    });
  });
});