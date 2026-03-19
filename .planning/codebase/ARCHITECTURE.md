# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** Full-stack monorepo with decoupled frontend (React SPA) and backend (Cloudflare Workers) communicating via REST API.

**Key Characteristics:**
- Frontend-driven architecture: React 19 handles all UI/routing; backend is purely API provider
- Monorepo structure with 3 workspaces: `frontend`, `backend`, `shared`
- Zustand-based state management for frontend caching and persistence
- Serverless backend (Cloudflare Workers + D1 SQLite)
- Type-safe API contract via shared TypeScript types in `shared/types/`
- Feature flag system for gradual rollouts and A/B testing

## Layers

**Frontend (React SPA):**
- Purpose: Curated guide UI, map navigation, admin panel, authentication
- Location: `frontend/src/`
- Contains: Components, hooks, stores, utilities, styles
- Depends on: Backend API, Leaflet (maps), React Router
- Used by: Web browsers via Cloudflare Pages

**API Layer (REST via Cloudflare Workers):**
- Purpose: Route requests, enforce auth, interact with database
- Location: `backend/src/routes/`, `backend/src/middleware/`
- Contains: Route handlers, auth middleware, rate limiting, validation
- Depends on: D1 database, Drizzle ORM, JWT tokens
- Used by: Frontend application, external integrations

**Data Layer (SQLite D1):**
- Purpose: Persistent storage for cafes, drinks, events, users
- Location: `backend/drizzle/schema.ts`
- Contains: Tables, indexes, migrations
- Depends on: Cloudflare D1
- Used by: Backend routes via Drizzle ORM

**Shared Types:**
- Purpose: Single source of truth for API contracts
- Location: `shared/types/index.ts`
- Contains: Interfaces for Cafe, Drink, Event, User, CityKey, etc.
- Depends on: Nothing (pure TS types)
- Used by: Both frontend and backend for type safety

## Data Flow

**Read Flow (Public Content):**

1. User navigates to map view
2. Frontend calls `api.cafes.getAll()` → `GET /api/cafes`
3. Backend `listCafes` route queries D1 via Drizzle ORM
4. Results returned with distance/scoring calculated (if needed)
5. Frontend stores cafes in `useDataStore` with `cafesFetched` flag
6. Zustand cache prevents refetch on route navigation back
7. Components receive data via `useCafeStore` (distance-sorted copy) or direct prop passing

**Write Flow (Admin Only):**

1. Admin submits cafe form in `CafeManagementPage`
2. Frontend validates locally, calls `api.cafes.update(id, data)`
3. Request includes JWT auth token in cookies
4. Backend `updateCafe` middleware checks:
   - `requireAdminAuth()` validates JWT and `admin` role
   - `writeRateLimit()` enforces rate limits
5. Route handler validates input, updates D1
6. Returns updated cafe; frontend updates `adminStore`
7. `cafesFetched` flag reset to trigger public data refresh

**Authentication Flow:**

1. Admin navigates to `/login`, enters credentials
2. Frontend posts to `POST /api/auth/login` (via `authStore`)
3. Backend validates email/password, signs JWT (secret in env)
4. Response includes JWT in HttpOnly cookie + user object
5. Frontend stores user in `useAuthStore` (persisted)
6. Future requests automatically include cookie (credentials: 'include')
7. `getCurrentUser()` on app load restores session from cookie
8. 401/403 responses trigger `SessionExpiredDialog` and clear auth

**State Management:**

- **Global State (Zustand Stores):** `dataStore`, `authStore`, `locationStore`, `cityStore`, `uiStore`, `visitedCafesStore`
  - Persist middleware: `authStore` persists user; `visitedCafesStore` persists to localStorage
  - Used when state is shared across 3+ components or needs to survive refresh
- **Component Local State:** useState for UI toggles, form inputs, loading states
- **Derived/Computed State:** `useCafeStore` calculates distances from user location on demand
- **Feature Flags:** `useFeatureToggle()` reads from `features.yaml` at build time

## Key Abstractions

**API Client (`frontend/src/utils/api.ts`):**
- Purpose: Centralize all HTTP communication, handle auth, inject JWT tokens
- Examples: `api.cafes.getAll()`, `api.events.getAll()`, `api.admin.stats`
- Pattern: Modular endpoints grouped by resource (cafes, drinks, events, admin, auth, etc.)
- Error handling: 401/403 clears auth + shows dialog; other errors thrown to caller

