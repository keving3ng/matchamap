import { Router } from 'itty-router';
import { Env } from './types';
import { handleCorsPreflightRequest } from './utils/cors';
import { handleHealth } from './routes/health';
import { HTTP_STATUS } from './constants';
import { listCafes, getCafe, createCafe, updateCafe, deleteCafe } from './routes/cafes';
import { listCities } from './routes/cities';
import { listDrinks, createDrink, updateDrink, deleteDrink, setDefaultDrink, getDrinks, getDrink } from './routes/drinks';
import { listEvents } from './routes/events';
import { listAllEvents, getEvent, createEvent, updateEvent, deleteEvent } from './routes/admin-events';
import { lookupPlace } from './routes/places';
import { bulkImportCafes, exportCafes } from './routes/import';
import { register, login, logout, getCurrentUser, refreshToken } from './routes/auth';
import { joinWaitlist, getWaitlistAdmin } from './routes/waitlist';
import { getUserProfile, getMyProfile, updateMyProfile, updatePrivacySettings, uploadAvatar } from './routes/profile';
import { listUsers, getUserStats, getUser, updateUserRole, deleteUser } from './routes/admin-users';
import { trackCafeStat, trackEventClick, handleCheckIn, getUserCheckins } from './routes/stats';
import { getUserPassport, getUserPassportSimple } from './routes/passport';
import { uploadPhoto, getCafePhotos, deletePhoto, getMyPhotos, getPhotosForModeration, moderatePhoto, servePhoto, getAdminCafePhotos } from './routes/photos';
import { createReview, getCafeReviews, updateReview, deleteReview, markHelpful, removeHelpful, getUserReviews, getAdminCafeReviews, getAdminCafeReviewsCount, moderateReview } from './routes/reviews';
import { getMyFavorites, addFavorite, removeFavorite, updateFavoriteNotes } from './routes/favorites';
import { getMyBadges, checkAndAwardBadges, getBadgeDefinitions, getBadgeProgress } from './routes/badges';
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
router.get('/api/events', publicRateLimit(), listEvents);
router.post('/api/waitlist', authRateLimit(), joinWaitlist);

// Stats tracking endpoints (public, no auth required)
router.post('/api/stats/cafe/:cafeId/:stat', publicRateLimit(), trackCafeStat);
router.post('/api/stats/event/:eventId', publicRateLimit(), trackEventClick);

// Check-in endpoints (authenticated users only)
router.post('/api/checkins', writeRateLimit(), requireAuth(), handleCheckIn);
router.get('/api/users/me/checkins', authRateLimit(), requireAuth(), getUserCheckins);

// User passport endpoints
router.get('/api/users/me/passport', authRateLimit(), requireAuth(), getUserPassport);
router.get('/api/users/me/passport/simple', authRateLimit(), requireAuth(), getUserPassportSimple);

// Photo upload endpoints
router.post('/api/photos/upload', writeRateLimit(), requireAuth(), uploadPhoto);
router.get('/api/cafes/:id/photos', publicRateLimit(), getCafePhotos);
router.delete('/api/photos/:id', writeRateLimit(), requireAuth(), deletePhoto);
router.get('/api/users/me/photos', authRateLimit(), requireAuth(), getMyPhotos);

// Auth endpoints (with stricter rate limiting)
router.post('/api/auth/register', authRateLimit(), register);
router.post('/api/auth/login', authRateLimit(), login);
router.post('/api/auth/logout', authRateLimit(), logout);
router.get('/api/auth/me', authRateLimit(), requireAuth(), getCurrentUser);
router.post('/api/auth/refresh', authRateLimit(), refreshToken);

// User profile endpoints (more specific routes first)
router.get('/api/users/me/profile', authRateLimit(), requireAuth(), getMyProfile);
router.put('/api/users/me/profile', writeRateLimit(), requireAuth(), updateMyProfile);
router.put('/api/users/me/privacy', writeRateLimit(), requireAuth(), updatePrivacySettings);
router.post('/api/users/me/avatar', writeRateLimit(), requireAuth(), uploadAvatar);
router.get('/api/users/:username/profile', publicRateLimit(), getUserProfile);

// User favorites endpoints
router.get('/api/users/me/favorites', authRateLimit(), requireAuth(), getMyFavorites);
router.post('/api/users/me/favorites', writeRateLimit(), requireAuth(), addFavorite);
router.delete('/api/users/me/favorites/:cafeId', writeRateLimit(), requireAuth(), removeFavorite);
router.put('/api/users/me/favorites/:cafeId/notes', writeRateLimit(), requireAuth(), updateFavoriteNotes);

// User badges endpoints
router.get('/api/users/me/badges', authRateLimit(), requireAuth(), getMyBadges);
router.post('/api/users/me/badges/check', writeRateLimit(), requireAuth(), checkAndAwardBadges);
router.get('/api/users/me/badges/progress', authRateLimit(), requireAuth(), getBadgeProgress);
router.get('/api/badges/definitions', publicRateLimit(), getBadgeDefinitions);

// Review endpoints
router.post('/api/cafes/:id/reviews', writeRateLimit(), requireAuth(), createReview);
router.get('/api/cafes/:id/reviews', publicRateLimit(), getCafeReviews);
router.put('/api/reviews/:id', writeRateLimit(), requireAuth(), updateReview);
router.delete('/api/reviews/:id', writeRateLimit(), requireAuth(), deleteReview);
router.post('/api/reviews/:id/helpful', writeRateLimit(), requireAuth(), markHelpful);
router.delete('/api/reviews/:id/helpful', writeRateLimit(), requireAuth(), removeHelpful);
router.get('/api/users/:username/reviews', publicRateLimit(), getUserReviews);

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

// Photo moderation admin endpoints
router.get('/api/admin/photos', publicRateLimit(), requireAdminAuth(), getPhotosForModeration);
router.put('/api/admin/photos/:id/moderate', writeRateLimit(), requireAdminAuth(), moderatePhoto);

// Content management admin endpoints
router.get('/api/admin/cafes/:id/photos', publicRateLimit(), requireAdminAuth(), getAdminCafePhotos);
router.get('/api/admin/cafes/:id/reviews', publicRateLimit(), requireAdminAuth(), getAdminCafeReviews);
router.get('/api/admin/cafes/:id/reviews/count', publicRateLimit(), requireAdminAuth(), getAdminCafeReviewsCount);
router.put('/api/admin/reviews/:id/moderate', writeRateLimit(), requireAdminAuth(), moderateReview);

// Photo serving endpoints (for local dev with local R2)
router.get('/photos/*', servePhoto);
router.get('/thumbnails/*', servePhoto);

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
