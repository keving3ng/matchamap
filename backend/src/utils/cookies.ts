import { Env } from '../types';

export interface CookieOptions {
  maxAge: number;
  path?: string;
  httpOnly?: boolean;
}

/**
 * Detect if we're running in local development mode
 * Wrangler dev doesn't expose a reliable env var, so we check if COOKIE_DOMAIN
 * contains localhost or if ENVIRONMENT is explicitly 'development'
 */
function isLocalDevelopment(env: Env): boolean {
  // If COOKIE_DOMAIN is set and contains 'localhost', we're in local dev
  if (env.COOKIE_DOMAIN && env.COOKIE_DOMAIN.includes('localhost')) {
    return true;
  }

  // If ENVIRONMENT is explicitly set to 'development', we're in local dev
  if (env.ENVIRONMENT === 'development') {
    return true;
  }

  // If no COOKIE_DOMAIN is set and ENVIRONMENT is production, assume local dev
  // (Production should always have COOKIE_DOMAIN set)
  if (!env.COOKIE_DOMAIN && env.ENVIRONMENT === 'production') {
    return true; // Likely wrangler dev with misconfigured env
  }

  return false;
}

/**
 * Create an authentication cookie with environment-aware security settings
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options (maxAge, path, httpOnly)
 * @param env - Environment configuration
 * @returns Cookie string formatted for Set-Cookie header
 */
export function createAuthCookie(
  name: string,
  value: string,
  options: CookieOptions,
  env: Env
): string {
  // Determine if we're in production or local development
  const isProduction = !isLocalDevelopment(env);

  // SameSite cookie policy:
  // - Production with custom domain (api.matchamap.club): Use 'None' to allow cross-site cookies
  // - Production without custom domain: Use 'Strict' for maximum security
  // - Development (HTTP): Omit SameSite to allow cross-origin cookies on localhost
  //   (SameSite=Lax would block cookies from localhost:3000 to localhost:8787)
  //   (SameSite=None requires Secure flag, which doesn't work on HTTP)
  const sameSiteAttr = isProduction
    ? (env.COOKIE_DOMAIN ? 'SameSite=None' : 'SameSite=Strict')
    : null;

  // Only use Secure flag on HTTPS (production)
  // HTTP localhost will reject cookies with Secure flag
  const secureFlag = isProduction ? 'Secure' : null;

  // Cookie domain for sharing across subdomains
  // Example: COOKIE_DOMAIN=.matchamap.club allows cookies to be shared between
  // matchamap.club and api.matchamap.club
  // IMPORTANT: Don't set Domain in local dev, it breaks cookies on localhost
  const domainAttr = (isProduction && env.COOKIE_DOMAIN) ? `Domain=${env.COOKIE_DOMAIN}` : null;

  const parts = [
    `${name}=${value}`,
    options.httpOnly !== false ? 'HttpOnly' : null,
    secureFlag,
    sameSiteAttr,
    domainAttr,
    `Path=${options.path || '/'}`,
    `Max-Age=${options.maxAge}`,
  ].filter(Boolean);

  console.log(`🍪 [COOKIE] Creating ${name} cookie:`, parts.join('; '));

  return parts.join('; ');
}

/**
 * Clear an authentication cookie with environment-aware security settings
 *
 * @param name - Cookie name to clear
 * @param path - Cookie path (should match the original cookie path)
 * @param env - Environment configuration
 * @returns Cookie string formatted for Set-Cookie header to clear the cookie
 */
export function clearAuthCookie(name: string, path: string = '/', env: Env): string {
  const isProduction = !isLocalDevelopment(env);
  const sameSiteAttr = isProduction
    ? (env.COOKIE_DOMAIN ? 'SameSite=None' : 'SameSite=Strict')
    : null;
  const secureFlag = isProduction ? 'Secure' : null;
  const domainAttr = (isProduction && env.COOKIE_DOMAIN) ? `Domain=${env.COOKIE_DOMAIN}` : null;

  const parts = [
    `${name}=`,
    'HttpOnly',
    secureFlag,
    sameSiteAttr,
    domainAttr,
    `Path=${path}`,
    'Max-Age=0',
  ].filter(Boolean);

  console.log(`🍪 [COOKIE] Clearing ${name} cookie:`, parts.join('; '));

  return parts.join('; ');
}