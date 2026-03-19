# External Integrations

**Analysis Date:** 2026-03-18

## APIs & External Services

**Google Places API (New):**
- What it's used for: Enriching cafe data (address, hours, phone, website, ratings)
- SDK/Client: Native `fetch()` via HTTP
- Auth: GOOGLE_PLACES_API_KEY (secret, set via Wrangler CLI)
- Endpoint: `https://places.googleapis.com/v1/places:searchText` and `/places/{placeId}`
- Setup: Enable "Places API (New)" in Google Cloud Console, restrict to Places API only
- Used in: `backend/src/utils/placesEnrichment.ts`, `backend/src/routes/places.ts`
- Field mask: displayName, formattedAddress, location, currentOpeningHours, internationalPhoneNumber, websiteUri, rating, userRatingCount, googleMapsUri
- Place ID extraction: Parses Google Maps URLs to extract ChIJ format IDs

**OpenRouteService (Optional):**
- What it's used for: Route visualization (walking/driving routes from user to cafe)
- SDK/Client: Native `fetch()` via HTTP
- Auth: VITE_OPENROUTESERVICE_API_KEY (frontend env var, optional)
- Endpoint: OpenRouteService Directions API
- Status: Feature flag controlled via ENABLE_ROUTE_DISPLAY (currently false in prod/dev)
- Used in: `frontend/src/utils/routing.ts`
- Notes: Only loaded if feature flag and API key present

## Data Storage

**Cloudflare D1 (SQLite):**
- Type: SQLite relational database
- Connection: Via Cloudflare Workers binding named `DB`
- Database: matchamap-db (prod)
  - database_id: 69667043-3d25-4fe2-9bac-1a8d42a7c25c
  - migrations_dir: `backend/drizzle/migrations` (auto-generated)
- Client: Drizzle ORM 0.44.7
- Environments:
  - Production: Remote database (deploy with migrations)
  - Development: Local SQLite with migrations
- Schema location: `backend/drizzle/schema.ts`
- Tables:
  - `cafes` - Cafe data with scores, location, social links
  - `drinks` - Individual drink offerings per cafe (score, price, grams used)
  - `events` - Matcha events and workshops
  - `users` - User accounts (auth system)
  - `userProfiles` - Extended user data
  - `checkIns` - User cafe visits
  - `reviews` - User reviews and ratings
  - `photos` - Photo metadata (uploaded to R2)
  - `waitlist` - Early access waitlist

**Cloudflare R2 (S3-compatible storage):**
- Type: Object storage
- Connection: Via Cloudflare Workers binding named `PHOTOS_BUCKET`
- Buckets:
  - Production: `matchamap-photos`
  - Development: `matchamap-photos-dev`
- Custom domain: `https://photos.matchamap.club` (production)
- Use case: Photo uploads (user-submitted cafe/matcha photos)
- Bandwidth: Free egress on Cloudflare network
- Setup: `npx wrangler r2 bucket create matchamap-photos`

**Local Storage (Browser):**
- Use: Passport data (visited cafe stamps - localStorage key: `matchamap_passport`)
- Persistence: useVistiedCafesStore with persist middleware
- No account required for passport functionality

## Authentication & Identity

**Auth Provider:** Custom JWT-based (no external auth service)

**Implementation:**
- JWT generation/verification: jose library (Cloudflare Workers compatible)
- Token storage: HTTP-only cookies (via Wrangler cookies.ts utility)
- Password hashing: Web Crypto API (PBKDF2 with SHA-256)
  - ITERATIONS: 100000
  - KEY_LENGTH: 32 bytes
  - HASH_ALGORITHM: SHA-256
  - SALT_LENGTH: 16 bytes
  - Details: `backend/src/utils/auth.ts`

**Authentication Flow:**
- Login endpoint: `POST /api/auth/login` (validates email + password)
- JWT token creation on successful login
- Cookie-based session (automatic with fetch `credentials: 'include'`)
- Admin-only in production (feature flag ENABLE_USER_ACCOUNTS disabled in prod)
- Protected routes: Admin panel requires JWT + admin role check
- Session expiry: Dialog shown on 401/403 responses

**Key Files:**
- `backend/src/utils/auth.ts` - Password hashing, JWT utils
- `backend/src/routes/auth.ts` - Login/logout endpoints
- `frontend/src/stores/authStore.ts` - Token management, login logic
- `frontend/src/hooks/useSessionExpiry.ts` - Session expiry dialog
- `frontend/src/utils/api.ts` - Automatic cookie injection in all requests

