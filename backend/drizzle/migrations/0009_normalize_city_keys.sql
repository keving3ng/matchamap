-- Migration: Normalize city keys to match CITIES constant
-- Purpose: Ensure database city values exactly match frontend CityKey type
-- Date: 2025-10-10

-- Normalize "new york city" to "new york"
UPDATE cafes
SET city = 'new york'
WHERE LOWER(city) = 'new york city';

-- Ensure all other cities are lowercase (idempotent)
UPDATE cafes
SET city = LOWER(city)
WHERE city != LOWER(city);

-- Verify results (optional - for logging)
-- SELECT city, COUNT(*) as count FROM cafes WHERE deleted_at IS NULL GROUP BY city ORDER BY count DESC;
