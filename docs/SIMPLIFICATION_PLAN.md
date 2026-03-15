# MatchaMap Simplification Plan

**Purpose:** Cut off the “social network” direction and align the repo with the [Product Foundation](./PRODUCT_FOUNDATION.md). This doc is the checklist for code, docs, and GitHub cleanup.

**Cut-off point:** The **new foundation** is: Map + List + Detail + Events + About (+ Contact) + Admin (cafes, drinks, events) + optional Passport (localStorage) + vivisual.diary promotion. Everything else is either disabled via feature flags or removed.

---

## Phase 1: Feature-Flag Cutoff (Fastest Win)

Goal: Turn off all social and public-user features in production without deleting code. One source of truth: [frontend/src/config/features.yaml](../frontend/src/config/features.yaml).

| Flag | Current (prod) | Target (prod) | Notes |
|------|----------------|---------------|--------|
| `ENABLE_USER_ACCOUNTS` | true | **false** | Hides login/signup; admin can still use direct login URL if backend allows. |
| `ENABLE_USER_PROFILES` | false | false | Keep off. |
| `ENABLE_USER_SOCIAL` | true | **false** | Hides leaderboards, check-ins, reviews UI, etc. |
| `ENABLE_PASSPORT` | false | optional | Keep as-is if you want localStorage-only passport; or leave off. |
| `ENABLE_EVENTS` | true | true | Keep. |
| `ENABLE_CONTACT` | false | optional | true if you want a contact page. |
| `ENABLE_ABOUT` | false | **true** | So About (and vivisual.diary) are visible. |
| `ENABLE_STORE` | false | false | Keep off. |
| `ENABLE_SETTINGS` | false | false | Keep off. |
| `ENABLE_ADMIN_PANEL` | true | true | Keep; editors need it. |

**Admin access:** If `ENABLE_USER_ACCOUNTS` is false, the app may hide the “Sign in” that admins use. Options: (a) keep a minimal “Admin login” entry point (e.g. link in footer or via URL only), or (b) keep `ENABLE_USER_ACCOUNTS` true but only use it for admin login (no sign-up, no profile/social UI). Choose one and document in PRODUCT_FOUNDATION.

**After Phase 1:** Production looks like the simplified product; social and public-user UI are hidden.

---

## Phase 2: UI and Routes Cleanup

Goal: Remove or guard routes and UI that are out of scope so the codebase matches the foundation.

### 2.1 Routes to remove or guard

| Route | Action |
|-------|--------|
| `/login` | Keep only for admin; hide from main nav when user accounts “off” for public. |
| `/profile/:username` | Remove from AppRoutes when profiles disabled, or leave behind feature flag. |
| `/leaderboards` | Remove route when `ENABLE_USER_SOCIAL` is false (already gated). |
| `/store` | Remove route when store disabled (already gated). |
| `/settings` | Remove route when settings disabled (already gated). |

No new routes needed for foundation; About and Contact already exist.

### 2.2 Navigation (Header / Menu / Bottom nav)

- **Header:** Remove or hide: Sign In, My Profile, Shop, Settings when those features are off. Keep About and Contact (and vivisual.diary links) visible when enabled.
- **Bottom nav:** Already minimal (Map, List, Events, Passport). No change if Passport stays optional.
- **Menu (if any):** Same as Header; only show items that are in scope.

### 2.3 Components to hide or remove (when flags off)

- Leaderboard page and links.
- Check-in UI (e.g. “I’ve been here” that calls backend).
- User review create/edit UI on cafe detail.
- Photo upload / gallery from users.
- Profile page, settings page, store page.
- Favorites, lists, “follow” UI.

Prefer **feature-flag guards** so code can be removed in a later phase without breaking the build.

---

## Phase 3: Backend and Data (Optional / Later)

Goal: Simplify API and DB to match foundation. Can be done after Phase 1–2.

### 3.1 API endpoints to consider removing or deprecating

Keep:

- Health, cafes, cities, drinks, events.
- Stats: cafe view, directions click, event click.
- Waitlist (if you keep it).
- Admin: cafes, drinks, events, export/import; admin auth.
- Auth: login (admin only), refresh, logout; optionally keep register disabled or admin-only.

Deprecate or remove (social / public user):

- Check-ins: `POST/GET /api/checkins`, `GET /api/users/me/passport`, etc.
- Photos: `POST /api/photos/upload`, `GET /api/cafes/:id/photos` (if only user photos), etc.
- Profile: `GET/PUT /api/users/me/profile`, `GET /api/users/:username/profile`, avatar, privacy.
- Following: follow/unfollow, followers, following, follow-status.
- Favorites: list, add, remove, notes.
- Cafe suggestions: create, list.
- Lists: CRUD and items.
- Notifications: list, unread count, mark read.
- Badges: mine, check, progress; definitions.
- Leaderboards: passport, reviewers, contributors, rank.
- Reviews: create, update, delete, helpful; comments, comment likes.
- Recommendations: for-you, trending, similar.

