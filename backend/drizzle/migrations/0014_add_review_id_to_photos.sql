-- Migration: Add review_id column to review_photos table
-- Purpose: Link photos to specific reviews (nullable - photos can be uploaded before review creation)
-- Date: 2025-10-15
-- 
-- IMPORTANT PRODUCTION FIX:
-- This migration may fail in production if review_id column already exists due to schema drift.
-- If migration fails with "duplicate column name: review_id", follow these steps:
--
-- 1. Manually mark this migration as applied in production:
--    npx wrangler d1 execute matchamap-db --remote --command \
--      "INSERT INTO d1_migrations (name, applied_at) VALUES ('0014_add_review_id_to_photos.sql', datetime('now'));"
--
-- 2. Verify the column and index exist:
--    npx wrangler d1 execute matchamap-db --remote --command \
--      "PRAGMA table_info(review_photos);"
--    npx wrangler d1 execute matchamap-db --remote --command \
--      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='review_photos' AND name='idx_review_photos_review';"
--
-- 3. If review_id column exists but index doesn't, create the index:
--    npx wrangler d1 execute matchamap-db --remote --command \
--      "CREATE INDEX IF NOT EXISTS idx_review_photos_review ON review_photos (review_id);"
--
-- For local development environments, this migration will run normally.

-- Add review_id column to review_photos table
ALTER TABLE `review_photos` ADD COLUMN `review_id` integer REFERENCES `user_reviews`(`id`) ON DELETE CASCADE;

-- Add index for review_id for performance
CREATE INDEX `idx_review_photos_review` ON `review_photos` (`review_id`);
