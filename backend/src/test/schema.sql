CREATE TABLE `cafes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`link` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`city` text NOT NULL,
	`ambiance_score` real,
	`charge_for_alt_milk` real,
	`quick_note` text NOT NULL,
	`review` text,
	`source` text,
	`hours` text,
	`instagram` text,
	`instagram_post_link` text,
	`tiktok_post_link` text,
	`images` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` text
);
CREATE UNIQUE INDEX `cafes_slug_unique` ON `cafes` (`slug`);
CREATE INDEX `cafes_city_idx` ON `cafes` (`city`);
CREATE INDEX `cafes_deleted_idx` ON `cafes` (`deleted_at`);
CREATE INDEX `cafes_slug_idx` ON `cafes` (`slug`);
CREATE TABLE `drinks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cafe_id` integer NOT NULL,
	`name` text,
	`score` real NOT NULL,
	`price_amount` integer,
	`price_currency` text,
	`grams_used` integer,
	`is_default` integer DEFAULT false,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`cafe_id`) REFERENCES `cafes`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `drinks_cafe_idx` ON `drinks` (`cafe_id`);
CREATE INDEX `drinks_default_idx` ON `drinks` (`is_default`);
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`venue` text NOT NULL,
	`location` text NOT NULL,
	`cafe_id` integer,
	`description` text NOT NULL,
	`image` text,
	`price` text,
	`featured` integer DEFAULT false,
	`published` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`cafe_id`) REFERENCES `cafes`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `events_date_idx` ON `events` (`date`);
CREATE INDEX `events_featured_idx` ON `events` (`featured`);
CREATE TABLE `feed_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`preview` text NOT NULL,
	`content` text,
	`cafe_id` integer,
	`cafe_name` text,
	`score` real,
	`previous_score` real,
	`neighborhood` text,
	`image` text,
	`author` text,
	`tags` text,
	`published` integer DEFAULT false,
	`date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`cafe_id`) REFERENCES `cafes`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `feed_published_date_idx` ON `feed_items` (`published`,`date`);
CREATE INDEX `feed_type_idx` ON `feed_items` (`type`);
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);
CREATE INDEX `sessions_token_idx` ON `sessions` (`token`);
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
CREATE INDEX `users_email_idx` ON `users` (`email`);
CREATE INDEX `users_username_idx` ON `users` (`username`);
CREATE TABLE `waitlist` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`referral_source` text,
	`converted` integer DEFAULT false,
	`user_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`converted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE UNIQUE INDEX `waitlist_email_unique` ON `waitlist` (`email`);
CREATE INDEX `waitlist_email_idx` ON `waitlist` (`email`);
CREATE INDEX `waitlist_converted_idx` ON `waitlist` (`converted`);
ALTER TABLE `cafes` ADD `address` text;
CREATE TABLE `user_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`display_name` text,
	`bio` text,
	`avatar_url` text,
	`location` text,
	`instagram` text,
	`tiktok` text,
	`website` text,
	`preferences` text,
	`is_public` integer DEFAULT true,
	`show_activity` integer DEFAULT true,
	`total_reviews` integer DEFAULT 0,
	`total_checkins` integer DEFAULT 0,
	`total_photos` integer DEFAULT 0,
	`reputation_score` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);
CREATE INDEX `user_profiles_user_id_idx` ON `user_profiles` (`user_id`);
CREATE INDEX `user_profiles_display_name_idx` ON `user_profiles` (`display_name`);
ALTER TABLE `users` ADD `last_active_at` text;
ALTER TABLE `users` ADD `is_email_verified` integer DEFAULT false;
CREATE TABLE `admin_audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_user_id` integer NOT NULL,
	`admin_username` text NOT NULL,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` integer NOT NULL,
	`changes_summary` text,
	`before_state` text,
	`after_state` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `audit_admin_user_idx` ON `admin_audit_log` (`admin_user_id`);
CREATE INDEX `audit_action_idx` ON `admin_audit_log` (`action`);
CREATE INDEX `audit_resource_idx` ON `admin_audit_log` (`resource_type`,`resource_id`);
CREATE INDEX `audit_created_at_idx` ON `admin_audit_log` (`created_at`);-- Migration: Normalize city keys to match CITIES constant
UPDATE cafes
SET city = 'new york'
WHERE LOWER(city) = 'new york city';
UPDATE cafes
SET city = LOWER(city)
WHERE city != LOWER(city);
ALTER TABLE events RENAME COLUMN image TO link;
CREATE TABLE `cafe_stats` (
	`cafe_id` integer PRIMARY KEY NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`directions_clicks` integer DEFAULT 0 NOT NULL,
	`anonymous_passport_marks` integer DEFAULT 0 NOT NULL,
	`instagram_clicks` integer DEFAULT 0 NOT NULL,
	`tiktok_clicks` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`cafe_id`) REFERENCES `cafes`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `cafe_stats_views_idx` ON `cafe_stats` (`views` DESC);
