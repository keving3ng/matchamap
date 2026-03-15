# MatchaMap Documentation Guide

**Last Updated:** 2025-03-14

This guide helps you navigate the MatchaMap documentation and find exactly what you need for your task.

---

## 🎯 Product direction (start here)

| I want to... | Read this |
|-------------|-----------|
| **Understand what MatchaMap is (and isn’t)** | `PRODUCT_FOUNDATION.md` ⭐ |
| **See the simplification cut-off and cleanup plan** | `SIMPLIFICATION_PLAN.md` ⭐ |
| **Run simplification with multiple agents in parallel** | `AGENT_PARALLELIZATION_PLAN.md` ⭐ |

MatchaMap is a **curated guide** (recommendations, events, vivisual.diary)—not a social network. Social and public user-account features are out of scope or disabled.

---

## 🚀 Quick Start

| I want to... | Read this |
|-------------|-----------|
| **Understand the project basics** | `../CLAUDE.md` (start here!) ⭐ |
| **Contribute to the project** | `../CONTRIBUTING.md` ⭐ |
| **Set up the backend locally** | `QUICKSTART_BACKEND.md` |
| **Deploy to production** | `DEPLOYMENT.md` |
| **Understand the full architecture** | `architecture/system-overview.md` ⭐ |
| **View API endpoints** | `api/api-reference.md` ⭐ |
| **View database schema** | `api/database-schema.md` ⭐ |

---

## 📋 By Task Type

### New to MatchaMap?

| Task | Document |
|------|----------|
| **First time contributing** | `../CONTRIBUTING.md` ⭐ |
| **Understand development patterns** | `../CLAUDE.md` ⭐ |
| **Local development setup** | `QUICKSTART_BACKEND.md` |
| **Run tests** | `TESTING.md` |

### Backend Development

| Task | Document |
|------|----------|
| Set up backend locally | `QUICKSTART_BACKEND.md` |
| Understand system architecture | `architecture/system-overview.md` ⭐ |
| Database schema reference | `api/database-schema.md` ⭐ (Complete - 15 tables) |
| API endpoints reference | `api/api-reference.md` ⭐ (60+ endpoints) |
| Authentication system | `architecture/auth-flow.md` ⭐ (JWT details) |
| Photo upload system | `architecture/photo-upload-flow.md` ⭐ |
| Add/modify database tables | `TECH_SPEC.md` + Drizzle migrations |
| Backend architecture (legacy) | `backend-prd.md` |

### Frontend Development

| Task | Document |
|------|----------|
| Use shared UI components | `../CLAUDE.md` → Shared UI Component Library |
| Make API calls | `../CLAUDE.md` → API Communication |
| Add user-facing strings | `../CLAUDE.md` → Copy & Internationalization |
| Manage global state | `../CLAUDE.md` → State Management Philosophy |
| Lazy load data | `../CLAUDE.md` → Lazy Loading Pattern |
| Code organization rules | `../CLAUDE.md` → Code Organization |

### Features & Functionality

| Task | Document |
|------|----------|
| Toggle features on/off | `feature-flags-guide.md` |
| *(Social features archived)* | See `archive/social-features-guide.md` + `PRODUCT_FOUNDATION.md` |
| Track analytics/metrics | `metrics-tracking-prd.md` |
| Add a new city | `adding-new-cities.md` |
| Integrate Google Places | `GOOGLE_PLACES_SETUP.md` |
| Implement photo uploads | `photo-upload-guide.md` ⭐ |

### Deployment & Operations

| Task | Document |
|------|----------|
| Deploy backend to production | `DEPLOYMENT.md` |
| Deploy frontend to production | `DEPLOYMENT.md` |
| Run database migrations | `DEPLOYMENT.md` → Database Management |
| Set up custom domains | `DEPLOYMENT.md` → Custom Domain Setup |
| Monitor performance | `DEPLOYMENT.md` → Monitoring & Analytics |
| Rollback a deployment | `DEPLOYMENT.md` → Rollback Procedures |

### User Guides

| Task | Document |
|------|----------|
| Getting started as a user | `user-guide/getting-started.md` ⭐ |
| Writing reviews | `user-guide/reviews.md` (planned) |
| Using Matcha Passport | `user-guide/passport.md` (planned) |
| Social features | `user-guide/social.md` (planned) |

### Admin Guides

| Task | Document |
|------|----------|
| Moderate content | `admin/moderation.md` ⭐ |
| Manage users | `admin/user-management.md` (planned) |
| View analytics | `admin/dashboard.md` (planned) |

### Technical Reference

| Task | Document |
|------|----------|
| Full technical specifications | `TECH_SPEC.md` |
| Performance targets | `TECH_SPEC.md` → Performance Specifications |
| Security guidelines | `TECH_SPEC.md` → Security |
| Browser support | `TECH_SPEC.md` → Browser Support |

