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

describe('Admin Users Routes', () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);
    userToken = await createTestToken(mockUser);
    adminToken = await createTestToken(mockAdminUser);
  });

  describe('GET /api/admin/users', () => {
    it('should list all users when authenticated as admin', async () => {
      const request = createAuthenticatedRequest('/api/admin/users', adminToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.users).toHaveLength(2); // mockUser and mockAdminUser
      expect(data.total).toBe(2);
      expect(data.users[0]).toMatchObject({
        id: expect.any(Number),
        email: expect.any(String),
        role: expect.any(String),
      });
      expect(data.users[0].passwordHash).toBeUndefined();
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest('/api/admin/users');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest('/api/admin/users', userToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 403);
    });

    it('should support pagination', async () => {
      // Add more users
      for (let i = 3; i <= 10; i++) {
        await env.DB.prepare(`
          INSERT INTO users (email, hashedPassword, role) 
          VALUES (?, ?, ?)
        `).bind(`user${i}@example.com`, 'hashedpassword', 'user').run();
      }

      const request = createAuthenticatedRequest('/api/admin/users?limit=5&offset=2', adminToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.users).toHaveLength(5);
      expect(data.total).toBe(10);
      expect(data.hasMore).toBe(true);
    });

    it('should support search by email', async () => {
      const request = createAuthenticatedRequest('/api/admin/users?search=admin@example.com', adminToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.users).toHaveLength(1);
      expect(data.users[0].email).toBe(mockAdminUser.email);
    });

    it('should filter by role', async () => {
      const request = createAuthenticatedRequest('/api/admin/users?role=admin', adminToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.users).toHaveLength(1);
      expect(data.users[0].role).toBe('admin');
    });

    it('should sort users by creation date', async () => {
      const request = createAuthenticatedRequest('/api/admin/users?sort=createdAt&order=desc', adminToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.users).toHaveLength(2);
      // Most recent first
      expect(new Date(data.users[0].createdAt).getTime())
        .toBeGreaterThanOrEqual(new Date(data.users[1].createdAt).getTime());
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get user details when authenticated as admin', async () => {
      const request = createAuthenticatedRequest(`/api/admin/users/${mockUser.id}`, adminToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const request = createAuthenticatedRequest('/api/admin/users/99999', adminToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 404);
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest(`/api/admin/users/${mockUser.id}`);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest(`/api/admin/users/${mockUser.id}`, userToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 403);
    });

    it('should return 400 for invalid user ID', async () => {
      const request = createAuthenticatedRequest('/api/admin/users/invalid', adminToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400, 'Invalid user ID');
    });

    it('should include user profile data', async () => {
      // Create profile for user
      await env.DB.prepare(`
        INSERT INTO userProfiles (userId, displayName, bio) 
        VALUES (?, ?, ?)
      `).bind(mockUser.id, 'Test Display Name', 'Test bio').run();

      const request = createAuthenticatedRequest(`/api/admin/users/${mockUser.id}`, adminToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.profile).toMatchObject({
        displayName: 'Test Display Name',
        bio: 'Test bio',
      });
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should update user role when authenticated as admin', async () => {
      const roleUpdate = { role: 'admin' };

      const request = createAuthenticatedRequest(`/api/admin/users/${mockUser.id}/role`, adminToken, {
        method: 'PUT',
        body: JSON.stringify(roleUpdate),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.user.role).toBe('admin');

      // Verify in database
      const updatedUser = await env.DB.prepare(`
        SELECT role FROM users WHERE id = ?
      `).bind(mockUser.id).first();
      expect(updatedUser.role).toBe('admin');
    });

    it('should return 400 for invalid role', async () => {
      const roleUpdate = { role: 'invalid_role' };

      const request = createAuthenticatedRequest(`/api/admin/users/${mockUser.id}/role`, adminToken, {
        method: 'PUT',
        body: JSON.stringify(roleUpdate),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400, 'Invalid role');
    });

    it('should return 400 when trying to update own role', async () => {
      const roleUpdate = { role: 'user' };

      const request = createAuthenticatedRequest(`/api/admin/users/${mockAdminUser.id}/role`, adminToken, {
        method: 'PUT',
        body: JSON.stringify(roleUpdate),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400, 'cannot modify your own role');
    });

    it('should return 404 for non-existent user', async () => {
      const roleUpdate = { role: 'admin' };

      const request = createAuthenticatedRequest('/api/admin/users/99999/role', adminToken, {
        method: 'PUT',
        body: JSON.stringify(roleUpdate),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 404);
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest(`/api/admin/users/${mockUser.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: 'admin' }),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest(`/api/admin/users/${mockUser.id}/role`, userToken, {
        method: 'PUT',
        body: JSON.stringify({ role: 'admin' }),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 403);
    });

    it('should log audit trail for role changes', async () => {
      const roleUpdate = { role: 'admin' };

      const request = createAuthenticatedRequest(`/api/admin/users/${mockUser.id}/role`, adminToken, {
        method: 'PUT',
        body: JSON.stringify(roleUpdate),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);

      // Verify audit log entry was created
      const auditLog = await env.DB.prepare(`
        SELECT * FROM admin_audit_log 
        WHERE resourceType = 'user' AND resourceId = ? AND action = 'UPDATE'
      `).bind(mockUser.id).first();

      expect(auditLog).toBeTruthy();
      expect(auditLog.userId).toBe(mockAdminUser.id);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user when authenticated as admin', async () => {
      const request = createAuthenticatedRequest(`/api/admin/users/${mockUser.id}`, adminToken, {
        method: 'DELETE',
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.message).toContain('deleted successfully');

      // Verify user is deleted from database
      const deletedUser = await env.DB.prepare(`
        SELECT * FROM users WHERE id = ?
      `).bind(mockUser.id).first();
      expect(deletedUser).toBeNull();
    });

    it('should return 400 when trying to delete own account', async () => {
      const request = createAuthenticatedRequest(`/api/admin/users/${mockAdminUser.id}`, adminToken, {
        method: 'DELETE',
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400, 'cannot delete your own account');
    });

    it('should return 404 for non-existent user', async () => {
      const request = createAuthenticatedRequest('/api/admin/users/99999', adminToken, {
        method: 'DELETE',
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 404);
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest(`/api/admin/users/${mockUser.id}`, {
        method: 'DELETE',
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest(`/api/admin/users/${mockUser.id}`, userToken, {
        method: 'DELETE',
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 403);
    });

    it('should cascade delete related user data', async () => {
      // Create related data
      await env.DB.prepare(`
        INSERT INTO userProfiles (userId, displayName) 
        VALUES (?, ?)
      `).bind(mockUser.id, 'Test Profile').run();

      await env.DB.prepare(`
        INSERT INTO sessions (userId, token, expiresAt) 
        VALUES (?, ?, ?)
      `).bind(mockUser.id, 'test-token', new Date(Date.now() + 3600000).toISOString()).run();

      const request = createAuthenticatedRequest(`/api/admin/users/${mockUser.id}`, adminToken, {
        method: 'DELETE',
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);

      // Verify related data is deleted
      const profile = await env.DB.prepare(`
        SELECT * FROM userProfiles WHERE userId = ?
      `).bind(mockUser.id).first();
      expect(profile).toBeNull();

      const session = await env.DB.prepare(`
        SELECT * FROM sessions WHERE userId = ?
      `).bind(mockUser.id).first();
      expect(session).toBeNull();
    });

    it('should log audit trail for user deletion', async () => {
      const request = createAuthenticatedRequest(`/api/admin/users/${mockUser.id}`, adminToken, {
        method: 'DELETE',
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);

      // Verify audit log entry was created
      const auditLog = await env.DB.prepare(`
        SELECT * FROM admin_audit_log 
        WHERE resourceType = 'user' AND resourceId = ? AND action = 'DELETE'
      `).bind(mockUser.id).first();

      expect(auditLog).toBeTruthy();
      expect(auditLog.userId).toBe(mockAdminUser.id);
    });
  });

  describe('GET /api/admin/users/stats', () => {
    it('should return user statistics when authenticated as admin', async () => {
      // Add more test data
      for (let i = 3; i <= 5; i++) {
        await env.DB.prepare(`
          INSERT INTO users (email, hashedPassword, role, createdAt) 
          VALUES (?, ?, ?, ?)
        `).bind(`user${i}@example.com`, 'hash', 'user', `2024-01-0${i}T00:00:00Z`).run();
      }

      const request = createAuthenticatedRequest('/api/admin/users/stats', adminToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.stats).toMatchObject({
        totalUsers: 5,
        totalAdmins: 1,
        totalRegularUsers: 4,
        newUsersThisMonth: expect.any(Number),
        newUsersThisWeek: expect.any(Number),
      });
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest('/api/admin/users/stats');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest('/api/admin/users/stats', userToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 403);
    });

    it('should handle empty database gracefully', async () => {
      // Delete all users
      await env.DB.exec('DELETE FROM users');

      const request = createAuthenticatedRequest('/api/admin/users/stats', adminToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.stats.totalUsers).toBe(0);
    });
  });

  describe('User Management Security', () => {
    it('should not expose password hashes in any response', async () => {
      const routes = [
        `/api/admin/users`,
        `/api/admin/users/${mockUser.id}`,
      ];

      for (const route of routes) {
        const request = createAuthenticatedRequest(route, adminToken);
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            expect(data.user.passwordHash).toBeUndefined();
            expect(data.user.password).toBeUndefined();
          }
          if (data.users) {
            for (const user of data.users) {
              expect(user.passwordHash).toBeUndefined();
              expect(user.password).toBeUndefined();
            }
          }
        }
      }
    });

    it('should validate admin permissions on all endpoints', async () => {
      const adminEndpoints = [
        { method: 'GET', path: '/api/admin/users' },
        { method: 'GET', path: `/api/admin/users/${mockUser.id}` },
        { method: 'PUT', path: `/api/admin/users/${mockUser.id}/role`, body: { role: 'admin' } },
        { method: 'DELETE', path: `/api/admin/users/${mockUser.id}` },
        { method: 'GET', path: '/api/admin/users/stats' },
      ];

      for (const endpoint of adminEndpoints) {
        const request = createAuthenticatedRequest(endpoint.path, userToken, {
          method: endpoint.method,
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        });
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(403);
      }
    });

    it('should handle malformed requests gracefully', async () => {
      const malformedRequests = [
        {
          path: `/api/admin/users/${mockUser.id}/role`,
          method: 'PUT',
          body: 'invalid json{',
        },
        {
          path: `/api/admin/users/${mockUser.id}/role`,
          method: 'PUT',
          body: JSON.stringify({ role: null }),
        },
        {
          path: `/api/admin/users/${mockUser.id}/role`,
          method: 'PUT',
          body: JSON.stringify({}),
        },
      ];

      for (const req of malformedRequests) {
        const request = createAuthenticatedRequest(req.path, adminToken, {
          method: req.method,
          body: req.body,
        });
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });
});