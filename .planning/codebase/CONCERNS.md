# Codebase Concerns

**Analysis Date:** 2026-03-18

## Tech Debt

### Placeholder Image Processing Implementation

**Issue:** Thumbnail generation is not implemented; full-resolution images are served as thumbnails.

**Files:** `backend/src/utils/imageProcessing.ts` (lines 107-114)

**Impact:**
- Full images (potentially 5MB) served where 200px thumbnails expected
- Severe performance degradation for users with slow connections
- Wasted bandwidth and storage costs
- User experience suffers on mobile networks

**Fix approach:** Implement actual thumbnail generation using one of:
1. Cloudflare Images Transform API (recommended - native integration)
2. Sharp via WASM (adds ~200KB+ to bundle)
3. Client-side Canvas API with server fallback
4. External image service (e.g., Imgix, Cloudinary)

**Priority:** High - Blocks production readiness for photo upload feature.

---

### Incomplete Contact Form

**Issue:** Contact form UI is built but backend submission is not implemented.

**Files:** `frontend/src/components/ContactPage.tsx` (line 14, TODO comment)

**Impact:**
- User messages are not sent; users believe contact works but messages disappear
- No feedback mechanism for cafe suggestions or bug reports
- Feature appears functional but silently fails

**Fix approach:**
1. Create `/api/contact` endpoint in backend (POST)
2. Add email sending integration (e.g., Resend, SendGrid, or Cloudflare Mail)
3. Store contact submissions in database (`contact_submissions` table)
4. Update frontend to call API endpoint with success/error feedback

**Priority:** Medium - Feature is visible but disabled; needs implementation before enabling.

---

### Unused/Deprecated Database Tables

**Status (2026-03):** Addressed — migration `0023_drop_social_era_tables.sql` drops social/UGC tables; `backend/drizzle/schema.ts` and cafe search updated; see `docs/SIMPLIFICATION_PLAN.md` §3.2.

**Remaining:** Historical migration files still exist for audit; fresh D1 databases still run the full chain through `0023`.

---

### Web Vitals Analytics Incomplete

**Issue:** Web Vitals data collection is not fully implemented.

**Files:** `frontend/src/utils/webVitals.ts` (line 54, TODO comment)

**Impact:**
- Performance metrics are collected locally but not sent to server
- No way to track real user performance trends across versions
- Can't identify performance regressions in production
- Data collection boilerplate exists but goes nowhere

**Fix approach:**
1. Create `/api/analytics/vitals` endpoint
2. Batch and send Web Vitals data periodically
3. Store in analytics table (or external service)
4. Remove `console.log` entries and implement proper error handling

**Priority:** Low - Feature is non-critical; can be deferred post-launch.

---

## Known Bugs

### Session Expiry Dialog Infinite Loop Risk

**Issue:** In `frontend/src/utils/api.ts` (lines 56-66), auth error handling calls `useSessionExpiry.getState().showSessionExpiredDialog()` which may trigger new API calls if user retries, potentially creating infinite retry loops.

**Symptoms:**
- Multiple "session expired" dialogs appear
- User gets stuck in auth error state if network is flaky
- Exponential retry behavior on poor connections

**Trigger:**
- Slow network causing auth failures
- Token expires mid-request
- Server returning 401/403 intermittently

**Workaround:**
- User can manually refresh page
- Clear cookies and re-login

**Fix approach:**
- Add debouncing to session expiry dialog
- Track whether dialog is already shown to prevent duplicates
- Implement exponential backoff with max retry count

**Priority:** Medium - Edge case but could impact mobile users on poor networks.

---

### Leaflet Icon Prototype Deletion

**Issue:** In `frontend/src/hooks/useLeafletMap.ts` (line 8), the Leaflet Icon default prototype is deleted with `delete (L.Icon.Default.prototype as any)._getIconUrl`.

**Impact:**
- Works around Leaflet's default icon loading issue in test/dev environment
- However, deleting prototype properties is unsafe and could cause runtime errors
- No fallback if Leaflet icon loading fails in production

**Symptoms:**
- Map pins may not render if icon loading fails
- `_getIconUrl` deletion bypasses Leaflet's internal error handling

**Fix approach:**
- Replace prototype deletion with proper Leaflet icon configuration
- Use Leaflet's documented `L.Icon.Default` initialization with explicit URL paths
- Add error boundary for map component to gracefully handle rendering failures

**Priority:** Low - Workaround is in place but not robust.

---

## Security Considerations

### JWT Tokens in localStorage via Zustand Persistence

