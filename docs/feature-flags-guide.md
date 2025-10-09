# MatchaMap Feature Flags Guide

This document describes all available feature flags and how to use them.

## Overview

Feature flags allow you to enable/disable features without deploying new code. All flags are defined in `frontend/src/config/features.yaml` and can be toggled by updating that file and redeploying the frontend.

## How Feature Flags Work

1. **Configuration:** Flags are defined in `features.yaml`
2. **Hook:** Components use `useFeatureToggle('FLAG_NAME')` to check if a feature is enabled
3. **Deployment:** Changes to flags require a frontend redeploy (Cloudflare Pages auto-rebuilds on push)

## Feature Flag Categories

### Core Discovery Features

These control the main functionality of MatchaMap.

| Flag | Default | Description | Dependencies |
|------|---------|-------------|--------------|
| `ENABLE_MAP_VIEW` | `true` | Main map view with cafe pins | None |
| `ENABLE_LIST_VIEW` | `true` | List view of cafes | None |
| `ENABLE_CAFE_DETAILS` | `true` | Individual cafe detail pages | None |
| `ENABLE_CITY_SELECTOR` | `true` | Multi-city support (Toronto, etc.) | None |
| `ENABLE_FILTERS` | `true` | Filter cafes by drink type, score, etc. | None |

**⚠️ WARNING:** Disabling these core features will break the main user experience. Only disable for testing.

---

### Content Features

Content and editorial features.

| Flag | Default | Description | Dependencies |
|------|---------|-------------|--------------|
| `ENABLE_FEED` | `true` | News/blog feed | None |
| `ENABLE_EVENTS` | `false` | Matcha events calendar | None |
| `ENABLE_PASSPORT` | `true` | Digital passport (localStorage-based) | None |

**Note:** Passport currently uses localStorage. When `ENABLE_USER_CHECKINS` is enabled, passport will sync with user accounts.

---

### User Account Features (Phase 2)

**⚠️ IMPORTANT:** All user features depend on `ENABLE_USER_ACCOUNTS` being `true`.

| Flag | Default | Description | Dependencies |
|------|---------|-------------|--------------|
| `ENABLE_USER_ACCOUNTS` | `true` | User registration and login system | None |
| `ENABLE_USER_PROFILES` | `true` | User profile pages | `ENABLE_USER_ACCOUNTS` |
| `ENABLE_USER_SOCIAL` | `false` | All social features (check-ins, reviews, photos, following, favorites, lists, badges, leaderboards, activity feed) | `ENABLE_USER_ACCOUNTS` |

**Implementation Status:**
- ✅ `ENABLE_USER_ACCOUNTS` - **Implemented** (auth, registration, login)
- ✅ `ENABLE_USER_PROFILES` - **Implemented** (user profile pages)
- ⏳ `ENABLE_USER_SOCIAL` - **Planned** (Phase 2 - all social features)

**What's included in ENABLE_USER_SOCIAL:**
- Check-ins (database-backed visit tracking)
- Reviews & Ratings (user-generated content)
- Photo Uploads (with moderation)
- Following & Followers (social connections)
- Activity Feed (see what friends are doing)
- Badges & Achievements (gamification)
- Leaderboards (top reviewers, most visited)
- Favorites (quick access to saved cafes)
- Custom Lists (themed cafe collections)

**Dependency Tree:**
```
ENABLE_USER_ACCOUNTS (master switch)
  ├── ENABLE_USER_PROFILES (profile pages)
  └── ENABLE_USER_SOCIAL (all social features - single toggle)
```

**To enable social features:**
1. Ensure `ENABLE_USER_ACCOUNTS: true`
2. Set `ENABLE_USER_SOCIAL: true`
3. Redeploy frontend

**Example - Enable All Social Features:**
```yaml
ENABLE_USER_ACCOUNTS: true   # ✅ Required
ENABLE_USER_PROFILES: true   # ✅ Required for social
ENABLE_USER_SOCIAL: true     # ✅ Enables all social features at once
```

---

### Admin Features

Control access to admin tools.

| Flag | Default | Description | Dependencies |
|------|---------|-------------|--------------|
| `ENABLE_ADMIN_PANEL` | `true` | Admin dashboard and management tools | None |
| `ENABLE_MENU` | `true` | Top-right hamburger menu | None |

**Security Note:** These flags only hide UI elements. All admin endpoints are protected by JWT authentication and role checks on the backend.

---

### Static Pages

Marketing and informational pages.

| Flag | Default | Description | Dependencies |
|------|---------|-------------|--------------|
| `ENABLE_CONTACT` | `false` | Contact/feedback page | None |
| `ENABLE_ABOUT` | `false` | About MatchaMap page | None |
| `ENABLE_STORE` | `false` | Merch store | None |
| `ENABLE_SETTINGS` | `false` | User settings page | `ENABLE_USER_ACCOUNTS` |

---

### UI/UX Features

Visual and interaction features.

| Flag | Default | Description | Dependencies |
|------|---------|-------------|--------------|
| `SHOW_COMING_SOON` | `false` | Show "coming soon" banners on disabled features | None |
| `ENABLE_ANIMATIONS` | `true` | UI animations and transitions | None |
| `ENABLE_DARK_MODE` | `false` | Dark mode toggle (future) | None |

---

## Using Feature Flags

### In React Components

