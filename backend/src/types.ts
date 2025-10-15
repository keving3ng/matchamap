// Cloudflare Workers environment bindings
export interface Env {
  DB: D1Database;
  PHOTOS_BUCKET: R2Bucket;
  ENVIRONMENT: string;
  ALLOWED_ORIGINS: string;
  GOOGLE_PLACES_API_KEY: string;
  JWT_SECRET: string;
  PHOTOS_BASE_URL?: string; // Optional: Base URL for photo serving (e.g., https://photos.matchamap.app)
  COOKIE_DOMAIN?: string; // Optional: Cookie domain for authentication (e.g., .matchamap.club for subdomain sharing)
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}
