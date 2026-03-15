# MatchaMap Metrics & Analytics PRD

**Version:** 2.0
**Date:** October 11, 2025
**Status:** Ready to Ship
**Implementation Time:** 5 hours (Phase 1: 3.5 hours | Phase 1.5: 1.5 hours)

## Philosophy: Partner-Actionable Metrics

**Goal:** Track simple metrics that compose into insights we can share with cafe partners.

**Example use cases:**
- "50 people marked your cafe as 'want to visit' - let's activate them with an event"
- "Your cafe has 200 views but only 10 direction clicks - let's improve your photos/description"
- "You have 15 engaged users who check in regularly - offer them a loyalty reward"

## What We're Tracking

### Phase 1: Anonymous User Behavior (All Users)

**Cafe Metrics:**
1. **Views** - Total cafe detail page views (logged in + logged out)
2. **Direction clicks** - Intent to visit (all users)
3. **Anonymous passport marks** - localStorage-based "want to visit" tracking (logged out users only)
4. **Social clicks** - Instagram/TikTok link clicks (all users)

**Content Metrics:**
5. **Feed article clicks** - Which news items get attention (all users)
6. **Event clicks** - Which events drive engagement (all users)

### Phase 1.5: Authenticated User Activity (NEW)

**User engagement metrics:**
1. **Authenticated check-ins** - Via `userCheckins` table (logged in users only)
2. **Active users** - Users who checked in recently (7 days, 30 days)
3. **Repeat visitors** - Users with 3+ check-ins
4. **User cafe views** - Which cafes each user is exploring

**Why track both anonymous + authenticated?**
- Many users browse logged out → need anonymous metrics
- Authenticated users provide richer data → check-ins, favorites, reviews (Phase 2)
- Composable insights: "100 anonymous marks + 25 check-ins = 125 total demand signal"

## Database Schema

### Phase 1: Anonymous Behavior Tracking

```sql
-- Cafe performance metrics (anonymous + authenticated combined)
CREATE TABLE cafe_stats (
    cafe_id INTEGER PRIMARY KEY REFERENCES cafes(id),
    views INTEGER DEFAULT 0,                    -- All users (logged in + logged out)
    directions_clicks INTEGER DEFAULT 0,        -- All users
    anonymous_passport_marks INTEGER DEFAULT 0, -- localStorage marks (logged out only)
    instagram_clicks INTEGER DEFAULT 0,         -- All users
    tiktok_clicks INTEGER DEFAULT 0,           -- All users
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feed article metrics
CREATE TABLE feed_stats (
    feed_item_id INTEGER PRIMARY KEY REFERENCES feed_items(id),
    clicks INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event metrics
CREATE TABLE event_stats (
    event_id INTEGER PRIMARY KEY REFERENCES events(id),
    clicks INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 1.5: User Activity Tracking (NEW)

```sql
-- User activity aggregates (for quick queries)
CREATE TABLE user_activity_stats (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    total_cafe_views INTEGER DEFAULT 0,         -- How many cafe pages they viewed
    total_checkins INTEGER DEFAULT 0,           -- Synced with userCheckins table
    total_directions_clicks INTEGER DEFAULT 0,   -- How often they got directions
    last_active_at TIMESTAMP,                    -- Last interaction timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: Authenticated check-ins already exist in your schema as `userCheckins` table
-- We'll just track aggregates in user_activity_stats for performance
```

**Total: 4 new tables. All just counters. Simple.**

## Frontend Tracking

**Create tracking utilities that handle both anonymous + authenticated users:**

```typescript
// src/utils/analytics.ts
import { useAuthStore } from '@/stores/authStore'

// Get user ID if authenticated, otherwise null
function getUserId(): number | null {
  const { user } = useAuthStore.getState()
  return user?.id ?? null
}

export async function trackCafeStat(
    cafeId: number,
    stat: "view" | "directions" | "passport" | "instagram" | "tiktok"
): Promise<void> {
    const userId = getUserId()

    // Fire and forget - don't block UI
    // Backend will handle anonymous vs authenticated logic
    fetch(`/api/stats/cafe/${cafeId}/${stat}`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }) // null if not logged in
    }).catch(() => {}); // Ignore errors silently
}

