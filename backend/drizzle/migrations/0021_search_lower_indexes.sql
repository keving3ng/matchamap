-- Speed up cafe list search that uses LOWER(column) LIKE ... (see routes/cafes.ts)
CREATE INDEX IF NOT EXISTS idx_cafes_search_name_lower ON cafes(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_cafes_search_quick_note_lower ON cafes(LOWER(quick_note));
CREATE INDEX IF NOT EXISTS idx_cafes_search_address_lower ON cafes(LOWER(address));

-- User review text search
CREATE INDEX IF NOT EXISTS idx_user_reviews_search_content_lower ON user_reviews(LOWER(content));
CREATE INDEX IF NOT EXISTS idx_user_reviews_search_tags_lower ON user_reviews(LOWER(tags));
