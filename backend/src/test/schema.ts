// Auto-generated database schema for testing
// DO NOT EDIT MANUALLY - Generated from drizzle/migrations/*.sql

export const TEST_SCHEMA = `
CREATE TABLE cafes (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	name text NOT NULL,
	slug text NOT NULL,
	link text NOT NULL,
	latitude real NOT NULL,
	longitude real NOT NULL,
	city text NOT NULL,
	ambiance_score real,
	charge_for_alt_milk real,
	quick_note text NOT NULL,
	review text,
	source text,
	hours text,
	instagram text,
	instagram_post_link text,
	tiktok_post_link text,
	images text,
	created_at text DEFAULT CURRENT_TIMESTAMP,
	updated_at text DEFAULT CURRENT_TIMESTAMP,
	deleted_at text,
	address text,
	user_rating_avg real,
	user_rating_count integer DEFAULT 0
);

CREATE UNIQUE INDEX cafes_slug_unique ON cafes (slug);
CREATE INDEX cafes_city_idx ON cafes (city);
CREATE INDEX cafes_deleted_idx ON cafes (deleted_at);
CREATE INDEX cafes_slug_idx ON cafes (slug);

CREATE TABLE drinks (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	cafe_id integer NOT NULL,
	name text,
	score real NOT NULL,
	price_amount integer,
	price_currency text,
	grams_used integer,
	is_default integer DEFAULT false,
	notes text,
	created_at text DEFAULT CURRENT_TIMESTAMP,
	updated_at text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX drinks_cafe_idx ON drinks (cafe_id);
CREATE INDEX drinks_default_idx ON drinks (is_default);

CREATE TABLE events (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	title text NOT NULL,
	date text NOT NULL,
	time text NOT NULL,
	venue text NOT NULL,
	location text NOT NULL,
	cafe_id integer,
	description text NOT NULL,
	link text,
	price text,
	featured integer DEFAULT false,
	published integer DEFAULT true,
	created_at text DEFAULT CURRENT_TIMESTAMP,
	updated_at text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON UPDATE no action ON DELETE no action
);

CREATE INDEX events_date_idx ON events (date);
CREATE INDEX events_featured_idx ON events (featured);

CREATE TABLE sessions (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	user_id integer NOT NULL,
	token text NOT NULL,
	expires_at text NOT NULL,
	created_at text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX sessions_token_unique ON sessions (token);
CREATE INDEX sessions_token_idx ON sessions (token);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

CREATE TABLE users (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	email text NOT NULL,
	username text NOT NULL,
	password_hash text NOT NULL,
	role text DEFAULT 'user' NOT NULL,
	created_at text DEFAULT CURRENT_TIMESTAMP,
	updated_at text DEFAULT CURRENT_TIMESTAMP,
	last_active_at text,
	is_email_verified integer DEFAULT false
);

CREATE UNIQUE INDEX users_email_unique ON users (email);
CREATE UNIQUE INDEX users_username_unique ON users (username);
CREATE INDEX users_email_idx ON users (email);
CREATE INDEX users_username_idx ON users (username);

CREATE TABLE waitlist (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	email text NOT NULL,
	referral_source text,
	converted integer DEFAULT false,
	user_id integer,
	created_at text DEFAULT CURRENT_TIMESTAMP,
	converted_at text,
	is_flagged_fraud integer DEFAULT 0,
	fraud_score real DEFAULT 0.0,
	fraud_reason text,
	signup_ip text,
	FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX waitlist_email_unique ON waitlist (email);
CREATE INDEX waitlist_email_idx ON waitlist (email);
CREATE INDEX waitlist_converted_idx ON waitlist (converted);
CREATE INDEX waitlist_fraud_idx ON waitlist(is_flagged_fraud);

CREATE TABLE user_profiles (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	user_id integer NOT NULL,
	display_name text,
	bio text,
	avatar_url text,
	location text,
	instagram text,
	tiktok text,
	website text,
	preferences text,
	is_public integer DEFAULT true,
	show_activity integer DEFAULT true,
	total_reviews integer DEFAULT 0,
	total_checkins integer DEFAULT 0,
	total_photos integer DEFAULT 0,
	reputation_score integer DEFAULT 0,
	total_favorites integer DEFAULT 0,
	passport_completion real DEFAULT 0.0,
	follower_count integer DEFAULT 0,
	following_count integer DEFAULT 0,
	privacy_settings text DEFAULT '{"isPublic":true,"showActivity":true,"showFollowers":true}',
	created_at text DEFAULT CURRENT_TIMESTAMP,
	updated_at text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX user_profiles_user_id_unique ON user_profiles (user_id);
CREATE INDEX user_profiles_user_id_idx ON user_profiles (user_id);
CREATE INDEX user_profiles_display_name_idx ON user_profiles (display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_reputation ON user_profiles(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_checkins ON user_profiles(total_checkins DESC);

CREATE TABLE admin_audit_log (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	admin_user_id integer NOT NULL,
	admin_username text NOT NULL,
	action text NOT NULL,
	resource_type text NOT NULL,
	resource_id integer NOT NULL,
	changes_summary text,
	before_state text,
	after_state text,
	ip_address text,
	user_agent text,
	created_at text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (admin_user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX audit_admin_user_idx ON admin_audit_log (admin_user_id);
CREATE INDEX audit_action_idx ON admin_audit_log (action);
CREATE INDEX audit_resource_idx ON admin_audit_log (resource_type,resource_id);
CREATE INDEX audit_created_at_idx ON admin_audit_log (created_at);

CREATE TABLE cafe_stats (
	cafe_id integer PRIMARY KEY NOT NULL,
	views integer DEFAULT 0 NOT NULL,
	directions_clicks integer DEFAULT 0 NOT NULL,
	anonymous_passport_marks integer DEFAULT 0 NOT NULL,
	instagram_clicks integer DEFAULT 0 NOT NULL,
	tiktok_clicks integer DEFAULT 0 NOT NULL,
	updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX cafe_stats_views_idx ON cafe_stats (views DESC);
CREATE INDEX cafe_stats_updated_idx ON cafe_stats (updated_at);

CREATE TABLE event_stats (
	event_id integer PRIMARY KEY NOT NULL,
	clicks integer DEFAULT 0 NOT NULL,
	updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (event_id) REFERENCES events(id) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE user_activity_stats (
	user_id integer PRIMARY KEY NOT NULL,
	total_cafe_views integer DEFAULT 0 NOT NULL,
	total_checkins integer DEFAULT 0 NOT NULL,
	total_directions_clicks integer DEFAULT 0 NOT NULL,
	last_active_at text,
	updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX user_activity_last_active_idx ON user_activity_stats (last_active_at);
CREATE INDEX user_activity_checkins_idx ON user_activity_stats (total_checkins);
`;