export async function trackFeedClick(feedItemId: number): Promise<void> {
    const userId = getUserId()
    fetch(`/api/stats/feed/${feedItemId}`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }).catch(() => {});
}

export async function trackEventClick(eventId: number): Promise<void> {
    const userId = getUserId()
    fetch(`/api/stats/event/${eventId}`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }).catch(() => {});
}

// NEW: Track authenticated check-in (only logged-in users)
export async function trackCheckIn(cafeId: number, notes?: string): Promise<void> {
    const userId = getUserId()
    if (!userId) return // Only authenticated users can check in

    fetch(`/api/checkins`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafeId, notes })
    }).catch(() => {});
}
```

**Add tracking to components:**

```typescript
// DetailView.tsx - track cafe view on mount
useEffect(() => {
  trackCafeStat(cafe.id, 'view')
}, [cafe.id])

// DetailView.tsx - track directions click
<a
  href={mapsUrl}
  onClick={() => trackCafeStat(cafe.id, 'directions')}
>
  Get Directions
</a>

// DetailView.tsx - track passport mark
const handleToggleVisited = (cafeId: number) => {
  onToggleVisited(cafeId)
  if (!isVisited) {
    trackCafeStat(cafeId, 'passport')
  }
}

// DetailView.tsx - track social clicks
<a
  href={cafe.instagram}
  onClick={() => trackCafeStat(cafe.id, 'instagram')}
>
  Instagram
</a>

// FeedPage.tsx - track feed article clicks
<a
  href={article.link}
  onClick={() => trackFeedClick(article.id)}
>
  {article.title}
</a>

// EventsPage.tsx - track event clicks
<a
  href={event.link}
  onClick={() => trackEventClick(event.id)}
>
  {event.name}
</a>
```

## Backend API

**Endpoints that handle both anonymous + authenticated tracking:**

```typescript
// workers/src/routes/stats.ts

// Cafe stats tracking (handles both anonymous + authenticated)
export async function handleTrackCafeStat(
    req: Request,
    env: Env
): Promise<Response> {
    const url = new URL(req.url);
    const [_, _api, _stats, _cafe, cafeId, stat] = url.pathname.split("/");

    // Parse request body for userId
    const body = await req.json().catch(() => ({}));
    const userId = body.userId ?? null;

    // Map stat names to column names (prevents SQL injection)
    const statColumns = {
        view: "views",
        directions: "directions_clicks",
        passport: "anonymous_passport_marks", // Only anonymous users
        instagram: "instagram_clicks",
        tiktok: "tiktok_clicks",
    };

    const column = statColumns[stat];
    if (!column) {
        return new Response("Invalid stat", { status: 400 });
    }

    // Increment cafe_stats counter (create row if doesn't exist)
    await env.DB.prepare(
        `
    INSERT INTO cafe_stats (cafe_id, ${column}, updated_at)
    VALUES (?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(cafe_id)
    DO UPDATE SET
      ${column} = ${column} + 1,
      updated_at = CURRENT_TIMESTAMP
  `
    )
        .bind(parseInt(cafeId))
        .run();

    // If authenticated user, also update user_activity_stats
    if (userId) {
      const userStatColumns = {
        view: "total_cafe_views",
        directions: "total_directions_clicks",
      };

      const userColumn = userStatColumns[stat];

      if (userColumn) {
        await env.DB.prepare(
          `
        INSERT INTO user_activity_stats (user_id, ${userColumn}, last_active_at, updated_at)
        VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id)
        DO UPDATE SET
          ${userColumn} = ${userColumn} + 1,
          last_active_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        `
        )
          .bind(userId)
          .run();
      }
    }

    return new Response("ok", { status: 200 });
}

