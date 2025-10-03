import { Env } from '../types';
import { getCorsHeaders } from './cors';
import { getSecurityHeaders } from '../middleware/securityHeaders';

export function jsonResponse(
  data: unknown,
  status = 200,
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
  status = 400,
  request: Request,
  env: Env
): Response {
  return jsonResponse({ error }, status, request, env, 'no-store');
}

export function notFoundResponse(request: Request, env: Env): Response {
  return errorResponse('Not found', 404, request, env);
}

export function badRequestResponse(message: string, request: Request, env: Env): Response {
  return errorResponse(message, 400, request, env);
}

export function serverErrorResponse(request: Request, env: Env): Response {
  return errorResponse('Internal server error', 500, request, env);
}
