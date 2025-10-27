-- Migration: Add user following system (Phase 2D)
-- Purpose: Create user_follows table for social features
-- Date: 2025-10-27
--
-- PRODUCTION SAFETY:
-- - New table with no impact on existing functionality
-- - All constraints and indexes added safely
-- - follower_count/following_count already exist in user_profiles
--
-- ROLLBACK PLAN (if needed):
-- This migration adds a new table only. Rollback would be:
-- - DROP TABLE user_follows;
--
-- This migration adds:
-- 1. user_follows table for tracking follow relationships
-- 2. Indexes for performance
-- 3. Unique constraint to prevent duplicate follows
-- 4. Self-referencing foreign keys with cascade delete

-- Create user_follows table
CREATE TABLE user_follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  
  -- Ensure one follow relationship per user pair
  UNIQUE(follower_id, following_id),
  
  -- Prevent users from following themselves
  CHECK(follower_id != following_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_created_at ON user_follows(created_at DESC);

-- Create composite index for efficient relationship queries
CREATE INDEX idx_user_follows_relationship ON user_follows(follower_id, following_id);