**Secrets (Required):**
- JWT_SECRET - Set via `npx wrangler secret put JWT_SECRET`
- GOOGLE_PLACES_API_KEY - Set via `npx wrangler secret put GOOGLE_PLACES_API_KEY`
- Development: Also set secrets for dev env via `--env dev` flag

## Monitoring & Observability

**Error Tracking:** Not detected (custom error handling only)

**Logs:**
- Frontend: Console.log (stripped in production build via Terser)
- Backend: Wrangler tail for live logs
  - Production: `npm run tail` or `npx wrangler tail --env=""`
  - Development: `npm run tail:dev`

**Analytics:**
- `frontend/src/utils/api.ts` - statsAPI for tracking
- Endpoints: `/api/stats/check-in`, `/api/stats/cafe-view`
- Currently minimal tracking (primarily for cafe view counts)

## CI/CD & Deployment

**Hosting:**
- Frontend: Cloudflare Pages (auto-deploy on push to main)
  - Build command: `npm run build`
  - Output directory: `dist`
  - Build preset: Vite
- Backend: Cloudflare Workers (manual deploy via `npm run deploy`)
  - Wrangler configuration: `backend/wrangler.toml`
  - Deploy includes automatic database migrations

**CI Pipeline:** GitHub Actions (lint-staged pre-commit hooks configured)

**Build Tools:**
- Frontend: Vite 7.1.12 with plugins
  - @vitejs/plugin-react - JSX transformation
  - @tailwindcss/vite - Tailwind CSS compilation
  - @rollup/plugin-yaml - Feature flag loading
  - vite-plugin-compression - Gzip + Brotli
  - rollup-plugin-visualizer - Bundle analysis
- Backend: Wrangler 4.43.0 with Workers CLI

**Environment Configuration:**
- Frontend: `.env.development` and `.env.production` (VITE_API_URL only)
  - Dev: `VITE_API_URL=http://localhost:8787`
  - Prod: `VITE_API_URL=https://api.matchamap.club`
- Backend: `backend/wrangler.toml` (environment variables and secrets)
  - Prod defaults: ENVIRONMENT=production, COOKIE_DOMAIN=.matchamap.club
  - Dev overrides: ENVIRONMENT=development, ALLOWED_ORIGINS=http://localhost:3000

## Webhooks & Callbacks

**Incoming:** None detected

**Outgoing:**
- Google Maps URL parsing (admin cafe creation)
- Google Places API lookups (for enrichment, not webhooks)

## Cross-Origin & Security

**CORS:**
- Configured in backend: `ALLOWED_ORIGINS` env var
  - Production: `https://matchamap.club,https://*.matchamap.club,https://matchamap.pages.dev,https://*.matchamap.pages.dev`
  - Development: `http://localhost:3000,http://localhost:5174`
  - Localhost: Special handling to prevent cookie issues in dev

**Cookies:**
- Domain: `.matchamap.club` (production)
- HTTP-only: Yes (security middleware in backend)
- Same-site: Strict (default)
- Special handling for localhost dev (no domain restriction)

**CSP & Security Headers:** Not detected (delegated to Cloudflare Pages)

## API Rate Limiting

**Status:** Not detected (Cloudflare provides DDoS protection, no app-level limiting visible)

## Feature Flags

**Location:** `frontend/src/config/features.yaml`

**Key Flags Related to Integrations:**
- ENABLE_PASSPORT - localStorage-based visited cafe tracking
- ENABLE_GEOLOCATION - Browser Geolocation API for distance calculations
- ENABLE_USER_ACCOUNTS - Admin login (requires auth API)
- ENABLE_ROUTE_DISPLAY - OpenRouteService routing (currently false)
- ENABLE_ADMIN_PANEL - Admin CRUD endpoints for cafes/drinks/events
- ENABLE_ABOUT - About page with vivisual.diary links
- ENABLE_MENU - Hamburger menu (contains social/contact links)

## Content Delivery

**Static Assets:**
- Hosted on Cloudflare Pages CDN
- Compression: Gzip + Brotli pre-compressed by Vite
- Cache busting: Content-hash based filenames (`[hash]` in vite.config.js)

**Images/Photos:**
- R2 bucket with custom domain: `https://photos.matchamap.club`
- Served with Cloudflare cache (free egress)
- User-uploaded cafe photos via admin panel or user profiles

## Third-Party Scripts

**None detected**

---

*Integration audit: 2026-03-18*