CREATE INDEX `cafe_stats_updated_idx` ON `cafe_stats` (`updated_at`);
CREATE TABLE `feed_stats` (
	`feed_item_id` integer PRIMARY KEY NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`feed_item_id`) REFERENCES `feed_items`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `event_stats` (
	`event_id` integer PRIMARY KEY NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `user_activity_stats` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`total_cafe_views` integer DEFAULT 0 NOT NULL,
	`total_checkins` integer DEFAULT 0 NOT NULL,
	`total_directions_clicks` integer DEFAULT 0 NOT NULL,
	`last_active_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `user_activity_last_active_idx` ON `user_activity_stats` (`last_active_at`);
CREATE INDEX `user_activity_checkins_idx` ON `user_activity_stats` (`total_checkins`);-- Migration: Add user reviews database schema (Phase 2A - Foundation)
CREATE TABLE `user_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` integer NOT NULL,
	`cafe_id` integer NOT NULL,
	`overall_rating` real NOT NULL CHECK(`overall_rating` >= 0 AND `overall_rating` <= 10),
	`matcha_quality_rating` real CHECK(`matcha_quality_rating` >= 0 AND `matcha_quality_rating` <= 10),
	`ambiance_rating` real CHECK(`ambiance_rating` >= 0 AND `ambiance_rating` <= 10),
	`service_rating` real CHECK(`service_rating` >= 0 AND `service_rating` <= 10),
	`value_rating` real CHECK(`value_rating` >= 0 AND `value_rating` <= 10),
	`title` text,
	`content` text NOT NULL CHECK(LENGTH(`content`) >= 50 AND LENGTH(`content`) <= 2000),
	`tags` text,
	`visit_date` text CHECK(`visit_date` IS NULL OR date(`visit_date`) <= date('now')),
	`is_public` integer DEFAULT 1,
	`is_featured` integer DEFAULT 0,
	`moderation_status` text DEFAULT 'pending' CHECK(`moderation_status` IN ('pending', 'approved', 'rejected', 'flagged')),
	`moderation_notes` text,
	`moderated_by` integer,
	`moderated_at` text,
	`helpful_count` integer DEFAULT 0,
	`flag_count` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`cafe_id`) REFERENCES `cafes`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`moderated_by`) REFERENCES `users`(`id`),
	UNIQUE(`user_id`, `cafe_id`)
);
CREATE TABLE `review_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` integer NOT NULL,
	`cafe_id` integer NOT NULL,
	`image_key` text NOT NULL UNIQUE,
	`image_url` text NOT NULL,
	`thumbnail_key` text NOT NULL,
	`thumbnail_url` text,
	`caption` text,
	`width` integer,
	`height` integer,
	`file_size` integer,
	`mime_type` text NOT NULL,
	`moderation_status` text DEFAULT 'pending' CHECK(`moderation_status` IN ('pending', 'approved', 'rejected')),
	`moderated_by` integer,
	`moderated_at` text,
	`moderation_notes` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`cafe_id`) REFERENCES `cafes`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`moderated_by`) REFERENCES `users`(`id`)
);
CREATE TABLE `review_helpful` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`review_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`review_id`) REFERENCES `user_reviews`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	UNIQUE(`review_id`, `user_id`)
);
CREATE INDEX `idx_user_reviews_user` ON `user_reviews` (`user_id`);
CREATE INDEX `idx_user_reviews_cafe` ON `user_reviews` (`cafe_id`);
CREATE INDEX `idx_user_reviews_rating` ON `user_reviews` (`overall_rating` DESC);
CREATE INDEX `idx_user_reviews_created` ON `user_reviews` (`created_at` DESC);
CREATE INDEX `idx_user_reviews_status` ON `user_reviews` (`moderation_status`);
CREATE INDEX `idx_user_reviews_cafe_rating` ON `user_reviews` (`cafe_id`, `overall_rating` DESC);
CREATE INDEX `idx_user_reviews_status_created` ON `user_reviews` (`moderation_status`, `created_at` DESC);
CREATE INDEX `idx_review_photos_user` ON `review_photos` (`user_id`);
CREATE INDEX `idx_review_photos_cafe` ON `review_photos` (`cafe_id`);
CREATE INDEX `idx_review_photos_image_key` ON `review_photos` (`image_key`);
CREATE INDEX `idx_review_photos_status` ON `review_photos` (`moderation_status`);
CREATE INDEX `idx_review_photos_created_at` ON `review_photos` (`created_at`);
CREATE INDEX `idx_review_helpful_review` ON `review_helpful` (`review_id`);
CREATE INDEX `idx_review_helpful_user` ON `review_helpful` (`user_id`);
ALTER TABLE `cafes` ADD COLUMN `user_rating_avg` real;
ALTER TABLE `cafes` ADD COLUMN `user_rating_count` integer DEFAULT 0;
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    
    -- Optional private notes
    notes TEXT,
    
    -- Priority/ordering
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    UNIQUE(user_id, cafe_id)
);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_cafe ON user_favorites(cafe_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_sort ON user_favorites(user_id, sort_order);-- Migration: Add review_id column to review_photos table
ALTER TABLE `review_photos` ADD COLUMN `review_id` integer REFERENCES `user_reviews`(`id`) ON DELETE CASCADE;
CREATE INDEX `idx_review_photos_review` ON `review_photos` (`review_id`);
DROP INDEX IF EXISTS `feed_published_date_idx`;
DROP INDEX IF EXISTS `feed_type_idx`;
DROP TABLE IF EXISTS `feed_items`;-- Migration: Enhance user profiles with stats and privacy settings (Phase 2A - Foundation)
ALTER TABLE user_profiles ADD COLUMN total_favorites INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN passport_completion REAL DEFAULT 0.0; -- Percentage (0-100)
ALTER TABLE user_profiles ADD COLUMN follower_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN following_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN privacy_settings TEXT DEFAULT '{"isPublic":true,"showActivity":true,"showFollowers":true}';
CREATE INDEX IF NOT EXISTS idx_user_profiles_reputation ON user_profiles(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_checkins ON user_profiles(total_checkins DESC);-- Migration: Add user badges and achievements system (Phase 2C)
CREATE TABLE user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Badge identification
  badge_key TEXT NOT NULL, -- e.g., 'passport_5', 'reviews_10', 'early_adopter'
  badge_category TEXT NOT NULL, -- e.g., 'passport', 'reviews', 'photos', 'special'
  
  -- Badge progress tracking
  earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  progress_value INTEGER, -- Optional: track progress that earned badge (e.g., 25 cafes)
  
  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one badge per user per badge type
  UNIQUE(user_id, badge_key)
);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_category ON user_badges(badge_category);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);
CREATE INDEX idx_user_badges_key ON user_badges(badge_key);
CREATE INDEX idx_user_badges_user_category ON user_badges(user_id, badge_category);-- Migration: Add review comments system
CREATE TABLE review_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL REFERENCES user_reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES review_comments(id) ON DELETE CASCADE,
    
    -- Comment content
    content TEXT NOT NULL,
    
    -- Engagement metrics
    like_count INTEGER DEFAULT 0 NOT NULL,
    
    -- Moderation
    moderation_status TEXT DEFAULT 'approved' NOT NULL CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    moderated_at TEXT,
    moderated_by INTEGER REFERENCES users(id),
    moderation_notes TEXT,
    
    -- Timestamps
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);
CREATE INDEX review_comments_review_id_idx ON review_comments(review_id);
CREATE INDEX review_comments_user_id_idx ON review_comments(user_id);
CREATE INDEX review_comments_parent_comment_id_idx ON review_comments(parent_comment_id);
CREATE INDEX review_comments_moderation_status_idx ON review_comments(moderation_status);
CREATE INDEX review_comments_created_at_idx ON review_comments(created_at);
CREATE TABLE review_comment_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER NOT NULL REFERENCES review_comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    
    -- Ensure unique constraint: one like per user per comment
    UNIQUE(comment_id, user_id)
);
CREATE INDEX review_comment_likes_comment_id_idx ON review_comment_likes(comment_id);
CREATE INDEX review_comment_likes_user_id_idx ON review_comment_likes(user_id);-- Migration: Add user following system (Phase 2D)
CREATE TABLE user_follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  
  -- Ensure one follow relationship per user pair
  UNIQUE(follower_id, following_id),
  
  -- Prevent users from following themselves
  CHECK(follower_id != following_id)
);
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_created_at ON user_follows(created_at DESC);
CREATE INDEX idx_user_follows_relationship ON user_follows(follower_id, following_id);-- Add fraud detection columns to waitlist table
ALTER TABLE waitlist ADD COLUMN is_flagged_fraud INTEGER DEFAULT 0;
ALTER TABLE waitlist ADD COLUMN fraud_score REAL DEFAULT 0.0;
ALTER TABLE waitlist ADD COLUMN fraud_reason TEXT;
ALTER TABLE waitlist ADD COLUMN signup_ip TEXT;
CREATE INDEX waitlist_fraud_idx ON waitlist(is_flagged_fraud);