**Issue:** In `frontend/src/stores/authStore.ts` (lines 174-180), authentication state (including user data) is persisted to localStorage via Zustand's persist middleware.

**Risk:**
- Sensitive user data stored in cleartext in localStorage
- Accessible to XSS attacks (malicious script can read tokens)
- Tokens cannot be invalidated server-side once issued
- No HttpOnly flag possible with localStorage (only cookies)

**Current mitigation:**
- Tokens are set via cookies (line 36: `credentials: 'include'`)
- localStorage only stores `user` object and `isAuthenticated` flag (not the token itself)

**Recommendations:**
1. Move tokens to HttpOnly, Secure, SameSite cookies only (no localStorage)
2. Remove user data from localStorage persistence (fetch on app load instead)
3. Implement token refresh cycle (currently tokens live until expiry)
4. Add Content Security Policy headers to prevent inline scripts

**Files:** `frontend/src/stores/authStore.ts`, `frontend/src/utils/api.ts`, `backend/src/utils/auth.ts`

**Priority:** High - Token security is critical for admin panel.

---

### Missing CORS/Origin Validation

**Issue:** Backend auth endpoints (`backend/src/routes/auth.ts`) do not validate request origin; CORS is not explicitly configured.

**Risk:**
- Cross-site request forgery (CSRF) possible if SameSite cookies not set
- Tokens could be used from different origins
- No protection against malicious form submissions

**Current mitigation:**
- SameSite cookie setting (should be in `backend/src/utils/cookies.ts`)
- Credentials-included requests limit exposure

**Recommendations:**
1. Explicitly configure CORS headers (white-list trusted origins)
2. Verify SameSite=Strict on all auth cookies
3. Add CSRF token validation for state-changing operations
4. Document CORS policy in README

**Files:** `backend/src/routes/auth.ts`, `backend/src/utils/cookies.ts`, `backend/wrangler.toml`

**Priority:** High - CORS/CSRF vulnerabilities affect admin authentication.

---

### Rate Limiting Not Implemented

**Issue:** Auth endpoints (login, register, refresh) have no rate limiting.

**Risk:**
- Brute force attacks on admin login
- Account lockout not possible
- Credential stuffing attacks feasible
- DoS attacks on auth endpoints

**Files:** `backend/src/routes/auth.ts`

**Recommendation:**
1. Implement rate limiting middleware (limit login attempts to 5 per 15 min per IP)
2. Add account lockout after N failed attempts
3. Monitor for suspicious patterns

**Priority:** High - Critical for production admin panel security.

---

### HTML Sanitization via innerHTML

**Issue:** In `frontend/src/utils/sanitize.ts` (line 100), HTML is sanitized by setting `div.innerHTML` which could be unsafe.

**Risk:**
- Only safe if using DOMPurify before setting innerHTML (check usage)
- Fallback pattern if DOMPurify fails

**Current state:**
- DOMPurify is imported; should be used
- Need to verify it's applied before innerHTML

**Files:** `frontend/src/utils/sanitize.ts`, all components displaying user/API data

**Priority:** Medium - Depends on actual usage pattern.

---

## Performance Bottlenecks

### MapView Component Size and Complexity

**Issue:** `frontend/src/components/MapView.tsx` is 1012 lines, one of the largest components.

**Problem:**
- Complex state management with 8+ useState hooks
- Multiple useEffect hooks with potential performance issues
- API call on every mount to fetch events (`useEffect` at line 44)
- Heavy filtering/memoization (lines 75-100)

**Impact:**
- Slow re-renders on map pan/zoom
- Memory leaks if cleanup not proper
- Bundle size inflated for map route

**Improvement path:**
1. Extract filter logic to custom hook (`useMapFilters`)
2. Extract event indicators to separate component
3. Use React.memo for pin components
4. Move events fetch to route/parent level (not MapView)
5. Lazy load map component entirely

**Priority:** Medium - Performance is acceptable but could improve for slow devices.

---

### ListView Component Size

**Issue:** `frontend/src/components/ListView.tsx` is 987 lines.

**Problem:**
- Search, sorting, filtering all in single component
- Re-renders entire list on filter change
- Virtual scrolling not implemented

**Impact:**
- Slow on large cafe lists (100+)
- Janky search/filter experience on older mobile devices

**Improvement path:**
1. Extract search logic to hook
2. Extract cafe card to memoized component
3. Implement virtual scrolling (react-window or custom)
4. Debounce search input

**Priority:** Medium - Currently works but will fail with more cafes.

---

