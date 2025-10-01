# MatchaMap Metrics & Analytics PRD

**Version:** 1.0
**Date:** October 1, 2025
**Status:** Ready to Ship
**Implementation Time:** 3.5 hours (tracking + admin UI)

## What We're Tracking (That's It)

**Cafe Metrics:**

1. **Which cafes get views** - Are people looking at them?
2. **Which cafes get direction clicks** - Do people want to visit?
3. **Who uses passport** - Is this feature useful?
4. **Social clicks** - Do people care about Instagram links?

**Content Metrics:** 5. **Feed article clicks** - Which news items are interesting? 6. **Event clicks** - Which events get attention?

That's everything. No sessions, no funnels, no composite scores.

## Database Schema

```sql
-- Cafe performance metrics
CREATE TABLE cafe_stats (
    cafe_id INTEGER PRIMARY KEY REFERENCES cafes(id),
    views INTEGER DEFAULT 0,
    directions_clicks INTEGER DEFAULT 0,
    passport_marks INTEGER DEFAULT 0,
    instagram_clicks INTEGER DEFAULT 0,
    tiktok_clicks INTEGER DEFAULT 0,
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

Three simple tables. Just counters. Done.

## Frontend Tracking

**Create simple tracking utilities:**

```typescript
// src/utils/analytics.ts

export async function trackCafeStat(
    cafeId: number,
    stat: "view" | "directions" | "passport" | "instagram" | "tiktok"
): Promise<void> {
    // Fire and forget - don't block UI
    fetch(`/api/stats/cafe/${cafeId}/${stat}`, { method: "POST" }).catch(
        () => {}
    ); // Ignore errors silently
}

export async function trackFeedClick(feedItemId: number): Promise<void> {
    fetch(`/api/stats/feed/${feedItemId}`, { method: "POST" }).catch(() => {});
}

export async function trackEventClick(eventId: number): Promise<void> {
    fetch(`/api/stats/event/${eventId}`, { method: "POST" }).catch(() => {});
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

**Simple endpoints that increment counters:**

```typescript
// workers/src/routes/stats.ts

// Cafe stats tracking
export async function handleTrackCafeStat(
    req: Request,
    env: Env
): Promise<Response> {
    const url = new URL(req.url);
    const [_, _api, _stats, _cafe, cafeId, stat] = url.pathname.split("/");

    // Map stat names to column names (prevents SQL injection)
    const statColumns = {
        view: "views",
        directions: "directions_clicks",
        passport: "passport_marks",
        instagram: "instagram_clicks",
        tiktok: "tiktok_clicks",
    };

    const column = statColumns[stat];
    if (!column) {
        return new Response("Invalid stat", { status: 400 });
    }

    // Increment counter (create row if doesn't exist)
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
```

## Admin Stats Page

**Build a simple React component (no Retool):**

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
    passport_marks: number;
    instagram_clicks: number;
    tiktok_clicks: number;
}

