import { Router } from 'itty-router';
import { Env } from './types';
import { handleCorsPreflightRequest } from './utils/cors';
import { handleHealth } from './routes/health';
import { listCafes, getCafe, createCafe, updateCafe, deleteCafe } from './routes/cafes';
import { listDrinks, createDrink, updateDrink, deleteDrink } from './routes/drinks';
import { listFeedItems } from './routes/feed';
import { listAllFeedItems, getFeedItem, createFeedItem, updateFeedItem, deleteFeedItem } from './routes/admin-feed';
import { listEvents } from './routes/events';
import { listAllEvents, getEvent, createEvent, updateEvent, deleteEvent } from './routes/admin-events';
import { lookupPlace } from './routes/places';
import { bulkImportCafes } from './routes/import';
import { register, login, logout, getCurrentUser, refreshToken } from './routes/auth';
import { requireAuth, requireAdminAuth } from './middleware/auth';
import { notFoundResponse } from './utils/response';

const router = Router();

// Health check
router.get('/api/health', handleHealth);

// Public API endpoints
router.get('/api/cafes', listCafes);
router.get('/api/cafes/:id', getCafe);
router.get('/api/feed', listFeedItems);
router.get('/api/events', listEvents);

// Auth endpoints
router.post('/api/auth/register', register);
router.post('/api/auth/login', login);
router.post('/api/auth/logout', requireAuth(), logout);
router.get('/api/auth/me', requireAuth(), getCurrentUser);
router.post('/api/auth/refresh', refreshToken);

// Admin API endpoints (protected by JWT authentication)
router.post('/api/admin/cafes', requireAdminAuth(), createCafe);
router.put('/api/admin/cafes/:id', requireAdminAuth(), updateCafe);
router.delete('/api/admin/cafes/:id', requireAdminAuth(), deleteCafe);
router.post('/api/admin/places/lookup', requireAdminAuth(), lookupPlace);

// Drinks management endpoints
router.get('/api/admin/cafes/:cafeId/drinks', requireAdminAuth(), listDrinks);
router.post('/api/admin/cafes/:cafeId/drinks', requireAdminAuth(), createDrink);
router.put('/api/admin/drinks/:id', requireAdminAuth(), updateDrink);
router.delete('/api/admin/drinks/:id', requireAdminAuth(), deleteDrink);

// Bulk import endpoint
router.post('/api/admin/import/cafes', requireAdminAuth(), bulkImportCafes);

// Feed admin endpoints
router.get('/api/admin/feed', requireAdminAuth(), listAllFeedItems);
router.get('/api/admin/feed/:id', requireAdminAuth(), getFeedItem);
router.post('/api/admin/feed', requireAdminAuth(), createFeedItem);
router.put('/api/admin/feed/:id', requireAdminAuth(), updateFeedItem);
router.delete('/api/admin/feed/:id', requireAdminAuth(), deleteFeedItem);

// Events admin endpoints
router.get('/api/admin/events', requireAdminAuth(), listAllEvents);
router.get('/api/admin/events/:id', requireAdminAuth(), getEvent);
router.post('/api/admin/events', requireAdminAuth(), createEvent);
router.put('/api/admin/events/:id', requireAdminAuth(), updateEvent);
router.delete('/api/admin/events/:id', requireAdminAuth(), deleteEvent);

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
