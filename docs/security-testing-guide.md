# Security Testing Guide

This document provides comprehensive security testing procedures for MatchaMap's social features and metrics system.

## Quick Security Checklist

Before any production deployment, ensure these security tests pass:

```bash
# 1. Run automated security checks
npm audit                     # Check for vulnerable dependencies
npm run typecheck            # Verify type safety
npm run lint                 # Code quality and basic security

# 2. Run backend tests
cd backend
npm test                     # All backend tests including security

# 3. Manual security verification
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"invalidpassword"}' \
  # Should return 401 without timing attack

# 4. File upload security test
curl -X POST http://localhost:8787/api/photos/upload \
  -H "Cookie: access_token=invalid" \
  -F "photo=@malicious.txt" \
  # Should reject non-image files

# 5. Authorization test
curl -X DELETE http://localhost:8787/api/reviews/1 \
  -H "Cookie: access_token=user_token" \
  # Should only allow deletion of own reviews
```

## Authentication Security Tests

### 1. Password Security Validation

```bash
# Test password requirements
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "weak"
  }'
# Expected: 400 with password requirement error

# Test strong password acceptance
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com", 
    "username": "testuser2",
    "password": "StrongPass123!@#"
  }'
# Expected: 201 with user created
```

### 2. JWT Token Security

```bash
# Test token expiration
curl -X GET http://localhost:8787/api/auth/me \
  -H "Cookie: access_token=expired.jwt.token"
# Expected: 401 Unauthorized

# Test invalid token
curl -X GET http://localhost:8787/api/auth/me \
  -H "Cookie: access_token=invalid.token"
# Expected: 401 Unauthorized

# Test missing token
curl -X GET http://localhost:8787/api/auth/me
# Expected: 401 Unauthorized
```

### 3. Session Management

```bash
# Test logout clears sessions
# 1. Login and get token
TOKEN=$(curl -s -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123!"}' \
  | grep -o 'access_token=[^;]*')

# 2. Verify token works
curl -X GET http://localhost:8787/api/auth/me \
  -H "Cookie: $TOKEN"
# Expected: 200 with user data

# 3. Logout
curl -X POST http://localhost:8787/api/auth/logout \
  -H "Cookie: $TOKEN"
# Expected: 200 

# 4. Verify token is invalidated
curl -X GET http://localhost:8787/api/auth/me \
  -H "Cookie: $TOKEN"
# Expected: 401 Unauthorized
```

## Authorization Security Tests

### 1. User Content Ownership

```bash
# Test user can only modify own reviews
# 1. Create review as user1
USER1_TOKEN="access_token=user1_jwt_token"
REVIEW_ID=$(curl -s -X POST http://localhost:8787/api/cafes/1/reviews \
  -H "Cookie: $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"overallRating":8,"content":"Great cafe!"}' \
  | jq -r '.review.id')

# 2. Try to modify as user2 (should fail)
USER2_TOKEN="access_token=user2_jwt_token"
curl -X PUT http://localhost:8787/api/reviews/$REVIEW_ID \
  -H "Cookie: $USER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hacked review!"}'
# Expected: 403 Forbidden

# 3. Try to delete as user2 (should fail)
curl -X DELETE http://localhost:8787/api/reviews/$REVIEW_ID \
  -H "Cookie: $USER2_TOKEN"
# Expected: 403 Forbidden
```

### 2. Admin-Only Endpoints

```bash
# Test admin endpoints reject regular users
USER_TOKEN="access_token=regular_user_token"

curl -X GET http://localhost:8787/api/admin/users \
  -H "Cookie: $USER_TOKEN"
# Expected: 403 Forbidden

curl -X PUT http://localhost:8787/api/admin/photos/1/moderate \
  -H "Cookie: $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
# Expected: 403 Forbidden
```

## File Upload Security Tests

### 1. File Type Validation

```bash
# Test malicious file upload
echo "<?php phpinfo(); ?>" > malicious.php
curl -X POST http://localhost:8787/api/photos/upload \
  -H "Cookie: access_token=valid_token" \
  -F "photo=@malicious.php" \
  -F "cafeId=1"
# Expected: 400 with invalid file type error

# Test oversized file
dd if=/dev/zero of=large.jpg bs=1M count=10  # 10MB file
curl -X POST http://localhost:8787/api/photos/upload \
  -H "Cookie: access_token=valid_token" \
  -F "photo=@large.jpg" \
  -F "cafeId=1"
# Expected: 400 with file too large error

# Test valid image upload
curl -X POST http://localhost:8787/api/photos/upload \
  -H "Cookie: access_token=valid_token" \
  -F "photo=@valid_image.jpg" \
  -F "cafeId=1" \
  -F "caption=Test photo"
# Expected: 201 with photo metadata
```

