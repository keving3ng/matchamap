# API Reference

**Last Updated:** 2025-11-02
**Base URL:** `https://api.matchamap.app` (production) | `http://localhost:8787` (local)

This document provides a comprehensive reference for all MatchaMap API endpoints.

---

## Table of Contents

- [Authentication](#authentication)
- [Cafes](#cafes)
- [Drinks](#drinks)
- [Events](#events)
- [Cities](#cities)
- [User Profiles](#user-profiles)
- [Reviews](#reviews)
- [Photos](#photos)
- [Comments](#comments)
- [Favorites](#favorites)
- [Passport/Check-ins](#passportcheck-ins)
- [Badges](#badges)
- [Following](#following)
- [Leaderboards](#leaderboards)
- [Waitlist](#waitlist)
- [Admin](#admin)
- [Health](#health)

---

## General Information

### Authentication

Most endpoints require authentication via JWT tokens. Tokens are sent as HTTP-only cookies.

**Cookie Name:** `auth_token` (access token), `refresh_token` (refresh token)

**Token Expiry:**
- Access Token: 15 minutes
- Refresh Token: 7 days

### Response Format

All responses follow this structure:

```json
{
  "data": {},
  "error": "Error message (if error)",
  "message": "Success message (if applicable)"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal Server Error |

### Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit` - Number of items per page (default: 50, max: 100)
- `offset` - Number of items to skip (default: 0)

**Response includes:**
```json
{
  "data": [...],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

---

## Authentication

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "matcha_lover",
  "password": "securePassword123"
}
```

**Validation Rules:**
- Email: Valid email format
- Username: 3-20 characters, alphanumeric + underscore
- Password: Minimum 8 characters

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "matcha_lover",
    "role": "user",
    "isEmailVerified": false,
    "createdAt": "2025-11-02T12:00:00Z",
    "updatedAt": "2025-11-02T12:00:00Z"
  }
}
```

**Errors:**
- 400: Validation error or user already exists

---

### Login

Authenticate a user and receive JWT tokens.

**Endpoint:** `POST /api/auth/login`

**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
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
- `auth_token` - Access token (15min, HTTP-only, secure)
- `refresh_token` - Refresh token (7 days, HTTP-only, secure)

**Errors:**
- 400: Invalid credentials
- 401: Incorrect email or password

---

### Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Authentication:** Refresh token cookie required

**Request Body:** None (uses cookie)

**Response (200):**
```json
{
  "message": "Token refreshed successfully"
}
```

**Cookies Set:**
- `auth_token` - New access token (15min)

**Errors:**
- 401: Invalid or expired refresh token

---

### Logout

Invalidate the current session.

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Cookies Cleared:**
- `auth_token`
- `refresh_token`

---

## Cafes

### List Cafes

Get a list of cafes with optional filtering and search.

**Endpoint:** `GET /api/cafes`

**Authentication:** None

**Query Parameters:**
- `city` (optional) - Filter by city (toronto, montreal, tokyo)
- `minScore` (optional) - Minimum expert score (0-10)
- `maxPrice` (optional) - Maximum price in cents
- `userMinRating` (optional) - Minimum user rating (0-10)
- `search` (optional) - Search query (max 100 chars)
- `limit` (optional) - Page size (default: 50, max: 100)
- `offset` (optional) - Pagination offset (default: 0)

**Example Request:**
```
GET /api/cafes?city=toronto&minScore=8&search=latte&limit=20&offset=0
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Matcha Cafe",
      "slug": "matcha-cafe-toronto",
      "latitude": 43.6532,
      "longitude": -79.3832,
      "city": "toronto",
      "ambianceScore": 8.5,
      "displayScore": 9.0,
      "userRatingAvg": 8.7,
      "userRatingCount": 42,
      "quickNote": "Best matcha in Toronto!",
      "review": "Full review text...",
      "address": "123 Queen St W",
      "link": "https://maps.google.com/...",
      "instagram": "@matchacafe",
      "drinks": [
        {
          "id": 1,
          "cafeId": 1,
          "name": "Iced Matcha Latte",
          "score": 9.0,
          "priceAmount": 650,
          "priceCurrency": "CAD",
          "isDefault": true
        }
      ],
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-10-01T15:30:00Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

### Get Cafe by ID

Get detailed information about a specific cafe.

**Endpoint:** `GET /api/cafes/:id`

**Authentication:** None

**Path Parameters:**
- `id` - Cafe ID

**Response (200):**
```json
{
  "id": 1,
  "name": "Matcha Cafe",
  "slug": "matcha-cafe-toronto",
  "latitude": 43.6532,
  "longitude": -79.3832,
  "city": "toronto",
  "ambianceScore": 8.5,
  "displayScore": 9.0,
  "userRatingAvg": 8.7,
  "userRatingCount": 42,
  "quickNote": "Best matcha in Toronto!",
  "review": "Full review text...",
  "address": "123 Queen St W",
  "link": "https://maps.google.com/...",
  "instagram": "@matchacafe",
  "drinks": [...],
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-10-01T15:30:00Z"
}
```

**Errors:**
- 404: Cafe not found

---

### Create Cafe (Admin)

Create a new cafe.

**Endpoint:** `POST /api/admin/cafes`

**Authentication:** Required (admin role)

**Request Body:**
```json
{
  "name": "New Matcha Cafe",
  "slug": "new-matcha-cafe-toronto",
  "latitude": 43.6532,
  "longitude": -79.3832,
  "city": "toronto",
  "link": "https://maps.google.com/...",
  "quickNote": "Amazing new spot!",
  "review": "Full review...",
  "ambianceScore": 8.0,
  "address": "456 King St",
  "instagram": "@newcafe"
}
```

**Response (201):**
```json
{
  "message": "Cafe created successfully",
  "cafe": { /* created cafe object */ }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Not admin
- 409: Slug already exists

---

### Update Cafe (Admin)

Update an existing cafe.

**Endpoint:** `PUT /api/admin/cafes/:id`

**Authentication:** Required (admin role)

**Request Body:** Partial cafe object (only fields to update)

**Response (200):**
```json
{
  "message": "Cafe updated successfully",
  "cafe": { /* updated cafe object */ }
}
```

---

### Delete Cafe (Admin)

Soft delete a cafe (sets deletedAt timestamp).

**Endpoint:** `DELETE /api/admin/cafes/:id`

**Authentication:** Required (admin role)

**Response (200):**
```json
{
  "message": "Cafe deleted successfully"
}
```

---

## Drinks

### Create Drink (Admin)

Add a drink to a cafe.

**Endpoint:** `POST /api/admin/cafes/:cafeId/drinks`

**Authentication:** Required (admin role)

**Request Body:**
```json
{
  "name": "Iced Matcha Latte",
  "score": 9.0,
  "priceAmount": 650,
  "priceCurrency": "CAD",
  "gramsUsed": 2,
  "isDefault": true,
  "notes": "Made with ceremonial grade matcha"
}
```

**Response (201):**
```json
{
  "message": "Drink created successfully",
  "drink": { /* created drink object */ }
}
```

---

### Update Drink (Admin)

Update an existing drink.

**Endpoint:** `PUT /api/admin/drinks/:id`

**Authentication:** Required (admin role)

**Request Body:** Partial drink object

**Response (200):**
```json
{
  "message": "Drink updated successfully",
  "drink": { /* updated drink object */ }
}
```

---

### Delete Drink (Admin)

Delete a drink.

**Endpoint:** `DELETE /api/admin/drinks/:id`

**Authentication:** Required (admin role)

**Response (200):**
```json
{
  "message": "Drink deleted successfully"
}
```

---

## Events

### List Events

Get upcoming events.

**Endpoint:** `GET /api/events`

**Authentication:** None

**Query Parameters:**
- `startDate` (optional) - Filter events after this date (ISO format)
- `endDate` (optional) - Filter events before this date
- `featured` (optional) - Filter featured events (true/false)
- `limit` (optional) - Page size (default: 50, max: 100)
- `offset` (optional) - Pagination offset

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Matcha Tasting Workshop",
      "date": "2025-11-15",
      "time": "14:00",
      "venue": "Matcha Cafe",
      "location": "123 Queen St W, Toronto",
      "description": "Learn about different grades of matcha...",
      "link": "@matchacafe",
      "price": "$45",
      "featured": true,
      "published": true,
      "cafeId": 1,
      "createdAt": "2025-11-01T10:00:00Z"
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

---

### Get Event by ID

Get event details.

**Endpoint:** `GET /api/events/:id`

**Authentication:** None

**Response (200):**
```json
{
  "id": 1,
  "title": "Matcha Tasting Workshop",
  ...
}
```

---

### Create Event (Admin)

Create a new event.

**Endpoint:** `POST /api/admin/events`

**Authentication:** Required (admin role)

**Request Body:**
```json
{
  "title": "Matcha Tasting Workshop",
  "date": "2025-11-15",
  "time": "14:00",
  "venue": "Matcha Cafe",
  "location": "123 Queen St W, Toronto",
  "description": "Learn about different grades of matcha...",
  "link": "@matchacafe",
  "price": "$45",
  "featured": true,
  "published": true,
  "cafeId": 1
}
```

**Response (201):**
```json
{
  "message": "Event created successfully",
  "event": { /* created event object */ }
}
```

---

## Cities

### List Cities

Get list of all cities with cafe counts.

**Endpoint:** `GET /api/cities`

**Authentication:** None

**Response (200):**
```json
{
  "cities": [
    {
      "city": "toronto",
      "cafe_count": 45
    },
    {
      "city": "montreal",
      "cafe_count": 12
    },
    {
      "city": "tokyo",
      "cafe_count": 8
    }
  ]
}
```

---

## User Profiles

### Get My Profile

Get the authenticated user's profile.

**Endpoint:** `GET /api/profile`

**Authentication:** Required

**Response (200):**
```json
{
  "id": 1,
  "userId": 1,
  "displayName": "Matcha Lover",
  "bio": "Exploring the best matcha in Toronto",
  "avatarUrl": "https://photos.matchamap.app/avatars/user1.jpg",
  "location": "Toronto, ON",
  "instagram": "@matchafan",
  "tiktok": "@matchafan",
  "website": "https://matchablog.com",
  "isPublic": true,
  "showActivity": true,
  "totalReviews": 15,
  "totalCheckins": 28,
  "totalPhotos": 42,
  "totalFavorites": 10,
  "passportCompletion": 62.2,
  "reputationScore": 850,
  "followerCount": 45,
  "followingCount": 32,
  "privacySettings": {
    "isPublic": true,
    "showActivity": true,
    "showFollowers": true
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-11-02T12:00:00Z"
}
```

---

### Update My Profile

Update the authenticated user's profile.

**Endpoint:** `PUT /api/profile`

**Authentication:** Required

**Request Body:**
```json
{
  "displayName": "Matcha Enthusiast",
  "bio": "Updated bio...",
  "location": "Toronto, ON",
  "instagram": "@newhandle",
  "preferences": {
    "favoriteStyle": "iced",
    "dietaryRestrictions": ["vegan"]
  }
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "profile": { /* updated profile object */ }
}
```

---

### Get Public Profile

Get a public user profile by username.

**Endpoint:** `GET /api/profile/:username`

**Authentication:** None

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "matcha_lover",
    "displayName": "Matcha Lover",
    "bio": "Exploring the best matcha in Toronto",
    "avatarUrl": "...",
    "location": "Toronto, ON",
    "joinedAt": "2025-01-15T10:00:00Z",
    "stats": {
      "totalReviews": 15,
      "totalCheckins": 28,
      "totalPhotos": 42,
      "passportCompletion": 62.2,
      "reputationScore": 850,
      "followerCount": 45,
      "followingCount": 32
    },
    "badges": [
      {
        "type": "passport_5",
        "name": "Explorer",
        "description": "Visited 5 cafes",
        "earnedAt": "2025-02-01T10:00:00Z"
      }
    ],
    "social": {
      "instagram": "@matchafan",
      "tiktok": "@matchafan",
      "website": "https://matchablog.com"
    }
  }
}
```

**Errors:**
- 404: User not found
- 403: Profile is private

---

## Reviews

### List Reviews for Cafe

Get all reviews for a specific cafe.

**Endpoint:** `GET /api/cafes/:cafeId/reviews`

**Authentication:** None

**Query Parameters:**
- `limit` (optional) - Page size (default: 20, max: 50)
- `offset` (optional) - Pagination offset

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "userId": 1,
      "cafeId": 1,
      "overallRating": 9.0,
      "matchaQualityRating": 9.5,
      "ambianceRating": 8.5,
      "serviceRating": 8.0,
      "valueRating": 8.5,
      "title": "Amazing matcha!",
      "content": "The best matcha latte I've ever had...",
      "tags": ["creamy", "rich", "authentic"],
      "visitDate": "2025-10-15",
      "isPublic": true,
      "isFeatured": false,
      "moderationStatus": "approved",
      "helpfulCount": 12,
      "createdAt": "2025-10-20T10:00:00Z",
      "user": {
        "id": 1,
        "username": "matcha_lover",
        "displayName": "Matcha Lover",
        "avatarUrl": "..."
      },
      "photos": [
        {
          "id": 1,
          "imageUrl": "https://photos.matchamap.app/reviews/1.jpg",
          "thumbnailUrl": "https://photos.matchamap.app/reviews/1_thumb.jpg",
          "caption": "Perfect color and texture"
        }
      ]
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

---

### Create Review

Create a review for a cafe.

**Endpoint:** `POST /api/cafes/:cafeId/reviews`

**Authentication:** Required

**Request Body:**
```json
{
  "overallRating": 9.0,
  "matchaQualityRating": 9.5,
  "ambianceRating": 8.5,
  "serviceRating": 8.0,
  "valueRating": 8.5,
  "title": "Amazing matcha!",
  "content": "The best matcha latte I've ever had...",
  "tags": ["creamy", "rich", "authentic"],
  "visitDate": "2025-10-15",
  "isPublic": true
}
```

**Response (201):**
```json
{
  "message": "Review created successfully",
  "review": { /* created review object */ }
}
```

**Errors:**
- 400: Validation error
- 409: User already reviewed this cafe

---

### Update Review

Update an existing review.

**Endpoint:** `PUT /api/reviews/:id`

**Authentication:** Required (must be review author)

**Request Body:** Partial review object

**Response (200):**
```json
{
  "message": "Review updated successfully",
  "review": { /* updated review object */ }
}
```

---

### Delete Review

Delete a review.

**Endpoint:** `DELETE /api/reviews/:id`

**Authentication:** Required (must be review author or admin)

**Response (200):**
```json
{
  "message": "Review deleted successfully"
}
```

---

### Mark Review as Helpful

Mark a review as helpful.

**Endpoint:** `POST /api/reviews/:id/helpful`

**Authentication:** Required

**Response (200):**
```json
{
  "message": "Review marked as helpful"
}
```

**Errors:**
- 409: Already marked helpful by this user

---

## Photos

### Upload Photo

Upload a photo for a cafe review.

**Endpoint:** `POST /api/photos/upload`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Form Data:**
- `photo` (file) - Image file (JPEG, PNG, WebP)
- `cafeId` (number) - Cafe ID
- `reviewId` (number, optional) - Review ID
- `caption` (string, optional) - Photo caption

**Validation:**
- Max file size: 10MB
- Allowed formats: JPEG, PNG, WebP
- Max dimensions: 4000x4000px

**Response (201):**
```json
{
  "message": "Photo uploaded successfully",
  "photo": {
    "id": 1,
    "imageUrl": "https://photos.matchamap.app/reviews/abc123.jpg",
    "thumbnailUrl": "https://photos.matchamap.app/reviews/abc123_thumb.jpg",
    "caption": "Perfect matcha color",
    "width": 1920,
    "height": 1080,
    "fileSize": 245678,
    "moderationStatus": "pending",
    "createdAt": "2025-11-02T12:00:00Z"
  }
}
```

**Errors:**
- 400: Invalid file type or size
- 413: File too large

---

### List Photos for Cafe

Get all approved photos for a cafe.

**Endpoint:** `GET /api/cafes/:cafeId/photos`

**Authentication:** None

**Query Parameters:**
- `limit` (optional) - Page size (default: 50, max: 100)
- `offset` (optional) - Pagination offset

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "imageUrl": "https://photos.matchamap.app/reviews/abc123.jpg",
      "thumbnailUrl": "https://photos.matchamap.app/reviews/abc123_thumb.jpg",
      "caption": "Perfect matcha color",
      "username": "matcha_lover",
      "createdAt": "2025-11-02T12:00:00Z"
    }
  ],
  "total": 128,
  "limit": 50,
  "offset": 0
}
```

---

## Comments

### List Comments for Review

Get all comments for a review.

**Endpoint:** `GET /api/reviews/:reviewId/comments`

**Authentication:** None

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "reviewId": 1,
      "userId": 2,
      "content": "Great review! I agree completely.",
      "likeCount": 5,
      "moderationStatus": "approved",
      "createdAt": "2025-10-21T10:00:00Z",
      "user": {
        "id": 2,
        "username": "cafe_explorer",
        "displayName": "Cafe Explorer",
        "avatarUrl": "..."
      },
      "replies": [
        {
          "id": 2,
          "parentCommentId": 1,
          "content": "Thanks!",
          "likeCount": 2,
          "createdAt": "2025-10-21T11:00:00Z",
          "user": { /* ... */ }
        }
      ]
    }
  ]
}
```

---

### Create Comment

Add a comment to a review.

**Endpoint:** `POST /api/reviews/:reviewId/comments`

**Authentication:** Required

**Request Body:**
```json
{
  "content": "Great review! I agree completely.",
  "parentCommentId": null
}
```

**Response (201):**
```json
{
  "message": "Comment created successfully",
  "comment": { /* created comment object */ }
}
```

---

### Like Comment

Like a comment.

**Endpoint:** `POST /api/comments/:id/like`

**Authentication:** Required

**Response (200):**
```json
{
  "message": "Comment liked successfully"
}
```

---

## Favorites

### List My Favorites

Get the authenticated user's favorite cafes.

**Endpoint:** `GET /api/favorites`

**Authentication:** Required

**Response (200):**
```json
{
  "favorites": [
    {
      "id": 1,
      "userId": 1,
      "cafeId": 1,
      "notes": "My go-to spot for matcha lattes",
      "sortOrder": 0,
      "createdAt": "2025-01-20T10:00:00Z",
      "cafe": { /* full cafe object */ }
    }
  ]
}
```

---

### Add Favorite

Add a cafe to favorites.

**Endpoint:** `POST /api/favorites`

**Authentication:** Required

**Request Body:**
```json
{
  "cafeId": 1,
  "notes": "My go-to spot for matcha lattes"
}
```

**Response (201):**
```json
{
  "message": "Cafe added to favorites",
  "favorite": { /* created favorite object */ }
}
```

**Errors:**
- 409: Cafe already in favorites

---

### Remove Favorite

Remove a cafe from favorites.

**Endpoint:** `DELETE /api/favorites/:cafeId`

**Authentication:** Required

**Response (200):**
```json
{
  "message": "Cafe removed from favorites"
}
```

---

## Passport/Check-ins

### Get My Check-ins

Get the authenticated user's check-in history.

**Endpoint:** `GET /api/passport/checkins`

**Authentication:** Required

**Response (200):**
```json
{
  "checkins": [
    {
      "id": 1,
      "userId": 1,
      "cafeId": 1,
      "visitedAt": "2025-10-15T14:30:00Z",
      "notes": "Great experience!",
      "cafe": { /* full cafe object */ }
    }
  ],
  "totalCafes": 28,
  "totalCheckIns": 28,
  "passportCompletion": 62.2
}
```

---

### Check In

Check in to a cafe.

**Endpoint:** `POST /api/passport/checkin`

**Authentication:** Required

**Request Body:**
```json
{
  "cafeId": 1,
  "notes": "Great experience!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Checked in successfully",
  "checkIn": { /* created check-in object */ }
}
```

**Errors:**
- 409: Already checked in to this cafe

---

## Badges

### Get My Badges

Get the authenticated user's earned badges.

**Endpoint:** `GET /api/badges`

**Authentication:** Required

**Response (200):**
```json
{
  "badges": [
    {
      "id": 1,
      "userId": 1,
      "badgeKey": "passport_5",
      "badgeCategory": "passport",
      "earnedAt": "2025-02-01T10:00:00Z",
      "progressValue": 5,
      "definition": {
        "key": "passport_5",
        "category": "passport",
        "name": "Explorer",
        "description": "Visited 5 cafes",
        "icon": "🗺️",
        "threshold": 5
      }
    }
  ]
}
```

---

### Get Badge Progress

Get progress towards unearned badges.

**Endpoint:** `GET /api/badges/progress`

**Authentication:** Required

**Response (200):**
```json
{
  "progress": [
    {
      "badge": {
        "key": "passport_10",
        "name": "Adventurer",
        "description": "Visited 10 cafes",
        "threshold": 10
      },
      "currentValue": 7,
      "targetValue": 10,
      "progress": 0.7,
      "isEligible": false
    }
  ]
}
```

---

## Following

### Get Followers

Get a user's followers.

**Endpoint:** `GET /api/following/followers/:userId`

**Authentication:** None (if profile is public)

**Response (200):**
```json
{
  "followers": [
    {
      "id": 2,
      "username": "cafe_explorer",
      "displayName": "Cafe Explorer",
      "avatarUrl": "...",
      "followedAt": "2025-03-15T10:00:00Z"
    }
  ],
  "total": 45
}
```

---

### Follow User

Follow another user.

**Endpoint:** `POST /api/following/follow/:userId`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "User followed successfully"
}
```

**Errors:**
- 400: Cannot follow yourself
- 409: Already following user

---

### Unfollow User

Unfollow a user.

**Endpoint:** `POST /api/following/unfollow/:userId`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "User unfollowed successfully"
}
```

---

## Leaderboards

### Get Check-ins Leaderboard

Get top users by check-in count.

**Endpoint:** `GET /api/leaderboards/checkins`

**Authentication:** None

**Query Parameters:**
- `period` (optional) - Time period (all, month, week) - default: all
- `limit` (optional) - Number of results (default: 10, max: 50)

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": 1,
      "username": "matcha_lover",
      "displayName": "Matcha Lover",
      "avatarUrl": "...",
      "checkinCount": 45,
      "passportCompletion": 100
    }
  ],
  "period": "all",
  "generatedAt": "2025-11-02T12:00:00Z"
}
```

---

## Waitlist

### Join Waitlist

Join the beta waitlist.

**Endpoint:** `POST /api/waitlist/join`

**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com",
  "referralSource": "instagram"
}
```

**Response (201):**
```json
{
  "message": "Successfully joined waitlist",
  "position": 1234
}
```

**Errors:**
- 409: Email already on waitlist
- 400: Suspected fraud (rate limiting, disposable email)

---

## Admin

### List Users (Admin)

Get list of all users.

**Endpoint:** `GET /api/admin/users`

**Authentication:** Required (admin role)

**Query Parameters:**
- `search` (optional) - Search by email or username
- `limit`, `offset` - Pagination

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "username": "matcha_lover",
      "role": "user",
      "isEmailVerified": true,
      "lastActiveAt": "2025-11-02T10:00:00Z",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1234,
  "limit": 50,
  "offset": 0
}
```

---

### Update User Role (Admin)

Promote/demote a user.

**Endpoint:** `PUT /api/admin/users/:id/role`

**Authentication:** Required (admin role)

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response (200):**
```json
{
  "message": "User role updated successfully",
  "user": { /* updated user object */ }
}
```

---

### Moderate Photo (Admin)

Approve or reject a user photo.

**Endpoint:** `PUT /api/admin/photos/:id/moderate`

**Authentication:** Required (admin role)

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Photo looks good"
}
```

**Response (200):**
```json
{
  "message": "Photo moderation updated",
  "photo": { /* updated photo object */ }
}
```

---

### Get Waitlist Analytics (Admin)

Get waitlist statistics.

**Endpoint:** `GET /api/admin/waitlist`

**Authentication:** Required (admin role)

**Response (200):**
```json
{
  "waitlist": [...],
  "total": 1234,
  "analytics": {
    "totalSignups": 1234,
    "dailySignups": 15,
    "weeklySignups": 89,
    "conversionRate": 0.12,
    "suspectedFraud": 23
  }
}
```

---

## Health

### Health Check

Check API health status.

**Endpoint:** `GET /api/health`

**Authentication:** None

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-02T12:00:00Z",
  "version": "2.0.0"
}
```

---

## Rate Limiting

Rate limiting is applied per IP address:

- **Public endpoints:** 100 requests/minute
- **Authenticated endpoints:** 200 requests/minute
- **Upload endpoints:** 10 requests/minute

**Rate limit headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698850000
```

---

## CORS

CORS is enabled for:
- Production: `https://matchamap.app`
- Development: `http://localhost:5173`

---

## See Also

- [Database Schema Reference](database-schema.md) - Complete database schema
- [Photo Storage Guide](photo-storage.md) - R2 photo storage setup
- [Authentication Flow](../architecture/auth-flow.md) - JWT authentication details
