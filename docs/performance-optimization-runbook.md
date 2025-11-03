# Performance Optimization Runbook

**Last Updated:** 2025-11-02
**Maintained By:** Engineering Team

## Overview

This runbook provides procedures for ongoing performance optimization of MatchaMap. Use this guide for both proactive optimization and reactive troubleshooting.

## Performance Targets

### Core Web Vitals (Must Maintain)
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTI (Time to Interactive)**: < 3.5s on 3G
- **Bundle Size**: < 100KB per page

### Feature-Specific Targets
- **Review submission**: < 500ms response time
- **Photo upload**: < 2s for typical image (2-5MB)
- **Activity feed load**: < 1s for 20 items
- **Search results**: < 300ms response time
- **Infinite scroll**: Smooth 60fps, no jank

---

## Quick Reference Commands

```bash
# Bundle analysis
npm run build:analyze              # Visual bundle analysis with treemap
npm run bundle:check               # CI-friendly size check (fails if exceeded)

# Performance testing
npm run build && npm run preview   # Build and preview for profiling
ANALYZE=true npm run build         # Build with bundle analyzer

# Development
npm run dev                        # Start dev server
npm run typecheck                  # Check for type errors
npm test                           # Run test suite
```

---

## 1. Frontend Bundle Optimization

### When to Run
- Adding new dependencies
- After major feature additions
- Monthly audit (first Tuesday)
- Bundle size warnings in CI

### Procedure

**Step 1: Analyze Current Bundle**
```bash
# Generate visual bundle analysis
npm run build:analyze

# Check against budgets
npm run bundle:check
```

**Step 2: Review Bundle Composition**
- Open `dist/stats.html` in browser
- Look for:
  - Unexpectedly large chunks (>50KB)
  - Duplicate dependencies
  - Unused library code
  - Non-tree-shakeable imports

**Step 3: Optimize Imports**

✅ **CORRECT:**
```tsx
// Tree-shakeable icon imports
import { MapPin, Navigation } from '@/components/icons'

// Specific imports from libraries
import formatDistance from 'date-fns/formatDistance'

// Lazy loaded routes
const AdminPanel = lazy(() => import('./admin/AdminPanel'))
```

❌ **INCORRECT:**
```tsx
// Imports entire library
import { MapPin } from 'lucide-react'
import * as dateFns from 'date-fns'

// All routes loaded upfront
import { AdminPanel } from './admin/AdminPanel'
```

**Step 4: Code Splitting**
- Routes should be lazy loaded (already done in AppRoutes.tsx)
- Heavy components (>50KB) should be lazy loaded
- Third-party libraries should be in separate chunks

**Step 5: Verify**
```bash
npm run bundle:check
```

### Troubleshooting

**Bundle size exceeded:**
1. Run `npm run build:analyze`
2. Identify largest chunks
3. Check for duplicate dependencies: look for same library in multiple chunks
4. Consider lazy loading heavy features
5. Review recent dependency additions

**Tree-shaking not working:**
1. Ensure imports are named exports, not `import *`
2. Check library supports ES modules
3. Verify no CommonJS imports
4. Review `vite.config.js` rollup options

---

## 2. Image Optimization

### When to Run
- Implementing photo upload features
- High image bandwidth usage
- Slow image loading reported

### Procedure

**Step 1: Client-Side Compression**

Use the image compression utility for uploads:

```tsx
import { compressImage, validateImage } from '@/utils/imageCompression'

async function handleImageUpload(file: File) {
  // Validate first
  const validation = await validateImage(file, {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  })

  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Compress before upload
  const result = await compressImage(file, {
    maxWidth: 1920,
    quality: 0.85,
    maxSizeBytes: 500 * 1024, // Target 500KB
  })

  // Upload compressed blob
  await uploadToR2(result.blob)
}
```

**Step 2: Lazy Loading**

Ensure images use lazy loading:

```tsx
<img
  src={imageUrl}
  loading="lazy"
  alt="Cafe photo"
  className="w-full h-auto"
/>
```

**Step 3: WebP with Fallback**