### 2. Path Traversal Prevention

```bash
# Test path traversal in photo serving
curl -X GET http://localhost:8787/photos/../../../etc/passwd
# Expected: 404 or proper error (not file contents)

# Test directory traversal in image keys
curl -X GET http://localhost:8787/photos/..%2F..%2Fetc%2Fpasswd
# Expected: 404 or proper error
```

## Input Validation Tests

### 1. SQL Injection Prevention

```bash
# Test SQL injection in login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com'\'' OR 1=1 --",
    "password": "anything"
  }'
# Expected: 401 (not 500 or successful login)

# Test SQL injection in review content
curl -X POST http://localhost:8787/api/cafes/1/reviews \
  -H "Cookie: access_token=valid_token" \
  -H "Content-Type: application/json" \
  -d '{
    "overallRating": 8,
    "content": "Great cafe'\''; DROP TABLE users; --"
  }'
# Expected: 201 with content properly escaped (not SQL error)
```

### 2. XSS Prevention

```bash
# Test XSS in review content
curl -X POST http://localhost:8787/api/cafes/1/reviews \
  -H "Cookie: access_token=valid_token" \
  -H "Content-Type: application/json" \
  -d '{
    "overallRating": 8,
    "content": "<script>alert('\''XSS'\'')</script>",
    "title": "<img src=x onerror=alert('\''XSS'\'')>"
  }'
# Expected: 201 with content properly sanitized

# Verify content is stored safely
curl -X GET http://localhost:8787/api/cafes/1/reviews
# Expected: XSS payload should be escaped/sanitized
```

### 3. Input Length Limits

```bash
# Test extremely long input
LONG_STRING=$(python3 -c "print('A' * 10000)")
curl -X POST http://localhost:8787/api/cafes/1/reviews \
  -H "Cookie: access_token=valid_token" \
  -H "Content-Type: application/json" \
  -d "{
    \"overallRating\": 8,
    \"content\": \"$LONG_STRING\"
  }"
# Expected: 400 with validation error
```

## Rate Limiting Tests

### 1. Authentication Rate Limiting

```bash
# Test login rate limiting
for i in {1..250}; do
  curl -X POST http://localhost:8787/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' &
done
wait
# Expected: Later requests should return 429 Too Many Requests
```

### 2. API Rate Limiting

```bash
# Test review creation rate limiting
for i in {1..150}; do
  curl -X POST http://localhost:8787/api/cafes/1/reviews \
    -H "Cookie: access_token=valid_token" \
    -H "Content-Type: application/json" \
    -d "{\"overallRating\":$((i%10+1)),\"content\":\"Review $i\"}" &
done
wait
# Expected: Requests beyond limit should return 429
```

## Privacy & Data Protection Tests

### 1. Private Data Access

```bash
# Test private review visibility
# 1. Create private review
curl -X POST http://localhost:8787/api/cafes/1/reviews \
  -H "Cookie: access_token=user_token" \
  -H "Content-Type: application/json" \
  -d '{
    "overallRating": 8,
    "content": "Private review",
    "isPublic": false
  }'

# 2. Verify it's not visible to other users
curl -X GET http://localhost:8787/api/cafes/1/reviews
# Expected: Private review should not appear in results

# 3. Verify owner can still see it in their profile
curl -X GET http://localhost:8787/api/users/username/reviews \
  -H "Cookie: access_token=user_token"
# Expected: Private review should appear for owner
```

### 2. Data Exposure Prevention

```bash
# Test password hash is never exposed
curl -X GET http://localhost:8787/api/auth/me \
  -H "Cookie: access_token=valid_token"
# Expected: Response should not contain passwordHash field

# Test user enumeration protection
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"anything"}'
# Expected: Same error message as invalid password
```

## Security Headers Tests

### 1. Essential Security Headers

```bash
# Test security headers on API responses
curl -I http://localhost:8787/api/health
# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin

# Test HSTS in production
curl -I https://api.matchamap.com/api/health
# Expected: Strict-Transport-Security header in production
```

### 2. CORS Configuration

```bash
# Test CORS with allowed origin
curl -X OPTIONS http://localhost:8787/api/health \
  -H "Origin: https://matchamap.com"
# Expected: Access-Control-Allow-Origin: https://matchamap.com

# Test CORS with disallowed origin  
curl -X OPTIONS http://localhost:8787/api/health \
  -H "Origin: https://malicious.com"
# Expected: No CORS headers or denied access
```

