/**
 * Input sanitization utilities for user-generated content
 * Provides protection against XSS, SQL injection, and other attacks
 */

/**
 * Sanitize text input by removing/escaping potentially dangerous characters
 * This is a basic HTML/script tag sanitization - frontend should also use DOMPurify
 *
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default 5000)
 * @returns Sanitized text safe for storage and display
 */
export function sanitizeTextInput(input: string | null | undefined, maxLength = 5000): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Return null for empty strings after trim
  if (sanitized.length === 0) {
    return null;
  }

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove or escape potentially dangerous HTML/script tags
  // This is a basic filter - frontend should also use DOMPurify for defense in depth
  sanitized = sanitized
    // Remove <script> tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove <iframe> tags and their content
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove event handlers (onclick, onerror, etc.)
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (can be used for XSS)
    .replace(/data:text\/html/gi, '');

  return sanitized;
}

/**
 * Sanitize short text fields like names and titles
 * More restrictive than general text input
 *
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default 200)
 * @returns Sanitized text
 */
export function sanitizeShortText(input: string | null | undefined, maxLength = 200): string | null {
  const sanitized = sanitizeTextInput(input, maxLength);

  if (!sanitized) {
    return null;
  }

  // For short text, also remove newlines and excessive whitespace
  return sanitized
    .replace(/[\r\n\t]+/g, ' ')  // Replace newlines and tabs with spaces
    .replace(/\s{2,}/g, ' ')     // Replace multiple spaces with single space
    .trim();
}

/**
 * Sanitize search queries for SQL LIKE statements
 * Escapes SQL wildcards and limits length
 *
 * @param search - Search query string
 * @param maxLength - Maximum search query length (default 200)
 * @returns Sanitized search term with SQL LIKE wildcards
 */
export function sanitizeSearchQuery(search: string, maxLength = 200): string {
  // Trim and limit length
  const sanitized = search.trim().substring(0, maxLength);

  // Escape SQL wildcards to prevent abuse
  const escaped = sanitized.replace(/[%_]/g, '\\$&');

  // Return lowercase with SQL LIKE wildcards
  return `%${escaped.toLowerCase()}%`;
}

/**
 * Sanitize and validate email addresses
 *
 * @param email - Email address to validate
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const trimmed = email.trim().toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed) || trimmed.length > 320) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize URLs - ensure they use safe protocols
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or null if invalid/unsafe
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Allow only http, https, and mailto protocols
  const allowedProtocols = /^(https?:\/\/|mailto:)/i;

  if (!allowedProtocols.test(trimmed)) {
    // If no protocol, assume https
    return `https://${trimmed}`;
  }

  // Block javascript:, data:, and other dangerous protocols
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return null;
  }

  return trimmed;
}