```tsx
<picture>
  <source srcSet={webpUrl} type="image/webp" />
  <source srcSet={jpegUrl} type="image/jpeg" />
  <img src={jpegUrl} alt="Cafe photo" loading="lazy" />
</picture>
```

**Step 4: R2 Image Variants (Backend)**

Configure R2 to generate multiple sizes:

```typescript
// backend/src/handlers/photos.ts
const variants = {
  thumbnail: { width: 150, height: 150 },
  medium: { width: 800, height: 600 },
  full: { width: 1920, height: 1440 },
}

// Serve appropriate size based on viewport
const url = `https://photos.matchamap.app/${photoId}/variants/${variant}`
```

---

## 3. React Rendering Optimization

### When to Run
- Components rendering slowly
- React DevTools shows excessive re-renders
- User reports jank/lag

### Procedure

**Step 1: Profile Components**

```bash
# Build in production mode
npm run build
npm run preview

# Open React DevTools → Profiler
# Record interaction
# Look for components with long render times
```

**Step 2: Add React.memo**

For expensive components that receive the same props:

```tsx
import { memo } from 'react'

export const CafeCard = memo<CafeCardProps>(({ cafe, onSelect }) => {
  // Component implementation
})
```

**When to use React.memo:**
- Component renders frequently with same props
- Component has expensive render logic
- Component is in a list (map/forEach)

**When NOT to use React.memo:**
- Props change frequently
- Component is cheap to render
- Parent always re-renders

**Step 3: Optimize Zustand Selectors**

Use shallow equality for selecting multiple values:

```tsx
import { shallow } from 'zustand/shallow'

// ❌ Creates new object on every render
const { cafes, selectedCafe } = useCafeStore()

// ✅ Only re-renders when values change
const { cafes, selectedCafe } = useCafeStore(
  state => ({ cafes: state.cafes, selectedCafe: state.selectedCafe }),
  shallow
)
```

**Step 4: useMemo for Expensive Computations**

```tsx
import { useMemo } from 'react'

const sortedCafes = useMemo(() => {
  return cafes.sort((a, b) => a.distance - b.distance)
}, [cafes])
```

**Step 5: useCallback for Event Handlers**

Only needed when passing callbacks to memoized children:

```tsx
import { useCallback } from 'react'

const handleClick = useCallback((cafe: Cafe) => {
  selectCafe(cafe.id)
}, [selectCafe])

return <CafeCard cafe={cafe} onClick={handleClick} />
```

**Step 6: List Virtualization**

For long lists (>50 items), consider virtualization:

```bash
npm install react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: cafes.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
})
```

---

## 4. Database Query Optimization

### When to Run
- API response times >100ms
- Database timeout errors
- High database CPU usage

### Procedure

**Step 1: Profile Slow Queries**

Add logging to identify slow queries:

```typescript
// backend/src/middleware/logging.ts
const startTime = Date.now()
const result = await db.query.cafes.findMany()
const duration = Date.now() - startTime

