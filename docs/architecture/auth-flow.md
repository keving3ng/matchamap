# Authentication Flow

**Last Updated:** 2025-11-02

This document describes the JWT-based authentication system used in MatchaMap.

---

## Table of Contents

- [Overview](#overview)
- [Authentication Architecture](#authentication-architecture)
- [Registration Flow](#registration-flow)
- [Login Flow](#login-flow)
- [Token Refresh Flow](#token-refresh-flow)
- [Logout Flow](#logout-flow)
- [Protected Route Access](#protected-route-access)
- [Session Management](#session-management)
- [Security Considerations](#security-considerations)
- [Implementation Details](#implementation-details)

---

## Overview

MatchaMap uses a **dual-token JWT authentication system** with:

- **Access Tokens** - Short-lived (15 minutes) tokens for API authentication
- **Refresh Tokens** - Long-lived (7 days) tokens for obtaining new access tokens

Both tokens are stored as **HTTP-only, secure cookies** to prevent XSS attacks.

### Key Features

- ✅ JWT-based stateless authentication
- ✅ HTTP-only cookies (XSS protection)
- ✅ Secure flag in production (HTTPS only)
- ✅ SameSite=Strict (CSRF protection)
- ✅ Bcrypt password hashing
- ✅ Session tracking in database
- ✅ Automatic token refresh
- ✅ Role-based access control (user/admin)

---

## Authentication Architecture

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │
       │ HTTP Request with Cookies
       │ (auth_token, refresh_token)
       ↓
┌─────────────────────────────────────┐
│     Cloudflare Workers Backend      │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Auth Middleware            │  │
│  │   - Verify JWT signature     │  │
│  │   - Check expiration         │  │
│  │   - Extract user from token  │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Route Handlers             │  │
│  │   - Protected routes         │  │
│  │   - Public routes            │  │
│  └──────────────────────────────┘  │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│      Cloudflare D1 Database         │
│                                     │
│  - users table (credentials)        │
│  - sessions table (refresh tokens)  │
│  - user_profiles table              │
└─────────────────────────────────────┘
```

---

## Registration Flow

```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│ User    │                    │ Backend │                    │ Database │
└────┬────┘                    └────┬────┘                    └────┬─────┘
     │                              │                              │
     │ POST /api/auth/register      │                              │
     │ {email, username, password}  │                              │
     ├─────────────────────────────>│                              │
     │                              │                              │
     │                              │ 1. Validate input            │
     │                              │    (Zod schema)              │
     │                              │                              │
     │                              │ 2. Check email exists        │
     │                              ├─────────────────────────────>│
     │                              │<─────────────────────────────┤
     │                              │                              │
     │                              │ 3. Check username exists     │
     │                              ├─────────────────────────────>│
     │                              │<─────────────────────────────┤
     │                              │                              │
     │                              │ 4. Hash password (bcrypt)    │
     │                              │                              │
     │                              │ 5. Insert user               │
     │                              ├─────────────────────────────>│
     │                              │<─────────────────────────────┤
     │                              │                              │
     │                              │ 6. Create default profile    │
     │                              ├─────────────────────────────>│
     │                              │<─────────────────────────────┤
     │                              │                              │
     │ 201 Created                  │                              │
     │ {user: {...}}                │                              │
     │<─────────────────────────────┤                              │
     │                              │                              │
```

### Registration Request

**Endpoint:** `POST /api/auth/register`

```json
{
  "email": "user@example.com",
  "username": "matcha_lover",
  "password": "securePassword123"
}
```

### Validation Rules

- **Email:**
  - Valid email format
  - Converted to lowercase
  - Must be unique
- **Username:**
  - 3-20 characters
  - Alphanumeric + underscore only
  - Must be unique
  - Case-sensitive
- **Password:**
  - Minimum 8 characters
  - No maximum length
  - Hashed with bcrypt (cost factor: 10)

### Response

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "matcha_lover",
    "role": "user",
    "isEmailVerified": false,
    "createdAt": "2025-11-02T12:00:00Z"
  }
}
```

**Note:** User is NOT automatically logged in after registration. They must call `/api/auth/login` separately.

---

## Login Flow

```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│ User    │                    │ Backend │                    │ Database │
└────┬────┘                    └────┬────┘                    └────┬─────┘
     │                              │                              │
     │ POST /api/auth/login         │                              │
     │ {email, password}            │                              │
     ├─────────────────────────────>│                              │
     │                              │                              │
     │                              │ 1. Find user by email        │
     │                              ├─────────────────────────────>│
     │                              │<─────────────────────────────┤
     │                              │                              │
     │                              │ 2. Verify password (bcrypt)  │
     │                              │                              │
     │                              │ 3. Generate access token     │
     │                              │    (JWT, 15min exp)          │
     │                              │                              │
     │                              │ 4. Generate refresh token    │
     │                              │    (random, 7 day exp)       │
     │                              │                              │
     │                              │ 5. Store session             │
     │                              ├─────────────────────────────>│
     │                              │<─────────────────────────────┤
     │                              │                              │
     │ 200 OK                       │                              │
     │ Set-Cookie: auth_token       │                              │
     │ Set-Cookie: refresh_token    │                              │
     │<─────────────────────────────┤                              │
     │                              │                              │
```

### Login Request

**Endpoint:** `POST /api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Response

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "matcha_lover",
    "role": "user"
  }
}
```

**Cookies Set:**

```
Set-Cookie: auth_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/
Set-Cookie: refresh_token=abc123...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/api/auth/refresh
```

### Token Structure

**Access Token (JWT):**
```json
{
  "sub": 1,              // User ID
  "username": "matcha_lover",
  "role": "user",
  "iat": 1698850000,     // Issued at
  "exp": 1698850900      // Expires at (15min)
}
```

**Refresh Token:**
- Random 64-character hex string
- Stored in `sessions` table with expiry
- Used only for `/api/auth/refresh` endpoint

---

## Token Refresh Flow

```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│ User    │                    │ Backend │                    │ Database │
└────┬────┘                    └────┬────┘                    └────┬─────┘
     │                              │                              │
     │ POST /api/auth/refresh       │                              │
     │ Cookie: refresh_token        │                              │
     ├─────────────────────────────>│                              │
     │                              │                              │
     │                              │ 1. Verify refresh token      │
     │                              ├─────────────────────────────>│
     │                              │<─────────────────────────────┤
     │                              │                              │
     │                              │ 2. Check expiration          │
     │                              │                              │
     │                              │ 3. Get user data             │
     │                              ├─────────────────────────────>│
     │                              │<─────────────────────────────┤
     │                              │                              │
     │                              │ 4. Generate new access token │
     │                              │    (JWT, 15min exp)          │
     │                              │                              │
     │ 200 OK                       │                              │
     │ Set-Cookie: auth_token       │                              │
     │<─────────────────────────────┤                              │
     │                              │                              │
```

### Automatic Refresh

The frontend automatically calls `/api/auth/refresh` when:
- Access token expires (detected via 401 response)
- User navigates to the app with expired access token but valid refresh token

**Endpoint:** `POST /api/auth/refresh`

**Request:** No body (uses cookie)

**Response:**
```json
{
  "message": "Token refreshed successfully"
}
```

**New Cookie Set:**
```
Set-Cookie: auth_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/
```

---

## Logout Flow

```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│ User    │                    │ Backend │                    │ Database │
└────┬────┘                    └────┬────┘                    └────┬─────┘
     │                              │                              │
     │ POST /api/auth/logout        │                              │
     │ Cookie: refresh_token        │                              │
     ├─────────────────────────────>│                              │
     │                              │                              │
     │                              │ 1. Delete session            │
     │                              ├─────────────────────────────>│
     │                              │<─────────────────────────────┤
     │                              │                              │
     │ 200 OK                       │                              │
     │ Set-Cookie: (clear cookies)  │                              │
     │<─────────────────────────────┤                              │
     │                              │                              │
```

**Endpoint:** `POST /api/auth/logout`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Cookies Cleared:**
```
Set-Cookie: auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/api/auth/refresh
```

---

## Protected Route Access

```
┌─────────┐                    ┌─────────┐
│ User    │                    │ Backend │
└────┬────┘                    └────┬────┘
     │                              │
     │ GET /api/profile             │
     │ Cookie: auth_token           │
     ├─────────────────────────────>│
     │                              │
     │                              │ Auth Middleware:
     │                              │ ┌────────────────────────┐
     │                              │ │ 1. Extract cookie      │
     │                              │ │ 2. Verify JWT signature│
     │                              │ │ 3. Check expiration    │
     │                              │ │ 4. Decode payload      │
     │                              │ │ 5. Attach to request   │
     │                              │ └────────────────────────┘
     │                              │
     │                              │ Route Handler:
     │                              │ - Access user via request.user
     │                              │ - Execute business logic
     │                              │
     │ 200 OK                       │
     │ {profile: {...}}             │
     │<─────────────────────────────┤
     │                              │
```

### Middleware Implementation

Protected routes use `requireAuth` middleware:

```typescript
// Backend: src/middleware/auth.ts
export async function requireAuth(request: IRequest, env: Env) {
  const authToken = getCookie(request.headers.get('Cookie') || '', 'auth_token');

  if (!authToken) {
    return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
  }

  try {
    const payload = await verifyToken(authToken, env.JWT_SECRET);

    // Attach user to request
    (request as AuthenticatedRequest).user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };

    return null; // Allow request to proceed
  } catch (error) {
    return errorResponse('Invalid token', HTTP_STATUS.UNAUTHORIZED);
  }
}
```

### Frontend Implementation

```typescript
// Frontend: src/stores/authStore.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const response = await api.auth.login(email, password);
    set({ user: response.user, isAuthenticated: true });
  },

  logout: async () => {
    await api.auth.logout();
    set({ user: null, isAuthenticated: false });
  },

  refreshToken: async () => {
    await api.auth.refresh();
  }
}));
```

### Protected Routes (Frontend)

```typescript
// Frontend: src/components/auth/ProtectedRoute.tsx
export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};
```

---

## Session Management

### Session Table Schema

```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,        -- Refresh token
  expires_at TEXT NOT NULL,           -- ISO 8601 timestamp
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Session Lifecycle

1. **Created:** When user logs in
2. **Used:** When refresh token is used to get new access token
3. **Expired:** After 7 days or when user logs out
4. **Cleaned:** Expired sessions are periodically deleted (TODO: implement cleanup job)

### Session Cleanup (Future)

```typescript
// Planned: Cloudflare Workers Cron job
export async function cleanupExpiredSessions(env: Env) {
  const db = getDb(env.DB);
  const now = new Date().toISOString();

  await db
    .delete(sessions)
    .where(lte(sessions.expiresAt, now))
    .run();
}
```

---

## Security Considerations

### Password Security

- ✅ **Bcrypt hashing** with cost factor 10
- ✅ **Minimum length:** 8 characters
- ✅ **No password in logs or responses**
- ✅ **Password hash never returned in API responses**

### Token Security

- ✅ **Access tokens:** Short-lived (15 minutes)
- ✅ **Refresh tokens:** Longer-lived but single-use per session
- ✅ **HTTP-only cookies:** Prevents XSS attacks
- ✅ **Secure flag:** HTTPS only in production
- ✅ **SameSite=Strict:** Prevents CSRF attacks
- ✅ **JWT signature verification:** Uses HS256 algorithm

### Common Attack Mitigations

**XSS (Cross-Site Scripting):**
- HTTP-only cookies prevent JavaScript access to tokens
- Content Security Policy headers (TODO: implement)

**CSRF (Cross-Site Request Forgery):**
- SameSite=Strict cookie attribute
- Origin validation (TODO: implement explicit origin checks)

**Session Hijacking:**
- Short-lived access tokens
- Refresh tokens stored in database (can be revoked)
- HTTPS enforced in production

**Brute Force:**
- Rate limiting on auth endpoints (TODO: implement)
- Account lockout after failed attempts (TODO: implement)

---

## Implementation Details

### JWT Configuration

```typescript
// Backend: src/utils/auth.ts
export const JWT_EXPIRY = '15m';           // Access token: 15 minutes
export const JWT_EXPIRY_SECONDS = 900;     // 15 * 60
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Sign token
export async function signToken(payload: JWTPayload, secret: string): Promise<string> {
  return await sign(payload, secret, 'HS256');
}

// Verify token
export async function verifyToken(token: string, secret: string): Promise<JWTPayload> {
  return await verify(token, secret, 'HS256') as JWTPayload;
}
```

### Cookie Configuration

```typescript
// Backend: src/utils/cookies.ts
export function createAuthCookie(
  name: string,
  value: string,
  maxAge: number,
  path: string = '/'
): string {
  const isProd = env.ENVIRONMENT === 'production';

  return `${name}=${value}; HttpOnly; ${isProd ? 'Secure;' : ''} SameSite=Strict; Max-Age=${maxAge}; Path=${path}`;
}
```

### Frontend API Client

```typescript
// Frontend: src/utils/api.ts
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // CRITICAL: Send cookies with requests
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Auto-refresh on 401
  if (response.status === 401) {
    const refreshed = await api.auth.refresh();
    if (refreshed) {
      // Retry original request
      return fetchAPI(endpoint, options);
    }
  }

  return response;
}
```

---

## Future Enhancements

- [ ] Email verification flow
- [ ] Password reset flow
- [ ] OAuth integration (Google, GitHub)
- [ ] Two-factor authentication (2FA)
- [ ] Rate limiting on auth endpoints
- [ ] Account lockout after failed login attempts
- [ ] Session cleanup cron job
- [ ] Explicit origin validation
- [ ] Content Security Policy headers
- [ ] Audit log for auth events

---

## See Also

- [API Reference](../api/api-reference.md) - Auth endpoint documentation
- [Database Schema](../api/database-schema.md) - Users and sessions tables
- [Security Best Practices](../operations/security.md) - Overall security guidelines
