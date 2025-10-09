/**
 * Backend Constants
 * 
 * Centralized constants to replace magic numbers throughout the codebase.
 * Each constant is documented with its purpose and usage context.
 */

/**
 * Authentication and Security Constants
 */
export const AUTH_CONSTANTS = {
  /** Minimum password length for user registration and validation */
  PASSWORD_MIN_LENGTH: 8,
  
  /** Access token expiry duration (1 hour) */
  ACCESS_TOKEN_EXPIRY: 3600, // 1 hour in seconds
  
  /** Refresh token expiry duration (7 days) */
  REFRESH_TOKEN_EXPIRY: 604800, // 7 days in seconds
  
  /** Session expiry duration in milliseconds (7 days) */
  SESSION_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  /** Minimum username length */
  USERNAME_MIN_LENGTH: 3,
  
  /** Maximum username length */
  USERNAME_MAX_LENGTH: 20,
  
  /** Minimum display name length */
  DISPLAY_NAME_MIN_LENGTH: 1,
  
  /** Maximum display name length */
  DISPLAY_NAME_MAX_LENGTH: 50,
  
  /** Maximum bio length */
  BIO_MAX_LENGTH: 500,
} as const;

/**
 * Rate Limiting Constants
 */
export const RATE_LIMIT_CONSTANTS = {
  /** Standard rate limit window in milliseconds (1 minute) */
  WINDOW_MS: 60000, // 1 minute
  
  /** Cleanup interval for old rate limit entries in milliseconds */
  CLEANUP_INTERVAL_MS: 60000, // 1 minute
  
  /** Maximum requests per minute for authentication endpoints */
  AUTH_MAX_REQUESTS: 200,
  
  /** Maximum requests per minute for write operations */
  WRITE_MAX_REQUESTS: 100,
  
  /** Maximum requests per minute for public read endpoints */
  PUBLIC_MAX_REQUESTS: 500,
  
  /** Maximum requests per minute for strict/sensitive operations */
  STRICT_MAX_REQUESTS: 10,
  
  /** User agent string slice length for rate limiting keys */
  USER_AGENT_SLICE_LENGTH: 50,
} as const;

/**
 * Validation Constants
 */
export const VALIDATION_CONSTANTS = {
  /** Minimum score value for ratings */
  SCORE_MIN: 0,
  
  /** Maximum score value for ratings */
  SCORE_MAX: 10,
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  /** Success responses */
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  
  /** Client error responses */
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  
  /** Server error responses */
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
  
  /** Redirection responses */
  MOVED_PERMANENTLY: 301,
} as const;

/**
 * Pagination Constants
 */
export const PAGINATION_CONSTANTS = {
  /** Default limit for admin events */
  ADMIN_EVENTS_DEFAULT_LIMIT: 100,
  
  /** Maximum limit for admin events */
  ADMIN_EVENTS_MAX_LIMIT: 200,
  
  /** Default limit for admin feed */
  ADMIN_FEED_DEFAULT_LIMIT: 50,
  
  /** Maximum limit for admin feed */
  ADMIN_FEED_MAX_LIMIT: 200,
  
  /** Default limit for public events */
  EVENTS_DEFAULT_LIMIT: 50,
  
  /** Maximum limit for public events */
  EVENTS_MAX_LIMIT: 100,
  
  /** Default limit for public feed */
  FEED_DEFAULT_LIMIT: 20,
  
  /** Maximum limit for public feed */
  FEED_MAX_LIMIT: 100,
  
  /** Default limit for cafes */
  CAFES_DEFAULT_LIMIT: 500,
  
  /** Maximum limit for cafes */
  CAFES_MAX_LIMIT: 500,
  
  /** Default offset for pagination */
  DEFAULT_OFFSET: 0,
} as const;

/**
 * Cache Constants
 */
export const CACHE_CONSTANTS = {
  /** Cache max-age for public data (5 minutes) */
  PUBLIC_CACHE_MAX_AGE: 300,
  
  /** Cache control for admin/sensitive data */
  NO_STORE: 'no-store',
  
  /** Cache control for public data */
  PUBLIC_CACHE: 'public',
} as const;

/**
 * Security Constants
 */
export const SECURITY_CONSTANTS = {
  /** HSTS max age (1 year in seconds) */
  HSTS_MAX_AGE: 31536000, // 1 year
} as const;

/**
 * Application Constants
 */
export const APP_CONSTANTS = {
  /** Application version */
  VERSION: '1.0.0',
} as const;

/**
 * JWT Token Expiry Strings
 * Used for JWT signing - these are string representations for the jose library
 */
export const JWT_EXPIRY = {
  /** Access token expiry (1 hour) */
  ACCESS_TOKEN: '1h',
  
  /** Refresh token expiry (7 days) */
  REFRESH_TOKEN: '7d',
} as const;