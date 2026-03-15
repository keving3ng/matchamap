# Photo Upload System - Technical Guide

**Version:** 1.0
**Date:** October 14, 2025
**Status:** Backend Complete | Frontend Pending
**Related PR:** #211

---

## Overview

The Photo Upload System enables users to upload photos of matcha cafes, building a community-driven gallery for each cafe. Photos are stored in Cloudflare R2 (object storage) and undergo admin moderation before public display.

**Key Features:**
- ✅ Multipart form upload to R2
- ✅ Image validation (format, size, dimensions)
- ✅ Automatic thumbnail generation (placeholder)
- ✅ Moderation workflow (pending → approved/rejected)
- ✅ User ownership and deletion
- ✅ Admin moderation endpoints

---

## Architecture

### Components

```
┌──────────────────────────────────────────────────┐
│                   Frontend                       │
│  (Upload UI - Pending Implementation)           │
└─────────────┬────────────────────────────────────┘
              │ POST /api/photos/upload
              │ (multipart/form-data)
              ↓
┌──────────────────────────────────────────────────┐
│              Cloudflare Workers                  │
│  ┌────────────────────────────────────────────┐ │
│  │  routes/photos.ts                          │ │
│  │  - uploadPhoto()                           │ │
│  │  - validateImage()                         │ │
│  │  - generateThumbnail() [placeholder]       │ │
│  │  - getImageDimensions()                    │ │
│  └────────────────────────────────────────────┘ │
└──────┬──────────────────────┬────────────────────┘
       │                      │
       ↓                      ↓
┌──────────────┐      ┌──────────────────┐
│  R2 Bucket   │      │   D1 Database    │
│              │      │                  │
│ Full Images  │      │ review_photos    │
│ Thumbnails   │      │ - metadata       │
│              │      │ - moderation     │
└──────────────┘      └──────────────────┘
```

---

## Database Schema

### `review_photos` Table

```sql
CREATE TABLE review_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  cafe_id INTEGER NOT NULL,

  -- R2 Storage
  image_key TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  thumbnail_key TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Metadata
  caption TEXT,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  mime_type TEXT NOT NULL,

  -- Moderation
  moderation_status TEXT DEFAULT 'pending' CHECK(moderation_status IN ('pending', 'approved', 'rejected')),
  moderated_at TEXT,
  moderated_by INTEGER,
  moderation_notes TEXT,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE,
  FOREIGN KEY (moderated_by) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_review_photos_user ON review_photos (user_id);
CREATE INDEX idx_review_photos_cafe ON review_photos (cafe_id);
CREATE INDEX idx_review_photos_image_key ON review_photos (image_key);
CREATE INDEX idx_review_photos_status ON review_photos (moderation_status);
CREATE INDEX idx_review_photos_created_at ON review_photos (created_at);
```

