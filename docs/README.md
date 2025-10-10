# MatchaMap Documentation Guide

**Last Updated:** 2025-10-10

This guide helps you navigate the MatchaMap documentation and find exactly what you need for your task.

---

## 🚀 Quick Start

| I want to... | Read this |
|-------------|-----------|
| **Understand the project basics** | `../CLAUDE.md` (start here!) |
| **Set up the backend locally** | `QUICKSTART_BACKEND.md` |
| **Deploy to production** | `DEPLOYMENT.md` |
| **Understand the full architecture** | `TECH_SPEC.md` |

---

## 📋 By Task Type

### Backend Development

| Task | Document |
|------|----------|
| Set up backend locally | `QUICKSTART_BACKEND.md` |
| Understand backend architecture | `backend-prd.md` |
| Database schema reference | `TECH_SPEC.md` → Database Schema section |
| API endpoints reference | `TECH_SPEC.md` → API Architecture section |
| Add/modify database tables | `TECH_SPEC.md` + Drizzle migrations |

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
| Implement social features | `social-features-guide.md` |
| Track analytics/metrics | `metrics-tracking-prd.md` |
| Add a new city | `adding-new-cities.md` |
| Integrate Google Places | `GOOGLE_PLACES_SETUP.md` |

### Deployment & Operations

| Task | Document |
|------|----------|
| Deploy backend to production | `DEPLOYMENT.md` |
| Deploy frontend to production | `DEPLOYMENT.md` |
| Run database migrations | `DEPLOYMENT.md` → Database Management |
| Set up custom domains | `DEPLOYMENT.md` → Custom Domain Setup |
| Monitor performance | `DEPLOYMENT.md` → Monitoring & Analytics |
| Rollback a deployment | `DEPLOYMENT.md` → Rollback Procedures |

### Technical Reference

| Task | Document |
|------|----------|
| Full technical specifications | `TECH_SPEC.md` |
| Performance targets | `TECH_SPEC.md` → Performance Specifications |
| Security guidelines | `TECH_SPEC.md` → Security |
| Browser support | `TECH_SPEC.md` → Browser Support |

---

## 📚 Document Descriptions

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
**Purpose:** Authoritative source for database schema and API endpoints
**Contents:**
- System architecture diagrams
- Complete database schema (source of truth)
- API endpoint specifications (source of truth)
- Component architecture
- Performance specifications
- Security guidelines

**When to read:** Backend development, API integration, schema changes

---

### Backend Documents

#### `backend-prd.md` (Backend Implementation PRD)
**Location:** `docs/`
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
**Location:** `docs/`
**Purpose:** Get backend running locally in 10 minutes
**Contents:**
- 5-step setup process
- Database creation
- Migration running
- Testing endpoints

**When to read:** First time backend setup

---

### Feature Documents

#### `social-features-guide.md` (Social Features)
**Location:** `docs/`
**Purpose:** Comprehensive guide to social features
**Contents:**
- User profiles, check-ins, reviews, ratings
- Photo uploads and galleries
- Following system and activity feeds
- Database schema and API endpoints
- Implementation phases
- Success metrics

**When to read:** Implementing social/community features

---

#### `feature-flags-guide.md` (Feature Flags)
**Location:** `docs/`
**Purpose:** How to enable/disable features
**Contents:**
- All available feature flags
- Usage patterns (useFeatureToggle, useUserFeatures)
- Common scenarios (launching, beta testing, rollback)
- Best practices

**When to read:** Launching features, A/B testing, rollback scenarios

---

#### `metrics-tracking-prd.md` (Analytics)
**Location:** `docs/`
**Purpose:** Simple counter-based metrics
**Contents:**
- What we track (views, clicks, passport usage)
- Database schema for stats tables
- Frontend tracking utilities
- Admin stats dashboard

**When to read:** Implementing analytics, viewing metrics

---

#### `adding-new-cities.md` (City Management)
**Location:** `docs/`
**Purpose:** How to add new cities to MatchaMap
**Contents:**
- City key rules
- Step-by-step guide (manual + slash command)
- Type safety flow
- Migration examples

**When to read:** Expanding to new cities

---

### Deployment Documents

#### `DEPLOYMENT.md` (Deployment Guide)
**Location:** `docs/`
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
**Location:** `docs/`
**Purpose:** Set up Google Places API
**Contents:**
- API key generation
- Integration steps
- Usage examples

**When to read:** Setting up Google Places features

---

## 🗂️ Archive

Historical documents for reference:

- `archive/UI_POLISH_SUMMARY.md` - UI/UX polish work summary (completed)

---

## 📖 Reading Paths

### New Developer Onboarding
1. Read `../CLAUDE.md` (understand patterns and principles)
2. Read `QUICKSTART_BACKEND.md` (set up backend locally)
3. Skim `TECH_SPEC.md` (understand architecture)
4. Reference other docs as needed

### Implementing a New Feature
1. Check `feature-flags-guide.md` (add feature flag)
2. Reference `TECH_SPEC.md` (schema/API patterns)
3. Follow `../CLAUDE.md` patterns (copy constants, API client, shared UI)
4. Add analytics via `metrics-tracking-prd.md` (if needed)

### Deploying to Production
1. Read `DEPLOYMENT.md` completely
2. Follow deployment checklist
3. Test endpoints
4. Monitor via dashboard

### Adding Social Features
1. Read `social-features-guide.md` completely
2. Follow implementation phases
3. Update feature flags via `feature-flags-guide.md`
4. Deploy via `DEPLOYMENT.md`

---

## 🔍 Finding Specific Information

### Database Schema
→ `TECH_SPEC.md` (Database Schema section) - **Authoritative source**

### API Endpoints
→ `TECH_SPEC.md` (API Architecture section) - **Authoritative source**

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

---

## ✨ Tips

1. **Start with CLAUDE.md** - It contains the patterns you'll use daily
2. **Use TECH_SPEC.md as reference** - Don't memorize schemas, look them up
3. **Keep docs open** - Reference frequently instead of guessing
4. **Update as you go** - Found outdated info? Update the doc!
5. **Follow the patterns** - CLAUDE.md patterns are battle-tested

---

## 📝 Documentation Principles

- **Single source of truth** - Database schema and API endpoints live in `TECH_SPEC.md` only
- **Minimal duplication** - Docs reference each other instead of duplicating content
- **Task-oriented** - Organized by what you're trying to accomplish
- **Quick reference** - Fast lookups for common tasks
- **Examples included** - Show, don't just tell

---

**Need help?** Check the main `CLAUDE.md` for common commands and troubleshooting.
