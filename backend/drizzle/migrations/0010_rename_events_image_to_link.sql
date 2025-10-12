-- Migration: Rename events.image to events.link
-- Purpose: Better semantic naming - field stores Instagram handle/link, not image URL
--          This also prevents future conflicts with the planned CTA link feature
-- Date: 2025-10-11

-- Rename the column from 'image' to 'link'
ALTER TABLE events RENAME COLUMN image TO link;
