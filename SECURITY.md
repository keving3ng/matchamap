# MatchaMap Security Policy

## Security Overview

MatchaMap implements comprehensive security measures to protect user data and system integrity. This document outlines our security practices, incident response procedures, and reporting guidelines.

## Authentication & Authorization

### Password Requirements
- Minimum length: 12 characters
- Must contain:
  - At least one lowercase letter (a-z)
  - At least one uppercase letter (A-Z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*()_+-=[]{};'"\\|,.<>?)
- Prohibited patterns:
  - Three or more consecutive identical characters
  - Common weak sequences (123456, qwerty, password, etc.)

### Token Security
- JWT tokens use HS256 algorithm with cryptographically secure secrets
- Access tokens expire after 1 hour (24 hours for admin users)
- Refresh tokens expire after 7 days (30 days for admin users)
- Session invalidation on logout

### Admin Access
- Requires dual authentication:
  1. Valid JWT token with admin role
  2. Role verification on every admin endpoint
- Self-protection: Admins cannot delete or demote themselves
- All admin actions are logged for audit purposes

## API Security

### Input Validation
- All inputs validated using Zod schemas
- SQL injection prevention via Drizzle ORM parameterized queries
- Request body size limits enforced
- Content-Type validation

### Rate Limiting
- Authentication endpoints: 200 requests/minute
- Write operations: 100 requests/minute
- Public read endpoints: 500 requests/minute
- Sensitive operations: 10 requests/minute

### CORS Configuration
- Strict origin validation with whitelist
- No wildcard (*) origins in production
- Credentials allowed only for whitelisted origins

## Database Security

### Access Control
- Principle of least privilege
- API uses dedicated database user with minimal permissions
- No direct database access from frontend

### Data Protection
- Password hashing: PBKDF2 with 100,000 iterations
- Soft deletes for important data preservation
- Foreign key constraints prevent orphaned records
- Audit logging for admin actions

## Infrastructure Security

### Environment Configuration
- No secrets in code or configuration files
- Environment variables managed via Wrangler CLI
- Separate secrets for development and production

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS) in production
- `Referrer-Policy: strict-origin-when-cross-origin`

### HTTPS Enforcement
- All production traffic enforced via HTTPS
- HSTS headers with 1-year max-age
- Secure cookie flags in production

## Known Security Issues & Mitigations

### Critical Issues Resolved
1. ✅ **Session invalidation**: Logout now properly deletes sessions from database
2. ✅ **Hardcoded secrets**: Removed from development configuration
3. ✅ **Weak passwords**: Enhanced requirements and validation

### Outstanding Issues
1. **Token Storage (High Priority)**: Tokens currently stored in sessionStorage (XSS vulnerable)
   - **Planned Fix**: Implement httpOnly cookies for token storage
   - **Timeline**: Next sprint
   - **Mitigation**: Strict CSP headers, XSS prevention measures

2. **Rate Limiting (Medium Priority)**: In-memory store resets on Worker restart
   - **Planned Fix**: Implement Cloudflare Durable Objects for persistence
   - **Timeline**: Q2 2025
   - **Mitigation**: Cloudflare's built-in DDoS protection

## Deployment Security Checklist

### Before Production Deployment
- [ ] Set JWT_SECRET via `wrangler secret put JWT_SECRET`
- [ ] Set GOOGLE_PLACES_API_KEY via `wrangler secret put GOOGLE_PLACES_API_KEY`
- [ ] Verify ALLOWED_ORIGINS contains only production domains
- [ ] Enable Cloudflare WAF rules
- [ ] Configure Cloudflare Access for admin routes
- [ ] Test authentication flows end-to-end
- [ ] Verify rate limiting is working
- [ ] Confirm security headers are present

### Production Monitoring
- [ ] Monitor failed authentication attempts
- [ ] Track rate limit violations
- [ ] Alert on admin privilege escalations
- [ ] Review audit logs weekly

## Incident Response

### Reporting Security Issues
If you discover a security vulnerability, please report it to us privately:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: [security@matchamap.com]
3. Include detailed reproduction steps
4. We will acknowledge receipt within 24 hours
5. We will provide a fix timeline within 72 hours

### Severity Levels
- **Critical**: Remote code execution, authentication bypass, data breach
- **High**: Privilege escalation, SQL injection, XSS
- **Medium**: Information disclosure, CSRF, session fixation
- **Low**: Information leakage, security misconfiguration

### Response Timeline
- **Critical**: Immediate response, fix within 24 hours
- **High**: Response within 24 hours, fix within 1 week
- **Medium**: Response within 72 hours, fix within 1 month
- **Low**: Response within 1 week, fix when convenient

## Security Contact

For security-related inquiries:
- **Primary**: security@matchamap.com
- **Backup**: admin@matchamap.com
- **PGP Key**: [To be provided]

## Updates

This security policy is reviewed quarterly and updated as needed. Last updated: 2025-01-10

---

**Note**: This document contains sensitive security information. Do not share publicly without review.