### API Call Cache Busting

**Issue:** In `frontend/src/utils/api.ts` (lines 37-41), cache busting is done with timestamp query params.

**Problem:**
- Every API call has `?_={timestamp}` added (when bustCache=true)
- Defeats browser HTTP caching
- Creates unnecessary cache misses

**Impact:**
- Increased bandwidth usage
- No benefit over proper HTTP cache headers

**Fix approach:**
- Remove cache-busting strategy
- Rely on proper HTTP cache headers (Cache-Control, ETag)
- Or use service workers for intelligent caching

**Priority:** Low - Not critical but wasteful.

---

## Fragile Areas

### Admin Authentication and Authorization

**Files:** `frontend/src/stores/authStore.ts`, `backend/src/routes/auth.ts`, `backend/src/middleware/auth.ts`

**Why fragile:**
- No explicit admin role verification on most endpoints
- Register endpoint creates users as regular users (line 69), but no clear audit trail
- Session management relies on cookies without explicit validation
- Token refresh can be called by anyone (no rate limiting)

**Safe modification:**
- Always verify `role === 'admin'` before sensitive operations
- Audit all admin routes (especially imports, exports)
- Use middleware to enforce auth checks

**Test coverage:**
- Auth middleware tests needed (verify unauthorized requests rejected)
- Role verification tests for each admin endpoint

**Priority:** High - Admin functionality is critical.

---

### Event Indicators on Map

**Issue:** In `MapView.tsx` (lines 44-60), events for all cafes are fetched on every MapView mount.

**Why fragile:**
- No caching; same API call on every navigate to map
- No error handling (swallows errors silently)
- State not synced with global data store

**Safe modification:**
- Move events fetch to parent (AppRoutes or App.tsx)
- Cache events in Zustand dataStore (use lazy-loading pattern)
- Add error handling with fallback UI

**Priority:** Medium - Works but inefficient.

---

### Contact Form Submission

**Files:** `frontend/src/components/ContactPage.tsx`, no backend

**Why fragile:**
- Form just logs to console; no actual submission
- If backend endpoint added without frontend update, feature silently breaks
- No error handling for failed submission

**Safe modification:**
- Create backend endpoint before enabling contact form
- Add API integration with proper error handling
- Show success/error messages to user
- Add test coverage for API integration

**Priority:** Medium - Feature appears functional but is non-functional.

---

## Scaling Limits

### Database Schema Not Optimized for Scale

**Issue:** No composite indexes on frequently-filtered columns (city + score, cafe + published, etc.)

**Current capacity:**
- Works fine with <1000 cafes
- Single-city scope (Toronto)

**Limit:**
- Multi-city with 10,000+ cafes will require index optimization
- Query performance degrades without proper indexes

**Scaling path:**
1. Add composite indexes: `CREATE INDEX cafes_city_score_idx ON cafes(city, display_score)`
2. Analyze slow queries with EXPLAIN PLAN
3. Consider pagination offset limits (1000 max offset inefficient)

**Priority:** Low - Not immediate concern for current scale.

---

### Leaflet Map Performance

**Issue:** Leaflet loads entire map library (~43KB gzipped) even for static UI.

**Current capacity:**
- Fine for Toronto (500 pins)
- Will slow down with multi-city (5000+ pins)

**Limit:**
- Renders all markers even if off-screen
- No clustering implemented

**Scaling path:**
1. Implement Leaflet.markercluster for 1000+ markers
2. Lazy-load map component (already done)
3. Virtual rendering for large datasets

**Priority:** Low - Can address when expanding to multiple cities.

---

## Dependencies at Risk

### Zustand Storage Persistence

**Risk:** localStorage-based persistence in Zustand stores may cause data inconsistencies if multiple browser tabs open simultaneously.

**Impact:**
- User data out of sync across tabs
- Last-write-wins behavior could lose user selections
- Visited cafes cache could conflict

**Files:** Multiple stores (`locationStore.ts`, `visitedCafesStore.ts`, `cityStore.ts`, `authStore.ts`)

**Migration plan:**
- Move to sessionStorage for tab-specific data
- Use server-side session state for critical data
- Add tab sync mechanism (broadcast channel API)

**Priority:** Low - Edge case; most users have single tab open.

---

### Drizzle ORM Schema Drift

**Risk:** Schema exports are auto-generated from migrations; if migrations conflict or are manually edited, schema can drift from migrations.

**Current state:**
- 22 migration files with some having duplicate numbers (e.g., multiple `0018_*` files)
- No validation that schema matches latest migration

