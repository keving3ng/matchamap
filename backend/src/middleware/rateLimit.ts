import { IRequest } from 'itty-router';
import { Env } from '../types';
import { errorResponse } from '../utils/response';

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
const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
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
  return `ua-${request.headers.get('User-Agent')?.slice(0, 50) || 'unknown'}`;
}

/**
 * Rate limit middleware
 *
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(maxRequests: number, windowMs: number = 60000) {
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
        429,
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

// Strict rate limit for authentication endpoints (200 req/min)
export const authRateLimit = () => rateLimit(200, 60000);

// Medium rate limit for write operations (100 req/min)
export const writeRateLimit = () => rateLimit(100, 60000);

// Generous rate limit for public read endpoints (500 req/min)
export const publicRateLimit = () => rateLimit(500, 60000);

// Very strict for sensitive operations (10 req/min)
export const strictRateLimit = () => rateLimit(10, 60000);
