-- Migration: Add cafe suggestions table (Phase 2F)
-- Purpose: Allow users to suggest new cafes for admin approval with full tracking
-- Date: 2025-11-02

-- Cafe suggestions table
CREATE TABLE `cafe_suggestions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` integer NOT NULL,
	`name` text NOT NULL CHECK(LENGTH(`name`) >= 2 AND LENGTH(`name`) <= 200),
	`address` text NOT NULL CHECK(LENGTH(`address`) >= 5 AND LENGTH(`address`) <= 500),
	`city` text NOT NULL CHECK(`city` IN ('toronto', 'vancouver', 'montreal', 'tokyo')),
	`neighborhood` text,
	`description` text CHECK(`description` IS NULL OR (LENGTH(`description`) >= 10 AND LENGTH(`description`) <= 1000)),
	`google_maps_url` text,
	`instagram` text,
	`website` text,
	`status` text DEFAULT 'pending' CHECK(`status` IN ('pending', 'approved', 'rejected')),
	`cafe_id` integer,
	`admin_notes` text,
	`moderated_by` integer,
	`moderated_at` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`cafe_id`) REFERENCES `cafes`(`id`) ON DELETE SET NULL,
	FOREIGN KEY (`moderated_by`) REFERENCES `users`(`id`)
);
--> statement-breakpoint

-- Indexes for performance
CREATE INDEX `idx_cafe_suggestions_user` ON `cafe_suggestions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_cafe_suggestions_status` ON `cafe_suggestions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_cafe_suggestions_city` ON `cafe_suggestions` (`city`);--> statement-breakpoint
CREATE INDEX `idx_cafe_suggestions_created` ON `cafe_suggestions` (`created_at` DESC);--> statement-breakpoint
CREATE INDEX `idx_cafe_suggestions_status_created` ON `cafe_suggestions` (`status`, `created_at` DESC);
