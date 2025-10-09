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
import { bulkImportCafes, exportCafes } from './routes/import';
import { register, login, logout, getCurrentUser, refreshToken } from './routes/auth';
import { joinWaitlist, getWaitlistAdmin } from './routes/waitlist';
import { getUserProfile, getMyProfile, updateMyProfile, uploadAvatar } from './routes/profile';
import { requireAuth, requireAdminAuth } from './middleware/auth';
import { authRateLimit, publicRateLimit, writeRateLimit } from './middleware/rateLimit';
import { requireHTTPS } from './middleware/httpsOnly';
import { notFoundResponse } from './utils/response';

const router = Router();

// Apply HTTPS enforcement globally (in production only)
router.all('*', requireHTTPS());

// Health check
router.get('/api/health', handleHealth);

// Public API endpoints (with rate limiting)
router.get('/api/cafes', publicRateLimit(), listCafes);
router.get('/api/cafes/:id', publicRateLimit(), getCafe);
router.get('/api/feed', publicRateLimit(), listFeedItems);
router.get('/api/events', publicRateLimit(), listEvents);
router.post('/api/waitlist', authRateLimit(), joinWaitlist);

// Auth endpoints (with stricter rate limiting)
router.post('/api/auth/register', authRateLimit(), register);
router.post('/api/auth/login', authRateLimit(), login);
router.post('/api/auth/logout', authRateLimit(), requireAuth(), logout);
router.get('/api/auth/me', authRateLimit(), requireAuth(), getCurrentUser);
router.post('/api/auth/refresh', authRateLimit(), refreshToken);

// User profile endpoints (more specific routes first)
router.get('/api/users/me/profile', authRateLimit(), requireAuth(), getMyProfile);
router.put('/api/users/me/profile', writeRateLimit(), requireAuth(), updateMyProfile);
router.post('/api/users/me/avatar', writeRateLimit(), requireAuth(), uploadAvatar);
router.get('/api/users/:username/profile', publicRateLimit(), getUserProfile);

// Admin API endpoints (protected by JWT authentication + rate limiting)
router.post('/api/admin/cafes', writeRateLimit(), requireAdminAuth(), createCafe);
router.put('/api/admin/cafes/:id', writeRateLimit(), requireAdminAuth(), updateCafe);
router.delete('/api/admin/cafes/:id', writeRateLimit(), requireAdminAuth(), deleteCafe);
router.post('/api/admin/places/lookup', writeRateLimit(), requireAdminAuth(), lookupPlace);

// Drinks management endpoints
router.get('/api/admin/cafes/:cafeId/drinks', publicRateLimit(), requireAdminAuth(), listDrinks);
router.post('/api/admin/cafes/:cafeId/drinks', writeRateLimit(), requireAdminAuth(), createDrink);
router.put('/api/admin/drinks/:id', writeRateLimit(), requireAdminAuth(), updateDrink);
router.delete('/api/admin/drinks/:id', writeRateLimit(), requireAdminAuth(), deleteDrink);

// Bulk import/export endpoints
router.post('/api/admin/import/cafes', writeRateLimit(), requireAdminAuth(), bulkImportCafes);
router.get('/api/admin/export/cafes', publicRateLimit(), requireAdminAuth(), exportCafes);

// Feed admin endpoints
router.get('/api/admin/feed', publicRateLimit(), requireAdminAuth(), listAllFeedItems);
router.get('/api/admin/feed/:id', publicRateLimit(), requireAdminAuth(), getFeedItem);
router.post('/api/admin/feed', writeRateLimit(), requireAdminAuth(), createFeedItem);
router.put('/api/admin/feed/:id', writeRateLimit(), requireAdminAuth(), updateFeedItem);
router.delete('/api/admin/feed/:id', writeRateLimit(), requireAdminAuth(), deleteFeedItem);

// Events admin endpoints
router.get('/api/admin/events', publicRateLimit(), requireAdminAuth(), listAllEvents);
router.get('/api/admin/events/:id', publicRateLimit(), requireAdminAuth(), getEvent);
router.post('/api/admin/events', writeRateLimit(), requireAdminAuth(), createEvent);
router.put('/api/admin/events/:id', writeRateLimit(), requireAdminAuth(), updateEvent);
router.delete('/api/admin/events/:id', writeRateLimit(), requireAdminAuth(), deleteEvent);

// Waitlist admin endpoints
router.get('/api/admin/waitlist', publicRateLimit(), requireAdminAuth(), getWaitlistAdmin);

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
