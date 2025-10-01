# MatchaMap - Claude Code Development Guide

## Project Overview

MatchaMap is a mobile-first web application providing a curated, map-based guide to matcha cafes in Toronto. The platform features expert reviews, ratings, and location-based discovery tools with a Japanese-inspired aesthetic.

## Tech Stack

-   **Framework**: React 18.3+ (functional components, hooks-first)
-   **State Management**: Zustand (lightweight, performant global state)
-   **Build Tool**: Vite 5+ (fast builds, HMR, ES modules)
-   **Styling**: Tailwind CSS 3+ with custom design tokens
-   **Routing**: React Router 6+ (client-side routing)
-   **Maps**: Leaflet (vanilla JS in React components)
-   **Backend**: Cloudflare Workers + D1 Database (SQLite at edge)
-   **API**: REST API with itty-router + Drizzle ORM
-   **Hosting**: Cloudflare Pages (edge deployment, global CDN)
-   **TypeScript**: Strict mode enabled for type safety

## Architecture Principles

### 1. Performance-First (Top 3 Priority)

**MUST maintain these targets:**
-   **LCP**: < 2.5 seconds
-   **FID**: < 100ms
-   **CLS**: < 0.1
-   **Bundle size**: < 100KB total per page
-   **Time to Interactive**: < 3.5 seconds on 3G

**Performance rules:**
-   Always lazy load routes and heavy components
-   Optimize images (WebP, proper sizing)
-   Minimize re-renders (React.memo, useMemo, useCallback when needed)
-   Keep Zustand stores focused and minimal
-   Test on real mobile devices, not just desktop emulation

### 2. Mobile-First Design (Top 3 Priority)

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

### 3. Lean & Efficient (Top 3 Priority)

**Keep it simple:**
-   Avoid over-engineering
-   Use browser APIs before libraries
-   Prefer CSS animations over JS when possible
-   Remove unused code aggressively
-   Bundle analysis on every major change

## State Management Philosophy

### Zustand Stores (Preferred for Global State)

**When to use Zustand:**
-   Shared state across multiple components
-   Persistent state (localStorage/sessionStorage)
-   Complex state with multiple actions
-   Authentication, user preferences, UI state

**Store organization:**
```
src/stores/
├── locationStore.ts      # User geolocation
├── visitedCafesStore.ts  # Passport/visited tracking
├── uiStore.ts            # UI state (modals, panels)
└── authStore.ts          # Authentication state
```

**Store rules:**
-   Keep stores focused and single-purpose
-   Use persist middleware for data that survives refresh
-   Always type stores with TypeScript interfaces
-   Export typed hooks, not raw store

### Custom Hooks (Preferred for Component Logic)

**When to use hooks:**
-   Reusable component logic
-   API calls and data fetching
-   Complex local state management
-   Side effects and lifecycle management

**Hook organization:**
```
src/hooks/
├── useGeolocation.ts         # Browser geolocation
├── useDistanceCalculation.ts # Cafe distance math
├── useCafeSelection.ts       # Cafe selection logic
├── useVisitedCafes.ts        # Wrapper around store
└── useFeatureToggle.ts       # Feature flags
```

**Hook rules:**
-   Name all hooks with `use` prefix
-   One hook = one concern
-   Document complex hooks with JSDoc
-   Return objects, not arrays (better for destructuring)
-   Avoid deeply nested hooks

## Key Features (V1)

1. **Interactive Map Interface**

    - Toronto-centered map with cafe pins
    - Popover with key cafe info
    - User location centering (optional)
    - Toggle to list view

2. **List View**

    - Expandable card interface
    - Sorting by neighborhood, rating, distance
    - Compact and expanded view states

3. **Location Detail Pages**

    - Static pages generated from JSON data
    - Primary/secondary scores, reviews, social links
    - Navigation integration with maps apps

4. **Matcha Passport**

    - Local storage visit tracking
    - Progress visualization
    - "I've been here" checkbox functionality

