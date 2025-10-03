-- Make drink fields optional for flexible data entry
-- Migration: 0005_make_drinks_fields_optional

-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- Step 1: Create new drinks table with optional fields
CREATE TABLE drinks_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  name TEXT, -- Optional - defaults to "Iced Matcha Latte"
  score REAL NOT NULL, -- Required
  price_amount INTEGER, -- Optional
  price_currency TEXT, -- Optional
  grams_used INTEGER, -- Optional
  is_default INTEGER DEFAULT 0, -- Boolean
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy data from old table, setting default name where null
INSERT INTO drinks_new (
  id, cafe_id, name, score, price_amount, price_currency,
  grams_used, is_default, notes, created_at, updated_at
)
SELECT
  id, cafe_id,
  COALESCE(name, 'Iced Matcha Latte') as name, -- Default name if null
  score, price_amount, price_currency,
  grams_used, is_default, notes, created_at, updated_at
FROM drinks;

-- Step 3: Drop old table
DROP TABLE drinks;

-- Step 4: Rename new table
ALTER TABLE drinks_new RENAME TO drinks;

-- Step 5: Recreate indexes
CREATE INDEX drinks_cafe_idx ON drinks(cafe_id);
CREATE INDEX drinks_default_idx ON drinks(is_default);
