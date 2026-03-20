# 🍵 MatchaMap
[![CI](https://github.com/keving3ng/matchamap/actions/workflows/ci.yml/badge.svg)](https://github.com/keving3ng/matchamap/actions/workflows/ci.yml)

A mobile-first, map-based **curated guide** to matcha cafes in Toronto (and beyond). We share our recommendations and data, relevant events, and promote our content creator backer [vivisual.diary](https://www.instagram.com/vivisual.diary).


## ✨ Features

- **Interactive Map** – Explore cafes with location-based discovery and geolocation
- **List & Detail Views** – Browse cafes with sorting, filtering, and expert reviews
- **Events** – Curated matcha-related events and tastings
- **About** – Who we are and links to vivisual.diary (Instagram, TikTok)
- **Matcha Passport** – Optional local stamp collection of cafes you’ve visited
- **Admin Panel** – Editor-only content management (cafes, drinks, events)

Product scope is defined in [docs/PRODUCT_FOUNDATION.md](docs/PRODUCT_FOUNDATION.md). Simplification plan: [docs/SIMPLIFICATION_PLAN.md](docs/SIMPLIFICATION_PLAN.md).

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS 4, Zustand 5, Leaflet
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

- **`frontend/`** - React 19 application with Vite 7, Tailwind CSS 4, and Zustand 5
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

**Index:** [docs/README.md](./docs/README.md) — task-oriented map of all guides.

**Getting Started**
- [CLAUDE.md](./CLAUDE.md) - Comprehensive development guide for contributors
- [Quick Start Guide](./docs/QUICKSTART_BACKEND.md) - Backend setup and development

**Architecture & Design**
- [Product Foundation](./docs/PRODUCT_FOUNDATION.md) - What MatchaMap is (and isn’t); product scope
- [Simplification Plan](./docs/SIMPLIFICATION_PLAN.md) - Cut-off and cleanup checklist
- [Tech Spec](./docs/TECH_SPEC.md) - Technical architecture overview
- [Backend PRD](./docs/backend-prd.md) - Backend implementation details
- [Metrics Tracking](./docs/metrics-tracking-prd.md) - Analytics implementation

**Operations**
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment, migrations, rollback (includes command reference)
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