```tsx
import { useFeatureToggle } from '@/hooks/useFeatureToggle'

export const MyComponent = () => {
  const isReviewsEnabled = useFeatureToggle('ENABLE_USER_REVIEWS')

  if (!isReviewsEnabled) {
    return null // Don't render if disabled
  }

  return (
    <div>
      {/* Review UI */}
    </div>
  )
}
```

### With Dependencies (User Features)

Use the `useUserFeatures` hook for user-related features:

```tsx
import { useUserFeatures } from '@/hooks/useUserFeatures'

export const CafeDetailPage = () => {
  const {
    isUserSocialEnabled,
    isUserCheckinsEnabled,
    isUserReviewsEnabled,
    isUserPhotosEnabled
  } = useUserFeatures()

  return (
    <div>
      {/* All individual checks use the same master toggle */}
      {isUserCheckinsEnabled && <CheckInButton />}
      {isUserReviewsEnabled && <WriteReviewButton />}
      {isUserPhotosEnabled && <UploadPhotoButton />}

      {/* Or use the master toggle for all social features */}
      {isUserSocialEnabled && <SocialFeaturesSection />}
    </div>
  )
}
```

### In Routes

```tsx
import { useFeatureToggle } from '@/hooks/useFeatureToggle'

export const AppRoutes = () => {
  const isEventsEnabled = useFeatureToggle('ENABLE_EVENTS')

  return (
    <Routes>
      {/* Conditionally render route */}
      {isEventsEnabled && (
        <Route path="/events" element={<EventsPage />} />
      )}
    </Routes>
  )
}
```

---

## Common Scenarios

### Launching Social Features

When ready to launch all social features:

1. **Update features.yaml:**
```yaml
ENABLE_USER_ACCOUNTS: true
ENABLE_USER_PROFILES: true
ENABLE_USER_SOCIAL: true  # Enables all social features at once
```

2. **Deploy backend** (if new API endpoints added)
3. **Push to main branch** (Cloudflare Pages auto-deploys frontend)
4. **Monitor** metrics and user feedback

### Beta Testing a Feature

To test a feature with a subset of users:

1. Create a separate branch
2. Enable the flag in that branch
3. Deploy to a preview URL (Cloudflare Pages branch preview)
4. Share preview URL with beta testers
5. Merge to main when ready

### Rolling Back a Feature

If social features have issues:

1. **Quick rollback:**
```yaml
ENABLE_USER_SOCIAL: false  # Disables all social features immediately
```

2. **Push to main** - takes ~1-2 minutes to deploy
3. **Fix issues** in separate branch
4. **Re-enable** when fixed

---

## Testing Feature Flags

### Local Development

**Option 1: Edit features.yaml directly**
```bash
cd frontend/src/config
# Edit features.yaml
ENABLE_USER_SOCIAL: true
```

**Option 2: Use Admin Panel**
- Navigate to `/admin`
- Go to "Feature Toggles" tab
- Toggle features on/off
- Changes are temporary (dev environment only)

### Production Testing

**Preview Deployments:**
1. Create a branch with flag changes
2. Push to GitHub
3. Cloudflare Pages creates preview URL automatically
4. Test on preview URL before merging to main

---

## Best Practices

### DO ✅

- **Keep flags simple** - Boolean true/false only
- **Document dependencies** - Note which flags require others
- **Test locally first** - Verify flag behavior before deploying
- **Monitor metrics** - Track engagement when enabling new features
- **Clean up old flags** - Remove flags after features are stable

### DON'T ❌

- **Don't use flags for A/B testing** - Use proper A/B testing tools
- **Don't nest complex logic** - Keep flag checks simple
- **Don't forget dependencies** - Check parent flags are enabled
- **Don't leave broken flags** - Fix or remove non-functional flags
- **Don't disable core features in production** - Breaks user experience

---

## Troubleshooting

### Flag changes not applying

**Problem:** Changed flag but feature still disabled/enabled

**Solution:**
1. Clear browser cache
2. Check Cloudflare Pages deployment status
3. Verify flag name matches exactly (case-sensitive)
4. Check console for TypeScript errors

### Feature flag not found

**Problem:** `useFeatureToggle('SOME_FLAG')` returns undefined

**Solution:**
1. Add flag to `features.yaml`
2. Add flag to `FeatureFlag` type in `useFeatureToggle.ts`
3. Restart dev server

### Social features not working despite flag enabled

**Problem:** `ENABLE_USER_SOCIAL` is `true` but features don't show

**Solution:**
1. Check `ENABLE_USER_ACCOUNTS` is `true` (required base feature)
2. Check `ENABLE_USER_PROFILES` is `true` (required for social)
3. Use `useUserFeatures()` hook instead of `useFeatureToggle()`
4. Verify backend endpoints exist for the specific feature

---

## Future Improvements

- [ ] Flag override via URL params (e.g., `?flags=ENABLE_USER_REVIEWS:true`)
- [ ] Per-user flag overrides (staff/beta testers)
- [ ] Gradual rollouts (percentage-based)
- [ ] A/B testing integration
- [ ] Analytics tracking (flag engagement metrics)

---

## References

- **Features Config:** `frontend/src/config/features.yaml`
- **Hook Implementation:** `frontend/src/hooks/useFeatureToggle.ts`
- **User Features Hook:** `frontend/src/hooks/useUserFeatures.ts`
- **Admin Toggle UI:** `frontend/src/components/admin/FeatureTogglesPage.tsx`

---

**Last Updated:** October 2025
**Maintainer:** Engineering Team
