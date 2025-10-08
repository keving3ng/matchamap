# MatchaMap Social Features - Product Requirements Document

**Version:** 1.0
**Date:** October 2025
**Status:** Planning
**Phase:** User-Generated Content & Community Features

---

## Executive Summary

Now that MatchaMap has user accounts, authentication, and user profiles, the next phase focuses on transforming the platform from an admin-curated guide into a community-driven discovery platform. This phase introduces user-generated content (reviews, ratings, photos, check-ins) while maintaining the quality and curation that makes MatchaMap unique.

**Core Philosophy:** Combine expert curation (admin reviews) with community wisdom (user reviews) to create the most comprehensive matcha cafe guide.

---

## Table of Contents

1. [Features Overview](#features-overview)
2. [Feature Details](#feature-details)
3. [Technical Architecture](#technical-architecture)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Success Metrics](#success-metrics)

---

## Features Overview

### Phase 2A: User Check-ins & Basic Engagement (MVP)

-   ✅ **Digital Passport** - Users mark cafes they've visited
-   ✅ **Check-in System** - Track visits with timestamps and notes
-   ✅ **Basic Stats** - Track personal visit count and completion percentage

### Phase 2B: User Reviews & Ratings

-   📝 **User Reviews** - Text reviews with structured format
-   ⭐ **User Ratings** - 0-10 scale ratings (matching admin system)
-   🎯 **Rating Aggregation** - Combine admin + user ratings intelligently
-   🏷️ **Review Tags** - Categorize reviews (vibe, service, quality, etc.)

### Phase 2C: Photo Uploads & Gallery

-   📸 **Photo Submissions** - Users upload matcha drink photos
-   🖼️ **Cafe Gallery** - Public gallery showing user photos
-   ✅ **Photo Moderation** - Admin approval queue for quality control
-   🏆 **Featured Photos** - Highlight best submissions

### Phase 2D: Social Features

-   👥 **User Profiles** - Public profiles showing activity
-   🔍 **User Discovery** - Find and follow other matcha enthusiasts
-   🏅 **Leaderboards** - Rankings by check-ins, reviews, contributions
-   🎖️ **Badges & Achievements** - Gamification for engagement

### Phase 2E: Personalization & Discovery

-   💚 **Favorites** - Save favorite cafes
-   📊 **Personalized Recommendations** - Based on user preferences and history
-   🔔 **Activity Feed** - See what users you follow are reviewing
-   🗺️ **Custom Lists** - Create and share themed cafe lists

---

## Feature Details

## 1. Digital Passport & Check-ins

### 1.1 User Stories

**As a user, I want to:**

-   Mark cafes I've visited so I can track my matcha journey
-   See my passport completion percentage to gamify my exploration
-   Add notes to my check-ins to remember specific drinks or experiences
-   View my check-in history with timestamps
-   Share my passport progress on social media

**As an admin, I want to:**

-   See which cafes are most visited to inform content strategy
-   Track user engagement with the passport feature
-   Ensure check-ins are legitimate (prevent spam/fake check-ins)

### 1.2 Functional Requirements

**Check-in Flow:**

1. User visits a cafe detail page
2. Clicks "I've been here" or "Check in" button
3. Optional: Add notes about their visit (e.g., "Had the ceremonial matcha - amazing!")
4. Optional: Rate their experience (if not leaving full review)
5. Check-in is saved with timestamp
6. Passport updates instantly

**Data to Capture:**

-   User ID
-   Cafe ID
-   Timestamp (visited_at)
-   Optional: Notes (text, max 500 chars)
-   Optional: Quick rating (1-10 scale)
-   Optional: Photos (link to photo uploads)

**Display:**

-   Passport page shows:
    -   Progress bar (X of Y cafes visited)
    -   Grid/list of visited cafes with check-in dates
    -   Badges earned for milestones (5, 10, 25, 50 cafes)
-   Cafe detail page shows:
    -   "✓ Visited on [date]" if user checked in
    -   Button to add/edit check-in

### 1.3 Technical Requirements

**Database Schema:**

```sql
-- Already exists: user_checkins table
- id
- user_id
- cafe_id
- visited_at
- notes (optional)
- quick_rating (optional, 1-10)
- created_at

-- Add indexes:
CREATE INDEX idx_user_checkins_user_visited ON user_checkins(user_id, visited_at DESC);
CREATE INDEX idx_user_checkins_cafe ON user_checkins(cafe_id);
```

**API Endpoints:**

```
POST   /api/checkins                    - Create check-in
GET    /api/checkins/me                - Get my check-ins
GET    /api/checkins/me/stats          - Get my passport stats
PUT    /api/checkins/:id               - Update check-in notes
DELETE /api/checkins/:id               - Remove check-in
GET    /api/cafes/:id/checkins/count   - Get total check-ins for cafe
```

**Frontend Components:**

-   `PassportView.tsx` (enhance existing)
-   `CheckInButton.tsx` (on cafe detail page)
-   `CheckInModal.tsx` (add notes/rating)
-   `PassportStats.tsx` (progress visualization)

---

## 2. User Reviews & Ratings

### 2.1 User Stories

**As a user, I want to:**

-   Leave a detailed review of my experience at a cafe
-   Rate different aspects (ambiance, matcha quality, service, etc.)
-   Edit or delete my reviews
-   See my own reviews on my profile
-   Upvote helpful reviews from other users

**As a visitor, I want to:**

-   See both expert (admin) and community reviews
-   Filter reviews by rating or recency
-   See review summaries/highlights
-   Trust that reviews are authentic

### 2.2 Functional Requirements

**Review Structure:**

-   Overall rating (0-10 scale, matches admin system)
-   Aspect ratings (optional):
    -   Matcha Quality (0-10)
    -   Ambiance (0-10)
    -   Service (0-10)
    -   Value (0-10)
-   Review text (50-2000 characters)
-   Tags (e.g., "great for studying", "instagram-worthy", "authentic Japanese")
-   Visit date (when did you visit?)
-   Recommended drink (optional)
-   Photos (0-5 photos)

**Review Display:**

-   Cafe detail page shows:
    -   **Combined Score**: Admin score + weighted average of user scores
    -   Admin review (always at top, highlighted)
    -   User reviews sorted by helpfulness/recency
    -   Ability to filter/sort reviews
-   User profile shows their reviews
-   Feed shows recent reviews from followed users

**Review Moderation:**

-   Auto-publish reviews from verified users
-   Flag suspicious reviews for admin review
-   Users can report inappropriate reviews
-   Admin can feature/pin exceptional reviews

### 2.3 Technical Requirements

**Database Schema:**

```sql
CREATE TABLE user_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,

  -- Ratings
  overall_rating REAL NOT NULL CHECK (overall_rating >= 0 AND overall_rating <= 10),
  matcha_quality_rating REAL CHECK (matcha_quality_rating >= 0 AND matcha_quality_rating <= 10),
  ambiance_rating REAL CHECK (ambiance_rating >= 0 AND ambiance_rating <= 10),
  service_rating REAL CHECK (service_rating >= 0 AND service_rating <= 10),
  value_rating REAL CHECK (value_rating >= 0 AND value_rating <= 10),

  -- Content
  review_text TEXT NOT NULL,
  tags TEXT, -- JSON array
  visit_date TEXT,
  recommended_drink TEXT,

  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,

  -- Moderation
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'pending', 'flagged', 'removed')),
  is_featured BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Constraint: One review per user per cafe
  UNIQUE(user_id, cafe_id)
);

CREATE TABLE review_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL REFERENCES user_reviews(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_helpful (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL REFERENCES user_reviews(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, user_id)
);

-- Indexes
CREATE INDEX idx_user_reviews_cafe ON user_reviews(cafe_id, status, created_at DESC);
CREATE INDEX idx_user_reviews_user ON user_reviews(user_id, created_at DESC);
CREATE INDEX idx_review_helpful_review ON review_helpful(review_id);
```

**API Endpoints:**

```
POST   /api/reviews                      - Create review
GET    /api/reviews/me                   - Get my reviews
GET    /api/cafes/:id/reviews            - Get cafe reviews (paginated)
GET    /api/reviews/:id                  - Get single review
PUT    /api/reviews/:id                  - Update my review
DELETE /api/reviews/:id                  - Delete my review
POST   /api/reviews/:id/helpful          - Mark review as helpful
DELETE /api/reviews/:id/helpful          - Remove helpful mark

Admin:
GET    /api/admin/reviews                - Get all reviews (filter by status)
PUT    /api/admin/reviews/:id/feature    - Feature a review
PUT    /api/admin/reviews/:id/status     - Change review status
```

**Rating Aggregation Algorithm:**

```typescript
// Combine admin rating with user ratings
function calculateCombinedScore(cafe: Cafe, userReviews: UserReview[]): number {
    // Admin score has higher weight initially, decreases as user reviews increase
    const adminWeight = 0.7; // Start with 70% weight for admin
    const userWeight = 0.3; // 30% for users initially

    // As user reviews increase, shift weight toward community
    const reviewCount = userReviews.length;
    const adjustedAdminWeight = adminWeight / (1 + reviewCount / 20); // Decreases as reviews grow
    const adjustedUserWeight = 1 - adjustedAdminWeight;

    const adminScore = cafe.displayScore; // Admin's curated score
    const userAvgScore =
        userReviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviewCount;

    const combinedScore =
        adminScore * adjustedAdminWeight + userAvgScore * adjustedUserWeight;

    return Math.round(combinedScore * 10) / 10; // Round to 1 decimal
}
```

**Frontend Components:**

-   `ReviewForm.tsx` - Form to submit review
-   `ReviewCard.tsx` - Display single review
-   `ReviewList.tsx` - List of reviews with filters
-   `ReviewModal.tsx` - Modal for writing review
-   `CombinedRating.tsx` - Display admin + user rating
-   `ReviewStats.tsx` - Rating breakdown by aspect

---

## 3. Photo Uploads & Gallery

### 3.1 User Stories

**As a user, I want to:**

-   Upload photos of my matcha drinks
-   Add photos when checking in or reviewing
-   See all my uploaded photos on my profile
-   Get featured if my photo is exceptional

**As a visitor, I want to:**

-   Browse photo galleries for each cafe
-   See real photos from actual visitors
-   Filter photos by drink type or rating

### 3.2 Functional Requirements

**Upload Flow:**

1. User clicks "Add Photo" on cafe detail page or during check-in/review
2. Upload image (max 5MB, JPG/PNG/HEIC)
3. Image is processed:
    - Resized to optimal dimensions (1200x1200 max)
    - Compressed for web
    - Uploaded to Cloudflare Images
4. Optional: Add caption and tag drink type
5. Photo enters moderation queue
6. Admin approves → Photo appears in gallery

**Moderation:**

-   All photos require admin approval before public display
-   Admin can reject inappropriate photos
-   Flagging system for community reporting

**Display:**

-   Cafe detail page: Photo gallery (grid layout)
-   User profile: Personal photo gallery
-   Feed: Recent photos from followed users

### 3.3 Technical Requirements

**Storage: Cloudflare Images**

-   Automatic resizing and optimization
-   Delivery via CDN
-   Variants for thumbnails (200x200, 400x400, 1200x1200)

**Database Schema:**

```sql
CREATE TABLE user_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,

  -- Cloudflare Images
  image_id TEXT NOT NULL UNIQUE, -- Cloudflare image ID
  image_url TEXT NOT NULL,       -- Full URL
  thumbnail_url TEXT NOT NULL,   -- Small thumbnail

  -- Metadata
  caption TEXT,
  drink_type TEXT, -- e.g., "Iced Matcha Latte", "Ceremonial Matcha"

  -- Association
  review_id INTEGER REFERENCES user_reviews(id) ON DELETE SET NULL,
  checkin_id INTEGER REFERENCES user_checkins(id) ON DELETE SET NULL,

  -- Moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured BOOLEAN DEFAULT FALSE,

  -- Engagement
  like_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  approved_at TEXT,
  approved_by INTEGER REFERENCES users(id)
);

CREATE TABLE photo_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  photo_id INTEGER NOT NULL REFERENCES user_photos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(photo_id, user_id)
);

-- Indexes
CREATE INDEX idx_user_photos_cafe ON user_photos(cafe_id, status, created_at DESC);
CREATE INDEX idx_user_photos_user ON user_photos(user_id, created_at DESC);
CREATE INDEX idx_user_photos_status ON user_photos(status, created_at);
```

**API Endpoints:**

```
POST   /api/photos/upload              - Upload photo (returns image_id)
POST   /api/photos                     - Create photo record
GET    /api/photos/me                  - Get my photos
GET    /api/cafes/:id/photos           - Get cafe photos (approved only)
DELETE /api/photos/:id                 - Delete my photo
POST   /api/photos/:id/like            - Like a photo

Admin:
GET    /api/admin/photos/pending       - Get photos awaiting approval
PUT    /api/admin/photos/:id/approve   - Approve photo
PUT    /api/admin/photos/:id/reject    - Reject photo
PUT    /api/admin/photos/:id/feature   - Feature photo
```

**Frontend Components:**

-   `PhotoUploadButton.tsx` - Trigger upload
-   `PhotoUploadModal.tsx` - Upload interface
-   `PhotoGallery.tsx` - Grid of photos
-   `PhotoLightbox.tsx` - Full-screen photo view
-   `PhotoModerationQueue.tsx` (admin) - Approve/reject photos

---

## 4. Social Features

### 4.1 User Stories

**As a user, I want to:**

-   View other users' profiles and their activity
-   Follow users with similar tastes
-   See what cafes my friends have reviewed
-   Compare my passport with friends
-   Earn badges and climb leaderboards

**As a community, we want to:**

-   Celebrate top contributors
-   Foster a sense of community among matcha lovers
-   Encourage quality contributions

### 4.2 Functional Requirements

**User Profiles:**

-   Display Name, Bio, Location
-   Avatar (Cloudflare Images)
-   Stats: Check-ins, Reviews, Photos, Followers, Following
-   Recent Activity feed
-   Passport completion percentage
-   Badges earned
-   Privacy controls (public/private profile)

**Following System:**

-   Follow/unfollow users
-   See followers and following lists
-   Activity feed shows followed users' reviews/check-ins

**Leaderboards:**

-   Top Contributors (by reviews + photos)
-   Most Cafes Visited (by check-ins)
-   Most Helpful Reviewers (by helpful votes)
-   Monthly/All-Time rankings
-   Filter by city

**Badges & Achievements:**

-   Passport Milestones (5, 10, 25, 50, 100 cafes)
-   Review Milestones (10, 25, 50, 100 reviews)
-   Photo Contributor (10, 50, 100 photos)
-   Early Adopter (joined in first month)
-   Featured Reviewer (admin featured review)
-   Neighborhood Expert (visited all cafes in neighborhood)
-   Matcha Master (100% passport completion)
-   Community Helper (50 helpful votes received)

### 4.3 Technical Requirements

**Database Schema:**

```sql
CREATE TABLE user_follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

CREATE TABLE user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- e.g., "passport_25", "reviewer_100"
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT, -- URL to icon
  earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT -- JSON for additional data
);

CREATE TABLE activity_feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'checkin', 'review', 'photo', 'badge', 'follow'
  activity_data TEXT NOT NULL, -- JSON with relevant IDs and data
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id, created_at DESC);
CREATE INDEX idx_user_follows_following ON user_follows(following_id, created_at DESC);
CREATE INDEX idx_user_badges_user ON user_badges(user_id, earned_at DESC);
CREATE INDEX idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
```

**API Endpoints:**

```
-- Following
POST   /api/users/:username/follow         - Follow user
DELETE /api/users/:username/follow         - Unfollow user
GET    /api/users/:username/followers      - Get followers
GET    /api/users/:username/following      - Get following
GET    /api/users/me/feed                  - Get activity feed

-- Badges
GET    /api/users/:username/badges         - Get user's badges
GET    /api/badges                         - Get all available badges

-- Leaderboards
GET    /api/leaderboard/contributors       - Top contributors
GET    /api/leaderboard/visitors           - Most cafes visited
GET    /api/leaderboard/reviewers          - Most helpful reviewers

-- Activity
GET    /api/activity/recent                - Recent site activity (public)
```

**Badge Award Logic:**

```typescript
// Check and award badges after user actions
async function checkAndAwardBadges(userId: number) {
    const user = await getUserStats(userId);
    const earnedBadges = [];

    // Check passport badges
    if (user.totalCheckins >= 5) earnedBadges.push("passport_5");
    if (user.totalCheckins >= 10) earnedBadges.push("passport_10");
    if (user.totalCheckins >= 25) earnedBadges.push("passport_25");
    // ... etc

    // Check review badges
    if (user.totalReviews >= 10) earnedBadges.push("reviewer_10");
    // ... etc

    // Award new badges
    for (const badgeType of earnedBadges) {
        const alreadyHas = await hasBadge(userId, badgeType);
        if (!alreadyHas) {
            await awardBadge(userId, badgeType);
            // Notify user (push notification, email, etc.)
        }
    }
}
```

**Frontend Components:**

-   `PublicUserProfile.tsx` - View other users' profiles
-   `FollowButton.tsx` - Follow/unfollow
-   `LeaderboardPage.tsx` - Rankings
-   `BadgeDisplay.tsx` - Show earned badges
-   `ActivityFeed.tsx` - Social feed
-   `UserCard.tsx` - Mini user profile card

---

## 5. Personalization & Discovery

### 5.1 User Stories

**As a user, I want to:**

-   Save my favorite cafes for quick access
-   Get recommendations based on my preferences
-   Create themed lists (e.g., "Best for Study", "Date Spots")
-   See trending cafes in my area
-   Discover cafes similar to ones I've loved

### 5.2 Functional Requirements

**Favorites:**

-   Heart icon to favorite/unfavorite cafes
-   Favorites list on profile
-   Quick filter to show favorites on map

**Personalized Recommendations:**

-   Based on:
    -   User's check-ins and ratings
    -   Similar users' preferences (collaborative filtering)
    -   Location and visit patterns
    -   Preferred drink types
-   Display in dedicated "For You" section

**Custom Lists:**

-   Create lists (e.g., "Winter Warmers", "Westside Favorites")
-   Add/remove cafes from lists
-   Make lists public or private
-   Share lists via link

**Trending & Discovery:**

-   Trending cafes (most check-ins/reviews this week)
-   New additions (recently added cafes)
-   Underrated gems (high ratings, few reviews)

### 5.3 Technical Requirements

**Database Schema:**

```sql
CREATE TABLE user_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, cafe_id)
);

CREATE TABLE user_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  notes TEXT,
  added_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(list_id, cafe_id)
);

-- Indexes
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id, created_at DESC);
CREATE INDEX idx_user_lists_user ON user_lists(user_id);
CREATE INDEX idx_user_list_items_list ON user_list_items(list_id);
```

**Recommendation Algorithm:**

```typescript
interface RecommendationFactors {
    userCheckins: CafeId[];
    userRatings: { cafeId: number; rating: number }[];
    userPreferences: UserPreferences;
    location: { lat: number; lng: number };
}

function generateRecommendations(
    factors: RecommendationFactors
): CafeRecommendation[] {
    const scores: Map<CafeId, number> = new Map();

    // Factor 1: Similar cafes based on check-ins (20% weight)
    const similarCafes = findSimilarCafes(factors.userCheckins);
    similarCafes.forEach((cafe) =>
        scores.set(cafe.id, (scores.get(cafe.id) || 0) + 0.2)
    );

    // Factor 2: Collaborative filtering - what similar users liked (30% weight)
    const similarUsers = findSimilarUsers(factors.userRatings);
    const theirLikes = getSimilarUsersLikes(similarUsers);
    theirLikes.forEach((cafe) =>
        scores.set(cafe.id, (scores.get(cafe.id) || 0) + 0.3)
    );

    // Factor 3: Preferences match (25% weight)
    const matchingCafes = getCafesByPreferences(factors.userPreferences);
    matchingCafes.forEach((cafe) =>
        scores.set(cafe.id, (scores.get(cafe.id) || 0) + 0.25)
    );

    // Factor 4: Proximity (15% weight)
    const nearbyCafes = getCafesNearby(factors.location);
    nearbyCafes.forEach((cafe) =>
        scores.set(cafe.id, (scores.get(cafe.id) || 0) + 0.15)
    );

    // Factor 5: Trending (10% weight)
    const trending = getTrendingCafes();
    trending.forEach((cafe) =>
        scores.set(cafe.id, (scores.get(cafe.id) || 0) + 0.1)
    );

    // Sort by score and return top 10
    return Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([cafeId, score]) => ({ cafeId, score }));
}
```

**API Endpoints:**

```
-- Favorites
POST   /api/favorites                    - Add favorite
DELETE /api/favorites/:cafeId           - Remove favorite
GET    /api/favorites/me                - Get my favorites

-- Lists
POST   /api/lists                       - Create list
GET    /api/lists/me                    - Get my lists
GET    /api/lists/:id                   - Get list details
PUT    /api/lists/:id                   - Update list
DELETE /api/lists/:id                   - Delete list
POST   /api/lists/:id/items             - Add cafe to list
DELETE /api/lists/:id/items/:cafeId    - Remove cafe from list

-- Recommendations
GET    /api/recommendations/for-you     - Personalized recommendations
GET    /api/recommendations/trending    - Trending cafes
GET    /api/recommendations/new         - New additions
GET    /api/recommendations/similar/:cafeId - Similar to this cafe
```

**Frontend Components:**

-   `FavoriteButton.tsx` - Heart icon to favorite
-   `RecommendationsSection.tsx` - "For You" feed
-   `CreateListModal.tsx` - Create/edit lists
-   `ListCard.tsx` - Display list
-   `TrendingSection.tsx` - Trending cafes
-   `SimilarCafes.tsx` - Similar recommendations

---

## Technical Architecture

### Data Flow

```
User Action (Check-in, Review, Photo)
    ↓
Frontend (React Component)
    ↓
API Client (api.ts)
    ↓
Cloudflare Worker (Backend)
    ↓
Middleware (Auth, Rate Limit)
    ↓
Route Handler
    ↓
Drizzle ORM
    ↓
D1 Database (SQLite)
    ↓
Response
    ↓
Frontend Update (Zustand Store)
    ↓
UI Re-render
```

### Image Upload Flow

```
User Selects Image
    ↓
Frontend (Compress & Validate)
    ↓
POST /api/photos/upload
    ↓
Backend: Upload to Cloudflare Images
    ↓
Cloudflare Images: Process & Generate Variants
    ↓
Backend: Save image_id to D1
    ↓
Response with image_url
    ↓
Frontend: Display uploaded image
    ↓
Admin: Review in moderation queue
    ↓
Admin Approves
    ↓
Photo appears publicly
```

### Real-time Features (Optional Phase 3)

For future consideration:

-   WebSockets for live activity feed
-   Push notifications for new followers/likes
-   Real-time leaderboard updates
-   Live photo approvals

---

## Implementation Roadmap

### Phase 2A: Foundation (Week 1-2)

**Priority: MVP for user engagement**

-   [ ] Backend: Check-in API endpoints
-   [ ] Backend: Review API endpoints (basic)
-   [ ] Frontend: Enhanced PassportView
-   [ ] Frontend: CheckInButton and modal
-   [ ] Frontend: Basic review form
-   [ ] Database: Migrations for user_reviews, review_photos
-   [ ] Testing: E2E check-in flow
-   [ ] Deploy: Backend + Frontend

**Success Metrics:**

-   20% of registered users check in at least once
-   Average 2+ check-ins per active user

### Phase 2B: Reviews & Ratings (Week 3-4)

**Priority: User-generated content**

-   [ ] Backend: Full review CRUD endpoints
-   [ ] Backend: Rating aggregation logic
-   [ ] Backend: Helpful/flagging system
-   [ ] Frontend: ReviewForm (full featured)
-   [ ] Frontend: ReviewList with filters
-   [ ] Frontend: CombinedRating display
-   [ ] Admin: Review moderation UI
-   [ ] Testing: Review flow end-to-end
-   [ ] Deploy

**Success Metrics:**

-   50+ user reviews in first month
-   80% of reviews marked helpful by others
-   Combined rating displayed on all cafes with 3+ reviews

### Phase 2C: Photo Uploads (Week 5-6)

**Priority: Visual content**

-   [ ] Setup: Cloudflare Images account
-   [ ] Backend: Photo upload API
-   [ ] Backend: Moderation queue
-   [ ] Frontend: PhotoUploadModal
-   [ ] Frontend: PhotoGallery component
-   [ ] Admin: Photo moderation queue
-   [ ] Testing: Upload and approval flow
-   [ ] Deploy

**Success Metrics:**

-   100+ photos uploaded in first month
-   90% approval rate (quality filter working)
-   30% of reviews include photos

### Phase 2D: Social Features (Week 7-8)

**Priority: Community building**

-   [ ] Backend: Following system
-   [ ] Backend: Activity feed
-   [ ] Backend: Badges system
-   [ ] Backend: Leaderboards
-   [ ] Frontend: Enhanced user profiles
-   [ ] Frontend: LeaderboardPage
-   [ ] Frontend: ActivityFeed
-   [ ] Frontend: BadgeDisplay
-   [ ] Testing: Social interactions
-   [ ] Deploy

**Success Metrics:**

-   30% of users follow at least 1 other user
-   Average 3+ followers per active user
-   50% of users earn at least one badge

### Phase 2E: Personalization (Week 9-10)

**Priority: Retention and discovery**

-   [ ] Backend: Favorites API
-   [ ] Backend: Lists API
-   [ ] Backend: Recommendation algorithm
-   [ ] Frontend: Favorites feature
-   [ ] Frontend: CreateListModal
-   [ ] Frontend: RecommendationsSection
-   [ ] Frontend: TrendingSection
-   [ ] Testing: Recommendation quality
-   [ ] Deploy

**Success Metrics:**

-   60% of users favorite at least 1 cafe
-   20% of users create a custom list
-   Recommendations have 40% click-through rate

---

## Success Metrics

### Overall Platform Metrics

**User Engagement:**

-   Daily Active Users (DAU): Target 500+ by end of Phase 2
-   Monthly Active Users (MAU): Target 2,000+ by end of Phase 2
-   User Retention: 40% 7-day retention, 25% 30-day retention
-   Session Duration: Average 5+ minutes per session
-   Sessions per User: Average 3+ per week

**Content Creation:**

-   Check-ins: 1,000+ per month
-   Reviews: 200+ per month
-   Photos: 150+ per month
-   Reviews with photos: 30%+
-   User-generated content ratio: 70% of cafe pages have UGC

**Community Health:**

-   Review quality: 80% of reviews marked helpful
-   Photo approval rate: 90%+
-   Follow relationships: 3+ followers per active user
-   Leaderboard participation: 40% of users on at least one leaderboard
-   Badge completion: Average 3+ badges per user

**Content Quality:**

-   Review length: Average 200+ characters
-   Rating distribution: Normal curve around cafe's admin rating
-   Spam/abuse reports: <2% of total content
-   Moderation response time: <24 hours

### Per-Feature Metrics

**Check-ins:**

-   Adoption rate: 50% of registered users
-   Frequency: Average 2+ check-ins per month per active user
-   Passport completion: 10% of users complete 50%+ of cafes

**Reviews:**

-   Coverage: 80% of cafes have 3+ user reviews
-   Engagement: 60% of users read reviews before visiting
-   Helpfulness: 50% of reviews marked helpful by others

**Photos:**

-   Quality: 90% approval rate
-   Coverage: 70% of cafes have 5+ photos
-   Engagement: Photo galleries viewed on 80% of cafe pages

**Social:**

-   Following: 40% of users follow others
-   Activity feed: 30% DAU check feed daily
-   Badges: 50% of users earn 3+ badges

---

## Risk Assessment & Mitigation

### Content Quality Risks

**Risk:** Low-quality spam reviews and photos
**Mitigation:**

-   Require email verification before posting
-   Admin moderation queue for first-time posters
-   Community flagging system
-   Reputation-based posting (verified users auto-publish)

**Risk:** Fake check-ins (gaming the system)
**Mitigation:**

-   Location verification (optional geofencing)
-   Time-based limits (max 5 check-ins per day)
-   Pattern detection (flag suspicious behavior)
-   Manual review of milestone achievements

**Risk:** Review bombing or coordinated attacks
**Mitigation:**

-   Rate limiting on review submissions
-   Flag unusual voting patterns
-   Admin can temporarily disable reviews for a cafe
-   Weight reviews by user reputation

### Technical Risks

**Risk:** Image storage costs spiral
**Mitigation:**

-   Set upload limits (5 photos per review, 20 per month)
-   Compress images aggressively
-   Use Cloudflare Images free tier limits
-   Monitor and alert on storage growth

**Risk:** Database performance degrades with UGC growth
**Mitigation:**

-   Proper indexing on all query patterns
-   Pagination on all list endpoints
-   Caching for expensive queries (leaderboards, recommendations)
-   Monitor query performance with D1 analytics

**Risk:** Recommendation algorithm produces poor results
**Mitigation:**

-   Start with simple collaborative filtering
-   A/B test recommendation strategies
-   Allow users to dismiss/feedback on recommendations
-   Fallback to trending/popular when not enough data

### Community Risks

**Risk:** Toxic community behavior
**Mitigation:**

-   Clear community guidelines
-   Easy reporting mechanisms
-   Quick admin response to flags
-   Ability to ban/suspend users

**Risk:** Low engagement/ghost town effect
**Mitigation:**

-   Seed with admin-created content
-   Incentivize early adopters (special badges)
-   Prompt users at optimal moments (after check-in)
-   Send engagement emails (weekly digest, milestone notifications)

---

## Future Considerations (Phase 3+)

### Advanced Features

**Mobile App:**

-   Native iOS/Android apps
-   Push notifications
-   Offline mode for passport
-   Camera integration for seamless photo uploads

**Matcha Events:**

-   Users can create and promote matcha events
-   RSVPs and calendar integration
-   Event check-ins
-   Post-event photo galleries

**Cafe Partnerships:**

-   Verified cafe accounts
-   Cafe can respond to reviews
-   Special offers for users
-   Direct messaging with cafes

**Advanced Gamification:**

-   Seasonal challenges (Summer Matcha Tour)
-   Team competitions (Toronto vs Montreal)
-   Achievement showcase on profiles
-   Rare limited-edition badges

**Marketplace:**

-   Buy matcha online (affiliate links)
-   Cafe merchandise
-   MatchaMap swag

**API & Integrations:**

-   Public API for developers
-   Widget for cafes to embed on their sites
-   Integration with Google Maps
-   Share to Instagram/TikTok with template

---

## Conclusion

This social features roadmap transforms MatchaMap from a curated guide into a thriving community platform while maintaining quality through moderation. The phased approach ensures we can validate each feature before moving to the next, and the metrics framework keeps us focused on what matters: user engagement and content quality.

**Next Steps:**

1. Review and approve this PRD
2. Create detailed technical specs for Phase 2A
3. Set up project tracking (GitHub Projects)
4. Begin Phase 2A implementation
5. Schedule weekly check-ins to track progress

---

**Document Maintainers:** Engineering Team
**Last Updated:** October 2025
**Next Review:** After Phase 2A completion