5. **News/Blog Feed**

    - Updates about new cafes and changes
    - Blog-style layout fed from same JSON data

6. **FAQ/About Section**
    - Rating rubric explanation
    - About the reviewer
    - How to suggest locations

## Data Management

### Backend Architecture (Phase 1+)

-   **Database**: Cloudflare D1 (SQLite at the edge)
-   **API**: Cloudflare Workers with REST endpoints
-   **Admin**: Custom React admin UI (protected by Cloudflare Access)
-   **Analytics**: Simple counter-based metrics (no external tools)

### API Endpoints

**Public API:**
- `GET /api/cafes` - List all cafes
- `GET /api/cafes/:id` - Single cafe details
- `GET /api/feed` - News feed items
- `GET /api/events` - Upcoming events

**Admin API (Cloudflare Access protected):**
- `POST /api/admin/cafes` - Create cafe
- `PUT /api/admin/cafes/:id` - Update cafe
- `DELETE /api/admin/cafes/:id` - Soft delete cafe
- `GET /api/admin/cafe-stats` - Analytics dashboard

**Analytics API (fire-and-forget):**
- `POST /api/stats/cafe/:id/:stat` - Track cafe metrics
- `POST /api/stats/feed/:id` - Track feed clicks
- `POST /api/stats/event/:id` - Track event clicks

### Update Workflow

1. Login to admin UI (protected by Cloudflare Access)
2. Edit cafe data via admin forms
3. Changes saved to D1 database instantly
4. Frontend fetches updated data from API
5. No rebuild or deploy needed

## Code Organization & Location Rules

### Directory Structure (STRICT)

```
src/
├── components/          # React components ONLY
│   ├── Header.tsx
│   ├── BottomNavigation.tsx
│   ├── AppRoutes.tsx
│   ├── MapView.tsx
│   ├── ListView.tsx
│   ├── DetailView.tsx
│   └── __tests__/      # Component tests
├── admin/              # Admin UI components
│   ├── StatsPage.tsx   # Analytics dashboard
│   └── CafeEditor.tsx  # Cafe CRUD forms
├── hooks/              # Custom React hooks ONLY
│   ├── useGeolocation.ts
│   ├── useCafeSelection.ts
│   └── useDistanceCalculation.ts
├── stores/             # Zustand stores ONLY
│   ├── locationStore.ts
│   ├── uiStore.ts
│   ├── cityStore.ts
│   └── visitedCafesStore.ts
├── utils/              # Pure utility functions ONLY
│   ├── distanceCalculator.ts
│   ├── deviceDetection.ts
│   └── analytics.ts    # Tracking utilities
├── types/              # TypeScript type definitions
│   └── index.ts
├── styles/             # Global CSS and Tailwind config
│   └── index.css
├── App.tsx             # Root component (composition only)
└── main.tsx            # React entry point

workers/                # Backend (separate directory)
├── src/
│   ├── index.ts        # Workers entry point
│   ├── routes/
│   │   ├── cafes.ts    # Cafe CRUD endpoints
│   │   ├── stats.ts    # Analytics endpoints
│   │   └── admin.ts    # Admin endpoints
│   └── db/
│       └── schema.ts   # Drizzle ORM schema
└── migrations/         # Database migrations
```

### Component Rules

**MUST follow these patterns:**

1. **Functional components only** - No class components
2. **TypeScript required** - All components use `.tsx`
3. **Props interface first** - Define `interface ComponentProps` before component
4. **Named exports** - Use `export const Component` (not default)
5. **File = Component** - One component per file, file name matches component name

**Component composition:**
```tsx
// ✅ GOOD - Focused, single-purpose
export const CafeCard: React.FC<CafeCardProps> = ({ cafe }) => {
  // Component logic
}

// ❌ BAD - Multiple components in one file
export const CafeCard = () => {}
export const CafeList = () => {}
```

