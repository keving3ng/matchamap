import { Router } from 'itty-router';
import { Env } from './types';
import { handleCorsPreflightRequest } from './utils/cors';
import { handleHealth } from './routes/health';
import { listCafes, getCafe, createCafe, updateCafe, deleteCafe } from './routes/cafes';
import { listDrinks, createDrink, updateDrink, deleteDrink } from './routes/drinks';
import { listFeedItems } from './routes/feed';
import { listEvents } from './routes/events';
import { lookupPlace } from './routes/places';
import { bulkImportCafes } from './routes/import';
import { notFoundResponse } from './utils/response';

const router = Router();

// Health check
router.get('/api/health', handleHealth);

// Public API endpoints
router.get('/api/cafes', listCafes);
router.get('/api/cafes/:id', getCafe);
router.get('/api/feed', listFeedItems);
router.get('/api/events', listEvents);

// Admin API endpoints (protected by Cloudflare Access)
router.post('/api/admin/cafes', createCafe);
router.put('/api/admin/cafes/:id', updateCafe);
router.delete('/api/admin/cafes/:id', deleteCafe);
router.post('/api/admin/places/lookup', lookupPlace);

// Drinks management endpoints
router.get('/api/admin/cafes/:cafeId/drinks', listDrinks);
router.post('/api/admin/cafes/:cafeId/drinks', createDrink);
router.put('/api/admin/drinks/:id', updateDrink);
router.delete('/api/admin/drinks/:id', deleteDrink);

// Bulk import endpoint
router.post('/api/admin/import/cafes', bulkImportCafes);

// Handle OPTIONS for CORS preflight
router.options('*', (request, env: Env) => handleCorsPreflightRequest(request, env));

// 404 for all other routes
router.all('*', (request, env: Env) => notFoundResponse(request, env));

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const response = await router.fetch(request, env);
      return response || new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Unhandled error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};
