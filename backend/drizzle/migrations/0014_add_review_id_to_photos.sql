-- Migration: Add review_id column to review_photos table
-- Purpose: Link photos to specific reviews (nullable - photos can be uploaded before review creation)
-- Date: 2025-10-15

-- Add review_id column to review_photos table
ALTER TABLE `review_photos` ADD COLUMN `review_id` integer REFERENCES `user_reviews`(`id`) ON DELETE CASCADE;

-- Add index for review_id for performance
CREATE INDEX `idx_review_photos_review` ON `review_photos` (`review_id`);
