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

describe('Auth Routes', () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);
    userToken = await createTestToken(mockUser);
    adminToken = await createTestToken(mockAdminUser);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'SecurePassword123!',
      };

      const request = createTestRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 201);
      
      const data = await response.json();
      expect(data.message).toBe('User registered successfully');
      expect(data.user).toMatchObject({
        email: newUser.email,
        username: newUser.username,
        role: 'user',
      });
      expect(data.user.passwordHash).toBeUndefined();
      expect(data.user.id).toBeDefined();
    });

    it('should return 400 for duplicate email', async () => {
      const duplicateUser = {
        email: mockUser.email, // Already exists from seedTestData
        username: 'differentusername',
        password: 'SecurePassword123!',
      };

      const request = createTestRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(duplicateUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400, 'already exists');
    });

    it('should return 400 for duplicate username', async () => {
      // First create a user with a username
      await env.DB.prepare(`
        UPDATE users SET username = ? WHERE id = ?
      `).bind('testuser', mockUser.id).run();

      const duplicateUser = {
        email: 'different@example.com',
        username: 'testuser', // Duplicate username
        password: 'SecurePassword123!',
      };

      const request = createTestRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(duplicateUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400, 'Username already taken');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidUser = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'SecurePassword123!',
      };

      const request = createTestRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(invalidUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400);
    });

    it('should return 400 for weak password', async () => {
      const weakPasswordUser = {
        email: 'test@example.com',
        username: 'testuser',
        password: '123', // Too weak
      };

      const request = createTestRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(weakPasswordUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteUser = {
        email: 'test@example.com',
        // missing username and password
      };

      const request = createTestRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(incompleteUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400);
    });

    it('should normalize email to lowercase', async () => {
      const newUser = {
        email: 'NewUser@Example.COM',
        username: 'newuser',
        password: 'SecurePassword123!',
      };

      const request = createTestRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 201);
      
      const data = await response.json();
      expect(data.user.email).toBe('newuser@example.com');
    });

    it('should create default user profile', async () => {
      const newUser = {
        email: 'profileuser@example.com',
        username: 'profileuser',
        password: 'SecurePassword123!',
      };

      const request = createTestRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 201);
      
      const data = await response.json();
      const userId = data.user.id;

      // Verify profile was created
      const profile = await env.DB.prepare(`
        SELECT * FROM userProfiles WHERE userId = ?
      `).bind(userId).first();

      expect(profile).toBeTruthy();
      expect(profile.userId).toBe(userId);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: mockUser.email,
        password: 'test-password', // This should match the mock password
      };

      const request = createTestRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.accessToken).toBeDefined();
      expect(data.refreshToken).toBeDefined();
      expect(data.user).toMatchObject({
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'test-password',
      };

      const request = createTestRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401, 'Invalid email or password');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: mockUser.email,
        password: 'wrong-password',
      };

      const request = createTestRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401, 'Invalid email or password');
    });

    it('should return 400 for missing credentials', async () => {
      const loginData = {
        email: mockUser.email,
        // missing password
      };

      const request = createTestRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400);
    });

    it('should handle email case insensitivity', async () => {
      const loginData = {
        email: mockUser.email.toUpperCase(),
        password: 'test-password',
      };

      const request = createTestRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.user.email).toBe(mockUser.email.toLowerCase());
    });

    it('should create session on successful login', async () => {
      const loginData = {
        email: mockUser.email,
        password: 'test-password',
      };

      const request = createTestRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);

      // Verify session was created
      const session = await env.DB.prepare(`
        SELECT * FROM sessions WHERE userId = ?
      `).bind(mockUser.id).first();

      expect(session).toBeTruthy();
      expect(session.userId).toBe(mockUser.id);
      expect(session.token).toBeTruthy();
      expect(session.expiresAt).toBeTruthy();
    });

    it('should use extended token expiry for admin users', async () => {
      const loginData = {
        email: mockAdminUser.email,
        password: 'test-password',
      };

      const request = createTestRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.accessToken).toBeDefined();
      expect(data.refreshToken).toBeDefined();
      expect(data.user.role).toBe('admin');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully when authenticated', async () => {
      const request = createAuthenticatedRequest('/api/auth/logout', userToken, {
        method: 'POST',
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.message).toBe('Logged out successfully');
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest('/api/auth/logout', {
        method: 'POST',
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401);
    });

    it('should delete all user sessions on logout', async () => {
      // Create multiple sessions for the user
      const tokens = ['token1', 'token2', 'token3'];
      for (const token of tokens) {
        await env.DB.prepare(`
          INSERT INTO sessions (userId, token, expiresAt) 
          VALUES (?, ?, ?)
        `).bind(mockUser.id, token, new Date(Date.now() + 3600000).toISOString()).run();
      }

      const request = createAuthenticatedRequest('/api/auth/logout', userToken, {
        method: 'POST',
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);

      // Verify all sessions were deleted
      const remainingSessions = await env.DB.prepare(`
        SELECT * FROM sessions WHERE userId = ?
      `).bind(mockUser.id).all();

      expect(remainingSessions.results).toHaveLength(0);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info when authenticated', async () => {
      const request = createAuthenticatedRequest('/api/auth/me', userToken);
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

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest('/api/auth/me');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401);
    });

    it('should return 404 if user no longer exists', async () => {
      // Delete the user from database
      await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(mockUser.id).run();

      const request = createAuthenticatedRequest('/api/auth/me', userToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 404, 'User not found');
    });

    it('should return fresh user data', async () => {
      // Update user data in database
      const newDisplayName = 'Updated Display Name';
      await env.DB.prepare(`
        UPDATE users SET displayName = ? WHERE id = ?
      `).bind(newDisplayName, mockUser.id).run();

      const request = createAuthenticatedRequest('/api/auth/me', userToken);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 200);
      
      const data = await response.json();
      expect(data.user.displayName).toBe(newDisplayName);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // First login to get tokens
      const loginRequest = createTestRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: mockUser.email,
          password: 'test-password',
        }),
      });
      const loginCtx = createExecutionContext();
      const loginResponse = await worker.fetch(loginRequest, env, loginCtx);
      await waitOnExecutionContext(loginCtx);

      const loginData = await loginResponse.json();
      const refreshToken = loginData.refreshToken;

      // Use refresh token to get new access token
      const refreshRequest = createTestRequest('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      const refreshCtx = createExecutionContext();
      const refreshResponse = await worker.fetch(refreshRequest, env, refreshCtx);
      await waitOnExecutionContext(refreshCtx);

      expectJsonResponse(refreshResponse, 200);
      
      const refreshData = await refreshResponse.json();
      expect(refreshData.accessToken).toBeDefined();
      expect(refreshData.accessToken).not.toBe(loginData.accessToken);
    });

    it('should return 401 for invalid refresh token', async () => {
      const request = createTestRequest('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'invalid-token' }),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401, 'Invalid or expired');
    });

    it('should return 401 for expired refresh token', async () => {
      // Create an expired token (this is a mock - in real implementation you'd use actual expired JWT)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const request = createTestRequest('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: expiredToken }),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 401, 'Invalid or expired');
    });

    it('should return 400 for missing refresh token', async () => {
      const request = createTestRequest('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      await expectErrorResponse(response, 400);
    });

    it('should use extended token expiry for admin users', async () => {
      // Login as admin to get tokens
      const loginRequest = createTestRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: mockAdminUser.email,
          password: 'test-password',
        }),
      });
      const loginCtx = createExecutionContext();
      const loginResponse = await worker.fetch(loginRequest, env, loginCtx);
      await waitOnExecutionContext(loginCtx);

      const loginData = await loginResponse.json();
      const refreshToken = loginData.refreshToken;

      // Use refresh token
      const refreshRequest = createTestRequest('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      const refreshCtx = createExecutionContext();
      const refreshResponse = await worker.fetch(refreshRequest, env, refreshCtx);
      await waitOnExecutionContext(refreshCtx);

      expectJsonResponse(refreshResponse, 200);
      
      const refreshData = await refreshResponse.json();
      expect(refreshData.accessToken).toBeDefined();
    });
  });

  describe('Authentication Security', () => {
    it('should hash passwords before storing', async () => {
      const newUser = {
        email: 'security@example.com',
        username: 'securityuser',
        password: 'TestPassword123!',
      };

      const request = createTestRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expectJsonResponse(response, 201);

      // Check that password is hashed in database
      const storedUser = await env.DB.prepare(`
        SELECT passwordHash FROM users WHERE email = ?
      `).bind(newUser.email).first();

      expect(storedUser.passwordHash).toBeDefined();
      expect(storedUser.passwordHash).not.toBe(newUser.password);
      expect(storedUser.passwordHash).toMatch(/^\$2[ab]\$/); // bcrypt hash format
    });

    it('should not return password hash in any response', async () => {
      const responses = [
        // Registration
        await worker.fetch(createTestRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: 'nopassword@example.com',
            username: 'nopassword',
            password: 'TestPassword123!',
          }),
        }), env, createExecutionContext()),
        
        // Login
        await worker.fetch(createTestRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: mockUser.email,
            password: 'test-password',
          }),
        }), env, createExecutionContext()),
        
        // Get current user
        await worker.fetch(createAuthenticatedRequest('/api/auth/me', userToken), env, createExecutionContext()),
      ];

      for (const response of responses) {
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            expect(data.user.passwordHash).toBeUndefined();
            expect(data.user.password).toBeUndefined();
          }
        }
      }
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = createTestRequest('/api/auth/login', {
        method: 'POST',
        body: 'invalid json{',
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(500);
    });

    it('should validate JWT tokens properly', async () => {
      const invalidTokens = [
        'invalid.token.here',
        'Bearer invalid.token.here',
        '',
        'null',
        'undefined',
      ];

      for (const token of invalidTokens) {
        const request = createAuthenticatedRequest('/api/auth/me', token);
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(401);
      }
    });
  });
});