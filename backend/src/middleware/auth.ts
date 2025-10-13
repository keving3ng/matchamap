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
    
    if (!cookieHeader) {
      return errorResponse('Unauthorized: Missing access token cookie', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const cookies = cookieHeader.split(';').map(c => c.trim());
    const tokenCookie = cookies.find(c => c.startsWith('access_token='));
    
    if (!tokenCookie) {
      return errorResponse('Unauthorized: Missing access token cookie', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const token = tokenCookie.split('=')[1];
    
    if (!token) {
      return errorResponse('Unauthorized: Invalid access token cookie', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    if (!env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return errorResponse('Server configuration error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
    }

    const payload = await verifyToken(token, env.JWT_SECRET);

    if (!payload) {
      return errorResponse('Unauthorized: Invalid or expired token', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

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