**Impact:**
- Type-safety broken if schema doesn't match database
- Silent data loss if migrations applied partially

**Migration plan:**
1. Clean up duplicate migration filenames
2. Add pre-deploy schema validation
3. Run `drizzle-kit check` in CI

**Priority:** Medium - Could cause deployment issues.

---

## Missing Critical Features

### No Monitoring/Alerting

**Problem:** No error tracking, logging, or performance monitoring in production.

**Files:** No centralized error handler; console.error used throughout.

**Blocks:**
- Can't detect production bugs until users report
- No alerting for API failures
- No performance trend tracking

**Solution:**
- Integrate Sentry or similar error tracking
- Setup Cloudflare Analytics for Web Vitals
- Add structured logging to backend

**Priority:** Medium - Should be implemented before public launch.

---

### No Backup/Disaster Recovery Plan

**Problem:** D1 database has no documented backup strategy.

**Files:** None (not documented)

**Risk:**
- Data loss if D1 fails
- No rollback mechanism
- No recovery time objective (RTO)

**Solution:**
- Document D1 backup schedule in deployment guide
- Test recovery procedure
- Consider read replicas or replication

**Priority:** High for production - Low for current MVP.

---

## Test Coverage Gaps

### Admin Authentication Not Fully Tested

**What's not tested:**
- Invalid token handling in admin panel
- Session expiry during admin operations
- Unauthorized user accessing admin routes

**Files:** `frontend/src/stores/__tests__/authStore.test.ts` (596 lines, good coverage), but integration tests missing

**Risk:**
- Admin panel could break unexpectedly
- Security vulnerabilities not caught

**Priority:** Medium - Add integration tests for auth flows.

---

### API Error Handling Not Comprehensive

**What's not tested:**
- Network timeouts
- 5xx errors from backend
- Malformed JSON responses

**Files:** `frontend/src/utils/api.ts` has basic error handling but no exhaustive tests

**Risk:**
- App crashes on unexpected API errors
- Silent failures with no user feedback

**Priority:** Medium - Add error scenario tests.

---

### Contact Form Integration Not Tested

**What's not tested:**
- Contact form submission (no backend)
- Error messages

**Files:** `frontend/src/components/ContactPage.tsx` has no test file

**Risk:**
- Form could break without being noticed
- Submission endpoint not validated when added

**Priority:** Low - Feature not live.

---

## Architecture/Design Concerns

### Feature Flags Not Used for Deprecated Features

**Issue:** Many deprecated tables and routes exist in code but aren't gated by feature flags.

**Examples:**
- Social features (reviews, comments, badges) not behind flags
- User accounts backend exists but frontend disabled via flags
- Database migrations for out-of-scope features applied to all environments

**Impact:**
- Code/schema bloat makes it hard to understand "real" product
- Risk of accidentally enabling deprecated features
- Maintenance burden

**Recommendation:**
- Create feature flag for each deprecated feature
- Conditionally skip deprecated migrations in new environments
- Document which flags must be off for production

**Priority:** Medium - Cleanup task for simplified foundation.

---

## Security Audit Gaps

### Content Security Policy (CSP) Not Configured

**Files:** No CSP headers configured in Cloudflare Pages or Workers

**Risk:**
- Vulnerable to XSS attacks
- No protection against unsafe inline scripts

**Recommendation:**
1. Add CSP header in `wrangler.toml` or Cloudflare Pages dashboard
2. Start with `default-src 'self'`
3. Allow Leaflet CDN, Google Maps API, Instagram API
4. Test with browser CSP violations

**Priority:** High - Should be baseline for any web app.

---

### No HSTS or Security Headers

**Files:** No Strict-Transport-Security, X-Content-Type-Options, etc. configured

**Risk:**
- Man-in-the-middle attacks possible
- Browsers may not enforce HTTPS

**Recommendation:**
1. Add `Strict-Transport-Security: max-age=31536000`
2. Add `X-Content-Type-Options: nosniff`
3. Add `X-Frame-Options: DENY`
4. Configure in Cloudflare Pages rules or Workers middleware

**Priority:** High - Standard security hygiene.

---

---

*Concerns audit: 2026-03-18*
*Product phase: Simplified foundation (Phase 1 & 2 consolidation)*
*Total tech debt items: 28 issues identified*
*Critical priority: 7 items (security, admin auth, image processing)*
*High priority: 8 items (performance, database cleanup, rate limiting)*
*Medium priority: 11 items (feature completeness, optimization)*
*Low priority: 2 items (deferred improvements)*
