import { IRequest } from 'itty-router';
import { Env } from '../types';
import { verifyToken, JWTPayload } from '../utils/auth';
import { errorResponse } from '../utils/response';

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
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized: Missing or invalid token', 401, request as Request, env);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return errorResponse('Server configuration error', 500, request as Request, env);
    }

    const payload = await verifyToken(token, env.JWT_SECRET);

    if (!payload) {
      return errorResponse('Unauthorized: Invalid or expired token', 401, request as Request, env);
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
      return errorResponse('Unauthorized: Authentication required', 401, request as Request, env);
    }

    if (request.user.role !== 'admin') {
      return errorResponse('Forbidden: Admin access required', 403, request as Request, env);
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