Mark deprecated routes with a comment or small doc; remove when no frontend calls them.

### 3.2 Database tables (do not drop without backup)

**Keep:** `cafes`, `drinks`, `events`, `cafe_stats` (or equivalent), `waitlist`, `users`, `sessions`, `admin_audit_log` (if used).

**Leave in place but unused (for now):**  
`user_profiles`, `user_checkins`, `user_reviews`, `review_photos`, `review_helpful`, `review_comments`, `review_comment_likes`, `user_favorites`, `user_badges`, `user_follows`, and any other user/social tables.  
Dropping tables is a separate migration; only after you’re sure you don’t need the data.

### 3.3 Auth model

- **Admin-only:** Only admin (editor) accounts; no public registration. Optionally remove or disable register endpoint; keep login for admin.
- **Sessions:** Keep for admin; no need for “remember me” or public profile sessions.

---

## Phase 4: Docs and GitHub

### 4.1 Docs to add or update

- **README (repo root):** Describe MatchaMap as a curated guide + events + vivisual.diary (see Product Foundation). Remove or shorten mentions of “social,” “user accounts,” “community,” “check-ins,” “reviews,” “leaderboards.”
- **docs/README.md:** Add links to PRODUCT_FOUNDATION.md and SIMPLIFICATION_PLAN.md; remove or archive heavy “social features” and “user guide” paths that assume a social product.
- **CLAUDE.md:** Update “Key Features” and “User Management & Social Features” to match foundation (admin-only auth; no public social features). Point to PRODUCT_FOUNDATION.md for product scope.

### 4.2 Docs to archive or trim

- **social-features-guide.md** – Move to `docs/archive/` or add a banner: “Out of scope for current product; see PRODUCT_FOUNDATION.md.”
- **social-features-analytics-prd.md** – Archive or mark deprecated.
- **user-guide/getting-started.md** – Simplify to “how to use the map/list/events/about”; remove sign-up, check-ins, reviews, profile.
- **feed-refactoring-plan.md** – Already about a deprecated feed; keep in archive or delete.
- **PARALLEL_EXECUTION_PLAN.md** – If it references activity feed and social work, archive or update.

Keep: TECH_SPEC, DEPLOYMENT, TESTING, QUICKSTART_BACKEND, feature-flags, adding-new-cities, GOOGLE_PLACES_SETUP, photo-upload-guide (only if you ever want to allow editor uploads; otherwise archive).

### 4.3 GitHub

- **Issues:** Close or label issues that are purely “social feature” or “community” if they’re out of scope; add a pointer to PRODUCT_FOUNDATION.md in a pinned issue or in the repo description.
- **Repo description / About:** One line: e.g. “Curated guide to matcha cafes (Toronto +), events, and vivisual.diary.”
- **Labels:** Optional: add “foundation” and “out-of-scope” so future PRs can be triaged.

---

## Checklist Summary

- [ ] **Phase 1:** Set feature flags so prod has no public user accounts, no social (see table above); About on, Contact optional.
- [ ] **Phase 2:** Hide or remove routes and nav items for login (or admin-only), profile, leaderboards, store, settings; hide check-ins, reviews, photos, favorites, follow UI when flags off.
- [ ] **Phase 3 (optional):** Deprecate/remove social and public-user API endpoints; keep DB tables for now; document admin-only auth.
- [ ] **Phase 4:** Update README, docs/README, CLAUDE.md; archive or trim social/feed docs; update GitHub description and optionally issues/labels.

**Cut-off definition:** The **new foundation** is the state of the product and repo after Phase 1 and Phase 2. Phase 3 and 4 can follow in order or in parallel.

**Agent parallelization:** See [AGENT_PARALLELIZATION_PLAN.md](./AGENT_PARALLELIZATION_PLAN.md) to run these phases with multiple agents in parallel.

---

## Where to Start

1. Read [PRODUCT_FOUNDATION.md](./PRODUCT_FOUNDATION.md) and confirm scope (especially admin-only auth and Passport).
2. Apply **Phase 1** in `features.yaml` (and any env-specific overrides).
3. Deploy and verify production: map, list, detail, events, about, vivisual.diary links; no sign-up, no social UI.
4. Do **Phase 2** in small PRs (e.g. “Hide social nav,” “Remove leaderboards route when flag off”).
5. Then tackle docs (Phase 4) and, if desired, backend simplification (Phase 3).
