import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// Cafes table
export const cafes = sqliteTable('cafes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),

  // Location
  link: text('link').notNull(), // Google Maps link
  address: text('address'),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  city: text('city').notNull(), // toronto, montreal, tokyo (for filtering/navigation only)

  // Ratings
  ambianceScore: real('ambiance_score'), // Cafe ambiance rating (0-10)

  // Pricing
  chargeForAltMilk: real('charge_for_alt_milk'), // Price charged for alt milk (null if free)

  // Content
  quickNote: text('quick_note').notNull(),
  review: text('review'),
  source: text('source'), // Source of cafe info (e.g., "Google", "Instagram", "Friend recommendation")

  // Contact/Social
  hours: text('hours'), // JSON object from Google Maps API
  instagram: text('instagram'),
  instagramPostLink: text('instagram_post_link'),
  tiktokPostLink: text('tiktok_post_link'),

  // Media
  images: text('images'), // Link/URL to images

  // Metadata
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text('deleted_at'),
}, (table) => ({
  cityIdx: index('cafes_city_idx').on(table.city),
  deletedIdx: index('cafes_deleted_idx').on(table.deletedAt),
  slugIdx: index('cafes_slug_idx').on(table.slug),
}));

// Drinks table
export const drinks = sqliteTable('drinks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cafeId: integer('cafe_id').notNull().references(() => cafes.id, { onDelete: 'cascade' }),

  name: text('name'), // Optional - defaults to "Iced Matcha Latte" if not provided
  score: real('score').notNull(), // Individual drink score (0-10) - required
  priceAmount: integer('price_amount'), // Optional - price in cents
  priceCurrency: text('price_currency'), // Optional - CAD, USD, JPY, etc.
  gramsUsed: integer('grams_used'), // Optional - grams of matcha used
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

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  usernameIdx: index('users_username_idx').on(table.username),
}));

// Sessions table
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  tokenIdx: index('sessions_token_idx').on(table.token),
  userIdx: index('sessions_user_idx').on(table.userId),
  expiresIdx: index('sessions_expires_idx').on(table.expiresAt),
}));

// Waitlist table
export const waitlist = sqliteTable('waitlist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  referralSource: text('referral_source'), // Optional - how they found us
  converted: integer('converted', { mode: 'boolean' }).default(false), // Track if converted to user
  userId: integer('user_id').references(() => users.id), // Link to user if converted
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  convertedAt: text('converted_at'),
}, (table) => ({
  emailIdx: index('waitlist_email_idx').on(table.email),
  convertedIdx: index('waitlist_converted_idx').on(table.converted),
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
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;
