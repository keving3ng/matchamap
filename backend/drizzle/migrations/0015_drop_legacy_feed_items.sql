-- Migration: Drop legacy feed_items table
-- Purpose: Remove deprecated blog/article-style feed system to make way for Phase 2 activity feed
-- Date: 2025-10-19
--
-- PRODUCTION SAFETY:
-- The feed_items table contains legacy blog/article content that is not publicly visible
-- (ENABLE_FEED: false in production). Safe to delete this data as it was never fully launched.
--
-- ROLLBACK PLAN (if needed):
-- If we need to restore this table later, the schema can be found in git history:
-- - backend/drizzle/schema.ts (lines 71-100, commit before this migration)
-- - Data backup can be created before migration:
--   npx wrangler d1 execute matchamap-db --remote --command "SELECT * FROM feed_items" --json > feed_backup.json
--
-- This migration removes:
-- 1. feed_items table (with all data)
-- 2. Associated indexes (feed_published_date_idx, feed_type_idx)

-- Drop indexes first (SQLite requires this order)
DROP INDEX IF EXISTS `feed_published_date_idx`;
DROP INDEX IF EXISTS `feed_type_idx`;

-- Drop the legacy feed_items table
DROP TABLE IF EXISTS `feed_items`;