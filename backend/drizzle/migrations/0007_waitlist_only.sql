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
--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_email_unique` ON `waitlist` (`email`);--> statement-breakpoint
CREATE INDEX `waitlist_email_idx` ON `waitlist` (`email`);--> statement-breakpoint
CREATE INDEX `waitlist_converted_idx` ON `waitlist` (`converted`);
