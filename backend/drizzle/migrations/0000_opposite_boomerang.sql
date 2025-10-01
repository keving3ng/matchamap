CREATE TABLE `cafes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`neighborhood_id` integer,
	`score` real NOT NULL,
	`value_score` real,
	`ambiance_score` real,
	`other_drinks_score` real,
	`price_range` text,
	`charge_for_alt_milk` integer DEFAULT false,
	`quick_note` text NOT NULL,
	`review` text,
	`comments` text,
	`menu_highlights` text,
	`hours` text,
	`instagram` text,
	`tiktok` text,
	`google_maps_url` text,
	`emoji` text NOT NULL,
	`color` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` text,
	FOREIGN KEY (`neighborhood_id`) REFERENCES `neighborhoods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cafes_slug_unique` ON `cafes` (`slug`);--> statement-breakpoint
CREATE INDEX `cafes_city_idx` ON `cafes` (`city`);--> statement-breakpoint
CREATE INDEX `cafes_neighborhood_idx` ON `cafes` (`neighborhood_id`);--> statement-breakpoint
CREATE INDEX `cafes_deleted_idx` ON `cafes` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `cafes_slug_idx` ON `cafes` (`slug`);--> statement-breakpoint
CREATE TABLE `drinks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cafe_id` integer NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`price_amount` integer NOT NULL,
	`price_currency` text DEFAULT 'CAD' NOT NULL,
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
CREATE INDEX `feed_type_idx` ON `feed_items` (`type`);--> statement-breakpoint
CREATE TABLE `neighborhoods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`bounds` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `neighborhoods_name_city_idx` ON `neighborhoods` (`name`,`city`);