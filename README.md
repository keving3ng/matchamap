# 🍵 MatchaMap
[![CI](https://github.com/keving3ng/matchamap/actions/workflows/ci.yml/badge.svg)](https://github.com/keving3ng/matchamap/actions/workflows/ci.yml) 
[![codecov](https://codecov.io/gh/keving3ng/matchamap/branch/main/graph/badge.svg?token=TQNXOMG9D5)](https://codecov.io/gh/keving3ng/matchamap)

A mobile-first, map-based guide to matcha cafes in Toronto featuring expert reviews, ratings, and location-based discovery tools.


## ✨ Features

- **Interactive Map** - Explore cafes with location-based discovery and user geolocation
- **List & Detail Views** - Browse cafes with sorting, filtering, and detailed information
- **Matcha Passport** - Track your visits and build your matcha journey
- **News Feed** - Stay updated on new cafes and community news
- **Events** - Discover matcha-related events and tastings
- **User Accounts** - Registration, authentication, and profile management
- **Social Features** - Check-ins, reviews, and community engagement
- **Admin Panel** - Content management and analytics dashboard

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4.x, Zustand, Leaflet
- **Backend**: Cloudflare Workers, D1 (SQLite), Drizzle ORM
- **Hosting**: Cloudflare Pages + Workers (edge deployment)
- **TypeScript**: Strict mode throughout

## 🎯 Core Principles

1. **Performance-First** - LCP < 2.5s, bundle < 100KB, optimized for 3G networks
2. **Mobile-First** - Touch-optimized UI with 44px minimum targets, works one-handed
3. **Lean & Efficient** - Simple architecture, browser APIs over libraries, aggressive code removal

## 📁 Monorepo Structure

```
matchamap/
├── frontend/          # React + Vite frontend
├── backend/           # Cloudflare Workers API
├── shared/            # Shared TypeScript types
└── docs/              # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 22+ (specified in package.json engines)
- npm workspaces
- Cloudflare Wrangler CLI (for backend development)

### Installation

```bash
# Install all dependencies
npm install

# Start frontend dev server
npm run dev

# Start backend dev server (requires wrangler)
npm run dev:backend

# Build everything
npm run build

# Run type checking
npm run typecheck
```

## 📦 Workspaces

This project uses npm workspaces for monorepo management:

- **`frontend/`** - React 19 application with Vite, Tailwind CSS 4.x, and Zustand
- **`backend/`** - Cloudflare Workers API with D1 database and Drizzle ORM
- **`shared/`** - Shared TypeScript types for API contracts

## 🛠️ Development

### Frontend Development

```bash
npm run dev:frontend
# or from frontend/ directory:
cd frontend && npm run dev
```

### Backend Development

```bash
npm run dev:backend
# or from backend/ directory:
cd backend && npm run dev
```

### Database Management

```bash
cd backend
npm run db:generate    # Generate migrations from schema
npm run db:push        # Push schema to D1
npm run db:migrate     # Apply migrations
```

### Environment Configuration

**Frontend**: Uses `frontend/src/config/features.yaml` for feature toggles:
```yaml
ENABLE_PASSPORT: true
ENABLE_EVENTS: true
ENABLE_USER_ACCOUNTS: true
ENABLE_USER_SOCIAL: true
```

**Backend**: Configuration in `backend/wrangler.toml`:
- API base URL via `VITE_API_URL` environment variable
- Database binding (D1)
- CORS settings

See [Feature Flags Guide](./docs/feature-flags-guide.md) for details.

## 📚 Documentation

**Getting Started**
- [CLAUDE.md](./CLAUDE.md) - Comprehensive development guide for contributors
- [Quick Start Guide](./docs/QUICKSTART_BACKEND.md) - Backend setup and development

**Architecture & Design**
- [Tech Spec](./docs/TECH_SPEC.md) - Technical architecture overview
- [Backend PRD](./docs/backend-prd.md) - Backend implementation details
- [Social Features](./docs/social-features-prd.md) - Social networking functionality
- [Metrics Tracking](./docs/metrics-tracking-prd.md) - Analytics implementation

**Operations**
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions
- [Deployment Commands](./docs/DEPLOYMENT_COMMANDS.md) - Common deployment commands
- [Feature Flags](./docs/feature-flags-guide.md) - Managing feature toggles
- [Google Places Setup](./docs/GOOGLE_PLACES_SETUP.md) - API integration guide

## 🌐 Deployment

### Frontend (Cloudflare Pages)
- Automatically deploys on push to `main`
- Build command: `cd frontend && npm run build`
- Output directory: `frontend/dist`

### Backend (Cloudflare Workers)
```bash
npm run deploy:backend
# or from backend/ directory:
cd backend && npm run deploy
```

## ✅ Quality Checks

```bash
npm run typecheck      # Type check all workspaces (required before commit)
npm run lint           # Lint frontend code
npm run build          # Verify builds succeed
```

**Pre-commit checklist:**
1. Run `npm run typecheck` - must pass
2. Run `npm run build` - must succeed
3. Test on mobile viewport (320px+)
4. Verify no console errors

## 📄 License

Private project - All rights reserved