// Feed article tracking
export async function handleTrackFeedClick(
    req: Request,
    env: Env
): Promise<Response> {
    const url = new URL(req.url);
    const [_, _api, _stats, _feed, feedItemId] = url.pathname.split("/");

    await env.DB.prepare(
        `
    INSERT INTO feed_stats (feed_item_id, clicks, updated_at)
    VALUES (?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(feed_item_id)
    DO UPDATE SET
      clicks = clicks + 1,
      updated_at = CURRENT_TIMESTAMP
  `
    )
        .bind(parseInt(feedItemId))
        .run();

    return new Response("ok", { status: 200 });
}

// Event tracking
export async function handleTrackEventClick(
    req: Request,
    env: Env
): Promise<Response> {
    const url = new URL(req.url);
    const [_, _api, _stats, _event, eventId] = url.pathname.split("/");

    await env.DB.prepare(
        `
    INSERT INTO event_stats (event_id, clicks, updated_at)
    VALUES (?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(event_id)
    DO UPDATE SET
      clicks = clicks + 1,
      updated_at = CURRENT_TIMESTAMP
  `
    )
        .bind(parseInt(eventId))
        .run();

    return new Response("ok", { status: 200 });
}

// NEW: Authenticated check-in tracking (Phase 1.5)
export async function handleCheckIn(
    req: Request,
    env: Env
): Promise<Response> {
    // Requires JWT auth - extract userId from token
    const userId = req.userId; // Set by auth middleware

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { cafeId, notes } = body;

    // Insert check-in (or update if exists)
    await env.DB.prepare(
        `
    INSERT INTO user_checkins (user_id, cafe_id, visited_at, notes)
    VALUES (?, ?, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(user_id, cafe_id)
    DO UPDATE SET
      visited_at = CURRENT_TIMESTAMP,
      notes = ?
  `
    )
        .bind(userId, cafeId, notes, notes)
        .run();

    // Increment user_activity_stats.total_checkins
    await env.DB.prepare(
        `
    INSERT INTO user_activity_stats (user_id, total_checkins, last_active_at, updated_at)
    VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id)
    DO UPDATE SET
      total_checkins = total_checkins + 1,
      last_active_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `
    )
        .bind(userId)
        .run();

    // Sync with userProfiles.totalCheckins (denormalized stat)
    await env.DB.prepare(
        `
    UPDATE user_profiles
    SET total_checkins = (
      SELECT COUNT(*) FROM user_checkins WHERE user_id = ?
    )
    WHERE user_id = ?
  `
    )
        .bind(userId, userId)
        .run();

    return new Response("ok", { status: 200 });
}
```

**Add routes:**

```typescript
// workers/src/index.ts
if (url.pathname.startsWith("/api/stats/cafe/")) {
    return handleTrackCafeStat(req, env);
}
if (url.pathname.startsWith("/api/stats/feed/")) {
    return handleTrackFeedClick(req, env);
}
if (url.pathname.startsWith("/api/stats/event/")) {
    return handleTrackEventClick(req, env);
}

// NEW: Authenticated check-in endpoint
if (url.pathname === "/api/checkins") {
    return handleCheckIn(req, env);
}
```

## Admin Stats Page

**Updated with user activity metrics:**

```typescript
// src/admin/StatsPage.tsx
import { useEffect, useState } from "react";

interface CafeStat {
    id: number;
    name: string;
    city: string;
    neighborhood: string;
    views: number;
    directions_clicks: number;
    anonymous_passport_marks: number;
    authenticated_checkins: number; // NEW
    instagram_clicks: number;
    tiktok_clicks: number;
}

interface UserActivitySummary {
    total_users: number;
    active_users_7d: number;
    active_users_30d: number;
    total_checkins: number;
    repeat_visitors: number; // Users with 3+ check-ins
}

