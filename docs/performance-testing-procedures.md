# Performance Testing Procedures

**Last Updated:** 2025-11-02

## Overview

This document outlines procedures for testing MatchaMap performance across different devices, networks, and scenarios.

---

## 1. Pre-Release Performance Testing

### Checklist

Run this checklist before every production deployment:

- [ ] Lighthouse audit (Desktop & Mobile)
- [ ] Bundle size check
- [ ] Core Web Vitals measured
- [ ] Mobile device testing (iOS & Android)
- [ ] Slow network testing (3G)
- [ ] Image optimization verified

### Procedure

**Step 1: Build Production Bundle**

```bash
npm run build
npm run bundle:check
```

Expected output:
```
✅ index: XX KB (budget: 100 KB)
✅ maps: XX KB (budget: 50 KB)
✅ router: XX KB (budget: 15 KB)
✅ vendor: XX KB (budget: 50 KB)
✅ Total bundle size within budget
```

**Step 2: Run Lighthouse Audit**

```bash
npm run preview
```

Open Chrome DevTools → Lighthouse → Generate report

**Minimum Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

**Core Web Vitals:**
- LCP: < 2.5s (green)
- FID: < 100ms (green)
- CLS: < 0.1 (green)

**Step 3: Test on Real Devices**

**iOS (Safari):**
1. Open on iPhone (physical device or BrowserStack)
2. Navigate through app
3. Check for:
   - Smooth scrolling
   - Touch responsiveness
   - Map performance
   - Image loading

**Android (Chrome):**
1. Open on Android device
2. Same checks as iOS

**Step 4: Network Throttling**

Chrome DevTools → Network → Throttling → Slow 3G

**Metrics to check:**
- TTI < 3.5s
- FCP < 1.8s
- No layout shifts during load

---

## 2. Load Testing

### When to Run
- Before major traffic events
- After infrastructure changes
- Quarterly stress tests

### Tools

**Cloudflare Load Balancing:**
- Monitor via Cloudflare Analytics
- Set up alerts for high response times

**Local Load Testing (optional):**

```bash
# Install k6 (load testing tool)
brew install k6  # macOS
# or
sudo apt install k6  # Linux

# Run load test
k6 run loadtest.js
```

Example load test script (`loadtest.js`):

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
  },
};