**When to extract a component:**
-   Logic repeated 2+ times → Create reusable component
-   Component file > 300 lines → Split into smaller components
-   Complex UI section → Extract to named component
-   Different responsibilities → Separate components

### Styling & Design System

**Design Tokens (Tailwind Config):**

```javascript
// tailwind.config.js
colors: {
  matcha: {
    50: '#f0f7e9',
    100: '#e1efd3',
    // ... full scale
    500: '#7cb342',  // Primary
    600: '#689f38',
    // ... to 900
  },
  cream: { /* ... */ },
  charcoal: { /* ... */ }
}
```

**Use design tokens, not arbitrary values:**
```tsx
// ✅ GOOD - Uses design tokens
<div className="bg-matcha-500 text-cream-50">

// ❌ BAD - Arbitrary values
<div className="bg-[#7cb342] text-[#faf7f2]">
```

**Animation Philosophy:**

Small, purposeful animations that enhance UX without hurting performance:
-   **Duration**: 150-300ms (never > 500ms)
-   **Easing**: `ease-out` for exits, `ease-in-out` for movements
-   **Prefer CSS animations** over JS (better performance)
-   **Use transforms** (translateX, scale) over position/size changes
-   **Animate sparingly** - only state changes and transitions

**Animation patterns:**
```css
/* ✅ GOOD - CSS keyframe animation */
@keyframes slide-down {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ❌ AVOID - JS-driven animations unless necessary */
```

### TypeScript Rules

**STRICT mode enabled** - No `any` types allowed

```tsx
// ✅ GOOD - Fully typed
interface CafeCardProps {
  cafe: CafeWithDistance
  onSelect: (cafe: CafeWithDistance) => void
}

// ❌ BAD - Using any
interface BadProps {
  data: any
  onClick: (item: any) => void
}
```

**Type organization:**
-   Shared types → `src/types/index.ts`
-   Component-specific types → Same file as component
-   Store types → Same file as store definition

### Finding Code (For Claude Code)

**To find a component:**
```bash
# Search by component name
glob "**/*ComponentName*.tsx"

# Search by functionality
grep "functionName" --type ts
```

**To find where something is used:**
```bash
# Find all imports
grep "import.*ComponentName" --type ts

# Find all usages
grep "ComponentName" --type tsx
```

**Common locations:**
-   UI components → `src/components/`
-   Business logic → `src/hooks/`
-   Global state → `src/stores/`
-   Pure functions → `src/utils/`
-   Type definitions → `src/types/`

## Common Commands

```bash
# Development
npm run dev              # Start dev server (Vite)
npm run build           # Build for production
npm run preview         # Preview built site
npm run typecheck       # TypeScript type checking (MUST pass)

# Quality checks (run before commit)
npm run typecheck       # Check TypeScript types
npm run build           # Ensure build succeeds

# Testing (when implemented)
npm run test            # Run test suite
npm run test:watch      # Run tests in watch mode
```

**Pre-commit checklist:**
1. ✅ `npm run typecheck` passes
2. ✅ `npm run build` succeeds
3. ✅ No console errors in browser
4. ✅ Test on mobile viewport (320px)
5. ✅ Check bundle size didn't explode

## Testing Approach

### Manual Testing Checklist

-   [ ] Mobile responsiveness (320px-768px)
-   [ ] Touch interactions work properly
-   [ ] Map functionality on mobile
-   [ ] Geolocation permission handling
-   [ ] Local storage persistence
-   [ ] Performance on slow networks

### Cross-Browser Testing

-   Safari (iOS) - Primary mobile target
-   Chrome (Android) - Secondary mobile target
-   Desktop browsers - Tertiary support

## File Naming Conventions

-   **Components**: PascalCase (e.g., `CafeCard.jsx`)
-   **Pages**: PascalCase (e.g., `CafeDetailPage.jsx`)
-   **Hooks**: camelCase with 'use' prefix (e.g., `useGeolocation.js`)
-   **Utilities**: camelCase (e.g., `distanceCalculator.js`)
-   **Styles**: kebab-case (e.g., `global.css`)

