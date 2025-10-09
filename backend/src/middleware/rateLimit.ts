import { IRequest } from 'itty-router';
import { Env } from '../types';
import { errorResponse } from '../utils/response';
import { RATE_LIMIT_CONSTANTS, HTTP_STATUS } from '../constants';

/**
 * Simple in-memory rate limiter for Cloudflare Workers
 *
 * NOTE: This is a basic implementation that resets on worker restart.
 * For production at scale, consider using Cloudflare's Rate Limiting API
 * or Durable Objects for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets when worker restarts)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 60 seconds
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup > RATE_LIMIT_CONSTANTS.CLEANUP_INTERVAL_MS) {
    const keysToDelete: string[] = [];
    rateLimitStore.forEach((entry, key) => {
      if (entry.resetAt < now) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => rateLimitStore.delete(key));
    lastCleanup = now;
  }
}

/**
 * Get client identifier from request (IP address)
 */
function getClientId(request: Request): string {
  // Try CF-Connecting-IP first (Cloudflare provided)
  const cfIP = request.headers.get('CF-Connecting-IP');
  if (cfIP) return cfIP;

  // Fallback to X-Forwarded-For
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Last resort: use a hash of user agent (less reliable)
  return `ua-${request.headers.get('User-Agent')?.slice(0, RATE_LIMIT_CONSTANTS.USER_AGENT_SLICE_LENGTH) || 'unknown'}`;
}

/**
 * Rate limit middleware
 *
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(maxRequests: number, windowMs: number = RATE_LIMIT_CONSTANTS.WINDOW_MS) {
  return async (request: IRequest, env: Env): Promise<Response | void> => {
    cleanup();

    const clientId = getClientId(request as Request);
    const key = `${clientId}:${new URL(request.url).pathname}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // Create new entry or reset if window expired
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(key, entry);
      return undefined; // Allow request
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const resetIn = Math.ceil((entry.resetAt - now) / 1000);
      return errorResponse(
        `Too many requests. Please try again in ${resetIn} seconds.`,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        request as Request,
        env
      );
    }

    return undefined; // Allow request
  };
}

/**
 * Preset rate limiters for common use cases
 */

// Strict rate limit for authentication endpoints
export const authRateLimit = () => rateLimit(RATE_LIMIT_CONSTANTS.AUTH_MAX_REQUESTS, RATE_LIMIT_CONSTANTS.WINDOW_MS);

// Medium rate limit for write operations
export const writeRateLimit = () => rateLimit(RATE_LIMIT_CONSTANTS.WRITE_MAX_REQUESTS, RATE_LIMIT_CONSTANTS.WINDOW_MS);

// Generous rate limit for public read endpoints
export const publicRateLimit = () => rateLimit(RATE_LIMIT_CONSTANTS.PUBLIC_MAX_REQUESTS, RATE_LIMIT_CONSTANTS.WINDOW_MS);

// Very strict for sensitive operations
export const strictRateLimit = () => rateLimit(RATE_LIMIT_CONSTANTS.STRICT_MAX_REQUESTS, RATE_LIMIT_CONSTANTS.WINDOW_MS);
