import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index, unique } from 'drizzle-orm/sqlite-core';

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

  // User-generated ratings (aggregated)
  userRatingAvg: real('user_rating_avg'), // Average user rating (0-10)
  userRatingCount: integer('user_rating_count').default(0), // Number of user reviews

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
  link: text('link'), // Instagram handle or post link
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
  lastActiveAt: text('last_active_at'),
  isEmailVerified: integer('is_email_verified', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  usernameIdx: index('users_username_idx').on(table.username),
}));

// User profiles table
export const userProfiles = sqliteTable('user_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),

  // Profile Info
  displayName: text('display_name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  location: text('location'),

  // Social Links
  instagram: text('instagram'),
  tiktok: text('tiktok'),
  website: text('website'),

  // Preferences (JSON)
  preferences: text('preferences'), // {"favoriteStyle": "iced", "dietaryRestrictions": ["vegan"]}

  // Privacy
  isPublic: integer('is_public', { mode: 'boolean' }).default(true),
  showActivity: integer('show_activity', { mode: 'boolean' }).default(true),

  // Stats (denormalized for performance)
  totalReviews: integer('total_reviews').default(0),
  totalCheckins: integer('total_checkins').default(0),
  totalPhotos: integer('total_photos').default(0),
  totalFavorites: integer('total_favorites').default(0),
  passportCompletion: real('passport_completion').default(0.0), // Percentage (0-100)
  reputationScore: integer('reputation_score').default(0),

  // Social stats (Phase 2D)
  followerCount: integer('follower_count').default(0),
  followingCount: integer('following_count').default(0),

  // Privacy settings (JSON)
  privacySettings: text('privacy_settings').default('{"isPublic":true,"showActivity":true,"showFollowers":true}'),

  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: index('user_profiles_user_id_idx').on(table.userId),
  displayNameIdx: index('user_profiles_display_name_idx').on(table.displayName),
  reputationIdx: index('idx_user_profiles_reputation').on(table.reputationScore),
  checkinsIdx: index('idx_user_profiles_checkins').on(table.totalCheckins),
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

// User check-ins / passport tracking
export const userCheckins = sqliteTable('user_checkins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cafeId: integer('cafe_id').notNull().references(() => cafes.id, { onDelete: 'cascade' }),
  visitedAt: text('visited_at').default(sql`CURRENT_TIMESTAMP`),
  notes: text('notes'),
}, (table) => ({
  userIdIdx: index('user_checkins_user_id_idx').on(table.userId),
  cafeIdIdx: index('user_checkins_cafe_id_idx').on(table.cafeId),
  visitedAtIdx: index('user_checkins_visited_at_idx').on(table.visitedAt),
  uniqueUserCafe: unique().on(table.userId, table.cafeId),
}));

// Review photos table (user-generated content)
export const reviewPhotos = sqliteTable('review_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cafeId: integer('cafe_id').notNull().references(() => cafes.id, { onDelete: 'cascade' }),
  reviewId: integer('review_id').references(() => userReviews.id, { onDelete: 'cascade' }), // Nullable - photos can exist before review

  // R2 Storage keys and URLs
  imageKey: text('image_key').notNull().unique(), // R2 object key (unique identifier)
  imageUrl: text('image_url').notNull(), // Public URL for full-size image
  thumbnailKey: text('thumbnail_key').notNull(), // R2 object key for thumbnail
  thumbnailUrl: text('thumbnail_url'), // Public URL for thumbnail (200px)

  // Photo metadata
  caption: text('caption'),
  width: integer('width'), // Original image width in pixels
  height: integer('height'), // Original image height in pixels
  fileSize: integer('file_size'), // File size in bytes
  mimeType: text('mime_type').notNull(), // image/jpeg, image/png, etc.

  // Moderation
  moderationStatus: text('moderation_status', {
    enum: ['pending', 'approved', 'rejected']
  }).notNull().default('pending'),
  moderatedAt: text('moderated_at'),
  moderatedBy: integer('moderated_by').references(() => users.id),
  moderationNotes: text('moderation_notes'),

  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: index('review_photos_user_idx').on(table.userId),
  cafeIdx: index('review_photos_cafe_idx').on(table.cafeId),
  reviewIdx: index('review_photos_review_idx').on(table.reviewId),
  imageKeyIdx: index('review_photos_image_key_idx').on(table.imageKey),
  moderationStatusIdx: index('review_photos_moderation_status_idx').on(table.moderationStatus),
  createdAtIdx: index('review_photos_created_at_idx').on(table.createdAt),
}));

// Admin audit log table
export const adminAuditLog = sqliteTable('admin_audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Who performed the action
  adminUserId: integer('admin_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  adminUsername: text('admin_username').notNull(), // Denormalized for convenience
  
  // What action was performed
  action: text('action', { enum: ['CREATE', 'UPDATE', 'DELETE'] }).notNull(),
  resourceType: text('resource_type', { 
    enum: ['cafe', 'drink', 'event', 'feed_item', 'user', 'user_role'] 
  }).notNull(),
  resourceId: integer('resource_id').notNull(), // ID of affected resource
  
  // Change details
  changesSummary: text('changes_summary'), // Human-readable summary (e.g., "Updated cafe name from 'Old' to 'New'")
  beforeState: text('before_state'), // JSON snapshot of resource before change (for UPDATE/DELETE)
  afterState: text('after_state'), // JSON snapshot of resource after change (for CREATE/UPDATE)
  
  // Request metadata
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  // Timestamp
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  adminUserIdx: index('audit_admin_user_idx').on(table.adminUserId),
  actionIdx: index('audit_action_idx').on(table.action),
  resourceIdx: index('audit_resource_idx').on(table.resourceType, table.resourceId),
  createdAtIdx: index('audit_created_at_idx').on(table.createdAt),
}));

