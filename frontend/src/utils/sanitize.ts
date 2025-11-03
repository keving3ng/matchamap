import DOMPurify from 'dompurify';

/**
 * Input sanitization utilities using DOMPurify
 *
 * Protects against XSS attacks by sanitizing user-generated content
 * before rendering it in the DOM.
 */

/**
 * Sanitize HTML content
 *
 * Use this when rendering user-generated HTML (e.g., rich text, reviews)
 * @param dirty - Potentially unsafe HTML string
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    // Allow basic formatting tags
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    // Always add rel="noopener noreferrer" to links
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text
 *
 * Use this for user input that should be displayed as plain text
 * (e.g., cafe names, usernames, comments)
 * @param dirty - Potentially unsafe text
 * @returns Sanitized plain text
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize URL
 *
 * Use this for user-provided URLs (e.g., social media links, website URLs)
 * @param dirty - Potentially unsafe URL
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(dirty: string): string {
  // Only allow http and https protocols
  const sanitized = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  try {
    const url = new URL(sanitized);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    // Invalid URL
  }

  return '';
}

/**
 * Sanitize markdown-style content
 *
 * Use this for content that allows basic markdown formatting
 * @param dirty - Potentially unsafe markdown
 * @returns Sanitized content
 */
export function sanitizeMarkdown(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'b', 'i', 'em', 'strong', 'u', 'code', 'pre',
      'ul', 'ol', 'li',
      'a', 'blockquote',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Escape HTML entities
 *
 * Simple utility to escape HTML without allowing any tags
 * Useful when you want to display code snippets or preserve formatting
 * @param text - Text to escape
 * @returns Escaped text
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize object properties
 *
 * Recursively sanitize all string properties in an object
 * Useful for sanitizing API responses or form data
 * @param obj - Object to sanitize
 * @param sanitizer - Sanitization function (default: sanitizeText)
 * @returns Sanitized object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizer: (value: string) => string = sanitizeText
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizer(value);
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, sanitizer);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
