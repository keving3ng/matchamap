import { Env } from '../types';

export interface CookieOptions {
  maxAge: number;
  path?: string;
  httpOnly?: boolean;
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
  // Determine if we're in production (HTTPS environment)
  const isProduction = env.ENVIRONMENT === 'production';

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
  const domainAttr = env.COOKIE_DOMAIN ? `Domain=${env.COOKIE_DOMAIN}` : null;

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
  const isProduction = env.ENVIRONMENT === 'production';
  const sameSiteAttr = isProduction
    ? (env.COOKIE_DOMAIN ? 'SameSite=None' : 'SameSite=Strict')
    : null;
  const secureFlag = isProduction ? 'Secure' : null;
  const domainAttr = env.COOKIE_DOMAIN ? `Domain=${env.COOKIE_DOMAIN}` : null;

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