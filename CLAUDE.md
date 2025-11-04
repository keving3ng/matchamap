# MatchaMap - Claude Code Development Guide

## Project Overview

MatchaMap is a mobile-first web application providing a curated, map-based guide to matcha cafes in Toronto (expanding to more cities). The platform features expert reviews, ratings, location-based discovery tools, and community features with a Japanese-inspired aesthetic.

**Tech Stack:** React 19 | Zustand 5 | Vite 7 | Tailwind CSS 4 | Cloudflare Workers + D1 + R2 | TypeScript (strict mode)

**Project Phase:** V2 Development (User Accounts + Social Features + Photo Uploads)

---

## Architecture Principles (Top 3 Priority)

### 1. Performance-First ⚡

**MUST maintain these targets:**
-   **LCP**: < 2.5 seconds
-   **FID**: < 100ms
-   **CLS**: < 0.1
-   **Bundle size**: < 100KB total per page (currently ~80KB)
-   **Time to Interactive**: < 3.5 seconds on 3G

**Performance rules:**
-   Always lazy load routes and heavy components
-   Optimize images (WebP, proper sizing, lazy loading)
-   Minimize re-renders (React.memo, useMemo, useCallback when needed)
-   Keep Zustand stores focused and minimal
-   Test on real mobile devices, not just desktop emulation

### 2. Mobile-First Design 📱

**ALWAYS start with mobile (320px), then scale up:**
-   Base styles = mobile (320px-640px)
-   `sm:` = tablet (640px+)
-   `md:` = small desktop (768px+)
-   `lg:` = desktop (1024px+)

**Touch-first interactions:**
-   Minimum touch target: 44px × 44px (enforced via CSS)
-   Swipe gestures where appropriate
-   One-handed operation priority
-   No hover-dependent interactions

### 3. Lean & Efficient 🎯

**Keep it simple:**
-   Avoid over-engineering
-   Use browser APIs before libraries
-   Prefer CSS animations over JS when possible
-   Remove unused code aggressively
-   Bundle analysis on every major change

### Bundle Size Strategy 📦

**Target:** < 100KB gzipped per page (enforced in CI/CD)

**Tools:**
- `npm run build:analyze` - Visual bundle analysis with treemap
- `npm run bundle:check` - CI-friendly size check (fails build if exceeded)
- Vite bundle analyzer - Automatic on build with `ANALYZE=true`

**Optimization Techniques:**

**1. Tree-Shaking (CRITICAL)**
- ✅ Import icons individually: `import { MapPin } from '@/components/icons'`
- ✅ Use ES modules (not CommonJS)
- ❌ Avoid `import *` patterns (imports entire library)

**2. Code Splitting**
- ✅ Admin panel: Lazy loaded via `React.lazy()`
- ✅ Events page: Lazy loaded
- ✅ Photos functionality: Contained within admin (lazy loaded)
- ✅ Route-based splitting enabled by default

**3. Dependency Management**
- Audit new dependencies: `npm run bundle:check` before adding
- Prefer lightweight alternatives
- Tree-shakeable libraries only

**4. Manual Chunking (Optimized)**
- `vendor`: React + React DOM (~50KB gzipped)
- `router`: React Router (~15KB gzipped)
- `maps`: Leaflet (heavy ~43KB gzipped)
- `state`: Zustand (~3KB gzipped)
- `utils`: DOMPurify (~6KB gzipped)

**5. Compression**
- Gzip: Enabled in production
- Brotli: Enabled in production (better compression)
- Pre-compressed assets served by Cloudflare Pages

**Icon Tree-Shaking (IMPLEMENTED):**
```tsx
// ✅ CORRECT - Tree-shakeable
import { MapPin, Navigation } from '@/components/icons'

// ❌ INCORRECT - Imports entire library
import { MapPin, Navigation } from 'lucide-react'
```

**CI/CD Enforcement:**
- Bundle size check runs on every PR
- Build fails if budget exceeded
- Bundle analyzer artifacts available for review