export default function StatsPage() {
    const [cafeStats, setCafeStats] = useState<CafeStat[]>([]);
    const [userSummary, setUserSummary] = useState<UserActivitySummary | null>(null);
    const [sortBy, setSortBy] = useState<keyof CafeStat>("views");
    const [sortDesc, setSortDesc] = useState(true);

    useEffect(() => {
        // Fetch cafe stats
        fetch("/api/admin/cafe-stats")
            .then((r) => r.json())
            .then((data) => setCafeStats(data.stats));

        // NEW: Fetch user activity summary
        fetch("/api/admin/user-activity-summary")
            .then((r) => r.json())
            .then((data) => setUserSummary(data));
    }, []);

    const handleSort = (key: keyof CafeStat) => {
        if (sortBy === key) {
            setSortDesc(!sortDesc);
        } else {
            setSortBy(key);
            setSortDesc(true);
        }
    };

    const sorted = [...cafeStats].sort((a, b) => {
        const aVal = a[sortBy] ?? 0;
        const bVal = b[sortBy] ?? 0;
        return sortDesc ? bVal - aVal : aVal - bVal;
    });

    const totalViews = cafeStats.reduce((sum, s) => sum + s.views, 0);
    const totalDirections = cafeStats.reduce((sum, s) => sum + s.directions_clicks, 0);
    const totalAnonymousMarks = cafeStats.reduce((sum, s) => sum + s.anonymous_passport_marks, 0);
    const totalAuthCheckins = cafeStats.reduce((sum, s) => sum + s.authenticated_checkins, 0);
    const totalDemandSignal = totalAnonymousMarks + totalAuthCheckins; // Composable insight
    const avgCTR = totalViews > 0 ? ((totalDirections / totalViews) * 100).toFixed(1) : "0";

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">MatchaMap Analytics</h1>

            {/* User Activity Summary (NEW) */}
            {userSummary && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">User Activity (Phase 1.5)</h2>
                    <div className="grid grid-cols-5 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg shadow">
                            <div className="text-sm text-gray-600">Total Users</div>
                            <div className="text-2xl font-bold">{userSummary.total_users}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg shadow">
                            <div className="text-sm text-gray-600">Active (7d)</div>
                            <div className="text-2xl font-bold">{userSummary.active_users_7d}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg shadow">
                            <div className="text-sm text-gray-600">Active (30d)</div>
                            <div className="text-2xl font-bold">{userSummary.active_users_30d}</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg shadow">
                            <div className="text-sm text-gray-600">Total Check-ins</div>
                            <div className="text-2xl font-bold">{userSummary.total_checkins}</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg shadow">
                            <div className="text-sm text-gray-600">Repeat Visitors</div>
                            <div className="text-2xl font-bold">{userSummary.repeat_visitors}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cafe Performance Summary */}
            <h2 className="text-xl font-semibold mb-4">Cafe Performance</h2>
            <div className="grid grid-cols-5 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-600">Total Views</div>
                    <div className="text-2xl font-bold">{totalViews}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-600">Directions</div>
                    <div className="text-2xl font-bold">{totalDirections}</div>
                    <div className="text-xs text-gray-500">{avgCTR}% CTR</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-600">Anonymous Marks</div>
                    <div className="text-2xl font-bold">{totalAnonymousMarks}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-600">Auth Check-ins</div>
                    <div className="text-2xl font-bold">{totalAuthCheckins}</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-600">Total Demand</div>
                    <div className="text-2xl font-bold">{totalDemandSignal}</div>
                    <div className="text-xs text-gray-500">Marks + Check-ins</div>
                </div>
            </div>

            {/* Stats Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                                Cafe {sortBy === "name" && (sortDesc ? "↓" : "↑")}
                            </th>
                            <th className="px-4 py-3 text-left">City</th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort("views")}>
                                Views {sortBy === "views" && (sortDesc ? "↓" : "↑")}
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort("directions_clicks")}>
                                Directions {sortBy === "directions_clicks" && (sortDesc ? "↓" : "↑")}
                            </th>
                            <th className="px-4 py-3 text-right">CTR</th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort("anonymous_passport_marks")}>
                                Anon Marks {sortBy === "anonymous_passport_marks" && (sortDesc ? "↓" : "↑")}
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort("authenticated_checkins")}>
                                Check-ins {sortBy === "authenticated_checkins" && (sortDesc ? "↓" : "↑")}
                            </th>
                            <th className="px-4 py-3 text-right">Demand</th>
                            <th className="px-4 py-3 text-right">Social</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {sorted.map((cafe) => {
                            const ctr = cafe.views > 0 ? ((cafe.directions_clicks / cafe.views) * 100).toFixed(1) : "0";
                            const totalDemand = cafe.anonymous_passport_marks + cafe.authenticated_checkins;
                            return (
                                <tr key={cafe.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{cafe.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{cafe.city}</td>
                                    <td className="px-4 py-3 text-right">{cafe.views}</td>
                                    <td className="px-4 py-3 text-right">{cafe.directions_clicks}</td>
                                    <td className="px-4 py-3 text-right">{ctr}%</td>
                                    <td className="px-4 py-3 text-right">{cafe.anonymous_passport_marks}</td>
                                    <td className="px-4 py-3 text-right">{cafe.authenticated_checkins}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{totalDemand}</td>
                                    <td className="px-4 py-3 text-right">{cafe.instagram_clicks + cafe.tiktok_clicks}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
```

**Add API endpoints:**

```typescript
// workers/src/routes/admin.ts

// Cafe stats with anonymous + authenticated data
export async function handleAdminCafeStats(
    req: Request,
    env: Env
): Promise<Response> {
    // Protected by JWT auth + admin role check

    const { results } = await env.DB.prepare(
        `
    SELECT
      c.id,
      c.name,
      c.city,
      c.neighborhood,
      COALESCE(s.views, 0) as views,
      COALESCE(s.directions_clicks, 0) as directions_clicks,
      COALESCE(s.anonymous_passport_marks, 0) as anonymous_passport_marks,
      COALESCE(s.instagram_clicks, 0) as instagram_clicks,
      COALESCE(s.tiktok_clicks, 0) as tiktok_clicks,
      -- Count authenticated check-ins for this cafe
      (SELECT COUNT(*) FROM user_checkins WHERE cafe_id = c.id) as authenticated_checkins
    FROM cafes c
    LEFT JOIN cafe_stats s ON c.id = s.cafe_id
    WHERE c.deleted_at IS NULL
    ORDER BY s.views DESC NULLS LAST
  `
    ).all();

    return new Response(JSON.stringify({ stats: results }), {
        headers: { "Content-Type": "application/json" },
    });
}

// NEW: User activity summary (Phase 1.5)
export async function handleUserActivitySummary(
    req: Request,
    env: Env
): Promise<Response> {
    // Protected by JWT auth + admin role check

    // Total users
    const { results: totalUsers } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM users`
    ).all();

    // Active users (7 days)
    const { results: activeUsers7d } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM user_activity_stats
         WHERE last_active_at >= datetime('now', '-7 days')`
    ).all();

    // Active users (30 days)
    const { results: activeUsers30d } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM user_activity_stats
         WHERE last_active_at >= datetime('now', '-30 days')`
    ).all();

    // Total check-ins
    const { results: totalCheckins } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM user_checkins`
    ).all();

    // Repeat visitors (3+ check-ins)
    const { results: repeatVisitors } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM user_activity_stats
         WHERE total_checkins >= 3`
    ).all();

    return new Response(JSON.stringify({
        total_users: totalUsers[0].count,
        active_users_7d: activeUsers7d[0].count,
        active_users_30d: activeUsers30d[0].count,
        total_checkins: totalCheckins[0].count,
        repeat_visitors: repeatVisitors[0].count,
    }), {
        headers: { "Content-Type": "application/json" },
    });
}
```

**Add routes + protect with JWT auth:**

```typescript
// workers/src/index.ts
if (url.pathname === "/api/admin/cafe-stats") {
    return handleAdminCafeStats(req, env);
}

// NEW: User activity summary endpoint
if (url.pathname === "/api/admin/user-activity-summary") {
    return handleUserActivitySummary(req, env);
}
```

**Route in React Router:**

```typescript
// src/components/AppRoutes.tsx
<Route path="/admin/stats" element={<StatsPage />} />
```

**Total code: ~200 lines (Phase 1: 100 lines | Phase 1.5: 100 lines)**

## Partner-Actionable Insights

**These are the questions cafe partners care about:**

### 1. **Which cafes have high demand signal?**
→ Sort by "Total Demand" (anonymous marks + check-ins)
→ **Partner pitch:** "50 people marked your cafe as 'want to visit' - let's activate them with an event"

### 2. **Which cafes have high interest but low visits?**
→ High anonymous marks, low check-ins = people interested but haven't visited yet
→ **Partner pitch:** "You have 30 people interested but haven't visited - let's drive conversions with a special offer"

### 3. **Which cafes have low visibility?**
→ Low views = content needs improvement
→ **Partner pitch:** "Your cafe has low views - let's improve photos/description to drive discovery"

### 4. **Which cafes drive the most visits?**
→ Sort by directions clicks or CTR %
→ **Partner pitch:** "Your cafe has 45% CTR - people love your content! Let's feature you on the homepage"

### 5. **Which cafes have engaged regulars?**
→ High authenticated check-ins = loyal community
→ **Partner pitch:** "You have 15 repeat visitors with 3+ check-ins - offer them a loyalty reward"

### 6. **Is the user base growing?**
→ Active users (7d/30d) trend over time
→ **Partner pitch:** "We have 200 active users this month - partner with us to reach engaged matcha enthusiasts"

### 7. **Which events drive engagement?**
→ Sort event_stats by clicks
→ **Partner pitch:** "Last month's workshop had 80 clicks - let's run another event at your cafe"

### 8. **Do people care about social links?**
→ Sum of instagram_clicks + tiktok_clicks
→ **Internal insight:** Track if social integration is valuable

## Privacy

**Anonymous users:**
- We track which cafes are viewed, clicked, marked as "want to visit"
- No personal data collected
- No cookies, no cross-session tracking
- localStorage only (never leaves device)

**Authenticated users:**
- We track cafe check-ins, views, direction clicks associated with your account
- Used to power your passport, activity feed (Phase 2), and show you personalized recommendations
- Aggregated stats shared with cafe partners (no individual user data)
- You can delete your account anytime (removes all associated data)

**What we share with partners:**
- Aggregate counts only: "50 people marked your cafe as want to visit"
- Never individual user identities or browsing history
- Never sell or share personal data with third parties

## Implementation Checklist

**Phase 1: Anonymous Behavior Tracking (2 hours)**

-   [ ] Add stats tables to schema migration (15 min)
    -   [ ] `cafe_stats` table (with `anonymous_passport_marks` column)
    -   [ ] `feed_stats` table
    -   [ ] `event_stats` table
-   [ ] Create tracking utility functions (20 min)
    -   [ ] `trackCafeStat()` (with userId parameter)
    -   [ ] `trackFeedClick()` (with userId parameter)
    -   [ ] `trackEventClick()` (with userId parameter)
    -   [ ] Helper: `getUserId()` from authStore
-   [ ] Add tracking to components (25 min)
    -   [ ] DetailView - cafe view, directions, passport (anonymous), social
    -   [ ] FeedPage - article clicks
    -   [ ] EventsPage - event clicks
-   [ ] Add backend API endpoints (40 min)
    -   [ ] `/api/stats/cafe/:id/:stat` (handles userId from request body)
    -   [ ] `/api/stats/feed/:id`
    -   [ ] `/api/stats/event/:id`
-   [ ] Test tracking works (check DB after clicks) (10 min)

**Phase 1.5: Authenticated User Activity Tracking (1.5 hours)**

-   [ ] Add `user_activity_stats` table to schema (5 min)
-   [ ] Update backend stats endpoints to track user activity (30 min)
    -   [ ] Modify `handleTrackCafeStat()` to update `user_activity_stats`
    -   [ ] Add logic to increment `total_cafe_views`, `total_directions_clicks`
-   [ ] Add check-in tracking (25 min)
    -   [ ] `trackCheckIn()` frontend function
    -   [ ] `/api/checkins` backend endpoint
    -   [ ] Sync with `userProfiles.totalCheckins`
-   [ ] Add user activity summary endpoint (20 min)
    -   [ ] `/api/admin/user-activity-summary` endpoint
    -   [ ] Queries: total users, active users (7d/30d), repeat visitors
-   [ ] Test authenticated tracking (10 min)
    -   [ ] Log in as user, check in to cafe, verify DB updates

**Phase 2: Admin Stats UI (90 minutes)**

-   [ ] Update `StatsPage.tsx` component (50 min)
    -   [ ] User activity summary cards (NEW)
    -   [ ] Update cafe stats summary (split anonymous vs auth)
    -   [ ] Update sortable table (add check-ins, demand columns)
    -   [ ] Feed/event stats section (simple list)
-   [ ] Update admin API endpoints (20 min)
    -   [ ] Update `/api/admin/cafe-stats` (add authenticated_checkins)
    -   [ ] `/api/admin/feed-stats`
    -   [ ] `/api/admin/event-stats`
-   [ ] Add route to React Router (5 min)
-   [ ] Protect with JWT auth + admin role check (10 min)
-   [ ] Test on real data (15 min)
    -   [ ] Verify anonymous + authenticated tracking works
    -   [ ] Check composable insights (demand signal)

**Total: 5 hours → Ship it.**

## When to Add More

**Don't add these until you actually need them:**

-   Session tracking → When you have 1000+ daily users
-   Discovery method tracking → When you're optimizing funnels
-   Search term tracking → When you have 100+ cafes
-   Real-time dashboards → When traffic spikes matter
-   User cohorts & segmentation → When you have 500+ users
-   A/B testing → When you're experimenting with features
-   Conversion funnels → When optimizing sign-up flow
-   Heatmaps / click tracking → When debugging UX issues

**Phase 2 (Social Features) metrics** → See `docs/archive/social-features-analytics-prd.md` (archived; social features out of scope per PRODUCT_FOUNDATION.md)

## Total Cost

-   Storage: ~2KB per cafe + ~1KB per user = ~200KB for 100 cafes + 100 users
-   API calls: ~1000/day = ~30K/month (within free tier)
-   Workers: Well within free tier
-   D1 reads/writes: Well within free tier

**Cost: $0/month**

## Success Criteria

**You can answer these partner-actionable questions:**

-   ✅ Which cafes have the highest demand signal? (marks + check-ins)
-   ✅ Which cafes have high interest but low visits? (opportunity for activation)
-   ✅ What's the average CTR across all cafes?
-   ✅ How many active users do we have? (7d, 30d)
-   ✅ How many repeat visitors? (3+ check-ins)
-   ✅ Which events drive the most engagement?
-   ✅ Which cafes need better content? (low views = low discoverability)

**If you can answer these and compose them into partner pitches, you're done.**

---

**Next Steps:**

1. **Phase 1:** Add stats tables to backend migration (cafe, feed, event)
2. **Phase 1:** Implement tracking utilities with userId support
3. **Phase 1:** Wire up tracking in components
4. **Phase 1.5:** Add user_activity_stats table and check-in tracking
5. **Phase 1.5:** Update backend to track authenticated user activity
6. **Phase 2 (Admin UI):** Build admin stats page with user activity dashboard
7. **Ship it** and start gathering partner insights

**No complex dashboards, no cron jobs, no heavy analytics. Just simple counters that compose into actionable insights.**