## Content Moderation Tests

### 1. Spam Detection

```bash
# Test spam content detection
curl -X POST http://localhost:8787/api/cafes/1/reviews \
  -H "Cookie: access_token=valid_token" \
  -H "Content-Type: application/json" \
  -d '{
    "overallRating": 10,
    "content": "AMAZING CAFE!!! BEST PLACE EVER!!! FREE MONEY CLICK HERE!!!",
    "title": "BEST CAFE IN THE WORLD AMAZING"
  }'
# Expected: Review should be flagged for moderation

# Test URL spam detection
curl -X POST http://localhost:8787/api/cafes/1/reviews \
  -H "Cookie: access_token=valid_token" \
  -H "Content-Type: application/json" \
  -d '{
    "overallRating": 8,
    "content": "Great cafe! Check out my website: https://spam.com"
  }'
# Expected: Review should be flagged for containing URLs
```

## Admin Security Tests

### 1. Admin Action Auditing

```bash
# Test admin actions are logged
curl -X PUT http://localhost:8787/api/admin/photos/1/moderate \
  -H "Cookie: access_token=admin_token" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","notes":"Looks good"}'
# Expected: Action should be logged in audit table

# Verify audit log entry
curl -X GET http://localhost:8787/api/admin/audit-log \
  -H "Cookie: access_token=admin_token"
# Expected: Recent moderation action should appear in log
```

### 2. Admin Self-Protection

```bash
# Test admin cannot delete themselves
curl -X DELETE http://localhost:8787/api/admin/users/1 \
  -H "Cookie: access_token=admin_token_for_user_id_1"
# Expected: 403 Forbidden (self-protection)

# Test admin cannot demote themselves
curl -X PUT http://localhost:8787/api/admin/users/1 \
  -H "Cookie: access_token=admin_token_for_user_id_1" \
  -H "Content-Type: application/json" \
  -d '{"role":"user"}'
# Expected: 403 Forbidden (self-protection)
```

## Production Security Checklist

Before deploying to production, verify:

### Environment Security
- [ ] JWT_SECRET is set via `wrangler secret put JWT_SECRET`
- [ ] GOOGLE_PLACES_API_KEY is properly configured
- [ ] ALLOWED_ORIGINS contains only production domains
- [ ] Database connection uses secure credentials

### Infrastructure Security  
- [ ] Cloudflare WAF rules are enabled
- [ ] Cloudflare Access is configured for admin routes
- [ ] HTTPS is enforced (HSTS headers present)
- [ ] R2 bucket permissions are restricted

### Application Security
- [ ] All tests pass including security tests
- [ ] Rate limiting is working properly
- [ ] File upload restrictions are enforced
- [ ] Admin panel requires proper authentication
- [ ] Audit logging is capturing admin actions

### Monitoring & Alerting
- [ ] Failed authentication monitoring
- [ ] Rate limit violation alerts
- [ ] Admin privilege escalation alerts
- [ ] Unusual file upload activity monitoring

## Automated Testing Integration

Add these tests to your CI/CD pipeline:

```yaml
# .github/workflows/security.yml
name: Security Tests
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v6
      
      - name: Install dependencies
        run: npm ci
        
      - name: Run dependency audit
        run: npm audit --audit-level=high
        
      - name: Run security tests
        run: npm run test:security
        
      - name: Run OWASP ZAP baseline scan
        run: |
          docker run -v $(pwd):/zap/wrk/:rw \
            -t owasp/zap2docker-stable \
            zap-baseline.py -t http://localhost:8787 \
            -r security-report.html
```

## Security Incident Response

If security issues are discovered:

1. **Immediate Response**
   - Document the issue with steps to reproduce
   - Assess impact and affected users
   - Implement immediate mitigations if possible

2. **Communication**
   - Report to security@matchamap.com (do not create public issues)
   - Follow responsible disclosure timeline
   - Coordinate with development team

3. **Resolution**
   - Develop and test fix
   - Deploy to production with minimal downtime
   - Monitor for exploitation attempts
   - Update security documentation

## Tools & Resources

### Security Testing Tools
- [OWASP ZAP](https://www.zaproxy.org/) - Web application security scanner
- [SQLMap](http://sqlmap.org/) - SQL injection testing
- [Burp Suite](https://portswigger.net/burp) - Comprehensive security testing
- [Nmap](https://nmap.org/) - Network security scanning

### Security References
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Cloudflare Security](https://developers.cloudflare.com/security/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**Last Updated:** October 27, 2025  
**Next Review:** Before production launch  
**Maintained By:** Security Team