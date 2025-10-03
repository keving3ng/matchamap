/**
 * Email validation utility
 * Uses a simple but effective regex pattern to validate email addresses
 */
export const isValidEmail = (email: string): boolean => {
  // Basic email regex: must have @ symbol, domain, and TLD
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length >= 5
}
