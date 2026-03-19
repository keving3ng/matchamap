# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- TypeScript 5.2.2 / 5.6.3 - Full codebase with strict mode (`noUnusedLocals: true`, `noUnusedParameters: true`)
  - Frontend (`frontend/tsconfig.json`): ES2020 target, DOM types
  - Backend (`backend/tsconfig.json`): ES2022 target, Cloudflare Workers types
  - Shared (`shared/tsconfig.json`): No build, pure types only

## Runtime

**Environment:**
- Node.js 22.0.0+ (frontend), 22.12.0+ (frontend strict), 22.0.0+ (backend)
- Package Manager: pnpm 10.9.0+sha512... (enforced in root `package.json`)
- Monorepo: pnpm workspaces with three workspaces: `frontend`, `backend`, `shared`

## Frameworks

**Core:**
- React 19.0.0 - Component library
- React Router 7.9.3/7.9.4 - Client-side routing
- Zustand 5.0.8 - State management (minimal ~3KB gzipped)
- Vite 7.1.12 - Build tool and dev server for frontend
- Tailwind CSS 4.1.16 - Utility-first styling with @tailwindcss/vite plugin
- Cloudflare Workers - Backend runtime via Wrangler 4.43.0

**Mapping:**
- Leaflet 1.9.4 - Interactive maps (~43KB gzipped, manually chunked)
- Types: @types/leaflet 1.9.8

**UI & Icons:**
- lucide-react 0.562.0 - Icon library (tree-shakeable, individual imports only)

**Utilities:**
- DOMPurify 3.2.7 - HTML sanitization (@types/dompurify 3.0.5)

**Security & Auth:**
- jose 6.1.2 - JWT signing/verification (Cloudflare Workers compatible)
- Web Crypto API - Password hashing (PBKDF2 with SHA-256)

**Database & ORM:**
- Drizzle ORM 0.44.7 - SQL ORM
- drizzle-kit 0.31.8 - Migration generation
- D1 - Cloudflare SQLite database (via Wrangler binding)
- Schema: `backend/drizzle/schema.ts` (SQLite)

**Routing & APIs:**
- itty-router 5.0.18 - Lightweight router for Cloudflare Workers

**Data Validation:**
- Zod 3.22.3 - TypeScript-first schema validation (backend routes)

**Compression:**
- vite-plugin-compression 0.5.1 - Gzip + Brotli pre-compression at build time
- Terser 5.44.0 - Minification (drop_console, drop_debugger in production)

**Testing:**
- Vitest 4.0.6 (frontend), 2.1.9 (backend) - Unit/component test runner
- @vitest/ui 4.0.6 - Interactive test UI
- @vitest/coverage-v8 4.0.6 / 2.1.9 - Code coverage reporting
- Testing Library: @testing-library/react 16.3.0, @testing-library/user-event 14.5.1, @testing-library/jest-dom 6.1.6
- JSDOM 27.1.0 - DOM environment for tests
- Playwright 1.40.1 - E2E testing framework

**Linting & Code Quality:**
- ESLint 9.0.0 - Linting with @eslint/js
- eslint-plugin-react 7.33.2, eslint-plugin-react-hooks 7.0.1, eslint-plugin-react-refresh 0.4.5
- typescript-eslint 8.0.0 - TypeScript linting
- TypeScript 5.2.2 / 5.6.3 - Type checking via `tsc --noEmit`

**Build & Dev Tools:**
- @vitejs/plugin-react 5.0.4 - JSX support
- @vitejs/plugin-basic-ssl 2.1.0 - Local HTTPS support
- @rollup/plugin-yaml 4.1.2 - YAML import support (feature flags)
- rollup-plugin-visualizer 6.0.5 - Bundle analysis
- @cloudflare/workers-types 4.20251014.0 - Type definitions
- @cloudflare/vitest-pool-workers 0.11.1 - Vitest Workers pool
- tsx 4.21.0 - TypeScript Node execution (scripts)

**Git & CI/CD:**
- Husky 9.1.7 - Git hooks management
- lint-staged 16.2.4 - Pre-commit linting