### Performance Optimization

| Task | Document |
|------|----------|
| Performance optimization procedures | `performance-optimization-runbook.md` ⭐ NEW |
| Performance testing procedures | `performance-testing-procedures.md` ⭐ NEW |
| React performance best practices | `react-performance-guide.md` ⭐ NEW |
| Bundle size optimization | `../CLAUDE.md` → Bundle Size Strategy |
| Web Vitals tracking | `frontend/src/utils/webVitals.ts` |
| Image compression | `frontend/src/utils/imageCompression.ts` |

---

## 📚 Document Descriptions

### 🆕 New Documentation (2025-11-02)

#### `api/api-reference.md` ⭐ NEW
**Purpose:** Complete API endpoint documentation
**Contents:**
- 60+ documented endpoints with examples
- Request/response formats for all endpoints
- Authentication requirements
- Error codes and handling
- Rate limiting policies
- CORS configuration

**When to use:** Integrating with API, understanding endpoints, debugging API calls

---

#### `api/database-schema.md` ⭐ NEW
**Purpose:** Comprehensive database schema reference
**Contents:**
- Complete documentation of all 15 tables
- Column descriptions and data types
- Foreign key relationships
- Index strategy
- Migration history
- ER diagrams

**When to use:** Understanding data model, writing queries, adding tables

---

#### `architecture/system-overview.md` ⭐ NEW
**Purpose:** High-level system architecture
**Contents:**
- Technology stack breakdown
- Component architecture diagrams
- Data flow explanations
- Scalability considerations
- Performance targets
- Security architecture

**When to use:** Understanding overall system, onboarding, architecture decisions

---

#### `architecture/auth-flow.md` ⭐ NEW
**Purpose:** JWT authentication system details
**Contents:**
- Registration/login/logout flows
- Token refresh mechanism
- Session management
- Security considerations
- Implementation details with code examples

**When to use:** Implementing auth features, debugging auth issues, security reviews

---

#### `architecture/photo-upload-flow.md` ⭐ NEW
**Purpose:** Photo upload architecture
**Contents:**
- Upload flow step-by-step
- R2 storage structure
- Moderation workflow
- Validation rules
- Performance optimization

**When to use:** Implementing photo features, understanding R2 storage

---

#### `user-guide/getting-started.md` ⭐ NEW
**Purpose:** User onboarding guide
**Contents:**
- Creating an account
- Exploring cafes
- First check-in
- Writing reviews
- Using Matcha Passport
- Profile customization

**When to use:** Understanding user experience, onboarding new users

---

#### `admin/moderation.md` ⭐ NEW
**Purpose:** Content moderation guide for admins
**Contents:**
- Moderation queue workflow
- Photo moderation guidelines
- Review moderation
- Common scenarios
- Best practices

**When to use:** Admin moderation tasks, understanding moderation policy

---

#### `CONTRIBUTING.md` ⭐ NEW
**Purpose:** Contributor guide
**Contents:**
- Code of Conduct
- Development workflow
- Code standards
- Testing requirements
- Pull request process
- Community resources

**When to use:** First-time contributing, understanding contribution process

---

### Core Documents

#### `CLAUDE.md` (Main Development Guide)
**Location:** Project root
**Purpose:** Primary reference for daily development
**Contents:**
- Architecture principles (Performance, Mobile-first, Lean)
- Critical patterns (Copy constants, API client, Shared UI, Lazy loading)
- State management philosophy
- Code organization rules
- Anti-patterns and best practices
- Quick command reference

**When to read:** Daily development, onboarding, code reviews

---

#### `TECH_SPEC.md` (Technical Specifications)
**Location:** `docs/`
**Purpose:** Authoritative source for technical details
**Contents:**
- System architecture diagrams
- Complete database schema (legacy - see api/database-schema.md instead)
- API endpoint specifications (legacy - see api/api-reference.md instead)
- Component architecture
- Performance specifications
- Security guidelines

**When to read:** Backend development, API integration, schema changes

**Note:** For database and API docs, prefer the new dedicated files in `api/` directory.

---

### Backend Documents

#### `backend-prd.md` (Backend Implementation PRD)
**Purpose:** Backend architecture and design decisions
**Contents:**
- Goals and success metrics
- Technology choices with rationale
- Migration strategy
- Operational concerns
- Cost analysis

**When to read:** Understanding backend decisions, planning backend work

---

#### `QUICKSTART_BACKEND.md` (Backend Quick Start)
**Purpose:** Get backend running locally in 10 minutes
**Contents:**
- 5-step setup process
- Database creation
- Migration running
- Testing endpoints

**When to read:** First time backend setup

---

### Feature Documents

