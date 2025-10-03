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
--> statement-breakpoint
CREATE UNIQUE INDEX `cafes_slug_unique` ON `cafes` (`slug`);--> statement-breakpoint
CREATE INDEX `cafes_city_idx` ON `cafes` (`city`);--> statement-breakpoint
CREATE INDEX `cafes_deleted_idx` ON `cafes` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `cafes_slug_idx` ON `cafes` (`slug`);--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX `drinks_cafe_idx` ON `drinks` (`cafe_id`);--> statement-breakpoint
CREATE INDEX `drinks_default_idx` ON `drinks` (`is_default`);--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX `events_date_idx` ON `events` (`date`);--> statement-breakpoint
CREATE INDEX `events_featured_idx` ON `events` (`featured`);--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX `feed_published_date_idx` ON `feed_items` (`published`,`date`);--> statement-breakpoint
CREATE INDEX `feed_type_idx` ON `feed_items` (`type`);