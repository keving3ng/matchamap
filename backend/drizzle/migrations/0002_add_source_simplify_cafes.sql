-- Add source field
ALTER TABLE `cafes` ADD `source` text;

-- Drop legacy columns that are now managed per-drink
-- Note: SQLite doesn't support DROP COLUMN directly, but we can leave them as-is
-- The application will simply ignore these fields going forward
-- Future cleanup can be done via table recreation if needed

-- For chargeForAltMilk, we're keeping the column but changing its meaning
-- Old: boolean (0/1), New: real (price or null)
-- Existing data will need manual update if needed