#### `archive/social-features-guide.md` (Social Features – archived)
**Purpose:** Historical reference; social features are out of scope per PRODUCT_FOUNDATION.md.
**Contents:** User profiles, check-ins, reviews, photos, following, activity feeds, etc.

**When to read:** Historical context only; current product scope in PRODUCT_FOUNDATION.md.

---

#### `feature-flags-guide.md` (Feature Flags)
**Purpose:** How to enable/disable features
**Contents:**
- All available feature flags
- Usage patterns (useFeatureToggle, useUserFeatures)
- Common scenarios (launching, beta testing, rollback)
- Best practices

**When to read:** Launching features, A/B testing, rollback scenarios

---

#### `metrics-tracking-prd.md` (Analytics)
**Purpose:** Simple counter-based metrics
**Contents:**
- What we track (views, clicks, passport usage)
- Database schema for stats tables
- Frontend tracking utilities
- Admin stats dashboard

**When to read:** Implementing analytics, viewing metrics

---

#### `adding-new-cities.md` (City Management)
**Purpose:** How to add new cities to MatchaMap
**Contents:**
- City key rules
- Step-by-step guide (manual + slash command)
- Type safety flow
- Migration examples

**When to read:** Expanding to new cities

---

#### `photo-upload-guide.md` ⭐ (Photo Upload System)
**Purpose:** Technical guide for photo upload infrastructure
**Contents:**
- Architecture overview (R2 + D1 integration)
- Database schema (`review_photos` table)
- API endpoints (upload, retrieve, moderate)
- Image processing (validation, dimensions, thumbnails)
- R2 storage configuration and naming conventions
- Security and moderation workflow
- Known limitations and next steps
- Frontend integration examples

**When to read:** Implementing photo uploads, understanding moderation, R2 setup

---

### Deployment Documents

#### `DEPLOYMENT.md` (Deployment Guide)
**Purpose:** Complete deployment reference
**Contents:**
- Local development setup
- Cloudflare Pages setup (frontend)
- Cloudflare Workers setup (backend)
- Database migrations
- Environment variables
- Custom domain configuration
- Monitoring and troubleshooting
- Quick command reference
- Rollback procedures

**When to read:** Deploying to production, troubleshooting deployments

---

#### `GOOGLE_PLACES_SETUP.md` (Google Places Integration)
**Purpose:** Set up Google Places API
**Contents:**
- API key generation
- Integration steps
- Usage examples

**When to read:** Setting up Google Places features

---

### Testing Documentation

#### `TESTING.md` (Testing Guide)
**Purpose:** Comprehensive testing guide
**Contents:**
- Testing philosophy
- Test structure and organization
- Store testing patterns
- Component testing best practices
- Mocking strategies
- Troubleshooting common issues

**When to read:** Writing tests, debugging test failures

---

#### `E2E_TESTING_GUIDE.md` (E2E Testing)
**Purpose:** End-to-end testing with Playwright
**Contents:**
- E2E test setup
- Writing E2E tests
- Running E2E tests locally and in CI

**When to read:** Writing E2E tests

---

#### `security-testing-guide.md` (Security Testing)
**Purpose:** Security testing procedures
**Contents:**
- Security testing checklist
- Common vulnerabilities to test
- Security best practices

**When to read:** Security audits, penetration testing

---

## 🗂️ Directory Structure

```
docs/
├── README.md                          # ⭐ This file
├── CLAUDE.md                          # Main development guide (in root)
├── CONTRIBUTING.md                    # ⭐ Contributor guide (in root)
│
├── api/                               # ⭐ NEW: API Documentation
│   ├── api-reference.md               # Complete API endpoint docs (60+ endpoints)
│   └── database-schema.md             # Complete database schema (15 tables)
│
├── architecture/                      # ⭐ NEW: Architecture Documentation
│   ├── system-overview.md             # High-level system architecture
│   ├── auth-flow.md                   # JWT authentication details
│   └── photo-upload-flow.md           # Photo upload architecture
│
├── user-guide/                        # ⭐ NEW: User Documentation
│   └── getting-started.md             # User onboarding guide
│
├── admin/                             # ⭐ NEW: Admin Documentation
│   └── moderation.md                  # Content moderation guide
│
├── development/                       # Development guides (planned)
├── operations/                        # Operations guides (planned)
├── migrations/                        # Migration guides (planned)
│
├── TECH_SPEC.md                       # Legacy technical spec
├── DEPLOYMENT.md                      # Deployment guide
├── TESTING.md                         # Testing guide
├── E2E_TESTING_GUIDE.md              # E2E testing guide
├── QUICKSTART_BACKEND.md             # Backend quick start
├── backend-prd.md                     # Backend PRD
├── feature-flags-guide.md            # Feature flags
├── photo-upload-guide.md             # Photo upload technical guide
├── metrics-tracking-prd.md           # Analytics tracking
├── adding-new-cities.md              # City management
├── GOOGLE_PLACES_SETUP.md            # Google Places setup
├── security-testing-guide.md         # Security testing
│
└── archive/                          # Historical documents
    ├── UI_POLISH_SUMMARY.md          # UI polish summary (completed)
    ├── social-features-guide.md      # Social features (out of scope)
    ├── social-features-analytics-prd.md
    └── feed-refactoring-plan.md
```

