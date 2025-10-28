/**
 * Fraud Detection Service for Waitlist Signups
 *
 * Applies multiple heuristics to detect potentially fraudulent signups
 * without blocking legitimate users. Flagged entries can be reviewed
 * through the admin panel.
 */

interface FraudDetectionResult {
  isFlagged: boolean
  score: number // 0-1, where 1 is definitely fraud
  reasons: string[]
}

/**
 * Detects potentially fraudulent waitlist signups using multiple heuristics
 */
export function detectWaitlistFraud(
  email: string,
  ip?: string,
  referralSource?: string
): FraudDetectionResult {
  const reasons: string[] = []
  let score = 0

  // 1. Disposable email domain detection
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', 'mailinator.com',
    '10minutemail.com', 'trashmail.com', 'throwaway.email',
    'temp-mail.org', 'getnada.com', 'maildrop.cc',
    'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com',
    'pokemail.net', 'spam4.me', 'bccto.me',
    'emailondeck.com', 'fakeinbox.com', 'dispostable.com'
  ]
  
  const domain = email.split('@')[1]?.toLowerCase()
  if (domain && disposableDomains.some(d => domain.includes(d))) {
    score += 0.6
    reasons.push('Disposable email domain')
  }

  // 2. Pattern detection (repeated chars, sequential)
  const localPart = email.split('@')[0]
  
  // 5+ repeated characters
  if (/(.)\1{4,}/.test(localPart)) {
    score += 0.3
    reasons.push('Repeated characters')
  }
  
  // 8+ sequential digits
  if (/\d{8,}/.test(localPart)) {
    score += 0.2
    reasons.push('Sequential digits')
  }

  // 3. Gibberish detection (very low vowel ratio)
  if (localPart.length > 6) {
    const vowelRatio = (localPart.match(/[aeiou]/gi) || []).length / localPart.length
    if (vowelRatio < 0.15) {
      score += 0.3
      reasons.push('Low vowel ratio (gibberish)')
    }
  }

  // 4. Known spam patterns
  const spamPatterns = ['test', 'fake', 'spam', 'asdf', 'qwerty', 'bot', 'dummy']
  if (spamPatterns.some(p => localPart.toLowerCase().includes(p))) {
    score += 0.4
    reasons.push('Spam keywords')
  }

  // 5. Suspicious email patterns
  // All numbers in local part (but allow reasonable length)
  if (/^\d+$/.test(localPart) && localPart.length > 10) {
    score += 0.2
    reasons.push('All numeric local part')
  }

  // Too many special characters
  const specialCharCount = (localPart.match(/[^a-zA-Z0-9]/g) || []).length
  if (specialCharCount > 3) {
    score += 0.2
    reasons.push('Excessive special characters')
  }

  // 6. Domain validation
  if (domain) {
    // Very short domains (likely typos or suspicious)
    if (domain.length < 4) {
      score += 0.3
      reasons.push('Suspicious domain length')
    }
    
    // No TLD or suspicious TLD patterns
    if (!domain.includes('.') || domain.endsWith('.')) {
      score += 0.5
      reasons.push('Invalid domain format')
    }
  }

  // Determine if flagged (threshold: 0.5)
  const isFlagged = score >= 0.5

  return {
    isFlagged,
    score: Math.min(score, 1), // Cap at 1.0
    reasons
  }
}

/**
 * Check for rate limiting violations per IP
 * This would require additional database queries to implement fully
 * For now, this is a placeholder for future enhancement
 */
export function checkRateLimitViolation(
  ip: string,
  recentSignupsFromIP: number
): { violated: boolean; reason?: string } {
  // Conservative threshold: max 5 signups per hour from same IP
  const MAX_SIGNUPS_PER_HOUR = 5
  
  if (recentSignupsFromIP >= MAX_SIGNUPS_PER_HOUR) {
    return {
      violated: true,
      reason: `Rate limit exceeded: ${recentSignupsFromIP} signups from IP in last hour`
    }
  }
  
  return { violated: false }
}

/**
 * Formats fraud reasons for database storage
 */
export function formatFraudReasons(reasons: string[]): string {
  return reasons.join(', ')
}

/**
 * Parses fraud reasons from database storage
 */
export function parseFraudReasons(reasonsString: string | null): string[] {
  if (!reasonsString) return []
  return reasonsString.split(', ').filter(r => r.trim().length > 0)
}