**Key Changes from Original Schema (PR #211):**
- ❌ Removed `review_id` field (photos are standalone, not tied to reviews)
- ✅ Added `thumbnail_key` (separate R2 key for thumbnails)
- ✅ Added `moderation_notes` (admin feedback on rejected photos)
- ✅ Made `image_key` UNIQUE to prevent duplicates
- ✅ Removed check constraints on width/height/file_size

---

## API Endpoints

### Upload Photo

**Endpoint:** `POST /api/photos/upload`
**Auth:** Required (JWT)
**Rate Limit:** Write rate limit (10 requests/minute)

**Request:**
```http
POST /api/photos/upload HTTP/1.1
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

------WebKitFormBoundary
Content-Disposition: form-data; name="photo"; filename="matcha.jpg"
Content-Type: image/jpeg

<binary image data>
------WebKitFormBoundary
Content-Disposition: form-data; name="cafeId"

42
------WebKitFormBoundary
Content-Disposition: form-data; name="caption"

Amazing matcha latte with beautiful foam art!
------WebKitFormBoundary--
```

**Response (Success):**
```json
{
  "photo": {
    "id": 123,
    "userId": 5,
    "cafeId": 42,
    "imageKey": "photos/42/5/1697234567890-abc123.jpg",
    "imageUrl": "https://photos.matchamap.app/photos/42/5/1697234567890-abc123.jpg",
    "thumbnailKey": "thumbnails/42/5/1697234567890-xyz789.webp",
    "thumbnailUrl": "https://photos.matchamap.app/thumbnails/42/5/1697234567890-xyz789.webp",
    "caption": "Amazing matcha latte with beautiful foam art!",
    "width": 1920,
    "height": 1080,
    "fileSize": 234567,
    "mimeType": "image/jpeg",
    "moderationStatus": "pending",
    "createdAt": "2025-10-14T12:34:56.789Z"
  },
  "message": "Photo uploaded successfully. It will be reviewed before appearing publicly."
}
```

**Response (Error):**
```json
{
  "error": "File too large (max 5MB)"
}
```

**Validation Rules:**
- Max file size: 5MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Required fields: `photo`, `cafeId`
- Optional fields: `caption`

---

### Get Cafe Photos

**Endpoint:** `GET /api/cafes/:id/photos`
**Auth:** Not required
**Rate Limit:** Public rate limit (60 requests/minute)

**Response:**
```json
{
  "photos": [
    {
      "id": 123,
      "imageUrl": "https://photos.matchamap.app/photos/42/5/1697234567890-abc123.jpg",
      "thumbnailUrl": "https://photos.matchamap.app/thumbnails/42/5/1697234567890-xyz789.webp",
      "caption": "Amazing matcha latte with beautiful foam art!",
      "width": 1920,
      "height": 1080,
      "fileSize": 234567,
      "createdAt": "2025-10-14T12:34:56.789Z",
      "userId": 5,
      "username": "matchalover"
    }
  ]
}
```

**Notes:**
- Only returns photos with `moderation_status = 'approved'`
- Ordered by `created_at DESC`
- Limited to 50 photos per request

---

### Get User's Photos

**Endpoint:** `GET /api/users/me/photos`
**Auth:** Required (JWT)
**Rate Limit:** Auth rate limit (30 requests/minute)

**Response:**
```json
{
  "photos": [
    {
      "id": 123,
      "imageUrl": "https://photos.matchamap.app/photos/42/5/1697234567890-abc123.jpg",
      "thumbnailUrl": "https://photos.matchamap.app/thumbnails/42/5/1697234567890-xyz789.webp",
      "caption": "Amazing matcha latte with beautiful foam art!",
      "width": 1920,
      "height": 1080,
      "fileSize": 234567,
      "moderationStatus": "approved",
      "createdAt": "2025-10-14T12:34:56.789Z",
      "cafeId": 42,
      "cafeName": "Matcha Bar Toronto"
    }
  ]
}
```

**Notes:**
- Returns all photos uploaded by the authenticated user
- Includes photos in all moderation states (pending, approved, rejected)
- Ordered by `created_at DESC`
- Limited to 100 photos per request

---

### Delete Photo

**Endpoint:** `DELETE /api/photos/:id`
**Auth:** Required (JWT)
**Rate Limit:** Write rate limit (10 requests/minute)

**Response (Success):**
```json
{
  "message": "Photo deleted successfully"
}
```

**Response (Error):**
```json
{
  "error": "Photo not found or access denied"
}
```

**Notes:**
- Users can only delete their own photos
- Deletes both the full-size image and thumbnail from R2
- Removes database record

---

### Admin: Get Pending Photos

**Endpoint:** `GET /api/admin/photos`
**Auth:** Required (JWT + Admin role)
**Rate Limit:** Public rate limit (60 requests/minute)

**Response:**
```json
{
  "photos": [
    {
      "id": 124,
      "imageUrl": "https://photos.matchamap.app/photos/43/6/1697234567890-def456.jpg",
      "thumbnailUrl": "https://photos.matchamap.app/thumbnails/43/6/1697234567890-uvw012.webp",
      "caption": "Cozy cafe vibes",
      "width": 1024,
      "height": 768,
      "fileSize": 156789,
      "moderationStatus": "pending",
      "createdAt": "2025-10-14T12:45:00.000Z",
      "userId": 6,
      "username": "cafehunter",
      "cafeId": 43,
      "cafeName": "Zen Matcha"
    }
  ]
}
```

**Notes:**
- Only returns photos with `moderation_status = 'pending'`
- Ordered by `created_at DESC`
- Limited to 50 photos per request

---

### Admin: Moderate Photo

**Endpoint:** `PUT /api/admin/photos/:id/moderate`
**Auth:** Required (JWT + Admin role)
**Rate Limit:** Write rate limit (10 requests/minute)

**Request:**
```json
{
  "status": "approved",
  "notes": "Great photo showcasing the cafe's atmosphere"
}
```

**Response:**
```json
{
  "photo": {
    "id": 124,
    "moderationStatus": "approved",
    "moderatedAt": "2025-10-14T13:00:00.000Z",
    "moderatedBy": 1,
    "moderationNotes": "Great photo showcasing the cafe's atmosphere"
  },
  "message": "Photo approved successfully"
}
```

**Notes:**
- `status` must be either `"approved"` or `"rejected"`
- `notes` is optional
- Records admin user ID and timestamp
- Rejected photos remain in database for audit trail

---

## Image Processing

### Validation (`validateImage`)

**File Type Validation:**
```typescript
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
```

**File Size Validation:**
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

**Validation Flow:**
1. Check if file exists
2. Check MIME type against whitelist
3. Check file size ≤ 5MB
4. Check file is not empty (size > 0)

---

### Dimension Extraction (`getImageDimensions`)

Extracts image dimensions by parsing binary headers (no external dependencies):

**JPEG:** Parses SOF (Start of Frame) markers
**PNG:** Reads IHDR chunk at byte offset 16
**WebP:** Handles VP8, VP8L, and VP8X formats

**Example:**
```typescript
const dimensions = await getImageDimensions(arrayBuffer, 'image/jpeg');
// { width: 1920, height: 1080 }
```

---

### Thumbnail Generation (`generateThumbnail`)

**⚠️ Current Status: Placeholder Implementation**

The current implementation returns the full image as a "thumbnail":

```typescript
export async function generateThumbnail(buffer: ArrayBuffer, targetSize: number): Promise<ArrayBuffer> {
  console.warn(`[PLACEHOLDER] Thumbnail generation not implemented`);
  return buffer; // Returns full image
}
```

**Impact:**
- Thumbnails are the same size as full images
- Increased bandwidth usage
- Slower page loads
- Higher R2 storage costs

**TODO: Implement Proper Thumbnail Generation**

**Option 1: Sharp via WASM**
```typescript
import sharp from 'sharp-wasm';

export async function generateThumbnail(buffer: ArrayBuffer, targetSize: number): Promise<ArrayBuffer> {
  const thumbnail = await sharp(buffer)
    .resize(targetSize, targetSize, { fit: 'inside' })
    .webp({ quality: 80 })
    .toBuffer();
  return thumbnail.buffer;
}
```

**Option 2: Cloudflare Images Transform API**
```typescript
// Use Cloudflare's built-in image resizing
const thumbnailUrl = `${baseUrl}/${imageKey}?width=200&format=webp`;
```

**Option 3: Canvas API in Workers** (Limited support)
```typescript
// Requires Workers with HTMLRewriter or Browser Rendering API
```

**Recommendation:** Use Option 2 (Cloudflare Images Transform) for zero implementation effort and better performance.

---

## R2 Storage

### Bucket Configuration

**Production:**
```toml
[[r2_buckets]]
binding = "PHOTOS_BUCKET"
bucket_name = "matchamap-photos"
preview_bucket_name = "matchamap-photos-dev"
```

**Setup Commands:**
```bash
# Create buckets
npx wrangler r2 bucket create matchamap-photos
npx wrangler r2 bucket create matchamap-photos-dev

# Verify
npx wrangler r2 bucket list
```

---

### File Naming Conventions

**Full-size Image:**
```
photos/{cafeId}/{userId}/{timestamp}-{randomId}.{ext}
```

Example: `photos/42/5/1697234567890-abc123xyz.jpg`

**Thumbnail:**
```
thumbnails/{cafeId}/{userId}/{timestamp}-{randomId}.webp
```

Example: `thumbnails/42/5/1697234567890-def456uvw.webp`

**Key Generation:**
```typescript
const timestamp = Date.now();
const randomId = Math.random().toString(36).substring(2, 15);
const imageKey = `photos/${cafeId}/${userId}/${timestamp}-${randomId}.${extension}`;
```

---

### Upload Metadata

**HTTP Metadata:**
```typescript
await env.PHOTOS_BUCKET.put(imageKey, arrayBuffer, {
  httpMetadata: {
    contentType: 'image/jpeg',
    cacheControl: 'public, max-age=31536000', // 1 year
  },
  customMetadata: {
    userId: '5',
    cafeId: '42',
    uploadedAt: '2025-10-14T12:34:56.789Z',
    originalFilename: 'matcha.jpg',
  }
});
```

**Cache Strategy:**
- 1 year cache (`max-age=31536000`)
- Immutable files (unique keys prevent staleness)
- CDN distribution via Cloudflare

---

### Public URLs

**Default (without custom domain):**
```
https://photos.matchamap.app/{imageKey}
```

**With Custom Domain:**
Set `PHOTOS_BASE_URL` in `wrangler.toml`:
```toml
[vars]
PHOTOS_BASE_URL = "https://photos.matchamap.club"
```

Then URLs become:
```
https://photos.matchamap.club/{imageKey}
```

**Custom Domain Setup:**
1. Navigate to R2 bucket in Cloudflare Dashboard
2. Settings → Public Access → Connect Domain
3. Enter subdomain: `photos.matchamap.club`
4. Add DNS CNAME: `photos → matchamap-photos.r2.dev`

---

## Security

### Rate Limiting

**Upload Endpoint:**
- Rate limit: Write rate limit (10 requests/minute)
- Prevents spam uploads
- Per-user limit (based on JWT userId)

**Public Endpoints:**
- Rate limit: Public rate limit (60 requests/minute)
- Prevents API abuse

---

### Authentication

**Required for:**
- `POST /api/photos/upload`
- `GET /api/users/me/photos`
- `DELETE /api/photos/:id`
- All admin endpoints

**Implementation:**
```typescript
import { requireAuth } from '../middleware/auth';

router.post('/api/photos/upload', writeRateLimit(), requireAuth(), uploadPhoto);
```

---

### Authorization

**Ownership Checks:**
```typescript
// User can only delete their own photos
const photo = await db
  .select()
  .from(reviewPhotos)
  .where(
    and(
      eq(reviewPhotos.id, photoId),
      eq(reviewPhotos.userId, userId) // Ownership check
    )
  )
  .get();
```

**Admin Role Checks:**
```typescript
import { requireAdminAuth } from '../middleware/auth';

router.get('/api/admin/photos', requireAdminAuth(), getPhotosForModeration);
```

---

### Content Moderation

**Moderation Workflow:**

1. **Upload** → Photo created with `moderation_status = 'pending'`
2. **Admin Review** → Admin views pending photos via `/api/admin/photos`
3. **Decision** → Admin approves or rejects via `/api/admin/photos/:id/moderate`
4. **Public Display** → Only `approved` photos appear in `/api/cafes/:id/photos`

**Moderation States:**
- `pending` - Default state, awaiting review
- `approved` - Publicly visible
- `rejected` - Hidden from public, kept for audit

**Audit Trail:**
- Rejected photos remain in database
- `moderated_by` tracks admin who made decision
- `moderated_at` tracks when decision was made
- `moderation_notes` explains rejection reason

---

## Frontend Integration (Pending)

### Photo Upload UI

**Component:** `frontend/src/components/photos/PhotoUploadModal.tsx`

**Example Implementation:**
```typescript
const handleUpload = async (file: File, cafeId: number, caption?: string) => {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('cafeId', cafeId.toString());
  if (caption) formData.append('caption', caption);

  const response = await fetch(`${API_URL}/api/photos/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const result = await response.json();
  return result.photo;
};
```

---

### Photo Gallery UI

**Component:** `frontend/src/components/photos/PhotoGallery.tsx`

**Example Implementation:**
```typescript
const PhotoGallery: React.FC<{ cafeId: number }> = ({ cafeId }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      const response = await fetch(`${API_URL}/api/cafes/${cafeId}/photos`);
      const data = await response.json();
      setPhotos(data.photos);
    };
    fetchPhotos();
  }, [cafeId]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map(photo => (
        <img
          key={photo.id}
          src={photo.thumbnailUrl}
          alt={photo.caption}
          className="w-full h-32 object-cover rounded"
        />
      ))}
    </div>
  );
};
```

---

## Testing

### Manual Testing Checklist

**Upload Tests:**
- [ ] Upload valid JPEG image (< 5MB) → Success
- [ ] Upload valid PNG image (< 5MB) → Success
- [ ] Upload valid WebP image (< 5MB) → Success
- [ ] Upload image > 5MB → Error: "File too large"
- [ ] Upload GIF image → Error: "Invalid file type"
- [ ] Upload without cafeId → Error: "cafeId is required"
- [ ] Upload to non-existent cafe → Error: "Cafe not found"
- [ ] Upload without authentication → Error 401

**Moderation Tests:**
- [ ] Upload photo → `moderation_status = 'pending'`
- [ ] Pending photo not visible in `/api/cafes/:id/photos`
- [ ] Admin approves photo → Photo appears in gallery
- [ ] Admin rejects photo → Photo hidden from gallery
- [ ] Rejected photo still in database with notes

**Deletion Tests:**
- [ ] User deletes own photo → Success, R2 and DB deleted
- [ ] User tries to delete other's photo → Error 404
- [ ] Photo deletion removes both image and thumbnail from R2

**R2 Storage Tests:**
- [ ] Image uploaded to correct R2 path: `photos/{cafeId}/{userId}/...`
- [ ] Thumbnail uploaded to: `thumbnails/{cafeId}/{userId}/...`
- [ ] Image accessible via public URL
- [ ] Cache headers set correctly (`max-age=31536000`)

---

## Known Issues & Limitations

### 1. Placeholder Thumbnail Generation

**Issue:** Thumbnails are full-size images, not resized.

**Impact:**
- Increased bandwidth usage
- Slower page loads (thumbnails should be ~20KB, currently 200KB+)
- Higher R2 storage costs

**Solution:** Implement proper thumbnail generation (see "Thumbnail Generation" section)

---

### 2. HEIC Format Not Supported

**Issue:** iOS devices capture images in HEIC format by default, which is not supported.

**Impact:**
- iOS users may encounter "Invalid file type" errors
- Poor user experience for iPhone users

**Solution:**
- Add server-side HEIC → JPEG conversion
- Or prompt iOS users to change camera settings to JPEG
- Or add client-side conversion before upload

---

### 3. No Client-Side Image Compression

**Issue:** Users can upload unnecessarily large images (up to 5MB).

**Impact:**
- Slower uploads
- Higher R2 storage costs
- Longer processing times

**Solution:**
- Add client-side compression before upload (e.g., browser-image-compression)
- Reduce max file size after compression is implemented

---

### 4. No Duplicate Detection

**Issue:** Users can upload the same photo multiple times.

**Impact:**
- Wasted storage
- Duplicate photos in galleries

**Solution:**
- Add perceptual hash (pHash) comparison
- Or check file hash (MD5/SHA256) before upload
- Or add client-side UI to show existing photos

---

## Performance Optimization

### Current Performance

**Upload:**
- Time: ~500ms - 2s (depending on file size and location)
- Bottleneck: R2 upload + D1 write

**Retrieval:**
- Time: ~100ms - 300ms (global CDN)
- Bottleneck: D1 query + JSON serialization

---

### Optimization Strategies

**1. Client-Side Compression**
```typescript
import imageCompression from 'browser-image-compression';

