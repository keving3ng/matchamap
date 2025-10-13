-- Migration: Add metrics tracking database schema (Phase 1)
-- Purpose: Implement anonymous and authenticated user behavior tracking
--          as outlined in docs/metrics-tracking-prd.md
-- Date: 2025-10-13

-- Phase 1: Anonymous Behavior Tracking
-- Cafe performance metrics (anonymous + authenticated combined)
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
--> statement-breakpoint
CREATE INDEX `cafe_stats_views_idx` ON `cafe_stats` (`views` DESC);--> statement-breakpoint
CREATE INDEX `cafe_stats_updated_idx` ON `cafe_stats` (`updated_at`);--> statement-breakpoint

-- Feed article metrics
CREATE TABLE `feed_stats` (
	`feed_item_id` integer PRIMARY KEY NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`feed_item_id`) REFERENCES `feed_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Event metrics
CREATE TABLE `event_stats` (
	`event_id` integer PRIMARY KEY NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Phase 1.5: User Activity Tracking
-- User activity aggregates (for quick queries)
CREATE TABLE `user_activity_stats` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`total_cafe_views` integer DEFAULT 0 NOT NULL,
	`total_checkins` integer DEFAULT 0 NOT NULL,
	`total_directions_clicks` integer DEFAULT 0 NOT NULL,
	`last_active_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_activity_last_active_idx` ON `user_activity_stats` (`last_active_at`);--> statement-breakpoint
CREATE INDEX `user_activity_checkins_idx` ON `user_activity_stats` (`total_checkins`);