export default function () {
  const res = http.get('https://matchamap.app');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## 3. Mobile Performance Testing

### Setup

**Chrome DevTools Mobile Emulation:**

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device: iPhone 12 Pro
4. Throttling: Slow 3G
5. CPU: 4x slowdown

### Testing Checklist

**Map Performance:**
- [ ] Pan/zoom smooth at 60fps
- [ ] Markers render quickly
- [ ] Popover opens without lag
- [ ] No jank during interaction

**List Performance:**
- [ ] Scroll smooth (no frame drops)
- [ ] Card expansion smooth
- [ ] Images load progressively
- [ ] No layout shift during scroll

**Form Performance:**
- [ ] Input responsive (< 100ms)
- [ ] Validation instant
- [ ] Submit button states clear
- [ ] Error messages clear

**Navigation:**
- [ ] Route changes instant
- [ ] Back button responsive
- [ ] No flash of unstyled content

### Common Issues

**Issue: Jank during scroll**
- Check for large images without lazy loading
- Review CSS animations (use transform/opacity only)
- Profile with Performance tab

**Issue: Slow map interaction**
- Reduce marker count (cluster if needed)
- Optimize marker rendering
- Check for expensive event handlers

**Issue: Layout shifts**
- Add width/height to images
- Reserve space for dynamic content
- Use skeleton loaders

---

## 4. Image Performance Testing

### Checklist

- [ ] Images use lazy loading (`loading="lazy"`)
- [ ] Images compressed before upload
- [ ] Multiple sizes available (thumbnail, medium, full)
- [ ] WebP format with JPEG fallback
- [ ] Proper alt text for accessibility

### Testing Procedure

**Test Image Upload:**

```tsx
// Test compression utility
import { compressImage } from '@/utils/imageCompression'

const file = new File([blob], 'test.jpg', { type: 'image/jpeg' })
const result = await compressImage(file, {
  maxWidth: 1920,
  quality: 0.85,
  maxSizeBytes: 500 * 1024,
})

console.log(`Original: ${file.size / 1024}KB`)
console.log(`Compressed: ${result.compressedSize / 1024}KB`)
console.log(`Ratio: ${Math.round(result.ratio * 100)}%`)
```

**Expected Results:**
- 2MB image → ~400-500KB compressed
- Dimensions: Max 1920x1440
- Quality: Visually acceptable

**Test Image Loading:**

1. Open Network tab
2. Throttle to Slow 3G
3. Scroll through cafe list
4. Verify:
   - Images load progressively
   - Lazy loading working (images only load when in viewport)
   - No layout shift when images load

---

## 5. Database Performance Testing

### Query Performance Baseline

**Target Response Times:**
- Simple queries (by ID): < 10ms
- List queries (paginated): < 50ms
- Complex joins: < 100ms
- Aggregations: < 200ms

### Testing Procedure

**Step 1: Enable Query Logging**

Add to backend handler:

```typescript
const startTime = Date.now()
const result = await db.query.cafes.findMany()
const duration = Date.now() - startTime

console.log(`Query duration: ${duration}ms`)

if (duration > 100) {
  console.warn(`Slow query detected: ${duration}ms`)
}
```

**Step 2: Test Hot Paths**

Hot paths to test:
- GET /api/cafes (cafe list)
- GET /api/cafes/:id (cafe detail)
- GET /api/reviews (review list)
- GET /api/activity (activity feed)
- GET /api/leaderboards (leaderboard)

**Step 3: Check Indexes**

```bash
# View D1 schema
npx wrangler d1 execute matchamap-db --remote --command ".schema cafes"

# Check query plan
npx wrangler d1 execute matchamap-db --remote --command "EXPLAIN QUERY PLAN SELECT * FROM cafes WHERE city_id = 1"
```

Expected: `USING INDEX` in query plan

**Step 4: Monitor in Production**

- Use Cloudflare Logs
- Track slow queries (>100ms)
- Review monthly

---

## 6. API Performance Testing

### Response Time Targets

| Endpoint | Target | Max |
|----------|--------|-----|
| GET /api/cafes | < 200ms | 500ms |
| GET /api/cafes/:id | < 100ms | 300ms |
| POST /api/reviews | < 300ms | 500ms |
| POST /api/photos | < 2s | 5s |
| GET /api/activity | < 500ms | 1s |

### Testing Tools

**cURL:**

```bash
# Test endpoint with timing
curl -w "@curl-format.txt" -o /dev/null -s https://matchamap.app/api/cafes
```

**curl-format.txt:**
```
time_namelookup:  %{time_namelookup}s\n
time_connect:     %{time_connect}s\n
time_starttransfer: %{time_starttransfer}s\n
time_total:       %{time_total}s\n
```

**Postman:**
- Create collection for all endpoints
- Use Postman monitors for continuous testing
- Set up alerts for slow responses

### Common Optimizations

**Slow API responses:**
1. Add pagination to list endpoints
2. Cache expensive computations
3. Optimize database queries
4. Use Cloudflare Cache API
5. Reduce response payload size

---

## 7. Continuous Performance Monitoring

### Daily Checks (Automated)

- [ ] Bundle size CI check
- [ ] Lighthouse CI (if configured)
- [ ] Error rate monitoring
- [ ] API response time alerts

### Weekly Reviews

- [ ] Review Cloudflare Analytics
- [ ] Check for slow queries in logs
- [ ] Review Web Vitals (when implemented)
- [ ] User-reported performance issues

### Monthly Audits

- [ ] Full Lighthouse audit
- [ ] Mobile device testing
- [ ] Bundle analysis
- [ ] Database performance review
- [ ] API endpoint review

---

## 8. Performance Regression Testing

### Before Each Release

1. **Baseline Measurement:**
   ```bash
   # Record current metrics
   npm run build
   npm run bundle:check > baseline-bundle.txt
   # Run Lighthouse, save report
   ```

2. **Make Changes**

3. **Compare:**
   ```bash
   npm run build
   npm run bundle:check > new-bundle.txt
   diff baseline-bundle.txt new-bundle.txt
   ```

4. **Acceptance Criteria:**
   - Bundle size increase < 10%
   - Lighthouse score decrease < 5 points
   - No Core Web Vitals regressions

---

## Resources

- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals Chrome Extension](https://chrome.google.com/webstore/detail/web-vitals/ahfhijdlegdabablpippeagghigmibma)
- [k6 Load Testing](https://k6.io/docs/)
- [BrowserStack](https://www.browserstack.com/)
- [Cloudflare Analytics](https://developers.cloudflare.com/analytics/)

---

**Maintained By:** Engineering Team
**Last Review:** 2025-11-02
**Next Review:** 2025-12-02
