import { IRequest } from 'itty-router';
import { eq } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, users, sessions, userProfiles, User } from '../db';
import { jsonResponse, errorResponse, badRequestResponse } from '../utils/response';
import {
  hashPassword,
  verifyPassword,
  signToken,
  generateSessionToken,
  JWTPayload,
} from '../utils/auth';
import { AuthenticatedRequest } from '../middleware/auth';
import { safeValidate, registerSchema, loginSchema, refreshTokenSchema } from '../validators';

/**
 * POST /api/auth/register
 * Register a new user (can be restricted to admin-only later)
 */
export async function register(request: IRequest, env: Env): Promise<Response> {
  try {
    const body = await request.json();

    // Validate input using Zod schema
    const validation = safeValidate(registerSchema, body);
    if (!validation.success) {
      return badRequestResponse(validation.error, request as Request, env);
    }

    const { email, username, password } = validation.data;

    const db = getDb(env.DB);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .get();

    if (existingUser) {
      return badRequestResponse('User with this email already exists', request as Request, env);
    }

    // Check if username is taken
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (existingUsername) {
      return badRequestResponse('Username already taken', request as Request, env);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (always as regular user - admins must be promoted via database)
    const result = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        username,
        passwordHash,
        role: 'user',
      })
      .returning()
      .get();

    // Create default profile for the new user
    try {
      await db
        .insert(userProfiles)
        .values({
          userId: result.id,
          // All other fields will use their default values
        })
        .run();
    } catch (profileError) {
      // Log error but don't fail registration if profile creation fails
      console.error('Failed to create default profile:', profileError);
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = result;

    return jsonResponse(
      {
        message: 'User registered successfully',
        user: userWithoutPassword,
      },
      201,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Registration failed', 500, request as Request, env);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export async function login(request: IRequest, env: Env): Promise<Response> {
  try {
    const body = await request.json();

    // Validate input using Zod schema
    const validation = safeValidate(loginSchema, body);
    if (!validation.success) {
      return badRequestResponse(validation.error, request as Request, env);
    }

    const { email, password } = validation.data;

    const db = getDb(env.DB);

    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .get();

    if (!user) {
      return errorResponse('Invalid email or password', 401, request as Request, env);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return errorResponse('Invalid email or password', 401, request as Request, env);
    }

    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = await signToken(tokenPayload, env.JWT_SECRET, '1h');
    const refreshToken = await signToken(tokenPayload, env.JWT_SECRET, '7d');

    // Store session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await db.insert(sessions).values({
      userId: user.id,
      token: sessionToken,
      expiresAt,
    });

    // Return tokens and user info
    const { passwordHash: _, ...userWithoutPassword } = user;

    return jsonResponse(
      {
        accessToken,
        refreshToken,
        user: userWithoutPassword,
      },
      200,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Login failed', 500, request as Request, env);
  }
}

/**
 * POST /api/auth/logout
 * Invalidate user session
 */
export async function logout(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return badRequestResponse('Not authenticated', request as Request, env);
    }

    // In a real app, you might want to invalidate the token
    // For JWT, we rely on token expiry
    // For sessions table, we can delete expired sessions or specific session

    return jsonResponse(
      { message: 'Logged out successfully' },
      200,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('Logout failed', 500, request as Request, env);
  }
}

/**
 * GET /api/auth/me
 * Get current user info
 */
export async function getCurrentUser(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', 401, request as Request, env);
    }

    const db = getDb(env.DB);

    // Fetch fresh user data
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, request.user.userId))
      .get();

    if (!user) {
      return errorResponse('User not found', 404, request as Request, env);
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return jsonResponse({ user: userWithoutPassword }, 200, request as Request, env);
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse('Failed to get user info', 500, request as Request, env);
  }
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function refreshToken(request: IRequest, env: Env): Promise<Response> {
  try {
    const body = await request.json();

    // Validate input using Zod schema
    const validation = safeValidate(refreshTokenSchema, body);
    if (!validation.success) {
      return badRequestResponse(validation.error, request as Request, env);
    }

    // Verify refresh token
    const { verifyToken } = await import('../utils/auth');
    const payload = await verifyToken(validation.data.refreshToken, env.JWT_SECRET);

    if (!payload) {
      return errorResponse('Invalid or expired refresh token', 401, request as Request, env);
    }

    // Generate new access token
    const accessToken = await signToken(payload, env.JWT_SECRET, '1h');

    return jsonResponse({ accessToken }, 200, request as Request, env);
  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse('Token refresh failed', 500, request as Request, env);
  }
}
