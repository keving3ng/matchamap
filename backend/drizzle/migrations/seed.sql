-- Seed data for MatchaMap database
-- Run with: wrangler d1 execute matchamap-db --local --file=./drizzle/migrations/seed.sql

-- Insert neighborhoods
INSERT INTO neighborhoods (name, city) VALUES
('Downtown', 'toronto'),
('Annex', 'toronto'),
('Queen West', 'toronto'),
('Leslieville', 'toronto');

-- Insert sample cafes
INSERT INTO cafes (
  name, slug, lat, lng, address, city, neighborhood_id,
  score, value_score, ambiance_score, other_drinks_score,
  price_range, charge_for_alt_milk, quick_note, review,
  hours, instagram, emoji, color
) VALUES
(
  'Matcha Haven',
  'matcha-haven',
  43.6532,
  -79.3832,
  '123 Queen St W, Toronto, ON',
  'toronto',
  3,
  8.5,
  8.0,
  9.0,
  7.5,
  '$$',
  0,
  'Cozy spot with exceptional ceremonial grade matcha',
  'One of the best matcha experiences in Toronto. They source directly from Uji and you can taste the difference.',
  '{"mon":"8-6","tue":"8-6","wed":"8-6","thu":"8-6","fri":"8-6","sat":"9-5","sun":"closed"}',
  '@matchahaven',
  '🍵',
  '#7cb342'
),
(
  'Green Leaf Cafe',
  'green-leaf-cafe',
  43.6590,
  -79.3977,
  '456 Bloor St W, Toronto, ON',
  'toronto',
  2,
  7.8,
  8.5,
  7.0,
  8.0,
  '$',
  1,
  'Budget-friendly with solid quality',
  'Great for students and daily matcha drinkers. Not the fanciest, but consistent quality.',
  '{"mon":"7-7","tue":"7-7","wed":"7-7","thu":"7-7","fri":"7-7","sat":"8-6","sun":"9-5"}',
  '@greenleafto',
  '🌿',
  '#8bc34a'
);

-- Insert sample drinks
INSERT INTO drinks (cafe_id, type, name, price_amount, price_currency, grams_used, is_default, notes) VALUES
(1, 'matcha_latte', 'Ceremonial Matcha Latte', 650, 'CAD', 3, 1, 'Made with Uji ceremonial grade'),
(1, 'matcha_latte', 'Iced Matcha Latte', 700, 'CAD', 3, 0, NULL),
(2, 'matcha_latte', 'House Matcha Latte', 550, 'CAD', 2, 1, NULL);

-- Insert sample feed item
INSERT INTO feed_items (
  type, title, preview, content, cafe_id, cafe_name, neighborhood,
  score, published, date, author, tags
) VALUES (
  'new_location',
  'New Matcha Spot: Matcha Haven Opens in Queen West',
  'Exciting news for matcha lovers! A new spot specializing in ceremonial grade matcha just opened.',
  'Full review coming soon. Initial impressions are very positive - they''re sourcing directly from Uji.',
  1,
  'Matcha Haven',
  'Queen West',
  8.5,
  1,
  datetime('now'),
  'MatchaMap Team',
  '["new","downtown"]'
);

-- Insert sample event
INSERT INTO events (
  title, date, time, venue, location, cafe_id,
  description, price, featured, published
) VALUES (
  'Matcha Tasting Workshop',
  '2025-10-15',
  '2:00 PM',
  'Matcha Haven',
  '123 Queen St W',
  1,
  'Learn about different grades of matcha and proper whisking technique. Limited to 12 participants.',
  '$45',
  1,
  1
);
