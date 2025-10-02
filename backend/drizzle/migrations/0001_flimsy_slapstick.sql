PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cafes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`link` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`city` text NOT NULL,
	`score` real,
	`ambiance_score` real,
	`other_drinks_score` real,
	`price` real,
	`charge_for_alt_milk` integer DEFAULT false,
	`grams_used` integer,
	`quick_note` text NOT NULL,
	`review` text,
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
INSERT INTO `__new_cafes`("id", "name", "slug", "link", "latitude", "longitude", "city", "score", "ambiance_score", "other_drinks_score", "price", "charge_for_alt_milk", "grams_used", "quick_note", "review", "hours", "instagram", "instagram_post_link", "tiktok_post_link", "images", "created_at", "updated_at", "deleted_at") SELECT "id", "name", "slug", "link", "latitude", "longitude", "city", "score", "ambiance_score", "other_drinks_score", "price", "charge_for_alt_milk", "grams_used", "quick_note", "review", "hours", "instagram", "instagram_post_link", "tiktok_post_link", "images", "created_at", "updated_at", "deleted_at" FROM `cafes`;--> statement-breakpoint
DROP TABLE `cafes`;--> statement-breakpoint
ALTER TABLE `__new_cafes` RENAME TO `cafes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `cafes_slug_unique` ON `cafes` (`slug`);--> statement-breakpoint
CREATE INDEX `cafes_city_idx` ON `cafes` (`city`);--> statement-breakpoint
CREATE INDEX `cafes_deleted_idx` ON `cafes` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `cafes_slug_idx` ON `cafes` (`slug`);--> statement-breakpoint
ALTER TABLE `drinks` ADD `score` real NOT NULL;