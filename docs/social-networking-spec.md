# MatchaMap Social Networking Features - Technical Specification

**Version:** 1.0
**Date:** 2025-10-05
**Author:** Claude Code
**Status:** Planning

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Feature Overview](#feature-overview)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Implementation Phases](#implementation-phases)
8. [Migration Strategy](#migration-strategy)
9. [Performance Considerations](#performance-considerations)
10. [Security & Privacy](#security--privacy)

---

## Executive Summary

This specification outlines the implementation of social networking features for MatchaMap, transforming it from a curated guide into a community-driven platform where users can share experiences, reviews, and ratings.

### Key Features

- **Enhanced User Profiles** - Bio, avatar, stats, preferences
- **User-Owned Passport** - Backend-synced check-ins with timestamps and achievements
- **User Reviews & Ratings** - Aggregated community ratings alongside expert scores
- **Social Features** - Following, favorites, activity feeds
- **Community Features** - Photo uploads, comments, badges, cafe suggestions

### Goals

1. Increase user engagement through social features
2. Build community around matcha culture
3. Enhance data quality through user contributions
4. Maintain performance (< 100KB bundle, < 2.5s LCP)
5. Preserve mobile-first UX

---

## Current State Analysis

### Existing Infrastructure

**Authentication System ✅**
- JWT-based auth with access/refresh tokens
- User registration and login
- Session management via `sessions` table
- Basic user model with email, username, role

**Passport System 🔄**
- Currently localStorage-based (client-side only)
- Tracks visited cafes via `visitedCafesStore`
- No persistence across devices
- No timestamps or metadata

**Ratings System ✅**
- Expert ratings via `drinks` table (score field)
- Display score calculated from default drink
- No user ratings yet

**Database ✅**
- Cloudflare D1 (SQLite at edge)
- Drizzle ORM with typed schema
- Tables: cafes, drinks, feed_items, events, users, sessions, waitlist

### Gaps & Opportunities

❌ No user profile pages
❌ No user-generated reviews
❌ No aggregated ratings
❌ No social features (following, favorites)
❌ Passport data not synced across devices
❌ No photo uploads from users
❌ No community engagement (comments, likes)

---

## Feature Overview

### Phase 1: Enhanced User Profiles

**User Profile Data**
- Bio (500 char limit)
- Avatar URL (Cloudflare Images or external URL)
- Display name (optional, defaults to username)
- Location (city/neighborhood, optional)
- Preferences (favorite matcha style, dietary restrictions)
- Social links (Instagram, TikTok)
- Join date, last active timestamp

**Profile Stats**
- Total cafes visited
- Total reviews written
- Total photos uploaded
- Passport completion percentage
- User level/badge tier
- Favorite cafe (most visited or highest rated)

**Profile Page Features**
- Public profile view (`/profile/:username`)
- Edit profile (authenticated users only)
- Activity timeline (recent reviews, check-ins)
- Passport progress visualization
- Review history

### Phase 2: User-Owned Passport System

**Backend-Synced Check-Ins**
- Store check-ins in `user_checkins` table
- Include timestamp, cafe, optional note
- Sync from localStorage on first login (migration)
- Cross-device sync via API

**Achievements & Gamification**
- Badges for milestones (5, 10, 25, 50 cafes)
- Neighborhood completionist badges
- "First to review" badges
- Seasonal challenges

**Passport Features**
- Check-in history with timestamps
- Personal notes per visit
- Photo gallery per cafe
- Leaderboard (most visited, fastest completion)
- Share passport progress

### Phase 3: User Reviews & Ratings

**Review System**
- Rating (0-10 scale, matching expert system)
- Review text (500-2000 chars)
- Optional photos (up to 5 per review)
- Optional tags (e.g., "great foam", "strong flavor")
- Timestamp, last edited
- Visibility (public/private)

**Aggregated Ratings**
- Combine expert score + user scores
- Weighted algorithm: Expert 60%, Users 40%
- Display both scores separately
- Minimum 5 user reviews before aggregation
- Show review count and distribution

**Review UI**
- Review submission form on detail page
- Review list view with sorting (recent, top-rated)
- User profile links
- Edit/delete own reviews
- Report inappropriate reviews (admin moderation)

**Photo Uploads**
- Cloudflare Images integration
- Image optimization (WebP, responsive sizes)
- Maximum 5MB per photo
- EXIF data stripping for privacy
- User attribution watermark

### Phase 4: Social Features

**Favorites/Bookmarks**
- Save cafes to "Want to Visit" list
- Private collection
- Shareable wishlist URL
- Notifications when favorite cafe updates

**Following System**
- Follow other users
- Follower/following counts
- Activity feed from followed users
- Privacy settings (public/private profile)

**Activity Feed**
- Personalized feed of followed users' activity
- Review posts, check-ins, new favorites
- Filter by activity type
- Chronological or algorithmic sorting

**Social Sharing**
- Share reviews to social media
- Share passport progress
- Share cafe recommendations
- Generate shareable images (Open Graph)

### Phase 5: Community Features

**User-Generated Cafe Suggestions**
- Submit new cafe suggestions
- Include name, location, description
- Admin approval workflow
- Credit user when cafe added

**Comment System**
- Comment on reviews
- Nested replies (1 level)
- Like/upvote comments
- Moderation tools

**Reputation & Badges**
- User reputation score based on activity
- Trust levels (new, member, regular, expert)
- Special badges (top contributor, local expert)
- Unlock features with reputation

---

## Database Schema

### New Tables

#### `user_profiles`

```sql
CREATE TABLE user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Profile Info
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,

  -- Social Links
  instagram TEXT,
  tiktok TEXT,
  website TEXT,

  -- Preferences (JSON)
  preferences TEXT, -- {"favoriteStyle": "iced", "dietaryRestrictions": ["vegan"]}

  -- Privacy
  is_public INTEGER DEFAULT 1, -- Boolean: public profile
  show_activity INTEGER DEFAULT 1, -- Boolean: show activity feed

  -- Stats (denormalized for performance)
  total_reviews INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  total_photos INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,

  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX user_profiles_username_idx ON user_profiles(display_name);
```

#### `user_checkins`

```sql
CREATE TABLE user_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,

  -- Check-in Data
  checked_in_at TEXT NOT NULL, -- ISO timestamp
  note TEXT, -- Optional personal note

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate check-ins on same day
  UNIQUE(user_id, cafe_id, DATE(checked_in_at))
);

CREATE INDEX user_checkins_user_id_idx ON user_checkins(user_id);
CREATE INDEX user_checkins_cafe_id_idx ON user_checkins(cafe_id);
CREATE INDEX user_checkins_timestamp_idx ON user_checkins(checked_in_at);
```

#### `user_reviews`

```sql
CREATE TABLE user_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,

  -- Review Content
  rating REAL NOT NULL CHECK(rating >= 0 AND rating <= 10),
  title TEXT,
  content TEXT NOT NULL,
  tags TEXT, -- JSON array: ["great-foam", "strong-flavor"]

  -- Photos (JSON array of Cloudflare Image IDs)
  photo_ids TEXT,

  -- Status
  is_public INTEGER DEFAULT 1,
  is_flagged INTEGER DEFAULT 0,
  flag_reason TEXT,

  -- Engagement
  helpful_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- One review per user per cafe
  UNIQUE(user_id, cafe_id)
);

CREATE INDEX user_reviews_user_id_idx ON user_reviews(user_id);
CREATE INDEX user_reviews_cafe_id_idx ON user_reviews(cafe_id);
CREATE INDEX user_reviews_rating_idx ON user_reviews(rating);
CREATE INDEX user_reviews_created_idx ON user_reviews(created_at);
CREATE INDEX user_reviews_public_idx ON user_reviews(is_public);
```

#### `user_favorites`

```sql
CREATE TABLE user_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,

  -- Metadata
  note TEXT, -- Optional private note
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, cafe_id)
);

CREATE INDEX user_favorites_user_id_idx ON user_favorites(user_id);
CREATE INDEX user_favorites_cafe_id_idx ON user_favorites(cafe_id);
```

#### `user_follows`

```sql
CREATE TABLE user_follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

CREATE INDEX user_follows_follower_idx ON user_follows(follower_id);
CREATE INDEX user_follows_following_idx ON user_follows(following_id);
```

#### `review_comments`

```sql
CREATE TABLE review_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL REFERENCES user_reviews(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES review_comments(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  is_flagged INTEGER DEFAULT 0,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX review_comments_review_id_idx ON review_comments(review_id);
CREATE INDEX review_comments_user_id_idx ON review_comments(user_id);
CREATE INDEX review_comments_parent_id_idx ON review_comments(parent_id);
```

#### `user_badges`

```sql
CREATE TABLE user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- 'first_5', 'local_expert', 'top_reviewer', etc.
  earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT, -- JSON: {"cafes": [1, 2, 3], "neighborhood": "Queen West"}

  UNIQUE(user_id, badge_type)
);

CREATE INDEX user_badges_user_id_idx ON user_badges(user_id);
CREATE INDEX user_badges_type_idx ON user_badges(badge_type);
```

#### `cafe_suggestions`

```sql
CREATE TABLE cafe_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Cafe Data
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  google_maps_link TEXT,
  description TEXT,
  instagram TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TEXT,

  -- If approved, link to created cafe
  cafe_id INTEGER REFERENCES cafes(id),

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX cafe_suggestions_user_id_idx ON cafe_suggestions(user_id);
CREATE INDEX cafe_suggestions_status_idx ON cafe_suggestions(status);
```

### Modified Tables

#### `cafes` (add aggregated rating fields)

```sql
ALTER TABLE cafes ADD COLUMN user_rating_avg REAL;
ALTER TABLE cafes ADD COLUMN user_rating_count INTEGER DEFAULT 0;
ALTER TABLE cafes ADD COLUMN combined_rating REAL; -- Weighted: expert 60%, users 40%
```

#### `users` (add profile stats)

```sql
ALTER TABLE users ADD COLUMN last_active_at TEXT;
ALTER TABLE users ADD COLUMN is_email_verified INTEGER DEFAULT 0;
```

---

## API Endpoints

### User Profiles

#### `GET /api/users/:username/profile`
Get public user profile.

**Response:**
```json
{
  "user": {
    "id": 123,
    "username": "matchalover",
    "displayName": "Matcha Lover",
    "bio": "Toronto-based matcha enthusiast...",
    "avatarUrl": "https://...",
    "location": "Toronto, ON",
    "joinedAt": "2024-01-15T...",
    "stats": {
      "totalReviews": 42,
      "totalCheckins": 67,
      "totalPhotos": 89,
      "passportCompletion": 75,
      "reputationScore": 450
    },
    "badges": [
      {"type": "first_10", "earnedAt": "..."},
      {"type": "local_expert_queen_west", "earnedAt": "..."}
    ],
    "social": {
      "instagram": "@matchalover",
      "tiktok": "@matchalover"
    }
  }
}
```

#### `PUT /api/users/me/profile`
Update own profile (authenticated).

**Request:**
```json
{
  "displayName": "New Name",
  "bio": "Updated bio...",
  "location": "Toronto",
  "preferences": {
    "favoriteStyle": "iced",
    "dietaryRestrictions": ["vegan"]
  },
  "privacy": {
    "isPublic": true,
    "showActivity": true
  }
}
```

#### `POST /api/users/me/avatar`
Upload avatar image.

**Request:** multipart/form-data with image file
**Response:** `{ "avatarUrl": "https://..." }`

### Check-ins (Passport)

#### `GET /api/users/me/checkins`
Get my check-ins.

**Query params:**
- `limit` (default: 50)
- `offset` (default: 0)
- `cafeId` (optional filter)

**Response:**
```json
{
  "checkins": [
    {
      "id": 1,
      "cafeId": 42,
      "cafe": { "name": "...", "slug": "..." },
      "checkedInAt": "2024-10-01T14:30:00Z",
      "note": "Amazing foam art!"
    }
  ],
  "total": 67
}
```

#### `POST /api/users/me/checkins`
Create check-in.

**Request:**
```json
{
  "cafeId": 42,
  "checkedInAt": "2024-10-05T14:30:00Z",
  "note": "Great matcha!"
}
```

#### `DELETE /api/users/me/checkins/:id`
Remove check-in.

#### `GET /api/users/:username/passport`
Get public passport view for user.

**Response:**
```json
{
  "totalCafes": 89,
  "visitedCount": 67,
  "completionPercentage": 75,
  "checkins": [...],
  "achievements": [...],
  "rank": 42
}
```

#### `POST /api/users/me/passport/sync`
Bulk sync check-ins from localStorage (migration endpoint).

**Request:**
```json
{
  "cafeIds": [1, 2, 3, 5, 8, 13]
}
```

**Response:**
```json
{
  "synced": 6,
  "skipped": 0,
  "errors": []
}
```

### Reviews

#### `GET /api/cafes/:id/reviews`
Get reviews for cafe.

**Query params:**
- `limit` (default: 20)
- `offset` (default: 0)
- `sort` (recent, top-rated, helpful)

**Response:**
```json
{
  "reviews": [
    {
      "id": 1,
      "userId": 123,
      "user": {
        "username": "matchalover",
        "displayName": "Matcha Lover",
        "avatarUrl": "https://..."
      },
      "rating": 8.5,
      "title": "Great matcha!",
      "content": "Really enjoyed...",
      "tags": ["great-foam", "strong-flavor"],
      "photoUrls": ["https://..."],
      "helpfulCount": 12,
      "createdAt": "2024-10-01T...",
      "updatedAt": "2024-10-01T..."
    }
  ],
  "total": 42,
  "aggregateRating": {
    "average": 8.2,
    "count": 42,
    "distribution": {
      "0-2": 1,
      "2-4": 2,
      "4-6": 5,
      "6-8": 18,
      "8-10": 16
    }
  }
}
```

#### `POST /api/cafes/:id/reviews`
Create review (authenticated).

**Request:**
```json
{
  "rating": 8.5,
  "title": "Great matcha!",
  "content": "Really enjoyed the foam...",
  "tags": ["great-foam", "strong-flavor"],
  "isPublic": true
}
```

**Response:**
```json
{
  "review": { "id": 1, ... }
}
```

#### `PUT /api/reviews/:id`
Update own review.

#### `DELETE /api/reviews/:id`
Delete own review.

#### `POST /api/reviews/:id/photos`
Upload review photos.

**Request:** multipart/form-data (up to 5 images)
**Response:** `{ "photoUrls": ["https://..."] }`

#### `POST /api/reviews/:id/helpful`
Mark review as helpful (vote).

#### `GET /api/users/:username/reviews`
Get user's reviews.

### Favorites

#### `GET /api/users/me/favorites`
Get my favorite cafes.

#### `POST /api/users/me/favorites`
Add cafe to favorites.

**Request:** `{ "cafeId": 42, "note": "Must visit again!" }`

#### `DELETE /api/users/me/favorites/:cafeId`
Remove from favorites.

### Following

#### `GET /api/users/:username/followers`
Get user's followers.

#### `GET /api/users/:username/following`
Get users this user follows.

#### `POST /api/users/:username/follow`
Follow user (authenticated).

#### `DELETE /api/users/:username/follow`
Unfollow user.

### Activity Feed

#### `GET /api/users/me/feed`
Get personalized activity feed from followed users.

**Query params:**
- `limit` (default: 50)
- `offset` (default: 0)
- `types` (comma-separated: review,checkin,favorite)

**Response:**
```json
{
  "activities": [
    {
      "id": 1,
      "type": "review",
      "user": { "username": "...", "displayName": "...", "avatarUrl": "..." },
      "cafe": { "id": 42, "name": "...", "slug": "..." },
      "data": { "rating": 8.5, "title": "Great matcha!" },
      "createdAt": "2024-10-05T..."
    },
    {
      "id": 2,
      "type": "checkin",
      "user": { ... },
      "cafe": { ... },
      "data": { "note": "Finally visited!" },
      "createdAt": "2024-10-04T..."
    }
  ],
  "total": 142
}
```

### Comments

#### `GET /api/reviews/:id/comments`
Get comments for review.

#### `POST /api/reviews/:id/comments`
Add comment.

**Request:**
```json
{
  "content": "I totally agree!",
  "parentId": null
}
```

#### `DELETE /api/comments/:id`
Delete own comment.

### Badges & Achievements

#### `GET /api/users/me/badges`
Get my badges.

**Response:**
```json
{
  "badges": [
    {
      "type": "first_5",
      "name": "Getting Started",
      "description": "Visited 5 cafes",
      "iconUrl": "...",
      "earnedAt": "2024-09-15T..."
    }
  ]
}
```

#### `POST /api/users/me/badges/check`
Check for new badge achievements (called after check-in/review).

### Cafe Suggestions

#### `GET /api/cafe-suggestions`
Get pending suggestions (admin only).

#### `POST /api/cafe-suggestions`
Submit cafe suggestion (authenticated).

**Request:**
```json
{
  "name": "New Matcha Cafe",
  "address": "123 Queen St W",
  "googleMapsLink": "https://...",
  "description": "Amazing new spot...",
  "instagram": "@newmatchacafe"
}
```

#### `PUT /api/cafe-suggestions/:id/approve`
Approve suggestion (admin only).

#### `PUT /api/cafe-suggestions/:id/reject`
Reject suggestion (admin only).

### Leaderboards

#### `GET /api/leaderboard/passport`
Get passport completion leaderboard.

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user": { "username": "...", "displayName": "...", "avatarUrl": "..." },
      "visitedCount": 89,
      "completionPercentage": 100
    }
  ]
}
```

#### `GET /api/leaderboard/reviewers`
Get top reviewers leaderboard.

---

## Frontend Components

### New Components

#### Profile Components

**`frontend/src/components/profile/`**

- **`UserProfilePage.tsx`** - Main profile page
- **`ProfileHeader.tsx`** - Avatar, name, bio, stats
- **`ProfileStats.tsx`** - Reviews, check-ins, photos count
- **`ProfileActivity.tsx`** - Recent activity timeline
- **`ProfileBadges.tsx`** - Badge collection display
- **`EditProfileModal.tsx`** - Profile editing form
- **`AvatarUpload.tsx`** - Avatar upload UI

#### Review Components

**`frontend/src/components/reviews/`**

- **`ReviewList.tsx`** - List of reviews with sorting
- **`ReviewCard.tsx`** - Single review display
- **`ReviewForm.tsx`** - Review submission form
- **`ReviewPhotoUpload.tsx`** - Photo upload UI
- **`ReviewRating.tsx`** - Star/score rating input
- **`AggregatedRating.tsx`** - Combined expert + user rating display
- **`ReviewComments.tsx`** - Comment thread UI

#### Passport Components

**`frontend/src/components/passport/`**

- **`PassportView.tsx`** - Enhanced with backend sync *(existing - modify)*
- **`CheckinButton.tsx`** - Quick check-in button
- **`CheckinModal.tsx`** - Check-in form with note
- **`CheckinHistory.tsx`** - Timeline of check-ins
- **`PassportAchievements.tsx`** - Badge/achievement display
- **`PassportLeaderboard.tsx`** - Leaderboard UI

#### Social Components

**`frontend/src/components/social/`**

- **`FollowButton.tsx`** - Follow/unfollow button
- **`FollowerList.tsx`** - Follower/following list
- **`ActivityFeed.tsx`** - Personalized activity feed
- **`ActivityCard.tsx`** - Single activity item
- **`FavoriteButton.tsx`** - Add to favorites button
- **`FavoritesList.tsx`** - User's favorites list

#### Admin Components

**`frontend/src/admin/`**

- **`ReviewModeration.tsx`** - Flagged reviews admin panel
- **`CafeSuggestions.tsx`** - Cafe suggestion approval UI
- **`UserManagement.tsx`** - User admin panel

### Modified Components

#### `DetailView.tsx`
- Add user review section
- Add aggregated rating display
- Add check-in button
- Add favorite button
- Show expert score separately from user score

#### `PassportView.tsx`
- Add backend sync on load
- Show timestamps for check-ins
- Add achievements section
- Add leaderboard link

#### `Header.tsx`
- Add profile dropdown
- Show unread notifications
- Link to activity feed

### New Hooks

**`frontend/src/hooks/`**

- **`useUserProfile.ts`** - Fetch user profile
- **`useReviews.ts`** - Fetch/submit reviews
- **`useCheckins.ts`** - Manage check-ins
- **`useFavorites.ts`** - Manage favorites
- **`useFollowing.ts`** - Follow/unfollow users
- **`useActivityFeed.ts`** - Fetch activity feed
- **`useBadges.ts`** - Fetch user badges

### New Stores

**`frontend/src/stores/`**

- **`userProfileStore.ts`** - Current user profile state
- **`socialStore.ts`** - Following, favorites, feed
- **`reviewsStore.ts`** - Review submission state

---

## Implementation Phases

### Phase 1: Enhanced User Profiles (3-4 days)

**Day 1: Database & Backend**
- [ ] Add `user_profiles` table schema
- [ ] Create migration script
- [ ] Add profile CRUD endpoints
- [ ] Add avatar upload to Cloudflare Images
- [ ] Add profile stats calculation

**Day 2: Frontend - Profile Page**
- [ ] Create `UserProfilePage` component
- [ ] Create `ProfileHeader` with avatar, bio
- [ ] Create `ProfileStats` component
- [ ] Add routing for `/profile/:username`
- [ ] Implement profile data fetching hook

**Day 3: Frontend - Edit Profile**
- [ ] Create `EditProfileModal` component
- [ ] Create `AvatarUpload` component
- [ ] Add form validation
- [ ] Implement profile update logic
- [ ] Add profile privacy settings

**Day 4: Polish & Testing**
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test on mobile
- [ ] Add profile SEO/meta tags
- [ ] Performance optimization

### Phase 2: User-Owned Passport (2-3 days)

**Day 1: Backend**
- [ ] Add `user_checkins` table
- [ ] Add `user_badges` table
- [ ] Create check-in CRUD endpoints
- [ ] Create bulk sync endpoint
- [ ] Implement badge achievement logic

**Day 2: Frontend - Check-in UI**
- [ ] Modify `PassportView` for backend sync
- [ ] Create `CheckinButton` component
- [ ] Create `CheckinModal` with note field
- [ ] Implement check-in submission
- [ ] Add localStorage migration logic

**Day 3: Achievements & Leaderboard**
- [ ] Create `PassportAchievements` component
- [ ] Create `PassportLeaderboard` component
- [ ] Add badge notification system
- [ ] Add leaderboard API endpoint
- [ ] Test passport sync across devices

### Phase 3: User Reviews & Ratings (4-5 days)

**Day 1: Database & Backend**
- [ ] Add `user_reviews` table
- [ ] Alter `cafes` table for aggregated ratings
- [ ] Create review CRUD endpoints
- [ ] Add review photo upload
- [ ] Implement rating aggregation logic

**Day 2: Frontend - Review Display**
- [ ] Create `ReviewList` component
- [ ] Create `ReviewCard` component
- [ ] Create `AggregatedRating` component
- [ ] Modify `DetailView` to show reviews
- [ ] Add review sorting (recent, top-rated)

**Day 3: Frontend - Review Submission**
- [ ] Create `ReviewForm` component
- [ ] Create `ReviewRating` input
- [ ] Create `ReviewPhotoUpload` component
- [ ] Add form validation
- [ ] Implement review submission

**Day 4: Review Moderation**
- [ ] Add flag/report review functionality
- [ ] Create admin moderation UI
- [ ] Add helpful vote system
- [ ] Implement edit/delete review
- [ ] Add review guidelines/rules

**Day 5: Polish & Testing**
- [ ] Add skeleton loaders
- [ ] Test photo uploads
- [ ] Test aggregated ratings
- [ ] Performance testing (pagination)
- [ ] Mobile UX testing

### Phase 4: Social Features (3-4 days)

**Day 1: Following System**
- [ ] Add `user_follows` table
- [ ] Create follow/unfollow endpoints
- [ ] Create `FollowButton` component
- [ ] Create `FollowerList` component
- [ ] Add follower/following counts to profile

**Day 2: Favorites System**
- [ ] Add `user_favorites` table
- [ ] Create favorites CRUD endpoints
- [ ] Create `FavoriteButton` component
- [ ] Create `FavoritesList` component
- [ ] Add favorites to profile page

**Day 3: Activity Feed**
- [ ] Create activity feed endpoint
- [ ] Create `ActivityFeed` component
- [ ] Create `ActivityCard` component
- [ ] Add activity feed page
- [ ] Implement feed filtering

**Day 4: Social Sharing**
- [ ] Add Open Graph meta tags
- [ ] Create shareable image generator
- [ ] Add share buttons (reviews, passport)
- [ ] Test social media previews

### Phase 5: Community Features (2-3 days)

**Day 1: Comments**
- [ ] Add `review_comments` table
- [ ] Create comment endpoints
- [ ] Create `ReviewComments` component
- [ ] Add nested reply UI
- [ ] Add comment moderation

**Day 2: Cafe Suggestions**
- [ ] Add `cafe_suggestions` table
- [ ] Create suggestion submission form
- [ ] Create admin approval UI
- [ ] Add suggestion notification system
- [ ] Credit user when cafe approved

**Day 3: Final Polish**
- [ ] Add reputation calculation
- [ ] Add special badges (top contributor)
- [ ] Performance audit
- [ ] Security review
- [ ] Documentation

---

## Migration Strategy

### Passport Migration (localStorage → Backend)

**Challenge:** Existing users have passport data in localStorage that needs to migrate to backend.

**Strategy:**

1. **Detect Migration Need**
   - Check if user is authenticated
   - Check if localStorage has passport data
   - Check if backend has zero check-ins

2. **Prompt User**
   - Show migration modal: "Sync your passport to the cloud?"
   - Explain benefits (cross-device, timestamps, achievements)
   - Allow skip (can sync later)

3. **Bulk Sync**
   - Call `POST /api/users/me/passport/sync` with cafe IDs
   - Backend creates check-ins with estimated timestamps
   - Clear localStorage after successful sync

4. **Fallback**
   - If sync fails, keep localStorage data
   - Retry on next login
   - Add manual "Sync Now" button in settings

**Code:**

```typescript
// frontend/src/hooks/usePassportMigration.ts
export const usePassportMigration = () => {
  const { isAuthenticated, user } = useAuthStore()
  const { stampedCafeIds } = useVisitedCafesStore()

  const migrate = async () => {
    if (!isAuthenticated || stampedCafeIds.length === 0) return

    try {
      const response = await api.passport.syncBulk({ cafeIds: stampedCafeIds })

      if (response.synced > 0) {
        // Clear localStorage
        useVisitedCafesStore.getState().clearAllStamps()

        // Show success notification
        toast.success(`Synced ${response.synced} check-ins!`)
      }
    } catch (error) {
      console.error('Passport migration failed:', error)
      toast.error('Failed to sync passport. Try again later.')
    }
  }

  return { migrate }
}
```

### Data Privacy

**User Data Export**
- Provide data export feature (GDPR compliance)
- Export as JSON (profile, reviews, check-ins)

**Account Deletion**
- Cascade delete all user data
- Option to anonymize reviews instead of delete
- 30-day grace period before permanent deletion

---

## Performance Considerations

### Bundle Size Targets

- **Current:** ~80KB total
- **Target after social features:** < 120KB
- **Strategy:**
  - Lazy load profile/review/social pages
  - Code split Cloudflare Images uploader
  - Use React.lazy for modals

### Database Optimization

**Indexes**
- All foreign keys indexed
- Timestamp fields indexed for sorting
- Composite indexes for common queries

**Denormalization**
- Store review counts on `cafes` table
- Store stats on `user_profiles` table
- Update via triggers or scheduled workers

**Caching**
- Cache aggregated ratings (recompute hourly)
- Cache leaderboards (recompute daily)
- Use Cloudflare KV for frequently accessed data

### Image Optimization

**Cloudflare Images**
- Auto WebP conversion
- Responsive variants (200w, 400w, 800w, 1200w)
- Lazy loading with blur placeholder
- EXIF stripping

**Upload Limits**
- Max 5MB per image
- Max 5 images per review
- Max 20 images per user per day (anti-spam)

---

## Security & Privacy

### Input Validation

**Zod Schemas**
- Validate all user inputs
- Sanitize HTML content
- Rate limit endpoints

**Example:**
```typescript
// backend/src/validators/review.ts
export const reviewSchema = z.object({
  rating: z.number().min(0).max(10),
  title: z.string().max(100).optional(),
  content: z.string().min(50).max(2000),
  tags: z.array(z.string()).max(10).optional(),
  isPublic: z.boolean().default(true),
})
```

### Content Moderation

**Auto-Moderation**
- Filter profanity
- Detect spam patterns
- Rate limit submissions

**Manual Moderation**
- Flag/report system
- Admin review queue
- User trust levels (auto-approve high-reputation users)

### Privacy Controls

**User Settings**
- Public/private profile
- Show/hide activity feed
- Show/hide follower list
- Email notification preferences

**Data Minimization**
- Don't store IP addresses
- Don't track user behavior beyond necessary analytics
- Strip EXIF data from photos

### Authentication

**Token Security**
- JWT with short expiry (1 hour access, 7 day refresh)
- Refresh token rotation
- Session invalidation on logout
- HTTPS only

**Password Security**
- bcrypt hashing (already implemented)
- Password strength requirements
- Rate limit login attempts

---

## Future Enhancements (V3+)

- **Notifications** - Real-time push notifications for follows, comments, badges
- **Direct Messages** - User-to-user messaging
- **Groups/Clubs** - Matcha enthusiast groups with group check-ins
- **Events Integration** - User-created events, RSVP system
- **Advanced Search** - Filter cafes by user ratings, tags
- **Personalized Recommendations** - ML-based cafe suggestions
- **Mobile Apps** - Native iOS/Android apps
- **API Public Access** - Public API for third-party integrations

---

## Success Metrics

### Engagement Metrics
- Daily active users (DAU)
- Review submission rate
- Check-in frequency
- Social interactions (follows, comments)

### Quality Metrics
- Review helpfulness votes
- Moderation queue size
- User retention rate
- Average reviews per cafe

### Performance Metrics
- LCP < 2.5s (maintain)
- Bundle size < 120KB
- API response time < 200ms (p95)
- Image load time < 1s (p95)

---

## Appendix: Sample Data

### Sample User Profile JSON
```json
{
  "id": 123,
  "email": "user@example.com",
  "username": "matchalover",
  "displayName": "Matcha Lover",
  "bio": "Toronto-based matcha enthusiast exploring the best cafes in the city.",
  "avatarUrl": "https://imagedelivery.net/...",
  "location": "Toronto, ON",
  "preferences": {
    "favoriteStyle": "iced",
    "dietaryRestrictions": ["vegan"]
  },
  "privacy": {
    "isPublic": true,
    "showActivity": true
  },
  "stats": {
    "totalReviews": 42,
    "totalCheckins": 67,
    "totalPhotos": 89,
    "passportCompletion": 75,
    "reputationScore": 450
  },
  "joinedAt": "2024-01-15T12:00:00Z",
  "lastActiveAt": "2024-10-05T14:30:00Z"
}
```

### Sample Review JSON
```json
{
  "id": 1,
  "userId": 123,
  "cafeId": 42,
  "rating": 8.5,
  "title": "Best matcha in Queen West!",
  "content": "The foam art was incredible and the matcha had a perfect balance of sweet and earthy flavors. The barista really knows their stuff. Highly recommend the iced matcha latte with oat milk!",
  "tags": ["great-foam", "strong-flavor", "oat-milk"],
  "photoUrls": [
    "https://imagedelivery.net/.../200w",
    "https://imagedelivery.net/.../200w"
  ],
  "isPublic": true,
  "helpfulCount": 12,
  "createdAt": "2024-10-01T14:30:00Z",
  "updatedAt": "2024-10-01T14:30:00Z"
}
```

---

**End of Specification**
