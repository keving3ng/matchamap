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
  verifyToken,
  JWTPayload,
} from '../utils/auth';
import { AuthenticatedRequest } from '../middleware/auth';
import { safeValidate, registerSchema, loginSchema, refreshTokenSchema } from '../validators';
import { AUTH_CONSTANTS, HTTP_STATUS, JWT_EXPIRY, JWT_EXPIRY_SECONDS } from '../constants';

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

    // Log token generation for security auditing (sanitized for privacy)
    console.log(`Token generated - User ID: ${user.id}, Role: ${user.role}, Access Token Expiry: ${accessTokenExpiry}, Refresh Token Expiry: ${refreshTokenExpiry}`);

    // Store session with role-based expiry duration
    const sessionToken = generateSessionToken();
    const sessionExpiry = user.role === 'admin' ? AUTH_CONSTANTS.SESSION_EXPIRY_MS_ADMIN : AUTH_CONSTANTS.SESSION_EXPIRY_MS;
    const expiresAt = new Date(Date.now() + sessionExpiry).toISOString();

    await db.insert(sessions).values({
      userId: user.id,
      token: sessionToken,
      expiresAt,
    });

    // Set httpOnly cookies instead of returning tokens in response
    const { passwordHash: _, ...userWithoutPassword } = user;

    const response = jsonResponse(
      {
        user: userWithoutPassword,
      },
      HTTP_STATUS.OK,
      request as Request,
      env
    );

    // Set httpOnly cookies with security flags
    const accessMaxAge = user.role === 'admin' ? JWT_EXPIRY_SECONDS.ACCESS_TOKEN_ADMIN : JWT_EXPIRY_SECONDS.ACCESS_TOKEN;
    const refreshMaxAge = user.role === 'admin' ? JWT_EXPIRY_SECONDS.REFRESH_TOKEN_ADMIN : JWT_EXPIRY_SECONDS.REFRESH_TOKEN;
    response.headers.append('Set-Cookie', `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${accessMaxAge}`);
    response.headers.append('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh; Max-Age=${refreshMaxAge}`);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Login failed', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * POST /api/auth/logout
 * Invalidate user session and delete from database
 */
export async function logout(request: IRequest, env: Env): Promise<Response> {
  // Try to extract auth info from cookie for cleanup, but don't require it
  const cookieHeader = request.headers.get('Cookie');
  let userFromToken: JWTPayload | null = null;
  
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const tokenCookie = cookies.find(c => c.startsWith('access_token='));
    
    if (tokenCookie) {
      const token = tokenCookie.split('=')[1];
      if (token) {
        try {
          userFromToken = await verifyToken(token, env.JWT_SECRET);
        } catch {
          // Ignore token verification errors during logout
        }
      }
    }
  }
  try {
    // If user is authenticated, clean up sessions
    if (userFromToken) {
      const db = getDb(env.DB);

      // Delete all sessions for this user to ensure complete logout
      // This provides additional security by invalidating all user sessions
      await db
        .delete(sessions)
        .where(eq(sessions.userId, userFromToken.userId))
        .run();

      // Log security event for audit purposes
      console.log(`User logout - User ID: ${userFromToken.userId}, Username: ${userFromToken.username}`);
    }

    const response = jsonResponse(
      { message: 'Logged out successfully' },
      HTTP_STATUS.OK,
      request as Request,
      env
    );

    // Clear httpOnly cookies by setting them to expire immediately
    response.headers.append('Set-Cookie', 'access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
    response.headers.append('Set-Cookie', 'refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh; Max-Age=0');

    return response;
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
    // Extract refresh token from cookie instead of request body
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) {
      return errorResponse('Missing refresh token cookie', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const cookies = cookieHeader.split(';').map(c => c.trim());
    const refreshTokenCookie = cookies.find(c => c.startsWith('refresh_token='));
    if (!refreshTokenCookie) {
      return errorResponse('Missing refresh token cookie', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const refreshTokenValue = refreshTokenCookie.split('=')[1];
    if (!refreshTokenValue) {
      return errorResponse('Invalid refresh token cookie', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    // Verify refresh token
    const { verifyToken } = await import('../utils/auth');
    const payload = await verifyToken(refreshTokenValue, env.JWT_SECRET);

    if (!payload) {
      return errorResponse('Invalid or expired refresh token', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    // Use extended token expiration for admin users
    const accessTokenExpiry = payload.role === 'admin' ? JWT_EXPIRY.ACCESS_TOKEN_ADMIN : JWT_EXPIRY.ACCESS_TOKEN;
    
    // Generate new access token
    const accessToken = await signToken(payload, env.JWT_SECRET, accessTokenExpiry);

    // Log token refresh for security auditing (sanitized for privacy)
    console.log(`Token refreshed - User ID: ${payload.userId}, Role: ${payload.role}, Access Token Expiry: ${accessTokenExpiry}`);

    const response = jsonResponse({ success: true }, HTTP_STATUS.OK, request as Request, env);

    // Set new access token in httpOnly cookie
    const accessMaxAge = payload.role === 'admin' ? JWT_EXPIRY_SECONDS.ACCESS_TOKEN_ADMIN : JWT_EXPIRY_SECONDS.ACCESS_TOKEN;
    response.headers.append('Set-Cookie', `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${accessMaxAge}`);
    
    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse('Token refresh failed', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
