# MatchaMap Technical Specifications

**Version:** 2.0
**Date:** October 10, 2025
**Status:** Updated for Full Stack Architecture

> **📌 Authoritative Source:**
> This document is the **single source of truth** for database schema and API endpoint specifications.
> All other documents reference this file to avoid duplication.
> For guidance on using patterns, see `../CLAUDE.md`.

## System Architecture

### Overview

MatchaMap is a full-stack React application with Cloudflare edge infrastructure, optimized for mobile-first performance and global low-latency.

```
┌─────────────────────────────────────┐
│           Frontend (SPA)            │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │  React  │ │Tailwind │ │  Vite  │ │
│  │  18.3+  │ │  CSS    │ │  Build │ │
│  └─────────┘ └─────────┘ └────────┘ │
└─────────────────────────────────────┘
              ↕ REST API
┌─────────────────────────────────────┐
│         Backend (Edge API)          │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │ Workers │ │itty-    │ │Drizzle │ │
│  │   API   │ │router   │ │  ORM   │ │
│  └─────────┘ └─────────┘ └────────┘ │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│          Data Layer (Edge)          │
│  ┌─────────┐ ┌─────────┐           │
│  │    D1   │ │   R2    │           │
│  │ SQLite  │ │ Storage │           │
│  └─────────┘ └─────────┘           │
└─────────────────────────────────────┘
```

## Technical Stack

### Frontend

-   **Framework**: React 18.3+
-   **Build Tool**: Vite 5.x
-   **Routing**: React Router 6.x
-   **State**: Zustand (lightweight global state)
-   **Styling**: Tailwind CSS 3.x
-   **Maps**: Leaflet 1.9.x
-   **Language**: TypeScript (strict mode)

### Backend

-   **Runtime**: Cloudflare Workers
-   **Router**: itty-router (~450 bytes)
-   **ORM**: Drizzle ORM
-   **Migrations**: Drizzle Kit
-   **Language**: TypeScript

### Data

-   **Database**: Cloudflare D1 (SQLite)
-   **Storage**: Cloudflare R2 (S3-compatible)
-   **Cache**: HTTP Cache-Control headers

### Hosting

-   **Frontend**: Cloudflare Pages
-   **Backend**: Cloudflare Workers
-   **CDN**: Cloudflare global network
-   **Auth**: Cloudflare Access

## Database Schema

### Core Tables

```sql
CREATE TABLE cafes (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,

    -- Location
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    neighborhood_id INTEGER REFERENCES neighborhoods(id),

    -- Content
    score REAL NOT NULL,
    review TEXT,
    quick_note TEXT,

    -- Contact
    instagram TEXT,
    tiktok TEXT,
    google_maps_url TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE feed_items (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK(type IN ('cafe_added', 'score_update', 'announcement')),
    related_cafe_id INTEGER REFERENCES cafes(id),
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    location TEXT,
    related_cafe_id INTEGER REFERENCES cafes(id)
);

CREATE TABLE cafe_stats (
    cafe_id INTEGER PRIMARY KEY REFERENCES cafes(id),
    views INTEGER DEFAULT 0,
    directions_clicks INTEGER DEFAULT 0,
    passport_marks INTEGER DEFAULT 0,
    instagram_clicks INTEGER DEFAULT 0,
    tiktok_clicks INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

See [backend-prd.md](./backend-prd.md) for full schema.

## API Architecture

### Endpoints

```
Public API:
GET  /api/cafes              # List all cafes
GET  /api/cafes/:id          # Get single cafe
GET  /api/feed               # News feed
GET  /api/events             # Upcoming events

Admin API (Cloudflare Access protected):
POST   /api/admin/cafes      # Create cafe
PUT    /api/admin/cafes/:id  # Update cafe
DELETE /api/admin/cafes/:id  # Soft delete cafe
GET    /api/admin/cafe-stats # Analytics dashboard

Analytics API (fire-and-forget):
POST /api/stats/cafe/:id/:stat   # Track cafe metric
POST /api/stats/feed/:id         # Track feed click
POST /api/stats/event/:id        # Track event click
```

### Response Format

```json
{
  "data": { /* ... */ },
  "error": null
}

