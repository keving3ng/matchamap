import { Router } from 'itty-router';
import { Env } from './types';
import { handleCorsPreflightRequest } from './utils/cors';
import { handleHealth } from './routes/health';
import { HTTP_STATUS } from './constants';
import { listCafes, getCafe, createCafe, updateCafe, deleteCafe } from './routes/cafes';
import { listCities } from './routes/cities';
import { listDrinks, createDrink, updateDrink, deleteDrink, setDefaultDrink, getDrinks, getDrink } from './routes/drinks';
import { listFeedItems } from './routes/feed';
import { listAllFeedItems, getFeedItem, createFeedItem, updateFeedItem, deleteFeedItem } from './routes/admin-feed';
import { listEvents } from './routes/events';
import { listAllEvents, getEvent, createEvent, updateEvent, deleteEvent } from './routes/admin-events';
import { lookupPlace } from './routes/places';
import { bulkImportCafes, exportCafes } from './routes/import';
import { register, login, logout, getCurrentUser, refreshToken } from './routes/auth';
import { joinWaitlist, getWaitlistAdmin } from './routes/waitlist';
import { getUserProfile, getMyProfile, updateMyProfile, uploadAvatar } from './routes/profile';
import { listUsers, getUserStats, getUser, updateUserRole, deleteUser } from './routes/admin-users';
import { requireAuth, requireAdminAuth } from './middleware/auth';
import { authRateLimit, publicRateLimit, writeRateLimit } from './middleware/rateLimit';
import { requireHTTPS } from './middleware/httpsOnly';
import { notFoundResponse } from './utils/response';

const router = Router();

/**
 * Validate required environment variables at startup
 * Fail fast with clear error messages if missing
 */
function validateEnvironment(env: Env): void {
  const requiredSecrets = [
    { key: 'JWT_SECRET', description: 'JWT signing secret' },
    { key: 'GOOGLE_PLACES_API_KEY', description: 'Google Places API key' }
  ];
  
  const missing = requiredSecrets.filter(({ key }) => !env[key as keyof Env]);
  
  if (missing.length > 0) {
    const errors = missing.map(({ key, description }) => 
      `- ${key}: ${description}`
    ).join('\n');
    
    throw new Error(
      `Missing required environment variables:\n${errors}\n\n` +
      `Set them via Wrangler CLI:\n` +
      missing.map(({ key }) => `npx wrangler secret put ${key}`).join('\n')
    );
  }
}

// Apply HTTPS enforcement globally (in production only)
router.all('*', requireHTTPS());

// Health check
router.get('/api/health', handleHealth);

// Public API endpoints (with rate limiting)
router.get('/api/cafes', publicRateLimit(), listCafes);
router.get('/api/cafes/:id', publicRateLimit(), getCafe);
router.get('/api/cities', publicRateLimit(), listCities);
router.get('/api/drinks', publicRateLimit(), getDrinks);
router.get('/api/drinks/:id', publicRateLimit(), getDrink);
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
router.put('/api/admin/cafes/:cafeId/drinks/:drinkId/set-default', writeRateLimit(), requireAdminAuth(), setDefaultDrink);
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

// User admin endpoints
router.get('/api/admin/users/stats', publicRateLimit(), requireAdminAuth(), getUserStats);
router.get('/api/admin/users/:id', publicRateLimit(), requireAdminAuth(), getUser);
router.get('/api/admin/users', publicRateLimit(), requireAdminAuth(), listUsers);
router.put('/api/admin/users/:id/role', writeRateLimit(), requireAdminAuth(), updateUserRole);
router.delete('/api/admin/users/:id', writeRateLimit(), requireAdminAuth(), deleteUser);

// Handle OPTIONS for CORS preflight
router.options('*', (request, env: Env) => handleCorsPreflightRequest(request, env));

// 404 for all other routes
router.all('*', (request, env: Env) => notFoundResponse(request, env));

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      // Validate environment variables on first request
      validateEnvironment(env);
      
      const response = await router.fetch(request, env);
      return response || new Response('Not Found', { status: HTTP_STATUS.NOT_FOUND });
    } catch (error) {
      console.error('Unhandled error:', error);
      
      // Return specific error for configuration issues
      if (error instanceof Error && error.message.includes('Missing required environment variables')) {
        return new Response(JSON.stringify({ 
          error: 'Configuration Error',
          details: error.message
        }), {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};