**Shared Dependencies:**
- globals 16.5.0 - Global scope definitions for ESLint

## Configuration

**Environment:**
- Frontend: VITE_API_URL (backend URL)
  - Dev: `http://localhost:8787`
  - Prod: `https://api.matchamap.club`
- Frontend: VITE_OPENROUTESERVICE_API_KEY (optional, for route visualization)
- Frontend: VITE_ACCESS_PASSWORD (optional, for coming soon page)
- Backend: JWT_SECRET (required, set via Wrangler CLI)
- Backend: GOOGLE_PLACES_API_KEY (required, set via Wrangler CLI)

**Feature Flags:**
- Location: `frontend/src/config/features.yaml`
- Format: YAML with dev/prod values
- Loaded at build time via @rollup/plugin-yaml
- Used by: `useFeatureToggle()`, `useUserFeatures()`, `useAppFeatures()` hooks

**TypeScript:**
- Strict mode enforced everywhere
- No `any` types allowed
- Path aliases: `@/` → `./src/` (frontend), `@/` → `./frontend/src/` (integration tests)

**Build Output:**
- Frontend: `dist/` directory
- Manual code splitting configured in Vite:
  - `vendor`: React + React DOM (~50KB gzipped)
  - `router`: React Router (~15KB gzipped)
  - `maps`: Leaflet (~43KB gzipped)
  - `state`: Zustand (~3KB gzipped)
  - `utils`: DOMPurify (~6KB gzipped)

## Platform Requirements

**Development:**
- Node.js 22.12.0+
- pnpm 10.9.0+
- MacOS/Linux/Windows (cross-platform support)
- Local HTTPS via mkcert (optional, `.pem` files in frontend root)

**Production:**
- Cloudflare Pages (frontend) - Vite preset
  - Build: `npm run build`
  - Output: `dist`
  - Auto-deploy on push to `main`
- Cloudflare Workers (backend)
  - Runtime: Node.js compatible
  - D1 Database binding: `DB` (SQLite, database_id: 69667043-3d25-4fe2-9bac-1a8d42a7c25c)
  - R2 bucket binding: `PHOTOS_BUCKET` (prod: matchamap-photos, dev: matchamap-photos-dev)
- Domains:
  - Frontend: https://matchamap.club, https://matchamap.pages.dev (preview)
  - Backend API: https://api.matchamap.club
  - Photos: https://photos.matchamap.club (R2 custom domain)

## Key Dependencies by Purpose

**Performance:**
- Vite (build tool - dev speed + tree-shaking)
- Zustand (state - tiny bundle, no boilerplate)
- Leaflet (maps - manually chunked to avoid main bundle)
- DOMPurify (sanitization - ~6KB, crucial for user input safety)
- vite-plugin-compression (Gzip + Brotli pre-compression)

**Type Safety:**
- TypeScript (strict everywhere)
- Zod (schema validation)
- Drizzle ORM (type-safe SQL)

**Security:**
- jose (JWT - Cloudflare Workers compatible)
- Web Crypto API (password hashing)
- DOMPurify (XSS prevention)

**Database:**
- Drizzle ORM 0.44.7 - Relations, migrations, type-safe queries
- D1 - Cloudflare SQLite (serverless, no connection pools needed)

## Bundle Size Enforcement

**Target:** < 100KB gzipped per page

**Tools:**
- `npm run build:analyze` - Visual treemap analysis
- `npm run bundle:check` - CI-friendly size check (fails if exceeded)
- Vite analyzer - Auto runs on build with `ANALYZE=true`

**Manual Chunking Strategy:**
```javascript
// vite.config.js rollupOptions.output.manualChunks
{
  vendor: ['react', 'react-dom'],           // ~50KB
  router: ['react-router', 'react-router-dom'], // ~15KB
  maps: ['leaflet'],                        // ~43KB
  state: ['zustand'],                       // ~3KB
  utils: ['dompurify'],                     // ~6KB
}
```

**Icon Tree-Shaking:**
- ✅ Import individually: `import { MapPin } from '@/components/icons'`
- ❌ Never use wildcard: `import * from 'lucide-react'`

---

*Stack analysis: 2026-03-18*
