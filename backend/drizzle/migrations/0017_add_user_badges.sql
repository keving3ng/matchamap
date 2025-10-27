-- Migration: Add user badges and achievements system (Phase 2C)
-- Purpose: Create user_badges table for gamification features
-- Date: 2025-10-27
--
-- PRODUCTION SAFETY:
-- - New table with no impact on existing functionality
-- - All constraints and indexes added safely
-- - Badge definitions stored in code, not database
--
-- ROLLBACK PLAN (if needed):
-- This migration adds a new table only. Rollback would be:
-- - DROP TABLE user_badges;
--
-- This migration adds:
-- 1. user_badges table for tracking earned badges
-- 2. Indexes for performance
-- 3. Unique constraint to prevent duplicate badges per user

-- Create user_badges table
CREATE TABLE user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Badge identification
  badge_key TEXT NOT NULL, -- e.g., 'passport_5', 'reviews_10', 'early_adopter'
  badge_category TEXT NOT NULL, -- e.g., 'passport', 'reviews', 'photos', 'special'
  
  -- Badge progress tracking
  earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  progress_value INTEGER, -- Optional: track progress that earned badge (e.g., 25 cafes)
  
  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one badge per user per badge type
  UNIQUE(user_id, badge_key)
);

-- Create indexes for performance
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_category ON user_badges(badge_category);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);
CREATE INDEX idx_user_badges_key ON user_badges(badge_key);

-- Create composite index for efficient user badge queries
CREATE INDEX idx_user_badges_user_category ON user_badges(user_id, badge_category);