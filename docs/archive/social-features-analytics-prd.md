# MatchaMap Social Features Analytics PRD (Phase 2)

> **⚠️ ARCHIVED (2025-03):** Social features are out of scope. See [PRODUCT_FOUNDATION.md](../PRODUCT_FOUNDATION.md).

---

**Version:** 1.0
**Date:** October 11, 2025
**Status:** Draft (Activates when `ENABLE_USER_SOCIAL` = true)
**Prerequisite:** Phase 1 + 1.5 analytics must be implemented first
**Implementation Time:** 3 hours

## Philosophy

**Keep it simple.** Track only what cafe partners care about from user-generated content.

**Partner-actionable insights:**
- "You have 50 user reviews with 4.5 average rating - let's feature your cafe"
- "15 users added your cafe to their 'want to visit' list this week"
- "Your cafe has 30 user photos - let's use them in marketing materials"
- "You have 10 active followers - notify them about your new menu"

## What We're Tracking (Social Features)

When `ENABLE_USER_SOCIAL` turns on, we add these metrics:

### 1. User Reviews & Ratings
- **Review count per cafe** - How many reviews each cafe has
- **Average user rating per cafe** - Aggregated 1-5 star rating
- **Review engagement** - Helpful votes, replies

### 2. User Photos
- **Photo count per cafe** - How many user-submitted photos
- **Photo views** - Which user photos get the most views

### 3. Favorites & Lists
- **Favorite count per cafe** - How many users favorited this cafe
- **"Want to visit" count** - Users who marked cafe as want to visit
- **Custom list adds** - How often cafes are added to user lists

### 4. User Following
- **Follower count per cafe** - Users following cafe updates
- **Following notifications** - Did users engage with cafe update notifications

### 5. User Engagement
- **Active reviewers** - Users who leave reviews regularly
- **Active photographers** - Users who upload photos regularly
- **Engagement rate** - % of users who contribute content vs just browse

## Database Schema (Additions)

**No new tables needed!** We aggregate from existing social tables:

```sql
-- These tables already exist in your schema (from social features implementation)
-- user_reviews, user_photos, user_favorites, user_lists, cafe_followers

-- We just add indexes for fast aggregation queries
CREATE INDEX user_reviews_cafe_id_idx ON user_reviews(cafe_id);
CREATE INDEX user_photos_cafe_id_idx ON user_photos(cafe_id);
CREATE INDEX user_favorites_cafe_id_idx ON user_favorites(cafe_id);
CREATE INDEX cafe_followers_cafe_id_idx ON cafe_followers(cafe_id);
```

**Aggregation approach:** Calculate stats on-demand from existing tables (no duplication).

## Admin UI Updates

Add a new section to `StatsPage.tsx`:

```typescript
interface SocialStats {
  cafe_id: number;
  cafe_name: string;
  review_count: number;
  avg_rating: number;
  photo_count: number;
  favorite_count: number;
  follower_count: number;
}

// NEW: Social Features Stats section
<div className="mb-8">
  <h2 className="text-xl font-semibold mb-4">Social Features (Phase 2)</h2>

  {/* Summary Cards */}
  <div className="grid grid-cols-5 gap-4 mb-4">
    <div className="bg-purple-50 p-4 rounded-lg shadow">
      <div className="text-sm text-gray-600">Total Reviews</div>
      <div className="text-2xl font-bold">{totalReviews}</div>
    </div>
    <div className="bg-yellow-50 p-4 rounded-lg shadow">
      <div className="text-sm text-gray-600">Avg Rating</div>
      <div className="text-2xl font-bold">{avgRating.toFixed(1)} ⭐</div>
    </div>
    <div className="bg-blue-50 p-4 rounded-lg shadow">
      <div className="text-sm text-gray-600">User Photos</div>
      <div className="text-2xl font-bold">{totalPhotos}</div>
    </div>
    <div className="bg-pink-50 p-4 rounded-lg shadow">
      <div className="text-sm text-gray-600">Favorites</div>
      <div className="text-2xl font-bold">{totalFavorites}</div>
    </div>
    <div className="bg-green-50 p-4 rounded-lg shadow">
      <div className="text-sm text-gray-600">Active Reviewers</div>
      <div className="text-2xl font-bold">{activeReviewers}</div>
    </div>
  </div>

  {/* Social Stats Table */}
  <table className="w-full bg-white rounded-lg shadow">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-left">Cafe</th>
        <th className="px-4 py-3 text-right">Reviews</th>
        <th className="px-4 py-3 text-right">Rating</th>
        <th className="px-4 py-3 text-right">Photos</th>
        <th className="px-4 py-3 text-right">Favorites</th>
        <th className="px-4 py-3 text-right">Followers</th>
      </tr>
    </thead>
    <tbody>
      {socialStats.map((cafe) => (
        <tr key={cafe.cafe_id} className="hover:bg-gray-50">
          <td className="px-4 py-3 font-medium">{cafe.cafe_name}</td>
          <td className="px-4 py-3 text-right">{cafe.review_count}</td>
          <td className="px-4 py-3 text-right">{cafe.avg_rating.toFixed(1)} ⭐</td>
          <td className="px-4 py-3 text-right">{cafe.photo_count}</td>
          <td className="px-4 py-3 text-right">{cafe.favorite_count}</td>
          <td className="px-4 py-3 text-right">{cafe.follower_count}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

## Backend API Endpoint

```typescript
// workers/src/routes/admin.ts