## Git Workflow

### Branch Strategy

-   `main` - Production-ready code
-   `develop` - Integration branch
-   `feature/*` - Feature development
-   `hotfix/*` - Production fixes

### Commit Message Format

```
type(scope): description

feat(map): add geolocation functionality
fix(passport): resolve localStorage persistence issue
docs(readme): update deployment instructions
style(ui): improve mobile navigation spacing
```

## Environment & Deployment

### Cloudflare Pages Configuration

**Build Settings:**
-   Framework preset: Vite
-   Build command: `npm run build`
-   Build output directory: `dist`
-   Node version: 18+

**Environment Variables:**

We use a YAML config file for feature toggles instead of env vars:
```yaml
# src/config/features.yaml
ENABLE_PASSPORT: true
ENABLE_EVENTS: false
ENABLE_MENU: false
SHOW_COMING_SOON: false
```

**Why not .env?**
-   No secrets in this app (all public data)
-   Easier to track in version control
-   Type-safe with TypeScript
-   No build-time variable injection needed

**Deployment Process:**
1. Push to `main` branch
2. Cloudflare Pages auto-builds
3. Deployed to global CDN edge
4. Verify at production URL

**Branch Previews:**
-   Every branch gets preview URL
-   Auto-deleted when branch is merged
-   Perfect for testing before merge

### Weekly Content Updates

1. Update `src/data/cafes.json`
2. Commit to `main` branch
3. Cloudflare auto-deploys in ~1 minute
4. Global CDN cache updated automatically
5. Verify changes on production site

## Analytics & Metrics

### Simple Counter-Based Tracking

**What we track (no external tools):**
- Cafe views, direction clicks, passport marks
- Social media clicks (Instagram, TikTok)
- Feed article clicks
- Event clicks

**Implementation:**
```typescript
// Frontend: src/utils/analytics.ts
export async function trackCafeStat(
  cafeId: number,
  stat: 'view' | 'directions' | 'passport' | 'instagram' | 'tiktok'
): Promise<void> {
  // Fire and forget - don't block UI
  fetch(`/api/stats/cafe/${cafeId}/${stat}`, { method: 'POST' })
    .catch(() => {}) // Ignore errors silently
}

// Usage in components
useEffect(() => {
  trackCafeStat(cafe.id, 'view')
}, [cafe.id])
```

**Backend: Simple counter increments**
```typescript
// workers/src/routes/stats.ts
await env.DB.prepare(`
  INSERT INTO cafe_stats (cafe_id, views, updated_at)
  VALUES (?, 1, CURRENT_TIMESTAMP)
  ON CONFLICT(cafe_id)
  DO UPDATE SET views = views + 1, updated_at = CURRENT_TIMESTAMP
`).bind(cafeId).run()
```

**Admin Dashboard:**
- Custom React component at `/admin/stats`
- Sortable table showing views, CTR, passport usage
- Protected by Cloudflare Access
- See [metrics-tracking-prd.md](docs/metrics-tracking-prd.md)

**What we DON'T track:**
- User sessions or identities
- Cross-session behavior
- Personal information
- Complex funnels or cohorts

**When to add more:**
- Session tracking → When you have 1000+ daily users
- Discovery funnels → When optimizing user flows
- Search terms → When you have 100+ cafes

## Future Considerations (V2+)

-   User-submitted reviews
-   Social features (favorites, sharing)
-   Geographic expansion beyond Toronto
-   Advanced search (when > 200 cafes)
-   User accounts and authentication
-   Enhanced passport features with rewards

## Quick Reference

### Color Palette

-   Primary Matcha: `#7cb342`
-   Light Matcha: `#aed581`
-   Dark Matcha: `#558b2f`
-   Cream Background: `#faf7f2`
-   Charcoal Text: `#2e2e2e`
-   Accent Pink: `#f8bbd9`

### Breakpoints

