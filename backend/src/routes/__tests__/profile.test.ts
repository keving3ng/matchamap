import { describe, it, expect, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../../index';
import {
  createTestRequest,
  createAuthenticatedRequest,
  mockUser,
  mockAdminUser,
  createTestToken,
  cleanupTestData,
  seedTestData,
  expectJsonResponse,
  expectErrorResponse,
} from '../../test/utils';

describe('Profile Routes', () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);
    userToken = await createTestToken(mockUser);
    adminToken = await createTestToken(mockAdminUser);
  });

  describe('GET /api/users/:username/profile', () => {
    it('should return public profile for existing user', async () => {
      // Set up user with username and public profile
      await env.DB.prepare(`
        UPDATE users SET username = ? WHERE id = ?
      `).bind('testuser', mockUser.id).run();

      await env.DB.prepare(`
        INSERT INTO userProfiles (userId, displayName, bio, isPublic) 
        VALUES (?, ?, ?, ?)
      `).bind(mockUser.id, 'Test User', 'This is a test bio', true).run();

      const request = createTestRequest('/api/users/testuser/profile');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.user).toMatchObject({
        id: mockUser.id,
        username: 'testuser',
        displayName: 'Test User',
        bio: 'This is a test bio',
      });
      expect(data.user.stats).toMatchObject({
        totalReviews: expect.any(Number),
        totalCheckins: expect.any(Number),
        totalPhotos: expect.any(Number),
        passportCompletion: expect.any(Number),
        reputationScore: expect.any(Number),
      });
    });

    it('should return 404 for non-existent user', async () => {
      const request = createTestRequest('/api/users/nonexistentuser/profile');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 404, 'User not found');
    });

    it('should return 403 for private profile when not authenticated', async () => {
      await env.DB.prepare(`
        UPDATE users SET username = ? WHERE id = ?
      `).bind('privateuser', mockUser.id).run();

      await env.DB.prepare(`
        INSERT INTO userProfiles (userId, displayName, isPublic) 
        VALUES (?, ?, ?)
      `).bind(mockUser.id, 'Private User', false).run();

      const request = createTestRequest('/api/users/privateuser/profile');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 403, 'This profile is private');
    });

    it('should allow viewing own private profile when authenticated', async () => {
      await env.DB.prepare(`
        UPDATE users SET username = ? WHERE id = ?
      `).bind('ownuser', mockUser.id).run();

      await env.DB.prepare(`
        INSERT INTO userProfiles (userId, displayName, isPublic) 
        VALUES (?, ?, ?)
      `).bind(mockUser.id, 'Own User', false).run();

      const request = createAuthenticatedRequest('/api/users/ownuser/profile', userToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.user.displayName).toBe('Own User');
    });

    it('should create default profile if none exists', async () => {
      await env.DB.prepare(`
        UPDATE users SET username = ? WHERE id = ?
      `).bind('noprofile', mockUser.id).run();

      const request = createTestRequest('/api/users/noprofile/profile');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.user.username).toBe('noprofile');
      expect(data.user.displayName).toBeNull();
    });

    it('should calculate passport completion correctly', async () => {
      // Insert test cafes
      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind('Cafe 1', 'cafe-1', 'https://example.com', 'toronto', 43.6532, -79.3832).run();

      await env.DB.prepare(`
        INSERT INTO cafes (name, slug, link, city, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind('Cafe 2', 'cafe-2', 'https://example.com', 'toronto', 43.6532, -79.3832).run();

      // Add one check-in
      await env.DB.prepare(`
        INSERT INTO userCheckins (userId, cafeId) 
        VALUES (?, ?)
      `).bind(mockUser.id, 1).run();

      await env.DB.prepare(`
        UPDATE users SET username = ? WHERE id = ?
      `).bind('testpassport', mockUser.id).run();

      await env.DB.prepare(`
        INSERT INTO userProfiles (userId, isPublic) 
        VALUES (?, ?)
      `).bind(mockUser.id, true).run();

      const request = createTestRequest('/api/users/testpassport/profile');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.user.stats.passportCompletion).toBe(50); // 1 out of 2 cafes = 50%
      expect(data.user.stats.totalCheckins).toBe(1);
    });

    it('should include social links', async () => {
      await env.DB.prepare(`
        UPDATE users SET username = ? WHERE id = ?
      `).bind('socialuser', mockUser.id).run();

      await env.DB.prepare(`
        INSERT INTO userProfiles (userId, isPublic, instagram, tiktok, website) 
        VALUES (?, ?, ?, ?, ?)
      `).bind(mockUser.id, true, 'testinsta', 'testtiktok', 'https://testwebsite.com').run();

      const request = createTestRequest('/api/users/socialuser/profile');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.user.social).toMatchObject({
        instagram: 'testinsta',
        tiktok: 'testtiktok',
        website: 'https://testwebsite.com',
      });
    });
  });

  describe('GET /api/users/me/profile', () => {
    it('should return own profile when authenticated', async () => {
      await env.DB.prepare(`
        INSERT INTO userProfiles (userId, displayName, bio, preferences) 
        VALUES (?, ?, ?, ?)
      `).bind(mockUser.id, 'My Profile', 'My bio', '{"theme": "dark"}').run();

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.displayName).toBe('My Profile');
      expect(data.bio).toBe('My bio');
      expect(data.preferences).toEqual({ theme: 'dark' });
      expect(data.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest('/api/users/me/profile');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401);
    });

    it('should create default profile if none exists', async () => {
      const request = createAuthenticatedRequest('/api/users/me/profile', userToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.userId).toBe(mockUser.id);
      expect(data.displayName).toBeNull();
    });

    it('should handle malformed JSON preferences gracefully', async () => {
      await env.DB.prepare(`
        INSERT INTO userProfiles (userId, preferences) 
        VALUES (?, ?)
      `).bind(mockUser.id, 'invalid json{').run();

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.preferences).toBeNull();
    });

    it('should return 404 if user no longer exists', async () => {
      // Delete user
      await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(mockUser.id).run();

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 404, 'User not found');
    });
  });

  describe('PUT /api/users/me/profile', () => {
    beforeEach(async () => {
      // Create initial profile
      await env.DB.prepare(`
        INSERT INTO userProfiles (userId) VALUES (?)
      `).bind(mockUser.id).run();
    });

    it('should update profile fields successfully', async () => {
      const updates = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
        location: 'Toronto, ON',
        instagram: 'updated_insta',
        website: 'https://updated.com',
      };

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data).toMatchObject(updates);
    });

    it('should update privacy settings', async () => {
      const updates = {
        privacy: {
          isPublic: false,
          showActivity: false,
        },
      };

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.isPublic).toBe(false);
      expect(data.showActivity).toBe(false);
    });

    it('should update preferences', async () => {
      const updates = {
        preferences: {
          theme: 'dark',
          notifications: true,
          language: 'en',
        },
      };

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.preferences).toEqual(updates.preferences);
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest('/api/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify({ displayName: 'Test' }),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401);
    });

    it('should validate display name', async () => {
      const invalidUpdates = [
        { displayName: '' }, // Empty
        { displayName: 'a'.repeat(101) }, // Too long
        { displayName: '   ' }, // Only whitespace
      ];

      for (const updates of invalidUpdates) {
        const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        await expectErrorResponse(response, 400);
      }
    });

    it('should validate bio length', async () => {
      const updates = {
        bio: 'a'.repeat(501), // Too long (assuming 500 char limit)
      };

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400);
    });

    it('should validate social usernames', async () => {
      const invalidUpdates = [
        { instagram: 'invalid username with spaces' },
        { tiktok: '@invalidusername' }, // Assuming @ is not allowed
        { instagram: 'a'.repeat(31) }, // Too long
      ];

      for (const updates of invalidUpdates) {
        const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        await expectErrorResponse(response, 400);
      }
    });

    it('should validate website URL', async () => {
      const invalidUpdates = [
        { website: 'not-a-url' },
        { website: 'ftp://invalid.com' }, // Wrong protocol
        { website: 'javascript:alert("xss")' }, // XSS attempt
      ];

      for (const updates of invalidUpdates) {
        const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        await expectErrorResponse(response, 400);
      }
    });

    it('should validate location', async () => {
      const updates = {
        location: 'a'.repeat(101), // Too long
      };

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400);
    });

    it('should allow partial updates', async () => {
      const updates = {
        displayName: 'Partial Update',
        // Other fields should remain unchanged
      };

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.displayName).toBe('Partial Update');
    });

    it('should allow clearing fields with null/empty values', async () => {
      // First set some values
      await env.DB.prepare(`
        UPDATE userProfiles 
        SET displayName = ?, bio = ?, location = ? 
        WHERE userId = ?
      `).bind('Original Name', 'Original bio', 'Original location', mockUser.id).run();

      const updates = {
        displayName: null,
        bio: '',
        location: null,
      };

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.displayName).toBeNull();
      expect(data.bio).toBe('');
      expect(data.location).toBeNull();
    });

    it('should create profile if none exists', async () => {
      // Delete existing profile
      await env.DB.prepare(`DELETE FROM userProfiles WHERE userId = ?`).bind(mockUser.id).run();

      const updates = {
        displayName: 'New Profile',
      };

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.displayName).toBe('New Profile');
    });
  });

  describe('POST /api/users/me/avatar', () => {
    it('should return 501 not implemented', async () => {
      const formData = new FormData();
      formData.append('avatar', new Blob(['fake image data'], { type: 'image/jpeg' }), 'avatar.jpg');

      const request = new Request('https://api.matchamap.com/api/users/me/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
        body: formData,
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 501, 'not yet implemented');
    });

    it('should return 401 when not authenticated', async () => {
      const formData = new FormData();
      formData.append('avatar', new Blob(['fake image data'], { type: 'image/jpeg' }), 'avatar.jpg');

      const request = new Request('https://api.matchamap.com/api/users/me/avatar', {
        method: 'POST',
        body: formData,
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401);
    });
  });

  describe('Profile Security and Privacy', () => {
    it('should not expose sensitive data in public profiles', async () => {
      await env.DB.prepare(`
        UPDATE users SET username = ?, email = ? WHERE id = ?
      `).bind('publicuser', 'private@email.com', mockUser.id).run();

      await env.DB.prepare(`
        INSERT INTO userProfiles (userId, isPublic) 
        VALUES (?, ?)
      `).bind(mockUser.id, true).run();

      const request = createTestRequest('/api/users/publicuser/profile');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.user.email).toBeUndefined();
      expect(data.user.role).toBeUndefined();
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('should handle malicious input in profile updates', async () => {
      await env.DB.prepare(`
        INSERT INTO userProfiles (userId) VALUES (?)
      `).bind(mockUser.id).run();

      const maliciousUpdates = {
        displayName: '<script>alert("xss")</script>',
        bio: 'javascript:alert("xss")',
        website: 'javascript:alert("xss")',
        location: '<img src=x onerror=alert("xss")>',
      };

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
        method: 'PUT',
        body: JSON.stringify(maliciousUpdates),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      // Should either reject malicious input or sanitize it
      await expectErrorResponse(response, 400);
    });

    it('should handle very large payloads gracefully', async () => {
      const largePayload = {
        displayName: 'a'.repeat(10000),
        bio: 'b'.repeat(100000),
        preferences: { data: 'x'.repeat(1000000) },
      };

      const request = createAuthenticatedRequest('/api/users/me/profile', userToken, {
        method: 'PUT',
        body: JSON.stringify(largePayload),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      // Should reject oversized payloads
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});