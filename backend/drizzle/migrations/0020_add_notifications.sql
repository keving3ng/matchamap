-- Migration: Add notifications system (Phase 2F)
-- Provides in-app notifications for social interactions

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('follower', 'comment', 'helpful', 'badge', 'comment_like')),
    actor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    resource_type TEXT CHECK(resource_type IN ('review', 'comment', 'badge', 'user')),
    resource_id INTEGER,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, is_read);