-   Mobile: 320px-640px (base)
-   Tablet: 640px-1024px (`sm:`)
-   Desktop: 1024px+ (`lg:`)

### Key Dependencies

**Frontend:**
-   `react` - UI Framework
-   `react-router-dom` - Client-side routing
-   `zustand` - Lightweight state management
-   `vite` - Build tool and dev server
-   `tailwindcss` - Styling
-   `leaflet` - Maps

**Backend:**
-   `@cloudflare/workers-types` - Workers TypeScript types
-   `itty-router` - Minimal routing (~450 bytes)
-   `drizzle-orm` - Type-safe ORM
-   `drizzle-kit` - Database migrations

## Troubleshooting

### Common Issues

1. **Map not loading**: Check Leaflet CSS import and container height
2. **Styles not applying**: Verify Tailwind purge configuration
3. **Build failures**: Check JSON syntax and component imports
4. **Mobile layout issues**: Test on actual devices, not just browser dev tools

### Debug Commands

```bash
npm run build -- --verbose    # Verbose build output
npm run dev -- --host        # Expose dev server to network
```

## Development Best Practices (Opinionated for Claude Code)

### Code Review Checklist

Before marking any task complete, verify:

**1. TypeScript**
-   [ ] No `any` types
-   [ ] All props interfaces defined
-   [ ] `npm run typecheck` passes

**2. Performance**
-   [ ] No unnecessary re-renders
-   [ ] Heavy computations memoized
-   [ ] Lazy loading where appropriate
-   [ ] Bundle size < 100KB per page

**3. Mobile-First**
-   [ ] Tested at 320px width
-   [ ] Touch targets ≥ 44px
-   [ ] No hover-only interactions
-   [ ] Works one-handed

**4. State Management**
-   [ ] Global state → Zustand store
-   [ ] Local state → useState/useReducer
-   [ ] Reusable logic → Custom hook
-   [ ] Pure functions → Utils

**5. Code Quality**
-   [ ] Component < 300 lines
-   [ ] Single responsibility per component
-   [ ] Descriptive variable names
-   [ ] No magic numbers/strings

### Anti-Patterns to Avoid

❌ **Don't do this:**
-   Class components
-   Inline styles (use Tailwind)
-   Default exports (use named exports)
-   `any` types in TypeScript
-   God components (>500 lines)
-   Prop drilling (use Zustand instead)
-   Hover-dependent mobile interactions
-   Heavy animations (>300ms)
-   Arbitrary Tailwind values
-   Multiple components per file

✅ **Do this instead:**
-   Functional components
-   Tailwind classes
-   Named exports
-   Proper TypeScript types
-   Small, focused components
-   Zustand stores for shared state
-   Touch-first interactions
-   CSS animations 150-300ms
-   Design token values
-   One component per file

### When to Refactor

**Extract to component when:**
-   Code duplicated 2+ times
-   File > 300 lines
-   Complex section that could be named
-   Different responsibility/concern

**Extract to hook when:**
-   Reusable logic across components
-   Complex state management
-   Side effects need coordination
-   API/data fetching logic

**Extract to Zustand store when:**
-   State shared across 3+ components
-   State needs persistence
-   Complex state with many actions
-   Authentication/global UI state

**Extract to utility when:**
-   Pure function (no React dependencies)
-   Math/calculation logic
-   Data transformation
-   Reusable helpers

## Support Resources

-   [React Documentation](https://react.dev/)
-   [Zustand Documentation](https://docs.pmnd.rs/zustand/)
-   [Vite Documentation](https://vitejs.dev/)
-   [React Router Documentation](https://reactrouter.com/)
-   [Tailwind CSS Documentation](https://tailwindcss.com/docs)
-   [TypeScript Documentation](https://www.typescriptlang.org/docs/)
-   [Leaflet Documentation](https://leafletjs.com/reference.html)
-   [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)

---

_Last updated: 2025-09-30_
_Project Phase: V1 Development_
_React: 18.3+ | Zustand: Latest | TypeScript: Strict Mode_
