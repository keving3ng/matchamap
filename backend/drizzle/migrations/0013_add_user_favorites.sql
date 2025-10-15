-- Migration: Add user favorites system
-- Allows users to save cafes to "Want to Visit" lists

CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    
    -- Optional private notes
    notes TEXT,
    
    -- Priority/ordering
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    UNIQUE(user_id, cafe_id)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_cafe ON user_favorites(cafe_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_sort ON user_favorites(user_id, sort_order);