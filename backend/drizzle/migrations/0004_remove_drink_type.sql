-- Remove type column from drinks table
-- Note: SQLite doesn't support DROP COLUMN directly in older versions
-- We'll create a new table without the type column and copy data

-- Create new drinks table without type column
CREATE TABLE `drinks_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `cafe_id` integer NOT NULL,
  `name` text NOT NULL,
  `score` real NOT NULL,
  `price_amount` integer NOT NULL,
  `price_currency` text DEFAULT 'CAD' NOT NULL,
  `grams_used` integer,
  `is_default` integer DEFAULT false,
  `notes` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`cafe_id`) REFERENCES `cafes`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Copy data from old table to new table
INSERT INTO `drinks_new` (id, cafe_id, name, score, price_amount, price_currency, grams_used, is_default, notes, created_at, updated_at)
SELECT id, cafe_id, name, score, price_amount, price_currency, grams_used, is_default, notes, created_at, updated_at
FROM `drinks`;

-- Drop old table
DROP TABLE `drinks`;

-- Rename new table to drinks
ALTER TABLE `drinks_new` RENAME TO `drinks`;

-- Recreate indexes
CREATE INDEX `drinks_cafe_idx` ON `drinks` (`cafe_id`);
CREATE INDEX `drinks_default_idx` ON `drinks` (`is_default`);
