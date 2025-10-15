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
  
  // Use Lax for development (allows cookies on HTTP localhost)
  // Use Strict for production (maximum security on HTTPS)
  const sameSite = isProduction ? 'Strict' : 'Lax';
  
  // Only use Secure flag on HTTPS (production)
  // HTTP localhost will reject cookies with Secure flag
  const secureFlag = isProduction ? 'Secure' : '';
  
  const parts = [
    `${name}=${value}`,
    options.httpOnly !== false ? 'HttpOnly' : null,
    secureFlag,
    `SameSite=${sameSite}`,
    `Path=${options.path || '/'}`,
    `Max-Age=${options.maxAge}`,
  ].filter(Boolean);
  
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
  const sameSite = isProduction ? 'Strict' : 'Lax';
  const secureFlag = isProduction ? 'Secure' : '';
  
  const parts = [
    `${name}=`,
    'HttpOnly',
    secureFlag,
    `SameSite=${sameSite}`,
    `Path=${path}`,
    'Max-Age=0',
  ].filter(Boolean);
  
  return parts.join('; ');
}