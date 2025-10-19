-- Migration: Enhance user profiles with stats and privacy settings (Phase 2A - Foundation)
-- Purpose: Add denormalized stats and privacy settings for user profiles
-- Date: 2025-10-19
--
-- PRODUCTION SAFETY:
-- - All new columns have default values
-- - Existing user_profiles records will get default values automatically
-- - No breaking changes to existing API
--
-- ROLLBACK PLAN (if needed):
-- This migration adds columns only, no data changes. Rollback would be:
-- - ALTER TABLE user_profiles DROP COLUMN total_favorites;
-- - ALTER TABLE user_profiles DROP COLUMN passport_completion;
-- - ALTER TABLE user_profiles DROP COLUMN follower_count;
-- - ALTER TABLE user_profiles DROP COLUMN following_count;
-- - ALTER TABLE user_profiles DROP COLUMN privacy_settings;
-- - DROP INDEX IF EXISTS idx_user_profiles_reputation;
-- - DROP INDEX IF EXISTS idx_user_profiles_checkins;
--
-- This migration adds:
-- 1. Additional stat columns (total_favorites, passport_completion, follower_count, following_count)
-- 2. Privacy settings JSON column
-- 3. Performance indexes

-- Add missing stat columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN total_favorites INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN passport_completion REAL DEFAULT 0.0; -- Percentage (0-100)

-- Add social stats (for future Phase 2D features)
ALTER TABLE user_profiles ADD COLUMN follower_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN following_count INTEGER DEFAULT 0;

-- Add privacy settings (JSON column for flexible privacy options)
ALTER TABLE user_profiles ADD COLUMN privacy_settings TEXT DEFAULT '{"isPublic":true,"showActivity":true,"showFollowers":true}';

-- Create performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_reputation ON user_profiles(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_checkins ON user_profiles(total_checkins DESC);