**Adding New Dependencies:**
```bash
# 1. Check bundle impact first
npm install --save new-dependency
npm run build:analyze

# 2. Verify bundle size
npm run bundle:check

# 3. If exceeded, consider alternatives or lazy loading
```

**Monitoring:**
- Codecov bundle analysis integration
- Bundle size trending in CI logs
- Manual review during PR process

---

## Critical Patterns (ALWAYS Follow)

### Pattern 1: Copy Constants (i18n-Ready)

**CRITICAL:** ALWAYS use the centralized copy constants (`frontend/src/constants/copy.ts`) for ALL user-facing strings. NEVER use hardcoded strings in components.

**Why?**
- ✅ Single source of truth
- ✅ Type safety with full autocomplete
- ✅ Future i18n ready
- ✅ Easy audits
- ✅ Consistent messaging

**✅ CORRECT:**
```tsx
import { COPY } from '@/constants/copy'

const Header = () => (
  <button onClick={handleClick}>
    {COPY.map.getDirections}
  </button>
)
```

**❌ INCORRECT:**
```tsx
const Header = () => (
  <button onClick={handleClick}>
    Get Directions  {/* DON'T DO THIS */}
  </button>
)
```

**Adding new copy:**
```typescript
// In frontend/src/constants/copy.ts
export const COPY = {
  // ... existing copy
  myFeature: {
    title: 'My Feature',
    description: 'A great new feature',
    errorMessage: (error: string) => `Error: ${error}`,
  },
} as const
```

**Exceptions (only):**
- ❌ Dynamic data from API (cafe names, addresses, reviews)
- ❌ Technical console logs (debug messages not shown to users)
- ❌ Test data (mock strings in test files)

---

### Pattern 2: API Client (Centralized Communication)

**CRITICAL:** ALWAYS use the centralized API client (`frontend/src/utils/api.ts`) for all backend communication. NEVER use direct `fetch()` calls (except in authStore.ts).

**Why?**
- ✅ Consistent base URL (VITE_API_URL with /api prefix)
- ✅ Automatic auth token injection via cookies
- ✅ Consistent error handling (401/403 → session expired dialog)
- ✅ Type safety
- ✅ Cache-busting for GET requests
- ✅ No environment variable confusion

**✅ CORRECT:**
```tsx
import { api } from '../utils/api'

const handleSubmit = async () => {
  try {
    await api.waitlist.join(email)
    setSuccess(true)
  } catch (error) {
    console.error('Failed:', error)
  }
}
```

**❌ INCORRECT:**
```tsx
// DON'T DO THIS - bypasses all centralized handling
const response = await fetch(`${import.meta.env.VITE_API_URL}/api/waitlist`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email })
})
```

**Available API modules:**
```typescript
export const api = {
  cafes: cafeAPI,          // Cafe CRUD, import/export
  cities: citiesAPI,       // City list with cafe counts
  events: eventsAPI,       // Events CRUD
  health: healthAPI,       // Health check
  places: placesAPI,       // Google Places lookup
  drinks: drinksAPI,       // Drink CRUD
  admin: adminAPI,         // Admin utilities
  waitlist: waitlistAPI,   // Waitlist management
  profile: profileAPI,     // User profiles
  userAdmin: userAdminAPI, // User management (admin)
  stats: statsAPI,         // Analytics tracking, check-ins
}
```

**Adding new API endpoints:**
```typescript
// In frontend/src/utils/api.ts
export const myFeatureAPI = {
  async doSomething(data: SomeType): Promise<ResponseType> {
    return fetchAPI('/my-endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

export const api = {
  cafes: cafeAPI,
  myFeature: myFeatureAPI,  // Add here
}
```

**Exception:** `authStore.ts` uses direct fetch to avoid circular dependency (it provides tokens to fetchAPI).

---

### Pattern 3: Shared UI Components (Design System)

**IMPORTANT:** Always use shared components from `frontend/src/components/ui/` instead of inline styles or duplicating component code.