// Error response
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Cafe not found"
  }
}
```

## Component Architecture

### React Component Strategy

```
src/
├── components/
│   ├── Header.tsx              # Top navigation
│   ├── BottomNavigation.tsx    # Mobile tab bar
│   ├── MapView.tsx             # Leaflet map
│   ├── ListView.tsx            # Cafe list with filters
│   ├── DetailView.tsx          # Cafe detail page
│   └── __tests__/              # Component tests
├── hooks/
│   ├── useGeolocation.ts       # Browser geolocation
│   ├── useCafeSelection.ts     # Cafe selection logic
│   ├── useDistanceCalculation.ts
│   └── useVisitedCafes.ts      # Passport wrapper
├── stores/
│   ├── locationStore.ts        # User location (Zustand)
│   ├── uiStore.ts              # UI state
│   └── cityStore.ts            # Multi-city support
├── utils/
│   ├── distanceCalculator.ts   # Haversine formula
│   ├── mapsUrl.ts              # Platform-specific maps
│   └── analytics.ts            # Tracking utilities
└── types/
    └── index.ts                # TypeScript definitions
```

### State Management

**Zustand Stores** (global state):

-   Location data (user coordinates)
-   UI state (modals, panels)
-   City selection
-   Visited cafes (persisted to localStorage)

**Local State** (useState/useReducer):

-   Component-specific interactions
-   Form inputs
-   Temporary UI state

## Performance Specifications

### Bundle Size Targets

```
Frontend:
- Initial JS: < 50KB gzipped
- CSS: < 20KB gzipped (Tailwind purged)
- Map page: + 45KB (Leaflet)
- Total (map page): < 115KB

Backend:
- Worker bundle: < 100KB
- Cold start: < 10ms
- Response time: < 50ms global avg
```

### Core Web Vitals Targets

```
LCP (Largest Contentful Paint): < 2.5s
FID (First Input Delay): < 100ms
CLS (Cumulative Layout Shift): < 0.1
```

### Optimization Strategies

**Frontend:**

-   Code splitting by route
-   Lazy loading for map/heavy components
-   Image optimization (WebP, proper sizing)
-   Tailwind CSS purging
-   Aggressive caching (1 year for assets)

**Backend:**

-   Prepared SQL statements
-   Database query optimization
-   HTTP caching headers
-   Edge caching (Cloudflare CDN)

## Mobile-First Design

### Breakpoints

```css
/* Base: 320px-640px (mobile) */
.container {
    /* mobile styles */
}

/* sm: 640px+ (tablet) */
@media (min-width: 640px) {
}

/* md: 768px+ (small desktop) */
@media (min-width: 768px) {
}

/* lg: 1024px+ (desktop) */
@media (min-width: 1024px) {
}
```

### Touch Interface

-   **Min touch target**: 44px × 44px
-   **Gestures**: Tap, scroll, pinch (map only)
-   **No hover dependencies**: All interactions work on touch
-   **Active states**: Visual feedback on all interactions

### Responsive Patterns

```
Navigation:
- Mobile: Bottom tab bar (fixed)
- Desktop: Top horizontal nav

Layout:
- Mobile: Single column, full width
- Tablet: Grid with 2 columns
- Desktop: Grid with 3 columns + sidebar

Map:
- Mobile: Full viewport
- Desktop: Split view (map + sidebar)
```

## Maps Implementation

### Leaflet Configuration

```typescript
const map = L.map("map", {
    center: [43.6532, -79.3832], // Toronto
    zoom: 12,
    zoomControl: false,
    scrollWheelZoom: true,
    touchZoom: true,
    doubleClickZoom: true,
    boxZoom: false, // Disabled on mobile
});

// OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap contributors",
}).addTo(map);
```

### Custom Markers

```typescript
// Matcha-themed pin
const matchaIcon = L.divIcon({
    className: "custom-marker",
    html: `<div class="w-8 h-8 bg-matcha-500 rounded-full...">
    <div class="w-3 h-3 bg-white rounded-full"></div>
  </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});
```

### Geolocation

```typescript
// Platform-specific handling
const options = getOptimalGeolocationOptions();

navigator.geolocation.getCurrentPosition(
    (position) => {
        const { latitude, longitude } = position.coords;
        // Update map center, calculate distances
    },
    (error) => {
        // Graceful fallback to city center
    },
    options
);
```

## Security

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' unpkg.com;
style-src 'self' 'unsafe-inline' unpkg.com;
img-src 'self' data: https:;
connect-src 'self' https:;
```

### Admin Authentication

```
Cloudflare Access protects /admin/* routes
- Email-based authentication
- No custom auth code needed
- Google/GitHub SSO integration
```

### Data Validation

```typescript
// Zod schema validation (backend)
const CafeSchema = z.object({
    name: z.string().min(1).max(100),
    lat: z.number().min(43.0).max(44.0),
    lng: z.number().min(-80.0).max(-79.0),
    score: z.number().min(0).max(10),
    // ...
});
```

## Monitoring & Analytics

### Cloudflare Analytics

```
Frontend (Pages):
- Page views
- Unique visitors
- Core Web Vitals
- Geographic distribution

Backend (Workers):
- Request count
- Error rate
- CPU time
- Response time
```

### Custom Analytics

```typescript
// Frontend tracking
trackCafeStat(cafeId, "view");
trackCafeStat(cafeId, "directions");
trackFeedClick(feedItemId);

// Backend: Simple counter increments
// See metrics-tracking-prd.md
```

## Build Process

### Development

```bash
# Frontend
npm run dev         # Vite dev server (http://localhost:3000)

# Backend
cd workers && npm run dev  # Wrangler dev (http://localhost:8787)

# Full stack
npm run dev:all     # Run both concurrently
```

### Production

```bash
# Frontend
npm run build       # Vite build → dist/
npm run preview     # Test production build

# Backend
cd workers && npm run build   # TypeScript → JS
cd workers && npm run deploy  # Deploy to Cloudflare

# Deployment
git push origin main  # Auto-deploys frontend via Cloudflare Pages
```

## Browser Support

### Primary (testing required)

-   **iOS Safari 14+** (primary mobile target)
-   **Chrome Mobile** (latest 2 versions)

### Secondary (best effort)

-   Chrome Desktop (latest)
-   Safari Desktop (latest)
-   Firefox Desktop (latest)

### Polyfills

None required (ES2020+ baseline)

## Cost Structure

### Free Tier (Current)

```
Cloudflare Pages:
- 500 builds/month
- Unlimited bandwidth
- Cost: $0/month

Cloudflare Workers:
- 100K requests/day
- 10ms CPU time/request
- Cost: $0/month

D1 Database:
- 5GB storage
- 5M reads/day
- Cost: $0/month

Total: $0/month for 100K+ requests/day
```

### Paid Tier (if needed)

```
Workers Paid ($5/month):
- 10M requests/month
- 50ms CPU time/request

When to upgrade:
- Exceeding 100K requests/day
- Need more CPU time
```

## Development Workflow

### Local Setup

```bash
# Clone repo
git clone <repo-url>
cd matchamap

# Install frontend deps
npm install

# Install backend deps
cd workers && npm install

# Setup environment
cp .env.example .env
```

### Testing

```bash
# Type checking
npm run typecheck

# Build test
npm run build

# Mobile testing
npm run dev -- --host
# Access from mobile device on same network
```

### Deployment

```bash
# Frontend (automatic)
git push origin main

# Backend (manual until CI/CD)
cd workers && npm run deploy
```

## Future Considerations

### Scalability

```
Database:
- Current: D1 (5GB free)
- When to migrate: > 3GB or slow queries
- Migration path: D1 → PostgreSQL (via Drizzle)

Search:
- Current: Client-side filtering
- When to add: > 200 cafes
- Options: Algolia, MeiliSearch, Postgres FTS

CDN:
- Current: Cloudflare global network
- Future: R2 for images, KV for cache
```

### Features (V2+)

-   User accounts (Cloudflare Access)
-   User-submitted reviews
-   Advanced search
-   Multi-city expansion
-   Mobile app (React Native)

---

**Technical Specifications Version:** 2.0
**Last Updated:** October 1, 2025
**Status:** Full Stack Architecture
**Stack:** React + Cloudflare Workers + D1
