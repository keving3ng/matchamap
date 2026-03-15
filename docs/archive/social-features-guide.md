# MatchaMap Social Features - Complete Guide

> **⚠️ ARCHIVED (2025-03):** Social features are out of scope for the current product. See [PRODUCT_FOUNDATION.md](../PRODUCT_FOUNDATION.md) and [SIMPLIFICATION_PLAN.md](../SIMPLIFICATION_PLAN.md). Kept for historical reference.

---

**Version:** 2.0
**Date:** October 2025
**Status:** Planning / In Progress (archived)
**Phase:** User-Generated Content & Community Features

> **Note:** This document consolidates the Social Features PRD and Technical Specification.
> For database schema details, see `TECH_SPEC.md` (authoritative source).

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State](#current-state)
3. [Features Overview](#features-overview)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Migration Strategy](#migration-strategy)
9. [Performance Considerations](#performance-considerations)
10. [Security & Privacy](#security--privacy)
11. [Success Metrics](#success-metrics)
12. [Risk Assessment](#risk-assessment)

---

## Executive Summary

MatchaMap is transforming from an admin-curated guide into a community-driven discovery platform. This phase introduces user-generated content (reviews, ratings, photos, check-ins) while maintaining the quality and curation that makes MatchaMap unique.

**Core Philosophy:** Combine expert curation (admin reviews) with community wisdom (user reviews) to create the most comprehensive matcha cafe guide.

### Goals

1. **Increase user engagement** through social features
2. **Build community** around matcha culture
3. **Enhance data quality** through user contributions
4. **Maintain performance** (< 100KB bundle, < 2.5s LCP)
5. **Preserve mobile-first UX**

### Key Features

- **Enhanced User Profiles** - Bio, avatar, stats, preferences
- **User-Owned Passport** - Backend-synced check-ins with timestamps and achievements
- **User Reviews & Ratings** - Aggregated community ratings alongside expert scores
- **Social Features** - Following, favorites, activity feeds
- **Community Features** - Photo uploads, comments, badges, cafe suggestions

---

## Current State

### Existing Infrastructure ✅

**Authentication System:**
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

## Features Overview

### Phase 2A: User Check-ins & Basic Engagement (MVP)

**Digital Passport**
- Users mark cafes they've visited
- Track visits with timestamps and notes
- Personal visit count and completion percentage

**User Stories:**
- As a user, I want to mark cafes I've visited so I can track my matcha journey
- As a user, I want to see my passport completion percentage to gamify my exploration
- As a user, I want to add notes to my check-ins to remember specific drinks or experiences

**Functional Requirements:**

*Check-in Flow:*
1. User visits a cafe detail page
2. Clicks "I've been here" or "Check in" button
3. Optional: Add notes about their visit
4. Optional: Rate their experience (if not leaving full review)
5. Check-in is saved with timestamp
6. Passport updates instantly

*Data to Capture:*
- User ID, Cafe ID
- Timestamp (visited_at)
- Optional: Notes (text, max 500 chars)
- Optional: Quick rating (1-10 scale)
- Optional: Photos (link to photo uploads)

*Passport Display:*
- Progress bar (X of Y cafes visited)
- Grid/list of visited cafes with check-in dates
- Badges earned for milestones (5, 10, 25, 50 cafes)
- "✓ Visited on [date]" on cafe detail pages

---

### Phase 2B: User Reviews & Ratings

**Review System**

*Review Structure:*
- Rating (0-10 scale, matching expert system)
- Aspect ratings (optional):
  - Matcha Quality (0-10)
  - Ambiance (0-10)
  - Service (0-10)
  - Value (0-10)
- Review text (50-2000 characters)
- Optional photos (up to 5 per review)
- Optional tags (e.g., "great foam", "strong flavor")
- Visit date, timestamp, last edited
- Visibility (public/private)

**Aggregated Ratings**

*Algorithm:*
- Combine expert score + user scores
- Weighted: Expert 60%, Users 40%
- Display both scores separately
- Minimum 5 user reviews before aggregation
- Show review count and distribution

```typescript
// Rating aggregation algorithm
function calculateCombinedScore(cafe: Cafe, userReviews: UserReview[]): number {
  const adminWeight = 0.7 // 70% weight for admin initially
  const userWeight = 0.3  // 30% for users

  // As user reviews increase, shift weight toward community
  const reviewCount = userReviews.length
  const adjustedAdminWeight = adminWeight / (1 + (reviewCount / 20))
  const adjustedUserWeight = 1 - adjustedAdminWeight

  const adminScore = cafe.displayScore
  const userAvgScore = userReviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviewCount

  const combinedScore = (adminScore * adjustedAdminWeight) + (userAvgScore * adjustedUserWeight)

  return Math.round(combinedScore * 10) / 10
}
```

*Review Display:*
- Combined Score: Admin score + weighted average of user scores
- Admin review always at top, highlighted
- User reviews sorted by helpfulness/recency
- Ability to filter/sort reviews
- User profile links

*Review Moderation:*
- Auto-publish reviews from verified users
- Flag suspicious reviews for admin review
- Users can report inappropriate reviews
- Admin can feature/pin exceptional reviews

**User Stories:**
- As a user, I want to leave a detailed review of my experience at a cafe
- As a user, I want to rate different aspects (ambiance, matcha quality, service)
- As a user, I want to edit or delete my reviews
- As a visitor, I want to see both expert (admin) and community reviews
- As a visitor, I want to filter reviews by rating or recency

---

### Phase 2C: Photo Uploads & Gallery

**Status:** ✅ **Infrastructure Complete** (PR #211) | 🚧 **Frontend UI Pending**

**Photo System** (Backend Implemented)

*Upload Flow:*
1. User clicks "Add Photo" on cafe detail page or during check-in/review *(Frontend pending)*
2. Upload image (max 5MB, JPG/PNG/WebP) ✅
3. Image is processed: ✅
   - Validated for type, size, dimensions ✅
   - Uploaded to Cloudflare R2 ✅
   - Thumbnail generated (200px WebP) ✅ *(Placeholder - full implementation pending)*
   - Image dimensions extracted from headers ✅
4. Optional: Add caption ✅
5. Photo enters moderation queue (`pending` status) ✅
6. Admin approves → Photo appears in gallery ✅

*Storage: Cloudflare R2* ✅
- R2 bucket bindings configured in `wrangler.toml`
- Public URLs via custom domain (configurable)
- Cache headers: 1 year for immutability
- Custom metadata: userId, cafeId, uploadedAt, originalFilename

*Moderation:* ✅
- All photos require admin approval before public display
- Photos default to `pending` status
- Admin endpoints: `/api/admin/photos` (list), `/api/admin/photos/:id/moderate`
- Admin can approve/reject with optional notes
- Rejected photos kept in database for audit trail

*Display:* 🚧
- Cafe detail page: Photo gallery (grid layout) *(Frontend pending)*
- User profile: Personal photo gallery *(Frontend pending)*
- Feed: Recent photos from followed users *(Phase 2D)*

**Implemented API Endpoints** (PR #211):
```
POST   /api/photos/upload                  - Upload photo to R2 bucket
GET    /api/cafes/:id/photos               - Get approved photos for cafe
DELETE /api/photos/:id                     - Delete own photo
GET    /api/users/me/photos                - Get user's uploaded photos
GET    /api/admin/photos                   - Get pending photos (admin)
PUT    /api/admin/photos/:id/moderate      - Approve/reject photo (admin)
```

**Technical Implementation:**
- File validation: Max 5MB, JPEG/PNG/WebP only
- Unique R2 keys: `photos/{cafeId}/{userId}/{timestamp}-{randomId}.{ext}`
- Thumbnail keys: `thumbnails/{cafeId}/{userId}/{timestamp}-{randomId}.webp`
- Database: `review_photos` table with moderation workflow
- Image dimensions parsed from JPEG/PNG/WebP headers
- Rate limiting: Write rate limit (max 10 uploads/minute)

**Known Limitations:**
- ⚠️ Thumbnail generation is placeholder (returns full image as WebP)
  - **TODO:** Implement proper thumbnail resizing before production
  - **Options:** Sharp via WASM, Cloudflare Images Transform API, or Canvas API
- HEIC format not supported (requires conversion)
- No client-side image compression yet

**User Stories:**
- ✅ As a user, I can upload photos of my matcha drinks via API
- ✅ As a user, I can add captions to my photos
- ✅ As a user, I can delete my own photos
- ✅ As a user, I can see all my uploaded photos via API
- ✅ As a visitor, I can browse approved photo galleries for each cafe via API
- 🚧 As a user, I want a UI to upload photos *(Phase 2C - Frontend)*
- 🚧 As a user, I want to see my photos on my profile page *(Phase 2C - Frontend)*

---

### Phase 2D: Social Features

**User Profiles**

*Profile Data:*
- Bio (500 char limit)
- Avatar URL (Cloudflare Images or external URL)
- Display name (optional, defaults to username)
- Location (city/neighborhood, optional)
- Preferences (favorite matcha style, dietary restrictions)
- Social links (Instagram, TikTok)
- Join date, last active timestamp

*Profile Stats:*
- Total cafes visited
- Total reviews written
- Total photos uploaded
- Passport completion percentage
- User level/badge tier
- Favorite cafe (most visited or highest rated)

*Profile Page Features:*
- Public profile view (`/profile/:username`)
- Edit profile (authenticated users only)
- Activity timeline (recent reviews, check-ins)
- Passport progress visualization
- Review history
- Privacy settings (public/private profile)

**Following System**
- Follow/unfollow users
- Follower/following counts
- Activity feed from followed users
- Privacy settings (public/private profile)

**Activity Feed**
- Personalized feed of followed users' activity
- Review posts, check-ins, new favorites
- Filter by activity type
- Chronological or algorithmic sorting

**Favorites/Bookmarks**
- Save cafes to "Want to Visit" list
- Private collection
- Shareable wishlist URL
- Notifications when favorite cafe updates

**Leaderboards**
- Top Contributors (by reviews + photos)
- Most Cafes Visited (by check-ins)
- Most Helpful Reviewers (by helpful votes)
- Monthly/All-Time rankings
- Filter by city

**Badges & Achievements**
- Passport Milestones (5, 10, 25, 50, 100 cafes)
- Review Milestones (10, 25, 50, 100 reviews)
- Photo Contributor (10, 50, 100 photos)
- Early Adopter (joined in first month)
- Featured Reviewer (admin featured review)
- Neighborhood Expert (visited all cafes in neighborhood)
- Matcha Master (100% passport completion)
- Community Helper (50 helpful votes received)

**User Stories:**
- As a user, I want to view other users' profiles and their activity
- As a user, I want to follow users with similar tastes
- As a user, I want to see what cafes my friends have reviewed
- As a user, I want to compare my passport with friends
- As a user, I want to earn badges and climb leaderboards

---

### Phase 2E: Personalization & Discovery

**Personalized Recommendations**
- Based on user's check-ins and ratings
- Similar users' preferences (collaborative filtering)
- Location and visit patterns
- Preferred drink types
- Display in dedicated "For You" section

**Custom Lists**
- Create lists (e.g., "Winter Warmers", "Westside Favorites")
- Add/remove cafes from lists
- Make lists public or private
- Share lists via link

**Trending & Discovery**
- Trending cafes (most check-ins/reviews this week)
- New additions (recently added cafes)
- Underrated gems (high ratings, few reviews)

**Recommendation Algorithm:**
```typescript
interface RecommendationFactors {
  userCheckins: CafeId[]
  userRatings: { cafeId: number, rating: number }[]
  userPreferences: UserPreferences
  location: { lat: number, lng: number }
}

function generateRecommendations(factors: RecommendationFactors): CafeRecommendation[] {
  const scores: Map<CafeId, number> = new Map()

  // Factor 1: Similar cafes based on check-ins (20% weight)
  const similarCafes = findSimilarCafes(factors.userCheckins)
  similarCafes.forEach(cafe => scores.set(cafe.id, (scores.get(cafe.id) || 0) + 0.2))

  // Factor 2: Collaborative filtering (30% weight)
  const similarUsers = findSimilarUsers(factors.userRatings)
  const theirLikes = getSimilarUsersLikes(similarUsers)
  theirLikes.forEach(cafe => scores.set(cafe.id, (scores.get(cafe.id) || 0) + 0.3))

  // Factor 3: Preferences match (25% weight)
  const matchingCafes = getCafesByPreferences(factors.userPreferences)
  matchingCafes.forEach(cafe => scores.set(cafe.id, (scores.get(cafe.id) || 0) + 0.25))

  // Factor 4: Proximity (15% weight)
  const nearbyCafes = getCafesNearby(factors.location)
  nearbyCafes.forEach(cafe => scores.set(cafe.id, (scores.get(cafe.id) || 0) + 0.15))

  // Factor 5: Trending (10% weight)
  const trending = getTrendingCafes()
  trending.forEach(cafe => scores.set(cafe.id, (scores.get(cafe.id) || 0) + 0.1))

  // Sort by score and return top 10
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cafeId, score]) => ({ cafeId, score }))
}
```

**User Stories:**
- As a user, I want to save my favorite cafes for quick access
- As a user, I want to get recommendations based on my preferences
- As a user, I want to create themed lists (e.g., "Best for Study")
- As a user, I want to see trending cafes in my area
- As a user, I want to discover cafes similar to ones I've loved

---

### Phase 2F: Community Features

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

> **Note:** For the authoritative database schema, see `TECH_SPEC.md`.
> This section provides a high-level overview of tables needed for social features.

### New Tables

#### `user_profiles`
- Extended user information (bio, avatar, preferences)
- Privacy settings
- Denormalized stats (total_reviews, total_checkins, etc.)

#### `user_checkins`
- User visit tracking
- Timestamps, notes
- Links to cafes

#### `user_reviews`
- User-generated reviews
- Ratings (overall + aspects)
- Review text, tags
- Photos (JSON array of Cloudflare Image IDs)
- Moderation status
- Engagement metrics (helpful_count)

#### `user_favorites`
- Saved cafes
- Optional private notes

#### `user_follows`
- Follow relationships
- Follower/following tracking

#### `user_badges`
- Achievement tracking
- Badge metadata

#### `user_photos`
- Cloudflare Images integration
- Moderation queue
- Caption, drink type
- Association with reviews/check-ins

#### `review_comments`
- Comments on reviews
- Nested replies (1 level)
- Moderation support

#### `review_helpful`
- Helpful vote tracking
- Prevents duplicate votes

#### `cafe_suggestions`
- User-submitted cafe suggestions
- Admin approval workflow
- Status tracking

#### `user_lists`
- Custom cafe collections
- Public/private visibility

#### `user_list_items`
- Cafes in custom lists
- Notes per cafe

#### `photo_likes`
- Photo engagement tracking

#### `activity_feed`
- User activity timeline
- Supports filtering

### Modified Tables

#### `cafes`
Add aggregated rating fields:
```sql
ALTER TABLE cafes ADD COLUMN user_rating_avg REAL;
ALTER TABLE cafes ADD COLUMN user_rating_count INTEGER DEFAULT 0;
ALTER TABLE cafes ADD COLUMN combined_rating REAL;
```

#### `users`
Add profile stats:
```sql
ALTER TABLE users ADD COLUMN last_active_at TEXT;
ALTER TABLE users ADD COLUMN is_email_verified INTEGER DEFAULT 0;
```

---

## API Endpoints

> **Note:** For complete API specifications, see `TECH_SPEC.md`.
> This section outlines the key endpoints needed for social features.

### User Profiles

```
GET    /api/users/:username/profile       - Get public profile
PUT    /api/users/me/profile              - Update own profile
POST   /api/users/me/avatar               - Upload avatar image
```

### Check-ins (Passport)

```
GET    /api/users/me/checkins             - Get my check-ins
POST   /api/users/me/checkins             - Create check-in
DELETE /api/users/me/checkins/:id         - Remove check-in
GET    /api/users/:username/passport      - Get public passport view
POST   /api/users/me/passport/sync        - Bulk sync from localStorage
```

### Reviews

```
GET    /api/cafes/:id/reviews             - Get cafe reviews (paginated)
POST   /api/cafes/:id/reviews             - Create review
PUT    /api/reviews/:id                   - Update own review
DELETE /api/reviews/:id                   - Delete own review
POST   /api/reviews/:id/helpful           - Mark review as helpful
DELETE /api/reviews/:id/helpful           - Remove helpful mark
POST   /api/reviews/:id/photos            - Upload review photos
GET    /api/users/:username/reviews       - Get user's reviews
```

### Favorites

```
GET    /api/users/me/favorites            - Get my favorites
POST   /api/users/me/favorites            - Add cafe to favorites
DELETE /api/users/me/favorites/:cafeId    - Remove from favorites
```

### Following

```
GET    /api/users/:username/followers     - Get user's followers
GET    /api/users/:username/following     - Get users this user follows
POST   /api/users/:username/follow        - Follow user
DELETE /api/users/:username/follow        - Unfollow user
```

### Activity Feed

```
GET    /api/users/me/feed                 - Get personalized activity feed
```

### Photos

```
POST   /api/photos/upload                 - Upload photo (returns image_id)
POST   /api/photos                        - Create photo record
GET    /api/photos/me                     - Get my photos
GET    /api/cafes/:id/photos              - Get cafe photos (approved only)
DELETE /api/photos/:id                    - Delete my photo
POST   /api/photos/:id/like               - Like a photo

Admin:
GET    /api/admin/photos/pending          - Get photos awaiting approval
PUT    /api/admin/photos/:id/approve      - Approve photo
PUT    /api/admin/photos/:id/reject       - Reject photo
PUT    /api/admin/photos/:id/feature      - Feature photo
```

### Comments

```
GET    /api/reviews/:id/comments          - Get comments for review
POST   /api/reviews/:id/comments          - Add comment
DELETE /api/comments/:id                  - Delete own comment
```

### Badges & Achievements

```
GET    /api/users/me/badges               - Get my badges
POST   /api/users/me/badges/check         - Check for new badge achievements
```

### Leaderboards

```
GET    /api/leaderboard/passport          - Passport completion leaderboard
GET    /api/leaderboard/reviewers         - Top reviewers leaderboard
GET    /api/leaderboard/contributors      - Top contributors
```

### Cafe Suggestions

```
GET    /api/cafe-suggestions               - Get pending suggestions (admin)
POST   /api/cafe-suggestions               - Submit suggestion
PUT    /api/cafe-suggestions/:id/approve   - Approve suggestion (admin)
PUT    /api/cafe-suggestions/:id/reject    - Reject suggestion (admin)
```

### Custom Lists

```
POST   /api/lists                         - Create list
GET    /api/lists/me                      - Get my lists
GET    /api/lists/:id                     - Get list details
PUT    /api/lists/:id                     - Update list
DELETE /api/lists/:id                     - Delete list
POST   /api/lists/:id/items               - Add cafe to list
DELETE /api/lists/:id/items/:cafeId      - Remove cafe from list
```

### Recommendations

```
GET    /api/recommendations/for-you       - Personalized recommendations
GET    /api/recommendations/trending      - Trending cafes
GET    /api/recommendations/new           - New additions
GET    /api/recommendations/similar/:cafeId - Similar to this cafe
```

---

## Frontend Components

### New Components

#### Profile Components
**Location:** `frontend/src/components/profile/`

- `UserProfilePage.tsx` - Main profile page
- `ProfileHeader.tsx` - Avatar, name, bio, stats
- `ProfileStats.tsx` - Reviews, check-ins, photos count
- `ProfileActivity.tsx` - Recent activity timeline
- `ProfileBadges.tsx` - Badge collection display
- `EditProfileModal.tsx` - Profile editing form
- `AvatarUpload.tsx` - Avatar upload UI

#### Review Components
**Location:** `frontend/src/components/reviews/`

- `ReviewList.tsx` - List of reviews with sorting
- `ReviewCard.tsx` - Single review display
- `ReviewForm.tsx` - Review submission form
- `ReviewPhotoUpload.tsx` - Photo upload UI
- `ReviewRating.tsx` - Star/score rating input
- `AggregatedRating.tsx` - Combined expert + user rating display
- `ReviewComments.tsx` - Comment thread UI

#### Passport Components
**Location:** `frontend/src/components/passport/`

- `PassportView.tsx` - Enhanced with backend sync *(modify existing)*
- `CheckinButton.tsx` - Quick check-in button
- `CheckinModal.tsx` - Check-in form with note
- `CheckinHistory.tsx` - Timeline of check-ins
- `PassportAchievements.tsx` - Badge/achievement display
- `PassportLeaderboard.tsx` - Leaderboard UI

#### Social Components
**Location:** `frontend/src/components/social/`

- `FollowButton.tsx` - Follow/unfollow button
- `FollowerList.tsx` - Follower/following list
- `ActivityFeed.tsx` - Personalized activity feed
- `ActivityCard.tsx` - Single activity item
- `FavoriteButton.tsx` - Add to favorites button
- `FavoritesList.tsx` - User's favorites list

#### Admin Components
**Location:** `frontend/src/admin/`

- `ReviewModeration.tsx` - Flagged reviews admin panel
- `CafeSuggestions.tsx` - Cafe suggestion approval UI
- `UserManagement.tsx` - User admin panel

### Modified Components

- `DetailView.tsx` - Add user review section, aggregated rating, check-in button, favorite button
- `PassportView.tsx` - Add backend sync on load, show timestamps, add achievements
- `Header.tsx` - Add profile dropdown, unread notifications, activity feed link

### New Hooks

**Location:** `frontend/src/hooks/`

- `useUserProfile.ts` - Fetch user profile
- `useReviews.ts` - Fetch/submit reviews
- `useCheckins.ts` - Manage check-ins
- `useFavorites.ts` - Manage favorites
- `useFollowing.ts` - Follow/unfollow users
- `useActivityFeed.ts` - Fetch activity feed
- `useBadges.ts` - Fetch user badges
- `usePassportMigration.ts` - Migrate localStorage to backend

### New Stores

**Location:** `frontend/src/stores/`

- `userProfileStore.ts` - Current user profile state
- `socialStore.ts` - Following, favorites, feed
- `reviewsStore.ts` - Review submission state

---

## Implementation Roadmap

### Phase 2A: Foundation (Week 1-2)

**Backend:**
- [ ] Add `user_checkins` table schema
- [ ] Add `user_reviews` table schema
- [ ] Add `review_photos` table schema
- [ ] Create check-in CRUD endpoints
- [ ] Create review CRUD endpoints (basic)
- [ ] Add review photo upload
- [ ] Database migrations

**Frontend:**
- [ ] Enhance `PassportView` with backend sync
- [ ] Create `CheckInButton` and `CheckinModal`
- [ ] Create basic `ReviewForm`
- [ ] Add localStorage migration logic
- [ ] Test check-in flow end-to-end

**Success Metrics:**
- 20% of registered users check in at least once
- Average 2+ check-ins per active user

---

### Phase 2B: Reviews & Ratings (Week 3-4)

**Backend:**
- [ ] Full review CRUD endpoints
- [ ] Rating aggregation logic
- [ ] Helpful/flagging system
- [ ] Admin review moderation endpoints

**Frontend:**
- [ ] `ReviewForm` (full featured)
- [ ] `ReviewList` with filters
- [ ] `AggregatedRating` display
- [ ] Admin review moderation UI
- [ ] Test review flow end-to-end

**Success Metrics:**
- 50+ user reviews in first month
- 80% of reviews marked helpful by others
- Combined rating displayed on all cafes with 3+ reviews

---

### Phase 2C: Photo Uploads (Week 5-6)

**Status:** ✅ Backend Complete | 🚧 Frontend Pending

**Setup:**
- [x] Cloudflare R2 bucket setup (PR #211)
- [x] R2 bindings in wrangler.toml (PR #211)
- [x] Image upload API integration (PR #211)

**Backend:** ✅ Complete (PR #211)
- [x] Photo upload endpoints (`POST /api/photos/upload`)
- [x] Moderation queue (`GET /api/admin/photos`)
- [x] Photo approval/rejection logic (`PUT /api/admin/photos/:id/moderate`)
- [x] Get cafe photos (`GET /api/cafes/:id/photos`)
- [x] Get user photos (`GET /api/users/me/photos`)
- [x] Delete photo endpoint (`DELETE /api/photos/:id`)
- [x] Image validation (type, size, dimensions)
- [x] R2 storage with unique keys
- [x] Thumbnail generation (placeholder implementation)
- [x] `review_photos` table schema and migration

**Frontend:** 🚧 Pending
- [ ] `PhotoUploadModal`
- [ ] `PhotoGallery` component
- [ ] Admin photo moderation queue
- [ ] Test upload and approval flow

**Next Steps:**
1. Implement proper thumbnail generation (Sharp/WASM or Cloudflare Transform)
2. Create frontend photo upload UI
3. Build photo gallery components
4. Add admin moderation UI

**Success Metrics:**
- 100+ photos uploaded in first month
- 90% approval rate (quality filter working)
- 30% of reviews include photos

---

### Phase 2D: Social Features (Week 7-8)

**Backend:**
- [ ] `user_follows` table
- [ ] `user_badges` table
- [ ] `activity_feed` table
- [ ] Following system endpoints
- [ ] Activity feed endpoints
- [ ] Badges system logic
- [ ] Leaderboards endpoints

**Frontend:**
- [ ] Enhanced user profiles
- [ ] `LeaderboardPage`
- [ ] `ActivityFeed`
- [ ] `BadgeDisplay`
- [ ] `FollowButton` and `FollowerList`
- [ ] Test social interactions

**Success Metrics:**
- 30% of users follow at least 1 other user
- Average 3+ followers per active user
- 50% of users earn at least one badge

---

### Phase 2E: Personalization (Week 9-10)

**Backend:**
- [ ] `user_favorites` table
- [ ] `user_lists` table
- [ ] Favorites API
- [ ] Lists API
- [ ] Recommendation algorithm

**Frontend:**
- [ ] Favorites feature
- [ ] `CreateListModal`
- [ ] `RecommendationsSection`
- [ ] `TrendingSection`
- [ ] Test recommendation quality

**Success Metrics:**
- 60% of users favorite at least 1 cafe
- 20% of users create a custom list
- Recommendations have 40% click-through rate

---

### Phase 2F: Community Features (Week 11-12)

**Backend:**
- [ ] `review_comments` table
- [ ] `cafe_suggestions` table
- [ ] Comment endpoints
- [ ] Cafe suggestion endpoints

**Frontend:**
- [ ] `ReviewComments` component
- [ ] Cafe suggestion form
- [ ] Admin suggestion approval UI
- [ ] Comment moderation tools

**Success Metrics:**
- 10+ cafe suggestions submitted per month
- 50% suggestion approval rate
- Active comment threads on popular reviews

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

**Implementation:**

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

## Success Metrics

### Overall Platform Metrics

**User Engagement:**
- Daily Active Users (DAU): Target 500+ by end of Phase 2
- Monthly Active Users (MAU): Target 2,000+ by end of Phase 2
- User Retention: 40% 7-day retention, 25% 30-day retention
- Session Duration: Average 5+ minutes per session
- Sessions per User: Average 3+ per week

**Content Creation:**
- Check-ins: 1,000+ per month
- Reviews: 200+ per month
- Photos: 150+ per month
- Reviews with photos: 30%+
- User-generated content ratio: 70% of cafe pages have UGC

**Community Health:**
- Review quality: 80% of reviews marked helpful
- Photo approval rate: 90%+
- Follow relationships: 3+ followers per active user
- Leaderboard participation: 40% of users on at least one leaderboard
- Badge completion: Average 3+ badges per user

**Content Quality:**
- Review length: Average 200+ characters
- Rating distribution: Normal curve around cafe's admin rating
- Spam/abuse reports: <2% of total content
- Moderation response time: <24 hours

### Per-Feature Metrics

**Check-ins:**
- Adoption rate: 50% of registered users
- Frequency: Average 2+ check-ins per month per active user
- Passport completion: 10% of users complete 50%+ of cafes

**Reviews:**
- Coverage: 80% of cafes have 3+ user reviews
- Engagement: 60% of users read reviews before visiting
- Helpfulness: 50% of reviews marked helpful by others

**Photos:**
- Quality: 90% approval rate
- Coverage: 70% of cafes have 5+ photos
- Engagement: Photo galleries viewed on 80% of cafe pages

**Social:**
- Following: 40% of users follow others
- Activity feed: 30% DAU check feed daily
- Badges: 50% of users earn 3+ badges

---

## Risk Assessment & Mitigation

### Content Quality Risks

**Risk:** Low-quality spam reviews and photos
**Mitigation:**
- Require email verification before posting
- Admin moderation queue for first-time posters
- Community flagging system
- Reputation-based posting (verified users auto-publish)

**Risk:** Fake check-ins (gaming the system)
**Mitigation:**
- Location verification (optional geofencing)
- Time-based limits (max 5 check-ins per day)
- Pattern detection (flag suspicious behavior)
- Manual review of milestone achievements

**Risk:** Review bombing or coordinated attacks
**Mitigation:**
- Rate limiting on review submissions
- Flag unusual voting patterns
- Admin can temporarily disable reviews for a cafe
- Weight reviews by user reputation

### Technical Risks

**Risk:** Image storage costs spiral
**Mitigation:**
- Set upload limits (5 photos per review, 20 per month)
- Compress images aggressively
- Use Cloudflare Images free tier limits
- Monitor and alert on storage growth

**Risk:** Database performance degrades with UGC growth
**Mitigation:**
- Proper indexing on all query patterns
- Pagination on all list endpoints
- Caching for expensive queries (leaderboards, recommendations)
- Monitor query performance with D1 analytics

**Risk:** Recommendation algorithm produces poor results
**Mitigation:**
- Start with simple collaborative filtering
- A/B test recommendation strategies
- Allow users to dismiss/feedback on recommendations
- Fallback to trending/popular when not enough data

### Community Risks

**Risk:** Toxic community behavior
**Mitigation:**
- Clear community guidelines
- Easy reporting mechanisms
- Quick admin response to flags
- Ability to ban/suspend users

**Risk:** Low engagement/ghost town effect
**Mitigation:**
- Seed with admin-created content
- Incentivize early adopters (special badges)
- Prompt users at optimal moments (after check-in)
- Send engagement emails (weekly digest, milestone notifications)

---

## Future Considerations (Phase 3+)

### Advanced Features

**Mobile App:**
- Native iOS/Android apps
- Push notifications
- Offline mode for passport
- Camera integration for seamless photo uploads

**Matcha Events:**
- Users can create and promote matcha events
- RSVPs and calendar integration
- Event check-ins
- Post-event photo galleries

**Cafe Partnerships:**
- Verified cafe accounts
- Cafe can respond to reviews
- Special offers for users
- Direct messaging with cafes

**Advanced Gamification:**
- Seasonal challenges (Summer Matcha Tour)
- Team competitions (Toronto vs Montreal)
- Achievement showcase on profiles
- Rare limited-edition badges

**Marketplace:**
- Buy matcha online (affiliate links)
- Cafe merchandise
- MatchaMap swag

**API & Integrations:**
- Public API for developers
- Widget for cafes to embed on their sites
- Integration with Google Maps
- Share to Instagram/TikTok with template

**Real-time Features:**
- WebSockets for live activity feed
- Push notifications for new followers/likes
- Real-time leaderboard updates
- Live photo approvals

---

## Next Steps

1. Review and approve this guide
2. Create detailed technical specs for Phase 2A
3. Set up project tracking (GitHub Projects)
4. Begin Phase 2A implementation
5. Schedule weekly check-ins to track progress

---

**Document Status:** Ready for Implementation
**Maintainers:** Engineering Team
**Last Updated:** October 2025
**Next Review:** After Phase 2A completion
