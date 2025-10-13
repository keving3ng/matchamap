-- Migration: Add user reviews database schema (Phase 2A - Foundation)
-- Purpose: Create database schema for user-generated reviews with full-featured support
--          (ratings, text, photos, moderation) as foundation for review system
-- Date: 2025-10-13

-- User-generated reviews
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
	`visit_date` text,
	`is_public` integer DEFAULT 1,
	`is_featured` integer DEFAULT 0,
	`moderation_status` text DEFAULT 'approved' CHECK(`moderation_status` IN ('pending', 'approved', 'rejected', 'flagged')),
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
--> statement-breakpoint

-- Review photos (links to R2 storage)
CREATE TABLE `review_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`review_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`cafe_id` integer NOT NULL,
	`image_key` text NOT NULL,
	`image_url` text NOT NULL,
	`thumbnail_url` text,
	`caption` text,
	`drink_type` text,
	`width` integer,
	`height` integer,
	`file_size` integer,
	`moderation_status` text DEFAULT 'pending' CHECK(`moderation_status` IN ('pending', 'approved', 'rejected')),
	`moderated_by` integer,
	`moderated_at` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`review_id`) REFERENCES `user_reviews`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`cafe_id`) REFERENCES `cafes`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`moderated_by`) REFERENCES `users`(`id`)
);
--> statement-breakpoint

-- Helpful votes (prevent duplicate votes)
CREATE TABLE `review_helpful` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`review_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`review_id`) REFERENCES `user_reviews`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	UNIQUE(`review_id`, `user_id`)
);
--> statement-breakpoint

-- Indexes for performance
CREATE INDEX `idx_user_reviews_user` ON `user_reviews` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_reviews_cafe` ON `user_reviews` (`cafe_id`);--> statement-breakpoint
CREATE INDEX `idx_user_reviews_rating` ON `user_reviews` (`overall_rating` DESC);--> statement-breakpoint
CREATE INDEX `idx_user_reviews_created` ON `user_reviews` (`created_at` DESC);--> statement-breakpoint
CREATE INDEX `idx_user_reviews_status` ON `user_reviews` (`moderation_status`);--> statement-breakpoint

CREATE INDEX `idx_review_photos_review` ON `review_photos` (`review_id`);--> statement-breakpoint
CREATE INDEX `idx_review_photos_cafe` ON `review_photos` (`cafe_id`);--> statement-breakpoint
CREATE INDEX `idx_review_photos_status` ON `review_photos` (`moderation_status`);--> statement-breakpoint

CREATE INDEX `idx_review_helpful_review` ON `review_helpful` (`review_id`);--> statement-breakpoint
CREATE INDEX `idx_review_helpful_user` ON `review_helpful` (`user_id`);