export async function handleAdminSocialStats(
    req: Request,
    env: Env
): Promise<Response> {
    // Protected by JWT auth + admin role check

    const { results } = await env.DB.prepare(
        `
    SELECT
      c.id as cafe_id,
      c.name as cafe_name,
      COUNT(DISTINCT ur.id) as review_count,
      COALESCE(AVG(ur.rating), 0) as avg_rating,
      COUNT(DISTINCT up.id) as photo_count,
      COUNT(DISTINCT uf.id) as favorite_count,
      COUNT(DISTINCT cf.id) as follower_count
    FROM cafes c
    LEFT JOIN user_reviews ur ON c.id = ur.cafe_id
    LEFT JOIN user_photos up ON c.id = up.cafe_id
    LEFT JOIN user_favorites uf ON c.id = uf.cafe_id
    LEFT JOIN cafe_followers cf ON c.id = cf.cafe_id
    WHERE c.deleted_at IS NULL
    GROUP BY c.id, c.name
    ORDER BY review_count DESC
  `
    ).all();

    // Calculate summary stats
    const totalReviews = results.reduce((sum, r) => sum + r.review_count, 0);
    const avgRating = results.reduce((sum, r) => sum + r.avg_rating, 0) / results.length;
    const totalPhotos = results.reduce((sum, r) => sum + r.photo_count, 0);
    const totalFavorites = results.reduce((sum, r) => sum + r.favorite_count, 0);

    // Active reviewers (users with 3+ reviews)
    const { results: activeReviewersResult } = await env.DB.prepare(
        `SELECT COUNT(DISTINCT user_id) as count
         FROM user_reviews
         GROUP BY user_id
         HAVING COUNT(*) >= 3`
    ).all();
    const activeReviewers = activeReviewersResult.length;

    return new Response(JSON.stringify({
        stats: results,
        summary: {
            total_reviews: totalReviews,
            avg_rating: avgRating,
            total_photos: totalPhotos,
            total_favorites: totalFavorites,
            active_reviewers: activeReviewers,
        },
    }), {
        headers: { "Content-Type": "application/json" },
    });
}

// Add route
if (url.pathname === "/api/admin/social-stats") {
    return handleAdminSocialStats(req, env);
}
```

## Partner-Actionable Insights (Phase 2)

### 1. **Which cafes have strong community engagement?**
→ Sort by review_count + photo_count + follower_count
→ **Partner pitch:** "You have 50 reviews, 30 photos, and 40 followers - you have a loyal community"

### 2. **Which cafes need review encouragement?**
→ Low review_count but high check-ins (from Phase 1.5)
→ **Partner pitch:** "You have 100 check-ins but only 5 reviews - let's encourage users to share feedback"

### 3. **Which cafes have the best ratings?**
→ Sort by avg_rating (4.5+)
→ **Partner pitch:** "You have 4.8 stars from 25 reviews - let's feature you as 'Community Favorite'"

### 4. **Which cafes have the most visual content?**
→ Sort by photo_count
→ **Partner pitch:** "You have 30 user photos - can we use them in our marketing materials?"

### 5. **Which cafes have engaged followers?**
→ Sort by follower_count
→ **Partner pitch:** "You have 50 followers - when you post updates, they'll get notified"

### 6. **Which users contribute the most?**
→ Active reviewers, photographers
→ **Internal insight:** Identify power users to engage/reward

### 7. **What's the engagement rate?**
→ (Active contributors / Total users) * 100
→ **Internal insight:** Track if social features are being used

## Implementation Checklist

**Prerequisite:** Phase 1 + 1.5 must be complete and social features tables must exist

-   [ ] Add indexes to social tables (10 min)
    -   [ ] `user_reviews_cafe_id_idx`
    -   [ ] `user_photos_cafe_id_idx`
    -   [ ] `user_favorites_cafe_id_idx`
    -   [ ] `cafe_followers_cafe_id_idx`
-   [ ] Add backend social stats endpoint (60 min)
    -   [ ] `/api/admin/social-stats` endpoint
    -   [ ] Aggregate queries across social tables
    -   [ ] Calculate summary stats
-   [ ] Update `StatsPage.tsx` component (90 min)
    -   [ ] Add social features summary cards
    -   [ ] Add social stats table
    -   [ ] Fetch from `/api/admin/social-stats`
-   [ ] Test with real social data (20 min)
    -   [ ] Create test reviews, photos, favorites
    -   [ ] Verify aggregations are correct

**Total: 3 hours → Ship it.**

## Privacy (Phase 2 Additions)

**User-generated content:**
- Reviews and photos are public (visible to all users)
- Favorites and lists can be private or public (user choice)
- Aggregated counts shared with cafe partners (e.g., "You have 50 favorites")
- Individual user identities never shared with partners
- Users can delete their content anytime (removes from aggregations)

## Success Criteria

**You can answer these partner questions:**

-   ✅ Which cafes have the most reviews and highest ratings?
-   ✅ Which cafes have the most user photos?
-   ✅ Which cafes have the most engaged followers?
-   ✅ Which cafes are being favorited the most?
-   ✅ How many active contributors (reviewers, photographers) do we have?
-   ✅ What's the overall engagement rate?

**If you can compose these into partner pitches, you're done.**

---

## When to Ship This

**Don't implement until:**
1. Phase 1 + 1.5 analytics are live and working
2. `ENABLE_USER_SOCIAL` is turned on in production
3. You have at least 50+ users actively using social features
4. You're actively talking to cafe partners about data

**Why wait?**
- Social features might not be used much at first
- No point tracking metrics if there's no data
- Focus on Phase 1 + 1.5 first to prove anonymous + authenticated tracking works

---

**That's it. Simple, partner-focused, actionable insights from social features.**