**Zustand Store Pattern:**
- Purpose: Global state with optional persistence
- Examples: `useDataStore`, `useAuthStore`, `useVisitedCafesStore`
- Pattern: `create<Interface>((set, get) => ({ initialState, actions }))`
- Persist middleware: `persist(store, { name: 'key' })` → localStorage
- Cache flags: `cafesFetched`, `eventsFetched` prevent API refetches

**Custom Hooks (Reusable Logic):**
- Purpose: Encapsulate complex component logic, side effects, data fetching
- Examples: `useLazyData()`, `useGeolocation()`, `useLeafletMap()`, `useCafeSelection()`
- Pattern: Return objects, not arrays; one concern per hook
- No React dependencies in hook names — implied in 'use' prefix

**UI Component Library (`frontend/src/components/ui/`):**
- Purpose: Consistent, accessible, performant UI elements
- Examples: `PrimaryButton`, `ScoreBadge`, `AlertDialog`, `Skeleton`
- Pattern: Reusable, styled with Tailwind CSS, enforce 44px touch targets
- No inline styles in app — only use these components

**Shared Types (`shared/types/index.ts`):**
- Purpose: Single source of truth for API contracts
- Examples: `Cafe`, `Drink`, `Event`, `User`, `CityKey`
- Pattern: Frontend imports from shared, backend imports from shared
- New API endpoints require type definitions before implementation

## Entry Points

**Frontend SPA:**
- Location: `frontend/src/main.tsx`
- Triggers: Page load in browser
- Responsibilities: Mounts React app to DOM, initializes performance monitoring, wraps app with Router + feature flag provider

**App Root Component:**
- Location: `frontend/src/App.tsx`
- Triggers: After React mounts
- Responsibilities: Restores auth session, checks feature flags, renders Header/Routes/Navigation, shows SessionExpiredDialog

**Route Management:**
- Location: `frontend/src/components/AppRoutes.tsx`
- Triggers: Browser navigation (React Router)
- Responsibilities: Lazy-loads route components, handles URL params (cafe slug, city), shows loading skeletons, fetches cafe/event data on first load

**Backend API Server:**
- Location: `backend/src/index.ts`
- Triggers: Cloudflare Workers runtime receives HTTP request
- Responsibilities: Validates environment, defines routes, applies middleware, delegates to route handlers

**Middleware Chain:**
- Location: `backend/src/middleware/`
- Triggers: Request enters router
- Order: HTTPS enforcement → CORS preflight → Rate limiting → Auth check → Route handler
- Pattern: Each middleware can short-circuit with Response

## Error Handling

**Strategy:** Fail-safe defaults, user-facing dialogs for critical errors, console logs for debugging.

**Patterns:**

**Frontend:**
- API errors (4xx/5xx): Catch in component, show `AlertDialog` with user-friendly message
- 401/403: Special handling — clear auth, show session expiry dialog with redirect
- Network errors: Catch in try/catch, log to console, show retry button in UI
- Loading states: Show `Skeleton` components while fetching
- Validation errors: Show inline form errors next to input fields

**Backend:**
- Invalid input: Return `badRequestResponse()` with specific error message
- Auth failures: Return `jsonResponse({ error: 'Unauthorized' }, 401)`
- Not found: Return `notFoundResponse()` with 404 status
- Server errors: Log to console/Wrangler tail, return generic 500 message (don't expose internals)
- Database errors: Catch and return 500; secrets/connection strings never in response

**Cross-Cutting Concerns:**

**Logging:**
- Frontend: `console.error()` for debugging, never user secrets
- Backend: Wrangler console (view with `wrangler tail`), audit log for admin actions

**Validation:**
- Frontend: Client-side form validation via `validateEmail()`, `validateCafe()` etc. in `utils/validation.ts`
- Backend: Input sanitization in each route handler (e.g., `sanitizeSearchQuery()` in cafes.ts)
- Shared: TypeScript strict mode catches type mismatches before runtime

**Authentication:**
- Frontend: JWT stored in HttpOnly cookie (set by backend)
- Backend: `requireAuth()` middleware validates JWT signature + expiry
- Session: `getCurrentUser()` checks cookie; refresh token extends session
- Admin: Additional `requireAdminAuth()` checks user.role === 'admin'

**Security:**
- HTTPS enforced in prod (middleware `requireHTTPS()`)
- CORS restricted to Cloudflare Pages domain
- SQL injection prevented via Drizzle ORM parameterized queries
- XSS prevented via DOMPurify sanitization
- Rate limiting per IP: auth endpoints 30/min, public 100/min, write 20/min
- Content Security Policy headers set in backend responses

---

*Architecture analysis: 2026-03-18*