if (duration > 100) {
  console.warn(`Slow query: ${duration}ms`)
}
```

**Step 2: Check Indexes**

Review `backend/drizzle/schema.ts` for missing indexes:

```typescript
// Add indexes for frequently queried columns
export const cafes = sqliteTable('cafes', {
  id: integer('id').primaryKey(),
  cityId: integer('city_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
}, (table) => ({
  cityIdIdx: index('city_id_idx').on(table.cityId),
  slugIdx: index('slug_idx').on(table.slug),
}))
```

**Step 3: Optimize N+1 Queries**

Use joins instead of separate queries:

```typescript
// ❌ N+1 query
const reviews = await db.query.reviews.findMany()
for (const review of reviews) {
  review.user = await db.query.users.findFirst({
    where: eq(users.id, review.userId)
  })
}

// ✅ Single join query
const reviews = await db.query.reviews.findMany({
  with: { user: true }
})
```

**Step 4: Add Pagination**

Always paginate list queries:

```typescript
const reviews = await db.query.reviews.findMany({
  limit: 20,
  offset: page * 20,
  orderBy: [desc(reviews.createdAt)],
})
```

**Step 5: Cache Expensive Queries**

Use Cloudflare Cache API for hot paths:

```typescript
const cacheKey = `leaderboard:${period}`
const cached = await caches.default.match(cacheKey)

if (cached) {
  return cached.json()
}

const data = await computeLeaderboard(period)

await caches.default.put(
  cacheKey,
  new Response(JSON.stringify(data), {
    headers: { 'Cache-Control': 'max-age=300' } // 5 minutes
  })
)
```

---

## 5. Performance Monitoring

### Setup

Web Vitals tracking is available in `frontend/src/utils/webVitals.ts`.

**Initialize in main.tsx:**

```tsx
import { initWebVitals } from './utils/webVitals'

// After React app mounts
initWebVitals()
```

**View metrics in development:**

```javascript
// In browser console
JSON.parse(sessionStorage.getItem('webVitals'))
```

### Monitoring Checklist

- [ ] Web Vitals initialized in production
- [ ] Performance marks added for custom metrics
- [ ] Error tracking configured
- [ ] Bundle size monitored in CI
- [ ] Lighthouse score checked monthly

### Custom Performance Marks

```typescript
// Mark start
performance.mark('cafe-list-start')

// ... do work

// Mark end and measure
performance.mark('cafe-list-end')
performance.measure('cafe-list-render', 'cafe-list-start', 'cafe-list-end')

// Get measurement
const measures = performance.getEntriesByName('cafe-list-render')
console.log(`Cafe list render: ${measures[0].duration}ms`)
```

---

## 6. Mobile Performance Testing

### Devices to Test

**Primary:**
- iPhone 12/13/14 (iOS Safari)
- Pixel 4/5/6 (Chrome Android)

**Secondary:**
- iPhone SE (budget iOS)
- Mid-range Android (Samsung Galaxy A series)

### Testing Procedure

**Step 1: Throttle Network**

Chrome DevTools → Network → Throttling → Slow 3G

**Step 2: Throttle CPU**

Chrome DevTools → Performance → CPU → 4x slowdown

**Step 3: Record Metrics**

- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Total Blocking Time (TBT)

**Step 4: Test Interactions**

- [ ] Map pan/zoom smooth at 60fps
- [ ] List scroll smooth (no jank)
- [ ] Image loading doesn't block UI
- [ ] Form submission responsive
- [ ] Navigation feels instant

**Step 5: Real Device Testing**

Use BrowserStack or physical devices for final validation.

---

## 7. Troubleshooting

### Slow Page Load

1. Run Lighthouse audit
2. Check LCP element (should be <2.5s)
3. Review network waterfall for blocking resources
4. Ensure critical CSS inlined
5. Verify lazy loading implemented

### Jank/Stuttering

1. Profile with React DevTools
2. Check for long tasks (>50ms)
3. Review CSS animations (use transform/opacity)
4. Optimize event handlers (debounce/throttle)
5. Check for memory leaks

### Large Bundle Size

1. Run `npm run build:analyze`
2. Identify largest chunks
3. Review recent dependency additions
4. Check for duplicate dependencies
5. Implement code splitting

### High API Latency

1. Profile database queries
2. Check for N+1 queries
3. Add missing indexes
4. Implement caching
5. Review Cloudflare analytics

---

## 8. Continuous Monitoring

### Weekly
- [ ] Review Lighthouse scores
- [ ] Check bundle size trends
- [ ] Monitor API response times

### Monthly
- [ ] Full performance audit
- [ ] Mobile device testing
- [ ] Bundle analysis
- [ ] Review and update this runbook

### Quarterly
- [ ] Dependency audit (remove unused)
- [ ] Database query optimization review
- [ ] Performance budget review
- [ ] Real user metrics analysis (when available)

---

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [Cloudflare Performance](https://developers.cloudflare.com/workers/learning/performance/)
- [Bundle Optimization](https://vitejs.dev/guide/build.html#chunking-strategy)

---

**Questions or Issues?**
Contact: Engineering Team
Last Review: 2025-11-02
