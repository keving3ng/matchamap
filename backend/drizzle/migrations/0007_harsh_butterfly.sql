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
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_profiles_user_id_idx` ON `user_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_profiles_display_name_idx` ON `user_profiles` (`display_name`);--> statement-breakpoint
ALTER TABLE `users` ADD `last_active_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `is_email_verified` integer DEFAULT false;