const compressedFile = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
});
```

**2. Parallel R2 Uploads**
```typescript
await Promise.all([
  env.PHOTOS_BUCKET.put(imageKey, arrayBuffer, ...),
  env.PHOTOS_BUCKET.put(thumbnailKey, thumbnail, ...),
]);
```

**3. Lazy Loading Thumbnails**
```typescript
<img
  src={photo.thumbnailUrl}
  loading="lazy"
  alt={photo.caption}
/>
```

**4. CDN Caching**
- Already implemented: `max-age=31536000`
- Cloudflare CDN automatically caches R2 objects

---

## Monitoring & Observability

### Key Metrics to Track

**Upload Metrics:**
- Total photos uploaded (per day/week/month)
- Upload success rate
- Average upload time
- File size distribution

**Moderation Metrics:**
- Photos pending moderation
- Average moderation time
- Approval rate vs rejection rate

**Storage Metrics:**
- Total R2 storage used
- Storage growth rate
- Average file size

**Performance Metrics:**
- Upload duration (p50, p95, p99)
- API response time
- R2 GET latency

---

### Cloudflare Analytics

**R2 Analytics:**
```bash
# View R2 bucket stats
npx wrangler r2 bucket stats matchamap-photos
```

**Worker Logs:**
```bash
# Tail production logs
npx wrangler tail --env production
```

---

## Troubleshooting

### Issue: Upload Fails with "Failed to upload photo"

**Possible Causes:**
1. R2 bucket not created
2. R2 binding not configured in wrangler.toml
3. Network timeout

**Solution:**
```bash
# Verify R2 bucket exists
npx wrangler r2 bucket list

