-- Migration: Add user lists system (Phase 2E)
-- Allows users to create custom cafe lists (e.g., "Weekend Spots", "Study Cafes")

CREATE TABLE IF NOT EXISTS user_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_list_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
    cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(list_id, cafe_id)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_user_lists_user ON user_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lists_public ON user_lists(is_public);
CREATE INDEX IF NOT EXISTS idx_user_list_items_list ON user_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_user_list_items_cafe ON user_list_items(cafe_id);
