-- Social/UGC tables removed per simplified product scope (docs/SIMPLIFICATION_PLAN.md).
-- Drop dependent tables first (SQLite FK order).
DROP TABLE IF EXISTS review_comment_likes;
DROP TABLE IF EXISTS review_comments;
DROP TABLE IF EXISTS review_helpful;
DROP TABLE IF EXISTS review_photos;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_list_items;
DROP TABLE IF EXISTS user_lists;
DROP TABLE IF EXISTS user_follows;
DROP TABLE IF EXISTS cafe_suggestions;
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS user_favorites;
DROP TABLE IF EXISTS user_checkins;
DROP TABLE IF EXISTS user_reviews;