export default function StatsPage() {
    const [stats, setStats] = useState<CafeStat[]>([]);
    const [sortBy, setSortBy] = useState<keyof CafeStat>("views");
    const [sortDesc, setSortDesc] = useState(true);

    useEffect(() => {
        fetch("/api/admin/cafe-stats")
            .then((r) => r.json())
            .then((data) => setStats(data.stats));
    }, []);

    const handleSort = (key: keyof CafeStat) => {
        if (sortBy === key) {
            setSortDesc(!sortDesc);
        } else {
            setSortBy(key);
            setSortDesc(true);
        }
    };

    const sorted = [...stats].sort((a, b) => {
        const aVal = a[sortBy] ?? 0;
        const bVal = b[sortBy] ?? 0;
        return sortDesc ? bVal - aVal : aVal - bVal;
    });

    const totalViews = stats.reduce((sum, s) => sum + s.views, 0);
    const totalDirections = stats.reduce(
        (sum, s) => sum + s.directions_clicks,
        0
    );
    const totalPassport = stats.reduce((sum, s) => sum + s.passport_marks, 0);
    const avgCTR =
        totalViews > 0
            ? ((totalDirections / totalViews) * 100).toFixed(1)
            : "0";

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Cafe Performance</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-600">Total Views</div>
                    <div className="text-2xl font-bold">{totalViews}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-600">
                        Total Directions
                    </div>
                    <div className="text-2xl font-bold">{totalDirections}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-600">Avg CTR</div>
                    <div className="text-2xl font-bold">{avgCTR}%</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-600">Passport Uses</div>
                    <div className="text-2xl font-bold">{totalPassport}</div>
                </div>
            </div>

            {/* Stats Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort("name")}
                            >
                                Cafe{" "}
                                {sortBy === "name" && (sortDesc ? "↓" : "↑")}
                            </th>
                            <th className="px-4 py-3 text-left">City</th>
                            <th className="px-4 py-3 text-left">
                                Neighborhood
                            </th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort("views")}
                            >
                                Views{" "}
                                {sortBy === "views" && (sortDesc ? "↓" : "↑")}
                            </th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort("directions_clicks")}
                            >
                                Directions{" "}
                                {sortBy === "directions_clicks" &&
                                    (sortDesc ? "↓" : "↑")}
                            </th>
                            <th className="px-4 py-3 text-right">CTR</th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort("passport_marks")}
                            >
                                Passport{" "}
                                {sortBy === "passport_marks" &&
                                    (sortDesc ? "↓" : "↑")}
                            </th>
                            <th className="px-4 py-3 text-right">Social</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {sorted.map((cafe) => {
                            const ctr =
                                cafe.views > 0
                                    ? (
                                          (cafe.directions_clicks /
                                              cafe.views) *
                                          100
                                      ).toFixed(1)
                                    : "0";
                            return (
                                <tr key={cafe.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">
                                        {cafe.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {cafe.city}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {cafe.neighborhood}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {cafe.views}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {cafe.directions_clicks}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {ctr}%
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {cafe.passport_marks}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {cafe.instagram_clicks +
                                            cafe.tiktok_clicks}
                                    </td>
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

**Add API endpoint:**

```typescript
// workers/src/routes/admin.ts
export async function handleAdminCafeStats(
    req: Request,
    env: Env
): Promise<Response> {
    // Protected by Cloudflare Access - only you can access this

    const { results } = await env.DB.prepare(
        `
    SELECT
      c.id,
      c.name,
      c.city,
      c.neighborhood,
      COALESCE(s.views, 0) as views,
      COALESCE(s.directions_clicks, 0) as directions_clicks,
      COALESCE(s.passport_marks, 0) as passport_marks,
      COALESCE(s.instagram_clicks, 0) as instagram_clicks,
      COALESCE(s.tiktok_clicks, 0) as tiktok_clicks
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
```

**Add route + protect with Cloudflare Access:**

```typescript
// workers/src/index.ts
if (url.pathname === "/api/admin/cafe-stats") {
    return handleAdminCafeStats(req, env);
}
```

**Route in React Router:**

```typescript
// src/components/AppRoutes.tsx
<Route path="/admin/stats" element={<StatsPage />} />
```

**Total code: ~100 lines. No Retool dependency.**

## Questions This Answers

**Which cafes are popular?**
→ Sort by views

**Which cafes drive visits?**
→ Sort by directions clicks or CTR %

**Is passport being used?**
→ Sum of passport_marks column

**Do people click social links?**
→ Sum of instagram_clicks column

**Which cafes need better content?**
→ High views + low CTR = bad content

**Which neighborhoods are popular?**
→ Group by neighborhood, sum views

## Privacy

We track which cafes are popular. No personal data collected. No cookies. No tracking across sessions.

That's the entire privacy policy.

## Implementation Checklist

**Phase 1: Core Tracking (2 hours)**

-   [ ] Add stats tables to schema migration (10 min)
    -   [ ] `cafe_stats` table
    -   [ ] `feed_stats` table
    -   [ ] `event_stats` table
-   [ ] Create tracking utility functions (15 min)
    -   [ ] `trackCafeStat()`
    -   [ ] `trackFeedClick()`
    -   [ ] `trackEventClick()`
-   [ ] Add tracking to components (25 min)
    -   [ ] DetailView - cafe view, directions, passport, social
    -   [ ] FeedPage - article clicks
    -   [ ] EventsPage - event clicks
-   [ ] Add backend API endpoints (40 min)
    -   [ ] `/api/stats/cafe/:id/:stat`
    -   [ ] `/api/stats/feed/:id`
    -   [ ] `/api/stats/event/:id`
-   [ ] Test tracking works (check DB after clicks) (10 min)

**Phase 2: Admin Stats UI (90 minutes)**

-   [ ] Create `StatsPage.tsx` component (45 min)
    -   [ ] Summary cards (total views, directions, CTR, passport)
    -   [ ] Sortable cafe stats table
    -   [ ] Feed/event stats section (simple list)
-   [ ] Add admin API endpoints (20 min)
    -   [ ] `/api/admin/cafe-stats`
    -   [ ] `/api/admin/feed-stats`
    -   [ ] `/api/admin/event-stats`
-   [ ] Add route to React Router (5 min)
-   [ ] Protect with Cloudflare Access (10 min)
-   [ ] Test on real data (10 min)

**Ship it.**

## When to Add More

**Don't add these until you actually need them:**

-   Session tracking → When you have 1000+ daily users
-   Discovery method tracking → When you're optimizing funnels
-   Search term tracking → When you have 100+ cafes
-   Real-time dashboards → When traffic spikes matter
-   User cohorts → When you have user accounts
-   A/B testing → When you're experimenting with features

## Total Cost

-   Storage: ~1KB per cafe = ~100KB for 100 cafes
-   API calls: ~500/day = ~15K/month
-   Workers: Well within free tier

**Cost: $0/month**

## Success Criteria

You can answer these questions in your admin UI:

-   ✅ Which 5 cafes got the most views?
-   ✅ What's the average CTR across all cafes?
-   ✅ How many people have used the passport feature?
-   ✅ Which cafe has the highest directions CTR?
-   ✅ Which feed articles/events are getting clicks?

If you can answer these, you're done.

---

**Next Steps:**

1. Add stats tables to backend migration
2. Implement tracking utilities (cafe, feed, event)
3. Wire up tracking in components
4. Build admin stats page
5. Ship and forget about it

**No complex dashboards, no cron jobs, no session tracking. Just simple counters.**
