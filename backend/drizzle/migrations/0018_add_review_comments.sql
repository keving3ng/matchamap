-- Migration: Add review comments system
-- Supports nested replies (1 level deep), likes/upvotes, and moderation

CREATE TABLE review_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL REFERENCES user_reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES review_comments(id) ON DELETE CASCADE,
    
    -- Comment content
    content TEXT NOT NULL,
    
    -- Engagement metrics
    like_count INTEGER DEFAULT 0 NOT NULL,
    
    -- Moderation
    moderation_status TEXT DEFAULT 'approved' NOT NULL CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    moderated_at TEXT,
    moderated_by INTEGER REFERENCES users(id),
    moderation_notes TEXT,
    
    -- Timestamps
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Create indexes for performance
CREATE INDEX review_comments_review_id_idx ON review_comments(review_id);
CREATE INDEX review_comments_user_id_idx ON review_comments(user_id);
CREATE INDEX review_comments_parent_comment_id_idx ON review_comments(parent_comment_id);
CREATE INDEX review_comments_moderation_status_idx ON review_comments(moderation_status);
CREATE INDEX review_comments_created_at_idx ON review_comments(created_at);

-- Table for tracking comment likes (to prevent duplicate likes)
CREATE TABLE review_comment_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER NOT NULL REFERENCES review_comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    
    -- Ensure unique constraint: one like per user per comment
    UNIQUE(comment_id, user_id)
);

-- Create indexes for comment likes
CREATE INDEX review_comment_likes_comment_id_idx ON review_comment_likes(comment_id);
CREATE INDEX review_comment_likes_user_id_idx ON review_comment_likes(user_id);