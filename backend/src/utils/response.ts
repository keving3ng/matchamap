import { Env } from '../types';
import { getCorsHeaders } from './cors';
import { getSecurityHeaders } from '../middleware/securityHeaders';
import { HTTP_STATUS, CACHE_CONSTANTS } from '../constants';

export function jsonResponse(
  data: unknown,
  status: number = HTTP_STATUS.OK,
  request: Request,
  env: Env,
  cacheControl?: string
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getCorsHeaders(request, env),
    ...getSecurityHeaders(env),
  };

  if (cacheControl) {
    headers['Cache-Control'] = cacheControl;
  }

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

export function errorResponse(
  error: string,
  status: number = HTTP_STATUS.BAD_REQUEST,
  request: Request,
  env: Env
): Response {
  return jsonResponse({ error }, status, request, env, CACHE_CONSTANTS.NO_STORE);
}

export function notFoundResponse(request: Request, env: Env): Response {
  return errorResponse('Not found', HTTP_STATUS.NOT_FOUND, request, env);
}

export function badRequestResponse(message: string, request: Request, env: Env): Response {
  return errorResponse(message, HTTP_STATUS.BAD_REQUEST, request, env);
}

export function serverErrorResponse(request: Request, env: Env): Response {
  return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request, env);
}
