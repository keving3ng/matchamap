import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// Neighborhoods table
export const neighborhoods = sqliteTable('neighborhoods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  city: text('city').notNull(),
  bounds: text('bounds'), // JSON: geographic boundaries
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  nameCity: index('neighborhoods_name_city_idx').on(table.name, table.city),
}));

// Cafes table
export const cafes = sqliteTable('cafes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),

  // Location
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(), // toronto, montreal, tokyo
  neighborhoodId: integer('neighborhood_id').references(() => neighborhoods.id),

  // Ratings
  score: real('score').notNull(),
  valueScore: real('value_score'),
  ambianceScore: real('ambiance_score'),
  otherDrinksScore: real('other_drinks_score'),

  // Pricing
  priceRange: text('price_range'), // $, $$, $$$
  chargeForAltMilk: integer('charge_for_alt_milk', { mode: 'boolean' }).default(false),

  // Content
  quickNote: text('quick_note').notNull(),
  review: text('review'),
  comments: text('comments'),
  menuHighlights: text('menu_highlights'),

  // Contact
  hours: text('hours'), // JSON or text format
  instagram: text('instagram'),
  tiktok: text('tiktok'),
  googleMapsUrl: text('google_maps_url'),

  // Display
  emoji: text('emoji').notNull(),
  color: text('color').notNull(),

  // Metadata
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text('deleted_at'),
}, (table) => ({
  cityIdx: index('cafes_city_idx').on(table.city),
  neighborhoodIdx: index('cafes_neighborhood_idx').on(table.neighborhoodId),
  deletedIdx: index('cafes_deleted_idx').on(table.deletedAt),
  slugIdx: index('cafes_slug_idx').on(table.slug),
}));

// Drinks table
export const drinks = sqliteTable('drinks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cafeId: integer('cafe_id').notNull().references(() => cafes.id, { onDelete: 'cascade' }),

  type: text('type').notNull(),
  name: text('name').notNull(),
  priceAmount: integer('price_amount').notNull(),
  priceCurrency: text('price_currency').notNull().default('CAD'), // CAD, USD, JPY
  gramsUsed: integer('grams_used'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  notes: text('notes'),

  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  cafeIdx: index('drinks_cafe_idx').on(table.cafeId),
  defaultIdx: index('drinks_default_idx').on(table.isDefault),
}));

// Feed items table
export const feedItems = sqliteTable('feed_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // new_location, score_update, announcement, menu_update, closure

  title: text('title').notNull(),
  preview: text('preview').notNull(),
  content: text('content'),

  cafeId: integer('cafe_id').references(() => cafes.id),
  cafeName: text('cafe_name'),

  score: real('score'),
  previousScore: real('previous_score'),
  neighborhood: text('neighborhood'),

  image: text('image'),
  author: text('author'),
  tags: text('tags'), // JSON array

  published: integer('published', { mode: 'boolean' }).default(false),
  date: text('date').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  publishedDateIdx: index('feed_published_date_idx').on(table.published, table.date),
  typeIdx: index('feed_type_idx').on(table.type),
}));

// Events table
export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  title: text('title').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),

  venue: text('venue').notNull(),
  location: text('location').notNull(),
  cafeId: integer('cafe_id').references(() => cafes.id),

  description: text('description').notNull(),
  image: text('image'),
  price: text('price'),

  featured: integer('featured', { mode: 'boolean' }).default(false),
  published: integer('published', { mode: 'boolean' }).default(true),

  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  dateIdx: index('events_date_idx').on(table.date),
  featuredIdx: index('events_featured_idx').on(table.featured),
}));

// Type exports for use in the application
export type Cafe = typeof cafes.$inferSelect;
export type NewCafe = typeof cafes.$inferInsert;
export type Drink = typeof drinks.$inferSelect;
export type NewDrink = typeof drinks.$inferInsert;
export type FeedItem = typeof feedItems.$inferSelect;
export type NewFeedItem = typeof feedItems.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Neighborhood = typeof neighborhoods.$inferSelect;
export type NewNeighborhood = typeof neighborhoods.$inferInsert;
