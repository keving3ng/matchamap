import { Env } from '../types';
import { SECURITY_CONSTANTS } from '../constants';

/**
 * Security headers middleware
 *
 * Adds essential security headers to all responses to protect against
 * common web vulnerabilities.
 */

export interface SecurityHeadersOptions {
  /**
   * Content-Security-Policy directives
   * Default: Strict policy for API endpoints
   */
  contentSecurityPolicy?: string;

  /**
   * Enable HSTS (HTTP Strict Transport Security)
   * Default: true in production
   */
  enableHSTS?: boolean;

  /**
   * HSTS max-age in seconds
   * Default: 1 year (31536000)
   */
  hstsMaxAge?: number;
}

const DEFAULT_OPTIONS: SecurityHeadersOptions = {
  contentSecurityPolicy: "default-src 'none'", // API only, no content
  enableHSTS: true,
  hstsMaxAge: SECURITY_CONSTANTS.HSTS_MAX_AGE, // 1 year
};

/**
 * Get security headers to add to responses
 */
export function getSecurityHeaders(
  env: Env,
  options: SecurityHeadersOptions = {}
): Record<string, string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const isProduction = env.ENVIRONMENT === 'production';

  const headers: Record<string, string> = {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Enable browser XSS protection (legacy, but doesn't hurt)
    'X-XSS-Protection': '1; mode=block',

    // Don't send referrer to external sites
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Prevent browsers from guessing content type
    'X-Download-Options': 'noopen',

    // Permissions policy (restrict browser features)
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };

  // Content Security Policy
  if (opts.contentSecurityPolicy) {
    headers['Content-Security-Policy'] = opts.contentSecurityPolicy;
  }

  // HSTS (only in production and over HTTPS)
  if (isProduction && opts.enableHSTS) {
    headers['Strict-Transport-Security'] = `max-age=${opts.hstsMaxAge}; includeSubDomains; preload`;
  }

  return headers;
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  response: Response,
  env: Env,
  options?: SecurityHeadersOptions
): Response {
  const headers = getSecurityHeaders(env, options);

  // Create new response with existing headers + security headers
  const newHeaders = new Headers(response.headers);
  Object.entries(headers).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