// User reviews table
export const userReviews = sqliteTable('user_reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cafeId: integer('cafe_id').notNull().references(() => cafes.id, { onDelete: 'cascade' }),

  // Ratings (0-10 scale to match expert system)
  overallRating: real('overall_rating').notNull(),
  matchaQualityRating: real('matcha_quality_rating'),
  ambianceRating: real('ambiance_rating'),
  serviceRating: real('service_rating'),
  valueRating: real('value_rating'),

  // Review content
  title: text('title'),
  content: text('content').notNull(),
  tags: text('tags'), // JSON array of strings

  // Visit information
  visitDate: text('visit_date'),

  // Moderation
  moderationStatus: text('moderation_status', {
    enum: ['pending', 'approved', 'rejected', 'flagged']
  }).notNull().default('approved'),
  
  // Settings
  isPublic: integer('is_public', { mode: 'boolean' }).default(true),

  // Engagement metrics
  helpfulCount: integer('helpful_count').default(0),

  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_reviews_user_id_idx').on(table.userId),
  cafeIdIdx: index('user_reviews_cafe_id_idx').on(table.cafeId),
  moderationIdx: index('user_reviews_moderation_idx').on(table.moderationStatus),
  helpfulIdx: index('user_reviews_helpful_idx').on(table.helpfulCount),
  uniqueUserCafe: unique().on(table.userId, table.cafeId),
}));

// Review helpful votes table
export const reviewHelpful = sqliteTable('review_helpful', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reviewId: integer('review_id').notNull().references(() => userReviews.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  reviewIdIdx: index('review_helpful_review_id_idx').on(table.reviewId),
  userIdIdx: index('review_helpful_user_id_idx').on(table.userId),
  uniqueReviewUser: unique().on(table.reviewId, table.userId),
}));

// User favorites table (Phase 2A - Foundation)
export const userFavorites = sqliteTable('user_favorites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cafeId: integer('cafe_id').notNull().references(() => cafes.id, { onDelete: 'cascade' }),
  
  // Optional private notes
  notes: text('notes'),
  
  // Priority/ordering
  sortOrder: integer('sort_order').default(0),
  
  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_favorites_user_idx').on(table.userId),
  cafeIdIdx: index('user_favorites_cafe_idx').on(table.cafeId),
  sortOrderIdx: index('user_favorites_sort_idx').on(table.userId, table.sortOrder),
  uniqueUserCafe: unique().on(table.userId, table.cafeId),
}));

// User badges table (Phase 2C - Badges & Achievements)
export const userBadges = sqliteTable('user_badges', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Badge identification
  badgeKey: text('badge_key').notNull(), // e.g., 'passport_5', 'reviews_10', 'early_adopter'
  badgeCategory: text('badge_category').notNull(), // e.g., 'passport', 'reviews', 'photos', 'special'

  // Badge progress tracking
  earnedAt: text('earned_at').default(sql`CURRENT_TIMESTAMP`),
  progressValue: integer('progress_value'), // Optional: track progress that earned badge (e.g., 25 cafes)

  // Metadata
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_badges_user_id_idx').on(table.userId),
  categoryIdx: index('user_badges_category_idx').on(table.badgeCategory),
  earnedAtIdx: index('user_badges_earned_at_idx').on(table.earnedAt),
  keyIdx: index('user_badges_key_idx').on(table.badgeKey),
  userCategoryIdx: index('user_badges_user_category_idx').on(table.userId, table.badgeCategory),
  uniqueUserBadge: unique().on(table.userId, table.badgeKey),
}));

// User follows table (Phase 2D - Social Features)
export const userFollows = sqliteTable('user_follows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  followerId: integer('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: integer('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`datetime('now')`),
}, (table) => ({
  followerIdx: index('user_follows_follower_idx').on(table.followerId),
  followingIdx: index('user_follows_following_idx').on(table.followingId),
  createdAtIdx: index('user_follows_created_at_idx').on(table.createdAt),
  relationshipIdx: index('user_follows_relationship_idx').on(table.followerId, table.followingId),
  uniqueFollow: unique().on(table.followerId, table.followingId),
}));

// Type exports for use in the application
export type Cafe = typeof cafes.$inferSelect;
export type NewCafe = typeof cafes.$inferInsert;
export type Drink = typeof drinks.$inferSelect;
export type NewDrink = typeof drinks.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;
export type UserCheckin = typeof userCheckins.$inferSelect;
export type NewUserCheckin = typeof userCheckins.$inferInsert;
export type ReviewPhoto = typeof reviewPhotos.$inferSelect;
export type NewReviewPhoto = typeof reviewPhotos.$inferInsert;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type NewAdminAuditLog = typeof adminAuditLog.$inferInsert;
export type UserReview = typeof userReviews.$inferSelect;
export type NewUserReview = typeof userReviews.$inferInsert;
export type ReviewHelpful = typeof reviewHelpful.$inferSelect;
export type NewReviewHelpful = typeof reviewHelpful.$inferInsert;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
export type UserFollow = typeof userFollows.$inferSelect;
export type NewUserFollow = typeof userFollows.$inferInsert;
