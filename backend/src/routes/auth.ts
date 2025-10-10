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
import { AUTH_CONSTANTS, HTTP_STATUS, JWT_EXPIRY } from '../constants';

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
      HTTP_STATUS.CREATED,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Registration failed', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
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
      return errorResponse('Invalid email or password', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return errorResponse('Invalid email or password', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    // Use extended token expiration for admin users
    const accessTokenExpiry = user.role === 'admin' ? JWT_EXPIRY.ACCESS_TOKEN_ADMIN : JWT_EXPIRY.ACCESS_TOKEN;
    const refreshTokenExpiry = user.role === 'admin' ? JWT_EXPIRY.REFRESH_TOKEN_ADMIN : JWT_EXPIRY.REFRESH_TOKEN;

    const accessToken = await signToken(tokenPayload, env.JWT_SECRET, accessTokenExpiry);
    const refreshToken = await signToken(tokenPayload, env.JWT_SECRET, refreshTokenExpiry);

    // Log token generation for security auditing
    console.log(`Token generated - User: ${user.email}, Role: ${user.role}, Access Token Expiry: ${accessTokenExpiry}, Refresh Token Expiry: ${refreshTokenExpiry}`);

    // Store session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.SESSION_EXPIRY_MS).toISOString();

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
      HTTP_STATUS.OK,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Login failed', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
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
      HTTP_STATUS.OK,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('Logout failed', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/auth/me
 * Get current user info
 */
export async function getCurrentUser(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const db = getDb(env.DB);

    // Fetch fresh user data
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, request.user.userId))
      .get();

    if (!user) {
      return errorResponse('User not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return jsonResponse({ user: userWithoutPassword }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse('Failed to get user info', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
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
      return errorResponse('Invalid or expired refresh token', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    // Use extended token expiration for admin users
    const accessTokenExpiry = payload.role === 'admin' ? JWT_EXPIRY.ACCESS_TOKEN_ADMIN : JWT_EXPIRY.ACCESS_TOKEN;
    
    // Generate new access token
    const accessToken = await signToken(payload, env.JWT_SECRET, accessTokenExpiry);

    // Log token refresh for security auditing
    console.log(`Token refreshed - User: ${payload.email}, Role: ${payload.role}, Access Token Expiry: ${accessTokenExpiry}`);

    return jsonResponse({ accessToken }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse('Token refresh failed', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
