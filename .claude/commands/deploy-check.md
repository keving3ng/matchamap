---
description: Run pre-deployment checks before shipping
---

Run comprehensive pre-deployment checks to ensure the code is ready to ship.

## Pre-Deployment Checklist

### Phase 1: Code Quality Checks

1. **TypeScript Type Check**
   - Run: `npm run typecheck`
   - MUST pass with zero errors
   - No `any` types allowed (strict mode enabled)

2. **Build Test**
   - Run: `npm run build`
   - MUST succeed without errors
   - Check bundle size output

3. **Bundle Size Analysis**
   - Target: < 100KB per page (gzipped)
   - Check build output for size warnings
   - Flag if any route bundle exceeds target

### Phase 2: Frontend Checks

4. **Dev Server Test**
   - Start: `npm run dev`
   - Open browser and check for console errors
   - Verify no runtime errors on homepage

5. **Mobile Viewport Test**
   - Test at 320px width (smallest mobile)
   - Verify touch targets ≥ 44px
   - Check no horizontal scroll
   - Test one-handed operation

6. **Core Routes Check**
   - [ ] Homepage loads
   - [ ] Map view renders (if feature enabled)
   - [ ] List view works
   - [ ] Detail pages load
   - [ ] Navigation works

### Phase 3: Backend Checks (if applicable)

7. **Workers Build**
   - Run: `cd workers && npm run build`
   - MUST succeed without errors

8. **Database Migrations**
   - Check if any pending migrations
   - Run: `cd workers && npm run db:migrate:local`
   - Verify schema matches expected state

9. **API Health Check**
   - Start: `cd workers && npm run dev`
   - Test: `curl http://localhost:8787/api/health`
   - Should return 200 OK

### Phase 4: Performance Checks

10. **Performance Budget**
    - LCP target: < 2.5s
    - FID target: < 100ms
    - CLS target: < 0.1
    - Check if any new images need optimization

11. **Animation Performance**
    - All animations 150-300ms
    - No animations > 500ms
    - CSS transforms only (no position/size changes)

### Phase 5: Git & Deploy

12. **Git Status**
    - Check for uncommitted changes
    - Verify on correct branch
    - Check for merge conflicts

13. **Commit Message**
    - Follows format: `type(scope): description`
    - Examples: `feat(map):`, `fix(passport):`, `docs(readme):`

14. **Branch Strategy**
    - main = production
    - feature/* for new work
    - Verify deploying from correct branch

## Final Checklist Summary

Run all checks and report status:

- [ ] `npm run typecheck` ✅ PASSED
- [ ] `npm run build` ✅ PASSED
- [ ] Bundle size < 100KB ✅ PASSED
- [ ] No console errors ✅ PASSED
- [ ] Mobile (320px) tested ✅ PASSED
- [ ] All routes work ✅ PASSED
- [ ] Workers build (if applicable) ✅ PASSED
- [ ] Git status clean ✅ PASSED

**Status: [READY TO SHIP | BLOCKED]**

If BLOCKED, list issues that must be fixed before deployment.

## Quick Deploy Commands

**Frontend (auto-deploys on push):**
```bash
git add .
git commit -m "type(scope): description"
git push origin main
```

**Backend (manual deploy):**
```bash
cd workers
npm run deploy
```

**Rollback if needed:**
- Frontend: Cloudflare Pages Dashboard → Rollback
- Backend: `git checkout <previous-commit> && cd workers && npm run deploy`

---

Run the deployment checklist now.