**Available Components:**
- **Buttons:** `PrimaryButton`, `SecondaryButton`, `TertiaryButton`, `IconButton`, `FilterButton`
- **Badges:** `ScoreBadge`, `DrinkScoreBadge`, `StatusBadge`, `FeatureBadge`, `NotificationBadge`
- **Dialogs:** `AlertDialog`, `InfoCard`, `ErrorAlert`
- **Loading:** `Skeleton`, `CafeCardSkeleton`, `ListSkeleton`, `DetailPageSkeleton`

**✅ CORRECT:**
```tsx
import { PrimaryButton, ScoreBadge, AlertDialog } from '@/components/ui'

<PrimaryButton icon={Navigation} onClick={handleClick}>
  Get Directions
</PrimaryButton>

<ScoreBadge score={8.5} size="lg" />

<AlertDialog
  variant="error"
  title="Location Access Needed"
  message="We need your location to show nearby cafes."
  primaryAction={{ label: "Try Again", onClick: handleRetry }}
/>
```

**❌ INCORRECT:**
```tsx
// DON'T create custom buttons - use shared components
<button className="bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl">
  Get Directions
</button>
```

**Benefits:**
- 80% less code per instance
- Automatic 44px touch targets (WCAG compliant)
- Consistent active states (`active:scale-[0.98]`)
- Built-in accessibility (focus rings, aria-labels)
- Type-safe props

**Design Tokens:**
```typescript
import { spacing, borderRadius, shadows, zIndex } from '@/styles/spacing'

spacing.cardPadding      // 16px
spacing.sectionGap       // 24px
spacing.minTouchTarget   // 44px
borderRadius.xl          // 24px
zIndex.modal             // 9999
```

---

### Pattern 4: Lazy Loading (useLazyData Hook)

**IMPORTANT:** Always use the `useLazyData` hook for lazy loading data in view components.

