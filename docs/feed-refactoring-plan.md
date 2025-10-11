# Feed Refactoring Plan

## Current State (Phase 1)

The feed system was originally designed for admin-curated blog posts:
- **Table:** `feed_items`
- **Purpose:** Announcements, new locations, score updates
- **Content type:** Long-form articles with preview/content
- **Admin CRUD interface** with complex form

## Target State (Phase 2)

The feed will become a social activity stream:
- **Table:** `activity_feed` (new)
- **Purpose:** User-generated content aggregation
- **Content type:** Activity items (check-ins, reviews, photos)
- **Auto-generated** from user actions (no admin CRUD)

## Migration Steps

### 1. ✅ Phase 1 Cleanup (This Issue)
   - [x] Simplify/deprecate admin feed UI
   - [x] Update terminology (newsfeed → feed/activity feed)
   - [x] Add code markers for legacy components
   - [x] Update copy constants
   - [x] Add deprecation warnings in admin UI
   - [x] Mark backend routes as deprecated
   - [x] Add database schema comments

### 2. ⏳ Phase 2A: New Activity Feed Table
   - Create `activity_feed` table with new schema
   - Add activity generation triggers for user actions
   - Build feed aggregation queries with following system
   - Create new API endpoints for activity feed

### 3. ⏳ Phase 2B: Frontend Activity Feed
   - New `ActivityFeed.tsx` component
   - Following-based filtering
   - Real-time updates (WebSocket/SSE)
   - Activity type components (check-in, review, photo)

### 4. ⏳ Phase 2C: Migration & Cleanup
   - Migrate any useful feed_items to activity format
   - Remove old feed_items table
   - Remove admin feed CRUD interface
   - Remove legacy endpoints (`/api/feed`, `/api/admin/feed`)

## New Activity Feed Schema (Phase 2)

```sql
CREATE TABLE activity_feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  activity_type TEXT NOT NULL, -- 'check_in', 'review', 'photo', 'badge_earned'
  
  -- Content
  content TEXT, -- Optional text content
  
  -- Relations
  cafe_id INTEGER REFERENCES cafes(id),
  review_id INTEGER REFERENCES reviews(id),
  photo_id INTEGER REFERENCES photos(id),
  
  -- Metadata
  visibility TEXT DEFAULT 'public', -- 'public', 'followers', 'private'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX activity_feed_user_idx (user_id),
  INDEX activity_feed_cafe_idx (cafe_id),
  INDEX activity_feed_type_idx (activity_type),
  INDEX activity_feed_created_idx (created_at)
);
```

## Activity Types

1. **Check-ins:** `"@username checked in at Café Name"`
2. **Reviews:** `"@username reviewed Café Name (8.5/10)"`
3. **Photos:** `"@username posted a photo at Café Name"`
4. **Badges:** `"@username earned the 'Matcha Explorer' badge"`
5. **Follow:** `"@username started following @othername"`

## Breaking Changes

- `feed_items` table will be dropped
- Admin feed CRUD endpoints will be removed
- Feed item types will change format
- New activity schema (see above)

## Legacy Code Markers

Throughout the codebase, legacy feed code is marked with:

```typescript
// TODO(Phase 2): Replace with activity_feed system
// See: docs/feed-refactoring-plan.md
```

This makes it easy to find all feed-related code when implementing Phase 2.

## Files Affected by Refactoring

### Phase 1 Changes (Completed)
- ✅ `frontend/src/constants/copy.ts` - Updated feed copy
- ✅ `frontend/src/components/admin/AdminLayout.tsx` - Renamed nav item
- ✅ `frontend/src/components/admin/NewsfeedManagementPage.tsx` - Added deprecation notice
- ✅ `backend/src/routes/admin-feed.ts` - Added deprecation header
- ✅ `backend/src/routes/feed.ts` - Added deprecation header
- ✅ `backend/drizzle/schema.ts` - Added table deprecation comment
- ✅ `frontend/src/utils/api.ts` - Added API deprecation comment

### Phase 2 Changes (Future)
- ⏳ `backend/drizzle/schema.ts` - Add activity_feed table
- ⏳ `backend/src/routes/activity-feed.ts` - New activity endpoints
- ⏳ `frontend/src/components/ActivityFeed.tsx` - New activity feed component
- ⏳ `frontend/src/utils/api.ts` - New activity API methods
- ⏳ Remove all legacy feed files

## Testing Strategy

### Phase 1 (Current)
- [x] Admin UI shows deprecation warnings
- [x] Legacy functionality still works
- [x] TypeScript compiles without errors
- [x] No breaking changes for existing users

### Phase 2 (Future)
- Activity feed API tests
- Activity generation tests
- Following system tests
- Real-time update tests

## Success Criteria

### Phase 1 ✅
- [x] Admin feed interface shows deprecation warnings
- [x] Code clearly marked as legacy/Phase 1
- [x] Documentation explains refactoring plan
- [x] No broken functionality
- [x] Easy to identify what needs replacement in Phase 2

### Phase 2 (Future Goals)
- [ ] Activity feed generates from user actions
- [ ] Following system filters activity
- [ ] Real-time updates work
- [ ] Legacy feed system completely removed
- [ ] Performance is better than legacy system

## Related Documentation

- `docs/social-features-guide.md` - Full social features spec
- `docs/TECH_SPEC.md` - Database schema reference
- Phase 2D section: Activity Feed implementation plan