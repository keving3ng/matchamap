# Database Schema Reference

**Last Updated:** 2025-11-02

This document provides a comprehensive reference for the MatchaMap database schema. The database uses Cloudflare D1 (SQLite) with Drizzle ORM.

---

## Table of Contents

- [Core Tables](#core-tables)
  - [cafes](#cafes)
  - [drinks](#drinks)
  - [events](#events)
- [User Management](#user-management)
  - [users](#users)
  - [user_profiles](#user_profiles)
  - [sessions](#sessions)
  - [waitlist](#waitlist)
- [User-Generated Content](#user-generated-content)
  - [user_reviews](#user_reviews)
  - [review_photos](#review_photos)
  - [review_helpful](#review_helpful)
  - [review_comments](#review_comments)
  - [review_comment_likes](#review_comment_likes)
- [User Activity](#user-activity)
  - [user_checkins](#user_checkins)
  - [user_favorites](#user_favorites)
  - [user_badges](#user_badges)
- [Social Features](#social-features)
  - [user_follows](#user_follows)
- [Admin](#admin)
  - [admin_audit_log](#admin_audit_log)
- [Relationships](#relationships)
- [Indexes](#indexes)

---

## Core Tables

### cafes

Stores cafe information including location, ratings, and metadata.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `name` | TEXT | No | - | Cafe name |
| `slug` | TEXT | No | - | URL-friendly slug (unique) |
| `link` | TEXT | No | - | Google Maps link |
| `address` | TEXT | Yes | NULL | Street address |
| `latitude` | REAL | No | - | Geographic latitude |
| `longitude` | REAL | No | - | Geographic longitude |
| `city` | TEXT | No | - | City key (toronto, montreal, tokyo, etc.) |
| `ambiance_score` | REAL | Yes | NULL | Expert ambiance rating (0-10) |
| `user_rating_avg` | REAL | Yes | NULL | Average user rating (0-10) |
| `user_rating_count` | INTEGER | Yes | 0 | Number of user reviews |
| `charge_for_alt_milk` | REAL | Yes | NULL | Alt milk surcharge (null if free) |
| `quick_note` | TEXT | No | - | Short tagline/summary |
| `review` | TEXT | Yes | NULL | Full expert review text |
| `source` | TEXT | Yes | NULL | Source of cafe info |
| `hours` | TEXT | Yes | NULL | JSON object from Google Maps API |
| `instagram` | TEXT | Yes | NULL | Instagram handle |
| `instagram_post_link` | TEXT | Yes | NULL | Instagram post URL |
| `tiktok_post_link` | TEXT | Yes | NULL | TikTok post URL |
| `images` | TEXT | Yes | NULL | Image URL/link |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TEXT | Yes | CURRENT_TIMESTAMP | Last update timestamp |
| `deleted_at` | TEXT | Yes | NULL | Soft delete timestamp |

**Indexes:**
- `cafes_city_idx` on `city`
- `cafes_deleted_idx` on `deleted_at`
- `cafes_slug_idx` on `slug`

**Unique Constraints:**
- `slug`

---

### drinks

Stores drink offerings for each cafe (matcha drinks reviewed).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `cafe_id` | INTEGER | No | - | Foreign key to cafes.id (CASCADE DELETE) |
| `name` | TEXT | Yes | NULL | Drink name (defaults to "Iced Matcha Latte") |
| `score` | REAL | No | - | Drink quality score (0-10) |
| `price_amount` | INTEGER | Yes | NULL | Price in cents |
| `price_currency` | TEXT | Yes | NULL | Currency code (CAD, USD, JPY) |
| `grams_used` | INTEGER | Yes | NULL | Grams of matcha powder used |
| `is_default` | INTEGER (BOOLEAN) | Yes | false | Primary/recommended drink |
| `notes` | TEXT | Yes | NULL | Drink-specific notes |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TEXT | Yes | CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `drinks_cafe_idx` on `cafe_id`
- `drinks_default_idx` on `is_default`

---

### events

Stores matcha-related events (workshops, tastings, popups).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `title` | TEXT | No | - | Event title |
| `date` | TEXT | No | - | Event date (ISO format) |
| `time` | TEXT | No | - | Event time |
| `venue` | TEXT | No | - | Venue name |
| `location` | TEXT | No | - | Location details |
| `cafe_id` | INTEGER | Yes | NULL | Optional reference to cafe |
| `description` | TEXT | No | - | Event description |
| `link` | TEXT | Yes | NULL | Instagram handle or post link |
| `price` | TEXT | Yes | NULL | Pricing information |
| `featured` | INTEGER (BOOLEAN) | Yes | false | Featured event flag |
| `published` | INTEGER (BOOLEAN) | Yes | true | Published status |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TEXT | Yes | CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `events_date_idx` on `date`
- `events_featured_idx` on `featured`

---

## User Management

### users

Core user accounts table.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `email` | TEXT | No | - | User email (unique) |
| `username` | TEXT | No | - | Username (unique) |
| `password_hash` | TEXT | No | - | Bcrypt password hash |
| `role` | TEXT | No | 'user' | User role ('admin' or 'user') |
| `last_active_at` | TEXT | Yes | NULL | Last activity timestamp |
| `is_email_verified` | INTEGER (BOOLEAN) | Yes | false | Email verification status |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Account creation timestamp |
| `updated_at` | TEXT | Yes | CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `users_email_idx` on `email`
- `users_username_idx` on `username`

**Unique Constraints:**
- `email`
- `username`

---

### user_profiles

Extended user profile information (1:1 with users).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `user_id` | INTEGER | No | - | Foreign key to users.id (unique, CASCADE DELETE) |
| `display_name` | TEXT | Yes | NULL | Public display name |
| `bio` | TEXT | Yes | NULL | User biography |
| `avatar_url` | TEXT | Yes | NULL | Avatar image URL |
| `location` | TEXT | Yes | NULL | User location |
| `instagram` | TEXT | Yes | NULL | Instagram handle |
| `tiktok` | TEXT | Yes | NULL | TikTok handle |
| `website` | TEXT | Yes | NULL | Personal website URL |
| `preferences` | TEXT | Yes | NULL | JSON preferences object |
| `is_public` | INTEGER (BOOLEAN) | Yes | true | Public profile flag |
| `show_activity` | INTEGER (BOOLEAN) | Yes | true | Show activity feed flag |
| `total_reviews` | INTEGER | Yes | 0 | Denormalized review count |
| `total_checkins` | INTEGER | Yes | 0 | Denormalized check-in count |
| `total_photos` | INTEGER | Yes | 0 | Denormalized photo count |
| `total_favorites` | INTEGER | Yes | 0 | Denormalized favorites count |
| `passport_completion` | REAL | Yes | 0.0 | Passport completion % (0-100) |
| `reputation_score` | INTEGER | Yes | 0 | User reputation score |
| `follower_count` | INTEGER | Yes | 0 | Denormalized follower count |
| `following_count` | INTEGER | Yes | 0 | Denormalized following count |
| `privacy_settings` | TEXT | Yes | (see default) | JSON privacy settings |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Profile creation timestamp |
| `updated_at` | TEXT | Yes | CURRENT_TIMESTAMP | Last update timestamp |

**Default Privacy Settings:**
```json
{"isPublic": true, "showActivity": true, "showFollowers": true}
```

**Indexes:**
- `user_profiles_user_id_idx` on `user_id`
- `user_profiles_display_name_idx` on `display_name`
- `idx_user_profiles_reputation` on `reputation_score`
- `idx_user_profiles_checkins` on `total_checkins`

**Unique Constraints:**
- `user_id`

---

### sessions

JWT refresh token sessions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `user_id` | INTEGER | No | - | Foreign key to users.id (CASCADE DELETE) |
| `token` | TEXT | No | - | Refresh token (unique) |
| `expires_at` | TEXT | No | - | Expiration timestamp |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Session creation timestamp |

**Indexes:**
- `sessions_token_idx` on `token`
- `sessions_user_idx` on `user_id`
- `sessions_expires_idx` on `expires_at`

**Unique Constraints:**
- `token`

---

### waitlist

Email waitlist for beta access.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `email` | TEXT | No | - | Email address (unique) |
| `referral_source` | TEXT | Yes | NULL | How they found MatchaMap |
| `converted` | INTEGER (BOOLEAN) | Yes | false | Converted to user flag |
| `user_id` | INTEGER | Yes | NULL | Foreign key to users.id if converted |
| `is_flagged_fraud` | INTEGER (BOOLEAN) | Yes | false | Fraud detection flag |
| `fraud_score` | REAL | Yes | 0.0 | Fraud score (0-1 scale) |
| `fraud_reason` | TEXT | Yes | NULL | Comma-separated fraud reasons |
| `signup_ip` | TEXT | Yes | NULL | IP address for rate limiting |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Signup timestamp |
| `converted_at` | TEXT | Yes | NULL | Conversion timestamp |

**Indexes:**
- `waitlist_email_idx` on `email`
- `waitlist_converted_idx` on `converted`
- `waitlist_fraud_idx` on `is_flagged_fraud`

**Unique Constraints:**
- `email`

---

## User-Generated Content

### user_reviews

User-submitted cafe reviews.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `user_id` | INTEGER | No | - | Foreign key to users.id (CASCADE DELETE) |
| `cafe_id` | INTEGER | No | - | Foreign key to cafes.id (CASCADE DELETE) |
| `overall_rating` | REAL | No | - | Overall rating (0-10 scale) |
| `matcha_quality_rating` | REAL | Yes | NULL | Matcha quality rating (0-10) |
| `ambiance_rating` | REAL | Yes | NULL | Ambiance rating (0-10) |
| `service_rating` | REAL | Yes | NULL | Service rating (0-10) |
| `value_rating` | REAL | Yes | NULL | Value rating (0-10) |
| `title` | TEXT | Yes | NULL | Review title |
| `content` | TEXT | No | - | Review text content |
| `tags` | TEXT | Yes | NULL | JSON array of tag strings |
| `visit_date` | TEXT | Yes | NULL | Visit date (ISO format) |
| `moderation_status` | TEXT | No | 'approved' | Moderation status (pending/approved/rejected/flagged) |
| `is_public` | INTEGER (BOOLEAN) | Yes | true | Public visibility flag |
| `helpful_count` | INTEGER | Yes | 0 | Helpful votes count |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Review creation timestamp |
| `updated_at` | TEXT | Yes | CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `user_reviews_user_id_idx` on `user_id`
- `user_reviews_cafe_id_idx` on `cafe_id`
- `user_reviews_moderation_idx` on `moderation_status`
- `user_reviews_helpful_idx` on `helpful_count`

**Unique Constraints:**
- `(user_id, cafe_id)` - One review per user per cafe

---

### review_photos

User-uploaded photos for reviews (stored in Cloudflare R2).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `user_id` | INTEGER | No | - | Foreign key to users.id (CASCADE DELETE) |
| `cafe_id` | INTEGER | No | - | Foreign key to cafes.id (CASCADE DELETE) |
| `review_id` | INTEGER | Yes | NULL | Foreign key to user_reviews.id (CASCADE DELETE) |
| `image_key` | TEXT | No | - | R2 object key (unique) |
| `image_url` | TEXT | No | - | Public URL for full-size image |
| `thumbnail_key` | TEXT | No | - | R2 object key for thumbnail |
| `thumbnail_url` | TEXT | Yes | NULL | Public URL for thumbnail (200px) |
| `caption` | TEXT | Yes | NULL | Photo caption |
| `width` | INTEGER | Yes | NULL | Image width in pixels |
| `height` | INTEGER | Yes | NULL | Image height in pixels |
| `file_size` | INTEGER | Yes | NULL | File size in bytes |
| `mime_type` | TEXT | No | - | MIME type (image/jpeg, image/png) |
| `moderation_status` | TEXT | No | 'pending' | Moderation status (pending/approved/rejected) |
| `moderated_at` | TEXT | Yes | NULL | Moderation timestamp |
| `moderated_by` | INTEGER | Yes | NULL | Foreign key to users.id (moderator) |
| `moderation_notes` | TEXT | Yes | NULL | Admin moderation notes |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Upload timestamp |
| `updated_at` | TEXT | Yes | CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `review_photos_user_idx` on `user_id`
- `review_photos_cafe_idx` on `cafe_id`
- `review_photos_review_idx` on `review_id`
- `review_photos_image_key_idx` on `image_key`
- `review_photos_moderation_status_idx` on `moderation_status`
- `review_photos_created_at_idx` on `created_at`

**Unique Constraints:**
- `image_key`

---

### review_helpful

Tracks "helpful" votes on reviews.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `review_id` | INTEGER | No | - | Foreign key to user_reviews.id (CASCADE DELETE) |
| `user_id` | INTEGER | No | - | Foreign key to users.id (CASCADE DELETE) |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Vote timestamp |

**Indexes:**
- `review_helpful_review_id_idx` on `review_id`
- `review_helpful_user_id_idx` on `user_id`

**Unique Constraints:**
- `(review_id, user_id)` - One vote per user per review

---

### review_comments

Comments on user reviews (with nested replies support).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `review_id` | INTEGER | No | - | Foreign key to user_reviews.id (CASCADE DELETE) |
| `user_id` | INTEGER | No | - | Foreign key to users.id (CASCADE DELETE) |
| `parent_comment_id` | INTEGER | Yes | NULL | Self-reference for nested replies |
| `content` | TEXT | No | - | Comment text |
| `like_count` | INTEGER | No | 0 | Comment likes count |
| `moderation_status` | TEXT | No | 'approved' | Moderation status (pending/approved/rejected/flagged) |
| `moderated_at` | TEXT | Yes | NULL | Moderation timestamp |
| `moderated_by` | INTEGER | Yes | NULL | Foreign key to users.id (moderator) |
| `moderation_notes` | TEXT | Yes | NULL | Admin moderation notes |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Comment creation timestamp |
| `updated_at` | TEXT | Yes | CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `review_comments_review_id_idx` on `review_id`
- `review_comments_user_id_idx` on `user_id`
- `review_comments_parent_comment_id_idx` on `parent_comment_id`
- `review_comments_moderation_status_idx` on `moderation_status`
- `review_comments_created_at_idx` on `created_at`

**Note:** The `parent_comment_id` self-reference is enforced at the database level via migration.

---

### review_comment_likes

Likes/upvotes on review comments.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `comment_id` | INTEGER | No | - | Foreign key to review_comments.id (CASCADE DELETE) |
| `user_id` | INTEGER | No | - | Foreign key to users.id (CASCADE DELETE) |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Like timestamp |

**Indexes:**
- `review_comment_likes_comment_id_idx` on `comment_id`
- `review_comment_likes_user_id_idx` on `user_id`

**Unique Constraints:**
- `(comment_id, user_id)` - One like per user per comment

---

## User Activity

### user_checkins

User check-ins at cafes (Matcha Passport).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `user_id` | INTEGER | No | - | Foreign key to users.id (CASCADE DELETE) |
| `cafe_id` | INTEGER | No | - | Foreign key to cafes.id (CASCADE DELETE) |
| `visited_at` | TEXT | Yes | CURRENT_TIMESTAMP | Check-in timestamp |
| `notes` | TEXT | Yes | NULL | User notes about visit |

**Indexes:**
- `user_checkins_user_id_idx` on `user_id`
- `user_checkins_cafe_id_idx` on `cafe_id`
- `user_checkins_visited_at_idx` on `visited_at`

**Unique Constraints:**
- `(user_id, cafe_id)` - One check-in per user per cafe

---

### user_favorites

User's favorite cafes list.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `user_id` | INTEGER | No | - | Foreign key to users.id (CASCADE DELETE) |
| `cafe_id` | INTEGER | No | - | Foreign key to cafes.id (CASCADE DELETE) |
| `notes` | TEXT | Yes | NULL | Private notes about favorite |
| `sort_order` | INTEGER | Yes | 0 | User-defined ordering |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Favorite added timestamp |
| `updated_at` | TEXT | Yes | CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `user_favorites_user_idx` on `user_id`
- `user_favorites_cafe_idx` on `cafe_id`
- `user_favorites_sort_idx` on `(user_id, sort_order)`

**Unique Constraints:**
- `(user_id, cafe_id)` - One favorite per user per cafe

---

### user_badges

Achievements and badges earned by users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `user_id` | INTEGER | No | - | Foreign key to users.id (CASCADE DELETE) |
| `badge_key` | TEXT | No | - | Badge identifier (e.g., 'passport_5') |
| `badge_category` | TEXT | No | - | Category (passport/reviews/photos/special) |
| `earned_at` | TEXT | Yes | CURRENT_TIMESTAMP | Badge earned timestamp |
| `progress_value` | INTEGER | Yes | NULL | Progress value that earned badge |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Record creation timestamp |

**Indexes:**
- `user_badges_user_id_idx` on `user_id`
- `user_badges_category_idx` on `badge_category`
- `user_badges_earned_at_idx` on `earned_at`
- `user_badges_key_idx` on `badge_key`
- `user_badges_user_category_idx` on `(user_id, badge_category)`

**Unique Constraints:**
- `(user_id, badge_key)` - One instance of each badge per user

---

## Social Features

### user_follows

User following/follower relationships.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `follower_id` | INTEGER | No | - | Foreign key to users.id (CASCADE DELETE) - The follower |
| `following_id` | INTEGER | No | - | Foreign key to users.id (CASCADE DELETE) - The followed user |
| `created_at` | TEXT | Yes | datetime('now') | Follow timestamp |

**Indexes:**
- `user_follows_follower_idx` on `follower_id`
- `user_follows_following_idx` on `following_id`
- `user_follows_created_at_idx` on `created_at`
- `user_follows_relationship_idx` on `(follower_id, following_id)`

**Unique Constraints:**
- `(follower_id, following_id)` - One follow relationship per pair

---

## Admin

### admin_audit_log

Tracks all admin actions for auditing and compliance.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | AUTO | Primary key |
| `admin_user_id` | INTEGER | No | - | Foreign key to users.id (CASCADE DELETE) |
| `admin_username` | TEXT | No | - | Admin username (denormalized) |
| `action` | TEXT | No | - | Action type (CREATE/UPDATE/DELETE) |
| `resource_type` | TEXT | No | - | Resource type (cafe/drink/event/feed_item/user/user_role) |
| `resource_id` | INTEGER | No | - | ID of affected resource |
| `changes_summary` | TEXT | Yes | NULL | Human-readable change summary |
| `before_state` | TEXT | Yes | NULL | JSON snapshot before change |
| `after_state` | TEXT | Yes | NULL | JSON snapshot after change |
| `ip_address` | TEXT | Yes | NULL | Admin IP address |
| `user_agent` | TEXT | Yes | NULL | Admin user agent |
| `created_at` | TEXT | Yes | CURRENT_TIMESTAMP | Action timestamp |

**Indexes:**
- `audit_admin_user_idx` on `admin_user_id`
- `audit_action_idx` on `action`
- `audit_resource_idx` on `(resource_type, resource_id)`
- `audit_created_at_idx` on `created_at`

---

## Relationships

```
users (1) ──── (1) user_profiles
  │
  ├── (1) ──── (many) sessions
  ├── (1) ──── (many) user_checkins ──── (many) cafes
  ├── (1) ──── (many) user_reviews ──── (many) cafes
  ├── (1) ──── (many) review_photos ──── (many) cafes
  ├── (1) ──── (many) review_helpful
  ├── (1) ──── (many) review_comments
  ├── (1) ──── (many) review_comment_likes
  ├── (1) ──── (many) user_favorites ──── (many) cafes
  ├── (1) ──── (many) user_badges
  ├── (follower) ──── (many) user_follows ──── (following)
  └── (1) ──── (many) admin_audit_log

cafes (1) ──── (many) drinks
  │
  ├── (1) ──── (many) events
  ├── (1) ──── (many) user_reviews
  ├── (1) ──── (many) review_photos
  ├── (1) ──── (many) user_checkins
  └── (1) ──── (many) user_favorites

user_reviews (1) ──── (many) review_photos
  │
  ├── (1) ──── (many) review_helpful
  └── (1) ──── (many) review_comments
      │
      └── (1) ──── (many) review_comment_likes

review_comments (parent) ──── (many) review_comments (self-reference)
```

---

## Indexes

All indexes are documented in their respective table sections above. Key performance indexes include:

- **Foreign key indexes:** All foreign key columns have indexes for join performance
- **Lookup indexes:** Email, username, slug for fast lookups
- **Time-based indexes:** created_at, expires_at for time-based queries
- **Composite indexes:** Multi-column indexes for common query patterns (e.g., user_id + sort_order)
- **Unique indexes:** Enforce business constraints (e.g., one review per user per cafe)

---

## Migration History

Database migrations are managed via Drizzle and stored in `backend/drizzle/migrations/`. Key migrations:

- `0000_fantastic_hitman.sql` - Initial schema
- `0008_add_admin_audit_log.sql` - Admin audit logging
- `0011_add_metrics_tracking_tables.sql` - Analytics tracking (removed in 0015)
- `0012_add_user_reviews_tables.sql` - User reviews and photos
- `0013_add_user_favorites.sql` - User favorites system
- `0014_add_review_id_to_photos.sql` - Link photos to reviews
- `0015_drop_legacy_feed_items.sql` - Clean up old feed system
- `0016_enhance_user_profiles.sql` - Enhanced profile fields
- `0017_add_user_badges.sql` - Badges and achievements
- `0018_add_user_follows.sql` - Social following system
- `0018_add_review_comments.sql` - Review comments
- `0018_add_waitlist_fraud_detection.sql` - Waitlist fraud detection

---

## Notes

- **SQLite/D1 Limitations:** No native ENUM type, using TEXT with constraints
- **Boolean Fields:** Stored as INTEGER (0/1) with boolean mode in Drizzle
- **JSON Fields:** Stored as TEXT, parsed on application layer
- **Timestamps:** Stored as TEXT in ISO 8601 format
- **Soft Deletes:** Only cafes table uses `deleted_at` for soft deletes
- **Denormalized Counts:** User profile stats are denormalized for performance and updated on writes

---

## See Also

- [API Reference](api-reference.md) - Complete API endpoint documentation
- [Photo Storage Guide](photo-storage.md) - R2 photo storage setup
- [TECH_SPEC.md](../TECH_SPEC.md) - Full technical specifications