**Why?**
- ✅ Automatic cache checking (won't refetch data already loaded)
- ✅ Consistent pattern across all views
- ✅ Performance optimization (reduces unnecessary API calls)
- ✅ Semantic clarity

**✅ CORRECT:**
```tsx
import { useLazyData } from '../hooks/useLazyData'
import { useDataStore } from '../stores/dataStore'

export const EventsView: React.FC<EventsViewProps> = ({ events }) => {
  const { fetchEvents, eventsFetched } = useDataStore()

  // Lazy load events when component mounts (only if not already fetched)
  useLazyData(fetchEvents, eventsFetched)

  return (
    // ... component JSX
  )
}
```

**When to use:**
- View components that fetch their own data (Events, Store, etc.)
- Data should only load when user navigates to the view
- Data should be cached in Zustand after first fetch

**When NOT to use:**
- Components that receive data via props (MapView, ListView, PassportView)
- Components that need to refetch on every mount
- Initial page load data (use AppRoutes.tsx instead)

---

## State Management Philosophy

### Zustand Stores (Global State)

**When to use:**
- Shared state across multiple components
- Persistent state (localStorage/sessionStorage)
- Complex state with multiple actions
- Authentication, user preferences, UI state

**Store organization:**
```
frontend/src/stores/
├── locationStore.ts      # User geolocation
├── visitedCafesStore.ts  # Passport/visited tracking (localStorage)
├── uiStore.ts            # UI state (modals, panels, bottom nav)
├── authStore.ts          # Authentication state (JWT tokens)
├── dataStore.ts          # Cafes, events data
├── cityStore.ts          # Multi-city support
├── cafeStore.ts          # Cafe-specific state
└── adminStore.ts         # Admin panel state
```

**Rules:**
- Keep stores focused and single-purpose
- Use persist middleware for data that survives refresh
- Always type stores with TypeScript interfaces
- Export typed hooks, not raw store

### Custom Hooks (Component Logic)

**When to use:**
- Reusable component logic
- API calls and data fetching
- Complex local state management
- Side effects and lifecycle management

**Available hooks:**
```
frontend/src/hooks/
├── useAppFeatures.ts          # Feature flag access
├── useCafeSelection.ts        # Cafe selection logic
├── useDistanceCalculation.ts  # Distance sorting
├── useFeatureToggle.ts        # Individual feature flag
├── useGeolocation.ts          # User location
├── useLazyData.ts             # Lazy data loading
├── useLeafletMap.ts           # Map initialization
├── useRouteVisualization.ts   # Map route drawing
├── useSessionExpiry.ts        # Session expiry dialog
├── useSwipeGesture.ts         # Touch gestures
├── useUserFeatures.ts         # User account feature flags
├── useUserProfile.ts          # User profile data
└── useVisitedCafes.ts         # Passport data access
```

**Rules:**
- Name all hooks with `use` prefix
- One hook = one concern
- Document complex hooks with JSDoc
- Return objects, not arrays (better for destructuring)
- Avoid deeply nested hooks

---

## Code Organization (STRICT)

### Directory Structure

```
frontend/src/
├── components/
│   ├── ui/              # ⭐ SHARED UI COMPONENTS (use these!)
│   ├── admin/           # Admin panel components
│   ├── auth/            # Login, register, protected routes
│   ├── profile/         # User profile components
│   ├── Header.tsx
│   ├── MapView.tsx
│   ├── ListView.tsx
│   ├── DetailView.tsx
│   ├── PassportView.tsx
│   ├── EventsView.tsx
│   └── __tests__/       # Component tests
├── hooks/               # Custom React hooks ONLY
├── stores/              # Zustand stores ONLY
├── utils/               # Pure utility functions ONLY
├── types/               # Frontend-specific types
├── styles/              # Global CSS, Tailwind, design tokens
│   └── spacing.ts       # ⭐ Design tokens
├── constants/
│   ├── copy.ts          # ⭐ All user-facing strings
│   └── cafeFields.ts    # Cafe field definitions
├── config/
│   └── features.yaml    # ⭐ Feature flags
├── test/
│   ├── setup.ts         # Test setup (mocks, globals)
│   ├── helpers.ts       # Test utilities
│   └── mocks/           # Test mocks
└── App.tsx              # Root component
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `CafeCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useGeolocation.ts`)
- **Utilities**: camelCase (e.g., `distanceCalculator.ts`)
- **Stores**: camelCase (e.g., `locationStore.ts`)

### Component Rules (MUST Follow)

1. **Functional components only** - No class components
2. **TypeScript required** - All components use `.tsx`
3. **Props interface first** - Define `interface ComponentProps` before component
4. **Named exports** - Use `export const Component` (not default)
5. **File = Component** - One component per file, file name matches component name

---

## Anti-Patterns & Best Practices

### ❌ Don't Do This

**Hardcoded strings in components:**
```tsx
<button>Get Directions</button>  // Use COPY.map.getDirections
```

**Direct fetch() calls:**
```tsx
await fetch('/api/cafes')  // Use api.cafes.getAll()
```

**Custom buttons with inline styles:**
```tsx
<button className="bg-gradient...">Click</button>  // Use PrimaryButton
```

**Arbitrary Tailwind values:**
```tsx
<div className="p-[16px]">  // Use p-4 or spacing.cardPadding
```

**Using `any` types:**
```tsx
const data: any = {}  // Define proper types
```

**God components (>300 lines):**
```tsx
// Split into smaller focused components
```

**Prop drilling:**
```tsx
// Use Zustand store instead
```

### ✅ Do This Instead

```tsx
import { COPY } from '@/constants/copy'
import { api } from '@/utils/api'
import { PrimaryButton } from '@/components/ui'
import { spacing } from '@/styles/spacing'

// Proper types
interface CafeCardProps {
  cafe: CafeWithDistance
  onSelect: (cafe: CafeWithDistance) => void
}

// Named export
export const CafeCard: React.FC<CafeCardProps> = ({ cafe, onSelect }) => {
  const handleClick = async () => {
    await api.cafes.getById(cafe.id)
  }

  return (
    <div className="p-4">  {/* Use Tailwind spacing classes */}
      <PrimaryButton onClick={handleClick}>
        {COPY.map.getDirections}
      </PrimaryButton>
    </div>
  )
}
```

---

## When to Refactor

**Extract to component when:**
- Code duplicated 2+ times
- File > 300 lines
- Complex section that could be named
- Different responsibility/concern

**Extract to hook when:**
- Reusable logic across components
- Complex state management
- Side effects need coordination
- API/data fetching logic

**Extract to Zustand store when:**
- State shared across 3+ components
- State needs persistence
- Complex state with many actions
- Authentication/global UI state

**Extract to utility when:**
- Pure function (no React dependencies)
- Math/calculation logic
- Data transformation
- Reusable helpers

---

## Documentation Quick Reference

**Need detailed info?** Reference these docs in the `docs/` folder:

| Task | Document |
|------|----------|
| **Testing guide** | `docs/TESTING.md` ⭐ |
| **Database schema** | `docs/TECH_SPEC.md` → Database Schema section |
| **API endpoints** | `docs/TECH_SPEC.md` → API Architecture section |
| **Deployment** | `docs/DEPLOYMENT.md` |
| **Backend setup** | `docs/QUICKSTART_BACKEND.md` |
| **Feature flags** | `docs/feature-flags-guide.md` |
| **Social features** | `docs/social-features-guide.md` |
| **Photo uploads** | `docs/photo-upload-guide.md` ⭐ |
| **Analytics** | `docs/metrics-tracking-prd.md` |
| **Adding cities** | `docs/adding-new-cities.md` |
| **Full tech spec** | `docs/TECH_SPEC.md` |
| **Doc navigation** | `docs/README.md` ⭐ START HERE |

---

## Common Commands

```bash
# Development
npm run dev              # Start frontend dev server (Vite)
npm run dev:backend      # Start backend dev server (Wrangler)

# Build & Deploy
npm run build            # Build all workspaces
npm run build:frontend   # Build frontend only
npm run deploy:backend   # Deploy backend to Cloudflare

# Quality checks (run before commit)
npm test                 # Run all tests (target: 100% passing)
npm run typecheck        # Check TypeScript types
npm run lint             # Lint frontend code
npm run lint:ci          # Lint with max 200 warnings (CI mode)

# Backend (from backend/ directory or root)
cd backend
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate:local # Apply migrations locally
npm run db:migrate:prod  # Apply migrations to production
npm run tail             # View live logs
npm run create-admin     # Create admin user

# Testing
npm test                 # Run all tests once
npm test -- --watch      # Watch mode
npm test -- --coverage   # With coverage report
npm test -- --ui         # Interactive UI mode
```

**Pre-commit checklist:**
1. ✅ `npm test` passes (100% passing required)
2. ✅ `npm run typecheck` passes
3. ✅ `npm run build` succeeds
4. ✅ No console errors in browser
5. ✅ Test on mobile viewport (320px)
6. ✅ Check bundle size didn't explode

---

## Key Features

### V1 Features (Complete)
1. **Interactive Map Interface** - Toronto-centered map with cafe pins, popover with info
2. **List View** - Expandable card interface with sorting (neighborhood, rating, distance)
3. **Location Detail Pages** - Static pages with scores, reviews, social links, navigation
4. **Matcha Passport** - Local storage visit tracking with progress visualization
5. **Events** - Community events and workshops
6. **FAQ/About Section** - Rating rubric, about the reviewer

### V2 Features (In Progress)
**Phase 2A: User Accounts & Check-ins**
- ✅ User registration and login (email/password)
- ✅ JWT-based authentication with refresh tokens
- ✅ Email verification system
- ✅ Profile management (view, edit)
- ✅ User admin management
- ⏳ Check-ins and passport sync

**Phase 2B: Reviews & Ratings** (Completed - Backend)
- ✅ Review CRUD API endpoints
- ✅ Rating aggregation (admin + user ratings)
- ⏳ Frontend UI components

**Phase 2C: Photo Uploads** (Completed - Backend)
- ✅ Cloudflare R2 integration
- ✅ Photo upload API
- ✅ Moderation workflow
- ✅ Thumbnail generation (placeholder)
- ⏳ Frontend UI components
→ See `docs/photo-upload-guide.md`

**Phase 2D+: Social Features** (Planned)
- Following system
- Activity feed
- Badges and achievements
- Leaderboards
→ See `docs/social-features-guide.md`

---

## User Management & Social Features

**Feature Flags:** `ENABLE_USER_ACCOUNTS`, `ENABLE_USER_PROFILES`, `ENABLE_USER_SOCIAL`

**Use the `useUserFeatures` hook:**
```tsx
import { useUserFeatures } from '@/hooks/useUserFeatures'

const { hasUserAccounts, hasUserProfiles, hasUserSocial } = useUserFeatures()

{hasUserAccounts && <LoginButton />}
{hasUserProfiles && <ProfileLink />}
{hasUserSocial && <CheckInButton />}
```

**Implemented:**
- ✅ User registration and login (email/password)
- ✅ JWT-based authentication with refresh tokens (cookies)
- ✅ Email verification system
- ✅ Profile management (GET, PUT endpoints)
- ✅ Session management via `sessions` table
- ✅ Protected routes with `<ProtectedRoute>` component
- ✅ Session expiry handling with dialog
- ✅ User admin management (list users, update roles, delete users)
- ✅ Waitlist system with analytics
- ⏳ Social features (Phase 2 - see docs/social-features-guide.md)

---

## Testing Approach

**Automated Testing**: 100% tests passing ✅ | See `docs/TESTING.md` for comprehensive guide

### Automated Tests (Vitest + Testing Library)

**Test Structure:**
```
frontend/src/
├── stores/__tests__/       # Store tests (260/260 passing - 100%)
├── components/__tests__/   # Component tests
├── hooks/__tests__/        # Hook tests
├── utils/__tests__/        # Utility tests
└── test/
    ├── setup.ts            # Global test setup
    ├── helpers.ts          # Test utilities
    └── mocks/              # Test mocks
```

**Key Testing Patterns:**
- **Store Tests**: Use `waitForPersistence()` for async Zustand persistence
- **Component Tests**: Use `userEvent` for realistic user interactions
- **API Mocking**: Use centralized API mock pattern with `vi.mocked()`
- **Feature Flags**: Use `mockFeatureFlag()` utility

**Running Tests:**
```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- path/to/test    # Run specific test
npm test -- --coverage      # With coverage
npm test -- --ui            # Interactive UI mode
```

**See `docs/TESTING.md` for:**
- Complete testing patterns and examples
- Store test refactoring guide
- Troubleshooting common issues
- Best practices and anti-patterns

### Manual Testing Checklist

- [ ] Mobile responsiveness (320px-768px)
- [ ] Touch interactions work properly
- [ ] Map functionality on mobile
- [ ] Geolocation permission handling
- [ ] Local storage persistence
- [ ] Performance on slow networks

**Cross-Browser Testing:**
- Safari (iOS) - Primary mobile target
- Chrome (Android) - Secondary mobile target
- Desktop browsers - Tertiary support

---

## Git Workflow

### GitHub MCP Server (Required for All GitHub Operations)

**CRITICAL:** ALWAYS use the GitHub MCP server tools (`mcp__github__*`) for ALL GitHub-related operations. NEVER use `gh` CLI or direct `git` commands for GitHub interactions.

**Why?**
- ✅ Centralized GitHub integration
- ✅ Consistent error handling
- ✅ Better automation support
- ✅ Type-safe operations
- ✅ No CLI configuration needed

**Available GitHub MCP Tools:**

**Repository Operations:**
- `mcp__github__get_file_contents` - Read files from repository
- `mcp__github__create_or_update_file` - Update single file
- `mcp__github__push_files` - Push multiple files in one commit

**Issue Management:**
- `mcp__github__create_issue` - Create new issues
- `mcp__github__list_issues` - List and filter issues
- `mcp__github__get_issue` - Get issue details
- `mcp__github__update_issue` - Update existing issues
- `mcp__github__add_issue_comment` - Add comments to issues

**Pull Request Management:**
- `mcp__github__create_pull_request` - Create PRs
- `mcp__github__list_pull_requests` - List PRs
- `mcp__github__pull_request_read` - Get PR details, diff, files, reviews
- `mcp__github__update_pull_request` - Update PRs
- `mcp__github__merge_pull_request` - Merge PRs
- `mcp__github__create_pending_pull_request_review` - Create review
- `mcp__github__add_comment_to_pending_review` - Add review comments
- `mcp__github__submit_pending_pull_request_review` - Submit review

**Branch Operations:**
- `mcp__github__create_branch` - Create new branch
- `mcp__github__list_commits` - List commit history
- `mcp__github__list_branches` - List branches

**Search:**
- `mcp__github__search_code` - Search code across repos
- `mcp__github__search_issues` - Search issues and PRs
- `mcp__github__search_repositories` - Search repositories
- `mcp__github__search_users` - Search users

**✅ CORRECT GitHub Operations:**

```typescript
// Creating an issue
await mcp__github__create_issue({
  owner: 'keving3ng',
  repo: 'matchamap',
  title: 'Fix authentication bug',
  body: 'Description of the issue...',
  labels: ['bug', 'frontend', 'high-priority']
})

// Pushing changes
await mcp__github__push_files({
  owner: 'keving3ng',
  repo: 'matchamap',
  branch: 'main',
  message: 'feat(cities): add Vancouver',
  files: [
    { path: 'shared/types/index.ts', content: '...' },
    { path: 'frontend/src/stores/cityStore.ts', content: '...' }
  ]
})

// Creating a PR
await mcp__github__create_pull_request({
  owner: 'keving3ng',
  repo: 'matchamap',
  title: 'Add new feature',
  body: 'PR description...',
  head: 'feature-branch',
  base: 'main'
})
```

**❌ INCORRECT - Don't Use These:**

```bash
# DON'T use gh CLI
gh issue create --title "..." --body "..."
gh pr create --title "..."

# DON'T use git for GitHub operations
git push origin main  # Use mcp__github__push_files instead
```

**Exception:** You MAY use basic `git` commands for local operations only:
- `git status` - Check local changes
- `git diff` - View local diffs
- `git log` - View commit history
- `git fetch` - Fetch remote changes
- `git checkout` - Switch branches locally
- `git pull` - Pull remote changes

But for ANY operation that interacts with GitHub (push, create issue, create PR), use the MCP server.

### Commit Message Format

```
type(scope): description

feat(map): add geolocation functionality
fix(passport): resolve localStorage persistence issue
docs(readme): update deployment instructions
```

**Types:** feat, fix, docs, style, refactor, test, chore

---

## Environment & Deployment

**Cloudflare Pages (Frontend):**
- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Auto-deploys on push to `main`
- Environment variables: Set in Cloudflare Pages dashboard

**Cloudflare Workers (Backend):**
- Deploy: `cd backend && npm run deploy`
- Wrangler configuration: `backend/wrangler.toml`
- D1 database binding: `DB`
- R2 bucket binding: `PHOTOS_BUCKET` (for photo uploads)
- Environment: Production and Dev environments available

**Cloudflare R2 (Photo Storage):**
- Bucket: `matchamap-photos` (prod), `matchamap-photos-dev` (dev)
- Setup: `npx wrangler r2 bucket create matchamap-photos`
- Custom domain: `photos.matchamap.app` (configurable)
- See `docs/photo-upload-guide.md`

**Environment Variables:**
- Frontend: Feature flags in `frontend/src/config/features.yaml`
- Backend: Managed by Wrangler (see `docs/DEPLOYMENT.md`)

**Content Updates:**
With backend in place, content updates via admin UI (protected by JWT auth). No rebuild or deploy needed.

---

## Feature Flags

All feature flags are defined in `frontend/src/config/features.yaml` with separate `dev` and `prod` values.

**Current Feature Flags:**
```yaml
ENABLE_PASSPORT: false (dev/prod)       # Matcha Passport
ENABLE_SEARCH: true (dev/prod)          # Search functionality
ENABLE_GEOLOCATION: true (dev/prod)     # Geolocation services
ENABLE_ADMIN_PANEL: true (dev/prod)     # Admin panel
SHOW_COMING_SOON: false/true (dev/prod) # Coming soon page
ENABLE_EVENTS: true (dev/prod)          # Events page
ENABLE_MENU: true/false (dev/prod)      # Hamburger menu
ENABLE_CITY_SELECTOR: true/false        # Multi-city selector

# User Account Features (Phase 2)
ENABLE_USER_ACCOUNTS: true (dev/prod)   # Base user system
ENABLE_USER_PROFILES: true/false        # Public profiles
ENABLE_USER_SOCIAL: true/true           # Social features
ENABLE_CONTACT: true/false              # Contact page
ENABLE_ABOUT: true/false                # About page
ENABLE_STORE: true/false                # Store page
ENABLE_SETTINGS: true/false             # Settings page
ENABLE_ROUTE_DISPLAY: false (dev/prod)  # Route visualization
```

**Using feature flags:**
```tsx
import { useFeatureToggle } from '@/hooks/useFeatureToggle'
import { useUserFeatures } from '@/hooks/useUserFeatures'

const isEnabled = useFeatureToggle('ENABLE_PASSPORT')
const { hasUserAccounts, hasUserSocial } = useUserFeatures()
```

See `docs/feature-flags-guide.md` for complete documentation.

---

## Troubleshooting

### Common Issues

1. **Map not loading**: Check Leaflet CSS import and container height
2. **Styles not applying**: Verify Tailwind purge configuration
3. **Build failures**: Check JSON syntax and component imports
4. **Mobile layout issues**: Test on actual devices, not just browser dev tools
5. **Session expired errors**: Check cookie configuration and JWT expiry
6. **Photo upload failures**: Verify R2 bucket exists and bindings are correct

### Debug Commands

```bash
npm run build -- --verbose    # Verbose build output
npm run typecheck             # Check for type errors
npx wrangler tail             # View live backend logs
npx wrangler d1 execute matchamap-db --remote --command "SELECT * FROM users LIMIT 10"
```

---

## Code Review Checklist

Before marking any task complete, verify:

**TypeScript:**
- [ ] No `any` types
- [ ] All props interfaces defined
- [ ] `npm run typecheck` passes

**Performance:**
- [ ] No unnecessary re-renders
- [ ] Heavy computations memoized
- [ ] Lazy loading where appropriate
- [ ] Bundle size < 100KB per page

**Mobile-First:**
- [ ] Tested at 320px width
- [ ] Touch targets ≥ 44px
- [ ] No hover-only interactions
- [ ] Works one-handed

**Patterns:**
- [ ] Copy constants used (no hardcoded strings)
- [ ] API client used (no direct fetch)
- [ ] Shared UI components used (no custom buttons)
- [ ] Design tokens used (no arbitrary values)

**Code Quality:**
- [ ] Component < 300 lines
- [ ] Single responsibility per component
- [ ] Descriptive variable names
- [ ] No magic numbers/strings

**Testing:**
- [ ] Tests pass (`npm test`)
- [ ] New tests added for new features
- [ ] Test coverage maintained

---

## Support Resources

- **Documentation:** Start with `docs/README.md`
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

---

_Last updated: 2025-11-03_
_Project Phase: V2 Development (User Accounts + Social Features + Photo Uploads)_
_React: 19.0 | Zustand 5.0 | Vite 7.1 | Tailwind CSS 4.1 | TypeScript: Strict Mode_
_UI Component Library: Available in `frontend/src/components/ui/`_
_Test Suite: 100% passing ✅ - See docs/TESTING.md_
_GitHub Operations: GitHub MCP Server (mcp__github__*) - See Git Workflow section_
_Repository Owner: keving3ng_