# Check wrangler.toml has correct binding
cat backend/wrangler.toml | grep -A 3 "r2_buckets"

# Check worker logs
npx wrangler tail --env production
```

---

### Issue: Photos Not Appearing in Gallery

**Possible Causes:**
1. Photo still pending moderation
2. Photo was rejected
3. GET endpoint not filtering correctly

**Solution:**
```bash
# Check photo moderation status in D1
npx wrangler d1 execute matchamap-db --remote \
  --command "SELECT id, moderation_status FROM review_photos WHERE cafe_id = 42"
```

---

### Issue: Thumbnail Is Full Size

**Expected Behavior:** This is a known limitation (see "Known Issues #1")

**Temporary Workaround:** Use CSS to resize thumbnails client-side

---

## Next Steps

### Phase 2C Frontend Implementation

**Priority 1: Photo Upload UI**
- [ ] Create `PhotoUploadModal` component
- [ ] Add file picker with drag-and-drop
- [ ] Display upload progress bar
- [ ] Show success/error messages
- [ ] Add caption input field

**Priority 2: Photo Gallery**
- [ ] Create `PhotoGallery` component
- [ ] Grid layout with lazy loading
- [ ] Lightbox for full-size viewing
- [ ] Display photo metadata (username, date)

**Priority 3: User Photo Management**
- [ ] "My Photos" page showing all uploads
- [ ] Display moderation status (pending/approved/rejected)
- [ ] Delete button for own photos
- [ ] Rejection reason display

**Priority 4: Admin Moderation UI**
- [ ] Admin panel showing pending photos
- [ ] Approve/Reject buttons
- [ ] Notes input for rejection reason
- [ ] Batch approval/rejection

---

### Phase 2C Infrastructure Improvements

**Priority 1: Implement Thumbnail Generation**
- [ ] Research Sharp WASM vs Cloudflare Images Transform
- [ ] Implement chosen solution
- [ ] Test thumbnail quality and performance
- [ ] Update placeholder warning logs

**Priority 2: HEIC Support**
- [ ] Add HEIC to allowed MIME types
- [ ] Implement server-side HEIC → JPEG conversion
- [ ] Test with iOS devices

**Priority 3: Client-Side Compression**
- [ ] Add browser-image-compression library
- [ ] Compress images before upload
- [ ] Reduce max file size to 2MB after compression

**Priority 4: Duplicate Detection**
- [ ] Implement perceptual hashing (pHash)
- [ ] Check duplicates before upload
- [ ] Show "Similar photo already uploaded" warning

---

## References

- **PR #211:** https://github.com/keving3ng/matchamap/pull/211
- **Issue #170:** https://github.com/keving3ng/matchamap/issues/170
- **Social Features Guide:** `docs/archive/social-features-guide.md` (archived; social out of scope)
- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **Cloudflare R2 Docs:** https://developers.cloudflare.com/r2/
- **Cloudflare Images Docs:** https://developers.cloudflare.com/images/

---

**Document Version:** 1.0
**Last Updated:** October 14, 2025
**Maintainers:** Engineering Team
**Status:** Backend Complete | Frontend Pending
