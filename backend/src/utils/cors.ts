import { Env } from '../types';

export function getCorsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [];

  // Check if origin is allowed
  const isAllowed = allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      // Handle wildcard domains like https://*.matchamap.com
      const pattern = allowed.replace('*', '.*');
      return new RegExp(`^${pattern}$`).test(origin || '');
    }
    return allowed === origin;
  });

  return {
    'Access-Control-Allow-Origin': isAllowed && origin ? origin : allowedOrigins[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function handleCorsPreflightRequest(request: Request, env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, env),
  });
}
