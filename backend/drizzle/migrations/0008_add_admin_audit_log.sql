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
--> statement-breakpoint
CREATE INDEX `audit_admin_user_idx` ON `admin_audit_log` (`admin_user_id`);--> statement-breakpoint
CREATE INDEX `audit_action_idx` ON `admin_audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `audit_resource_idx` ON `admin_audit_log` (`resource_type`,`resource_id`);--> statement-breakpoint
CREATE INDEX `audit_created_at_idx` ON `admin_audit_log` (`created_at`);