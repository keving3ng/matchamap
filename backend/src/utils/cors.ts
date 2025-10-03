import { Env } from '../types';

export function getCorsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

  // Check if origin is allowed
  const isAllowed = allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      // Handle wildcard domains like https://*.matchamap.pages.dev
      // Escape special regex chars except *, then replace * with [a-z0-9-]+
      const pattern = allowed
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
        .replace(/\\\*/g, '[a-z0-9-]+'); // Replace \* with subdomain pattern

      try {
        return new RegExp(`^${pattern}$`).test(origin || '');
      } catch (e) {
        console.error('Invalid CORS pattern:', allowed, e);
        return false;
      }
    }
    return allowed === origin;
  });

  return {
    'Access-Control-Allow-Origin': isAllowed && origin ? origin : (allowedOrigins[0] || '*'),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin', // Important for caching
  };
}

export function handleCorsPreflightRequest(request: Request, env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, env),
  });
}
