CREATE TABLE `contact_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`signup_ip` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `contact_submissions_created_at_idx` ON `contact_submissions` (`created_at`);
