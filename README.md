# 🍵 MatchaMap 🍵

A curated, map-based guide to matcha cafes in Toronto with expert reviews and ratings.

## 📁 Monorepo Structure

```
matchamap/
├── frontend/          # React + Vite frontend
├── backend/           # Cloudflare Workers API
├── shared/            # Shared TypeScript types
└── docs/             # Project documentation
```

## 🚀 Quick Start

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

- **`frontend/`** - React application with Vite, Tailwind CSS, and Zustand
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

## 📚 Documentation

- [CLAUDE.md](./CLAUDE.md) - Comprehensive development guide
- [Backend PRD](./docs/backend-prd.md) - Backend architecture and implementation
- [Metrics Tracking PRD](./docs/metrics-tracking-prd.md) - Analytics implementation

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

## 🧪 Testing

```bash
npm run test           # Run tests
npm run typecheck      # Type check all workspaces
npm run lint           # Lint frontend code
```

## 📄 License

Private project - All rights reserved