---

## 📖 Reading Paths

### New Developer Onboarding

1. **Read `CONTRIBUTING.md`** - Understand how to contribute ⭐
2. **Read `../CLAUDE.md`** - Learn patterns and principles ⭐
3. **Read `architecture/system-overview.md`** - Understand system architecture ⭐
4. **Read `QUICKSTART_BACKEND.md`** - Set up backend locally
5. **Skim `api/database-schema.md`** - Understand data model ⭐
6. **Skim `api/api-reference.md`** - Familiarize with API ⭐
7. **Reference other docs as needed**

### Implementing a New Feature

1. **Check `feature-flags-guide.md`** - Add feature flag
2. **Review `architecture/system-overview.md`** - Understand system
3. **Reference `api/database-schema.md`** - Check data model
4. **Reference `api/api-reference.md`** - Use API patterns
5. **Follow `../CLAUDE.md` patterns** - Copy constants, API client, shared UI
6. **Write tests per `TESTING.md`**
7. **Add analytics via `metrics-tracking-prd.md`** (if needed)

### Deploying to Production

1. **Read `DEPLOYMENT.md` completely**
2. **Follow deployment checklist**
3. **Test endpoints**
4. **Monitor via dashboard**

### Adding Social Features *(out of scope)*

Social features are out of scope per PRODUCT_FOUNDATION.md. For historical reference only: `archive/social-features-guide.md`.

### Implementing Photo Uploads

1. **Read `photo-upload-guide.md`** - Backend implementation
2. **Read `architecture/photo-upload-flow.md`** - Architecture overview ⭐
3. **Set up R2 buckets via `DEPLOYMENT.md`** (R2 Bucket Setup section)
4. **Run database migrations** (0012_add_user_reviews_tables.sql)
5. **Test endpoints via curl/Postman**
6. **Implement frontend UI components**

### Understanding Authentication

1. **Read `architecture/auth-flow.md`** - JWT implementation ⭐
2. **Review `api/api-reference.md`** - Auth endpoints ⭐
3. **Check `api/database-schema.md`** - Users and sessions tables ⭐

---

## 🔍 Finding Specific Information

### Database Schema
→ **`api/database-schema.md`** ⭐ - Complete documentation of all 15 tables

### API Endpoints
→ **`api/api-reference.md`** ⭐ - 60+ endpoints with examples

### System Architecture
→ **`architecture/system-overview.md`** ⭐ - Technology stack, data flow, scaling

### Authentication Details
→ **`architecture/auth-flow.md`** ⭐ - JWT implementation, session management

### Copy Constants
→ `../CLAUDE.md` (Copy & Internationalization section)

### Shared UI Components
→ `../CLAUDE.md` (Shared UI Component Library section)

### API Client Usage
→ `../CLAUDE.md` (API Communication section)

### Deployment Commands
→ `DEPLOYMENT.md` (Quick Command Reference section)

### Feature Flags
→ `feature-flags-guide.md`

### Analytics
→ `metrics-tracking-prd.md`

### Photo Upload System
→ `photo-upload-guide.md` + `architecture/photo-upload-flow.md` ⭐

### Contributing Guidelines
→ **`../CONTRIBUTING.md`** ⭐

---

## ✨ Tips

1. **Start with CONTRIBUTING.md** - Essential for new contributors ⭐
2. **Use CLAUDE.md daily** - Contains patterns you'll use every day
3. **Use new API/DB docs as reference** - Don't memorize, look them up ⭐
4. **Keep docs open** - Reference frequently instead of guessing
5. **Update as you go** - Found outdated info? Update the doc!
6. **Follow the patterns** - CLAUDE.md patterns are battle-tested

---

## 📝 Documentation Principles

- **Single source of truth** - Database schema and API endpoints in dedicated files
- **Minimal duplication** - Docs reference each other instead of duplicating content
- **Task-oriented** - Organized by what you're trying to accomplish
- **Quick reference** - Fast lookups for common tasks
- **Examples included** - Show, don't just tell
- **Keep updated** - Documentation is code - keep it current

---

**Need help?** Check the main `CLAUDE.md` for common commands and troubleshooting, or see `CONTRIBUTING.md` for getting help from the community.
