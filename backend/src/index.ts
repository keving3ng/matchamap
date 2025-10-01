/**
 * MatchaMap API - Cloudflare Workers Backend
 *
 * Entry point for the API server running on Cloudflare Workers.
 * Handles public cafe endpoints, admin endpoints, and analytics.
 */

import { Router } from 'itty-router';

// Environment bindings
export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
}

// Create router
const router = Router();

// CORS helper
function corsHeaders(origin: string, allowedOrigins: string): HeadersInit {
  const origins = allowedOrigins.split(',');
  const isAllowed = origins.includes(origin) || origins.includes('*');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : origins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Health check
router.get('/health', () => {
  return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Public API routes (to be implemented)
router.get('/api/cafes', async (request, env: Env) => {
  // TODO: Implement cafe listing
  return new Response(JSON.stringify({ cafes: [] }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

router.get('/api/cafes/:id', async (request, env: Env) => {
  // TODO: Implement cafe details
  const { id } = request.params;
  return new Response(JSON.stringify({ id, message: 'Not implemented' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  });
});

// 404 handler
router.all('*', () => {
  return new Response('Not Found', { status: 404 });
});

// Main fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    try {
      const response = await router.handle(request, env, ctx);

      // Add CORS headers to response
      const headers = new Headers(response.headers);
      Object.entries(cors).forEach(([key, value]) => headers.set(key, value));

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  },
};
