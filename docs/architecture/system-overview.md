# System Architecture Overview

**Last Updated:** 2025-11-02

This document provides a high-level overview of the MatchaMap system architecture.

---

## Table of Contents

- [Architecture Diagram](#architecture-diagram)
- [Technology Stack](#technology-stack)
- [System Components](#system-components)
- [Data Flow](#data-flow)
- [Deployment Architecture](#deployment-architecture)
- [Scalability Considerations](#scalability-considerations)
- [Performance Targets](#performance-targets)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           End Users (Mobile/Desktop)                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        Cloudflare Global CDN                            │
│  - DDoS Protection                                                      │
│  - TLS Termination                                                      │
│  - Edge Caching                                                         │
│  - Brotli/Gzip Compression                                              │
└──────────────┬───────────────────────────────────┬──────────────────────┘
               │                                   │
               │ Static Assets                     │ API Requests
               ↓                                   ↓
┌──────────────────────────────┐   ┌──────────────────────────────────────┐
│   Cloudflare Pages           │   │   Cloudflare Workers (Backend)       │
│   (Frontend - React SPA)     │   │   - Serverless Functions             │
│                              │   │   - Edge Computing                   │
│   - React 19                 │   │   - Itty Router                      │
│   - Vite Build               │   │   - TypeScript                       │
│   - Zustand State            │   └───────────────┬──────────────────────┘
│   - Tailwind CSS             │                   │
│   - Leaflet Maps             │                   │
│   - Bundle: ~80KB gzipped    │                   │
└──────────────────────────────┘                   │
                                                   ↓
                              ┌────────────────────────────────────────────┐
                              │        Cloudflare D1 Database              │
                              │        (SQLite at the Edge)                │
                              │                                            │
                              │  - 15 tables (users, cafes, reviews, etc.) │
                              │  - Drizzle ORM                             │
                              │  - Automatic replication                   │
                              │  - Low-latency reads                       │
                              └────────────────────────────────────────────┘
                                                   │
                                                   │
                              ┌────────────────────────────────────────────┐
                              │        Cloudflare R2 Storage               │
                              │        (S3-Compatible Object Storage)      │
                              │                                            │
                              │  - User-uploaded photos                    │
                              │  - Photo thumbnails                        │
                              │  - Custom domain: photos.matchamap.app     │
                              └────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 19.0 |
| **Vite** | Build Tool | 5.0 |
| **TypeScript** | Type Safety | Latest (strict mode) |
| **Zustand** | State Management | 5.0 |
| **Tailwind CSS** | Styling | Latest |
| **Leaflet** | Interactive Maps | Latest |
| **React Router** | Client-side Routing | v6 |
| **Vitest** | Testing Framework | Latest |

**Bundle Size:** ~80KB gzipped total per page

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Cloudflare Workers** | Serverless Runtime | Latest |
| **Itty Router** | HTTP Routing | Latest |
| **TypeScript** | Type Safety | Latest (strict mode) |
| **Drizzle ORM** | Database ORM | Latest |
| **Zod** | Schema Validation | Latest |
| **Bcrypt** | Password Hashing | Latest |
| **Jose** | JWT Handling | Latest |

### Infrastructure

| Service | Purpose | Plan |
|---------|---------|------|
| **Cloudflare Pages** | Frontend Hosting | Pro |
| **Cloudflare Workers** | Backend API | Paid |
| **Cloudflare D1** | SQL Database | Paid |
| **Cloudflare R2** | Object Storage | Paid |
| **GitHub Actions** | CI/CD | Free |

---

## System Components

### 1. Frontend (React SPA)

**Location:** `frontend/`

**Responsibilities:**
- Render UI components
- Handle user interactions
- Manage client-side routing
- Maintain application state
- Cache data in localStorage (Passport, visited cafes)
- Make API requests to backend

**Key Files:**
- `src/App.tsx` - Root component
- `src/stores/` - Zustand state stores
- `src/components/` - React components
- `src/utils/api.ts` - Centralized API client
- `src/constants/copy.ts` - All user-facing strings

**Performance Optimizations:**
- Code splitting (lazy loading routes)
- Tree-shakeable icon library
- Manual chunk splitting (vendor, maps, router)
- Brotli/Gzip compression
- Image lazy loading
- Memoization (React.memo, useMemo, useCallback)

---

### 2. Backend API (Cloudflare Workers)

**Location:** `backend/`

**Responsibilities:**
- Handle API requests
- Authenticate users (JWT)
- Validate input data (Zod schemas)
- Execute business logic
- Query database (Drizzle ORM)
- Upload/retrieve photos (R2)
- Log admin actions (audit log)

**Key Files:**
- `src/index.ts` - Entry point, router setup
- `src/routes/` - Route handlers
- `src/middleware/` - Auth middleware
- `src/utils/` - Utilities (auth, response, cookies)
- `src/validators/` - Zod schemas

**API Architecture:**
- RESTful endpoints
- JSON request/response
- HTTP-only cookie authentication
- Centralized error handling
- Input validation with Zod
- Audit logging for admin actions

---

### 3. Database (Cloudflare D1)

**Location:** `backend/drizzle/`

**Schema:**
- 15 tables total
- Core: `cafes`, `drinks`, `events`
- Users: `users`, `user_profiles`, `sessions`
- UGC: `user_reviews`, `review_photos`, `review_comments`
- Activity: `user_checkins`, `user_favorites`, `user_badges`
- Social: `user_follows`
- Admin: `admin_audit_log`, `waitlist`

**ORM:** Drizzle
- Type-safe queries
- Schema-first design
- SQL migrations
- SQLite dialect

**See:** [Database Schema Reference](../api/database-schema.md)

---

### 4. Object Storage (Cloudflare R2)

**Purpose:** User-uploaded photos

**Buckets:**
- `matchamap-photos` (production)
- `matchamap-photos-dev` (development)

**Structure:**
```
/reviews/
  ├── abc123.jpg          (original photo)
  ├── abc123_thumb.jpg    (thumbnail - 200px)
/avatars/                 (future)
```

**Access:**
- Custom domain: `photos.matchamap.app`
- Public read access for approved photos
- Signed URLs for moderation (future)

**See:** [Photo Upload Flow](photo-upload-flow.md)

---

## Data Flow

### 1. Page Load Flow

```
User opens matchamap.app
    ↓
Cloudflare CDN serves index.html
    ↓
Browser loads JS bundle (~80KB)
    ↓
React app initializes
    ↓
Check localStorage for visited cafes
    ↓
Fetch cafes from API: GET /api/cafes
    ↓
Cloudflare Worker queries D1
    ↓
Return cafes with drinks
    ↓
Frontend renders map + list
```

### 2. User Authentication Flow

```
User submits login form
    ↓
POST /api/auth/login {email, password}
    ↓
Worker queries users table
    ↓
Verify password (bcrypt)
    ↓
Generate JWT access token (15min)
    ↓
Generate refresh token (7 days)
    ↓
Store session in D1
    ↓
Set HTTP-only cookies
    ↓
Return user object
    ↓
Frontend updates auth state
```

### 3. Photo Upload Flow

```
User selects photo file
    ↓
POST /api/photos/upload (multipart/form-data)
    ↓
Worker validates file (size, type, dimensions)
    ↓
Generate unique key: reviews/abc123.jpg
    ↓
Upload to R2 bucket
    ↓
Generate thumbnail (future: image resize)
    ↓
Store metadata in review_photos table
    ↓
Return photo URLs
    ↓
Frontend displays photo
```

---

## Deployment Architecture

### Frontend Deployment (Cloudflare Pages)

```
Developer commits to main branch
    ↓
GitHub Actions triggers
    ↓
Run tests: npm test (969 tests)
    ↓
Run build: npm run build
    ↓
Cloudflare Pages auto-deploys
    ↓
Assets cached at edge locations globally
    ↓
Available at: https://matchamap.app
```

**Build Output:**
- `dist/` directory
- Pre-compressed (Brotli + Gzip)
- Immutable assets with cache busting
- Service worker for offline support (future)

---

### Backend Deployment (Cloudflare Workers)

```
Developer runs: cd backend && npm run deploy
    ↓
Wrangler builds TypeScript
    ↓
Bundles dependencies
    ↓
Uploads to Cloudflare Workers
    ↓
Binds to D1 database
    ↓
Binds to R2 bucket
    ↓
Available at: https://api.matchamap.app
```

**Environment:**
- Production: Deployed to production D1 + R2
- Development: Local D1 + local R2 (wrangler dev)

---

### Database Migrations

```
Developer creates migration
    ↓
cd backend && npm run db:generate
    ↓
Drizzle generates SQL migration
    ↓
Review migration file
    ↓
Apply to production: npm run db:migrate:prod
    ↓
Schema updated in D1
```

---

## Scalability Considerations

### Current Architecture (V2)

- **Users:** Up to 10,000 DAU
- **Requests:** ~100K requests/day
- **Database:** Single D1 instance (auto-replicated)
- **Storage:** R2 with unlimited scale
- **Edge:** Global Cloudflare network

### Scaling Strategies

**Horizontal Scaling:**
- ✅ Cloudflare Workers auto-scale globally
- ✅ D1 auto-replicates for read performance
- ✅ R2 scales automatically

**Caching:**
- ✅ Static assets cached at CDN
- ✅ API responses cached at edge (future: Cache API)
- ⏳ Browser cache for cafe data (future)
- ⏳ Stale-while-revalidate strategy (future)

**Database Optimization:**
- ✅ Proper indexes on all foreign keys
- ✅ Denormalized counts in user_profiles
- ⏳ Query optimization (monitor slow queries)
- ⏳ Read replicas (D1 future feature)

**Future Considerations (>100K DAU):**
- Implement Redis for session storage
- Add full-text search (Algolia or Typesense)
- CDN caching for API responses
- Database sharding by city
- Image CDN for R2 (Cloudflare Images)

---

## Performance Targets

### Frontend (MUST maintain)

| Metric | Target | Current |
|--------|--------|---------|
| **LCP** (Largest Contentful Paint) | < 2.5s | ~2.1s |
| **FID** (First Input Delay) | < 100ms | ~50ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | ~0.05 |
| **Bundle Size** | < 100KB | ~80KB |
| **Time to Interactive (3G)** | < 3.5s | ~3.2s |

### Backend

| Metric | Target | Current |
|--------|--------|---------|
| **API Response Time (p50)** | < 100ms | ~60ms |
| **API Response Time (p95)** | < 300ms | ~180ms |
| **Cold Start** | < 50ms | ~30ms |
| **Database Query (simple)** | < 10ms | ~5ms |
| **Database Query (complex)** | < 50ms | ~30ms |

### Monitoring

- Cloudflare Analytics Dashboard
- Real User Monitoring (RUM) - future
- Error tracking (Sentry) - future
- Performance budgets in CI/CD

---

## Security Architecture

### Defense in Depth

**Layer 1: Cloudflare**
- DDoS protection
- WAF (Web Application Firewall)
- Rate limiting
- Bot protection

**Layer 2: Backend**
- JWT authentication
- Input validation (Zod)
- SQL injection prevention (Drizzle ORM)
- XSS prevention (HTTP-only cookies)
- CSRF prevention (SameSite cookies)

**Layer 3: Database**
- Row-level security (planned)
- Encrypted at rest
- Audit logging (admin actions)

**Layer 4: Application**
- Content Security Policy (future)
- HTTPS enforcement
- Secure headers

**See:** [Security Best Practices](../operations/security.md)

---

## Development Workflow

### Local Development

```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# → http://localhost:5173

# Terminal 2: Backend
cd backend
npm run dev:backend
# → http://localhost:8787
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run frontend tests only
cd frontend && npm test

# Run backend tests only
cd backend && npm test
```

### Deployment

```bash
# Deploy backend
cd backend && npm run deploy

# Frontend deploys automatically on push to main
```

---

## See Also

- [TECH_SPEC.md](../TECH_SPEC.md) - Detailed technical specifications
- [Database Schema](../api/database-schema.md) - Complete database documentation
- [API Reference](../api/api-reference.md) - API endpoint documentation
- [Authentication Flow](auth-flow.md) - Auth system details
- [Photo Upload Flow](photo-upload-flow.md) - Photo upload system
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment procedures
