import { IRequest } from 'itty-router';
import { Env } from '../types';
import { verifyToken, JWTPayload } from '../utils/auth';
import { errorResponse } from '../utils/response';
import { HTTP_STATUS } from '../constants';

/**
 * Extended request with authenticated user
 */
export interface AuthenticatedRequest extends IRequest {
  user?: JWTPayload;
}

/**
 * Middleware to require authentication
 * Extracts JWT from Authorization header and verifies it
 */
export function requireAuth() {
  return async (request: AuthenticatedRequest, env: Env): Promise<Response | void> => {
    // Extract token from httpOnly cookie instead of Authorization header
    const cookieHeader = request.headers.get('Cookie');

    console.log('🔐 [AUTH] Cookie header received:', cookieHeader ? 'YES' : 'NO');
    console.log('🔐 [AUTH] Full cookie header:', cookieHeader);

    if (!cookieHeader) {
      console.log('❌ [AUTH] No cookie header found');
      return errorResponse('Unauthorized: Missing access token cookie', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const cookies = cookieHeader.split(';').map(c => c.trim());
    const tokenCookie = cookies.find(c => c.startsWith('access_token='));

    console.log('🔐 [AUTH] All cookies:', cookies);
    console.log('🔐 [AUTH] Access token cookie found:', tokenCookie ? 'YES' : 'NO');

    if (!tokenCookie) {
      console.log('❌ [AUTH] No access_token cookie in header');
      return errorResponse('Unauthorized: Missing access token cookie', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const token = tokenCookie.split('=')[1];
    console.log('🔐 [AUTH] Token extracted:', token ? token.substring(0, 20) + '...' : 'EMPTY');

    if (!token) {
      console.log('❌ [AUTH] Token is empty after extraction');
      return errorResponse('Unauthorized: Invalid access token cookie', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    if (!env.JWT_SECRET) {
      console.error('❌ [AUTH] JWT_SECRET is not configured');
      return errorResponse('Server configuration error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
    }

    console.log('🔐 [AUTH] JWT_SECRET is configured, verifying token...');

    let payload;
    try {
      payload = await verifyToken(token, env.JWT_SECRET);
      console.log('🔐 [AUTH] Token verification result:', payload ? 'SUCCESS' : 'FAILED (null)');
      if (payload) {
        console.log('🔐 [AUTH] Payload:', { userId: payload.userId, email: payload.email, role: payload.role });
      }
    } catch (error) {
      console.error('❌ [AUTH] Token verification threw error:', error);
      return errorResponse('Unauthorized: Token verification failed', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    if (!payload) {
      console.log('❌ [AUTH] Token verification returned null (invalid or expired token)');
      return errorResponse('Unauthorized: Invalid or expired token', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    console.log('✅ [AUTH] Authentication successful, attaching user to request');

    // Attach user to request
    request.user = payload;

    // Continue to next handler
    return undefined;
  };
}

/**
 * Middleware to require admin role
 * Must be used after requireAuth()
 */
export function requireAdmin() {
  return async (request: AuthenticatedRequest, env: Env): Promise<Response | void> => {
    if (!request.user) {
      return errorResponse('Unauthorized: Authentication required', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    if (request.user.role !== 'admin') {
      return errorResponse('Forbidden: Admin access required', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Continue to next handler
    return undefined;
  };
}

/**
 * Combined middleware: require auth + admin
 */
export function requireAdminAuth() {
  return async (request: AuthenticatedRequest, env: Env): Promise<Response | void> => {
    // First check auth
    const authResult = await requireAuth()(request, env);
    if (authResult) return authResult;

    // Then check admin
    const adminResult = await requireAdmin()(request, env);
    if (adminResult) return adminResult;

    return undefined;
  };
}
