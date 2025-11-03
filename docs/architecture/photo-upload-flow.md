# Photo Upload Flow

**Last Updated:** 2025-11-02

This document describes the architecture and flow for user photo uploads in MatchaMap.

---

## Quick Reference

**See comprehensive guide:** [Photo Upload System - Technical Guide](../photo-upload-guide.md)

This document provides a high-level overview of the photo upload architecture. For detailed implementation, API specs, and examples, refer to the full technical guide above.

---

## Architecture Overview

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         │ 1. Select photo file
         │
         ↓
┌─────────────────────────────────┐
│  Frontend (React Component)     │
│  - Photo upload form            │
│  - Image preview                │
│  - Caption input                │
└────────┬────────────────────────┘
         │
         │ 2. POST /api/photos/upload
         │    Content-Type: multipart/form-data
         │    {photo: File, cafeId: number, caption: string}
         ↓
┌──────────────────────────────────────────────┐
│   Cloudflare Workers (Backend)               │
│                                              │
│   Step 1: Validate Request                  │
│   - Check authentication                    │
│   - Validate multipart data                 │
│                                              │
│   Step 2: Validate Image                    │
│   - Check file type (JPEG, PNG, WebP)       │
│   - Check file size (< 10MB)                │
│   - Check dimensions (< 4000x4000px)        │
│                                              │
│   Step 3: Generate Keys                     │
│   - image_key: reviews/{uuid}.jpg           │
│   - thumbnail_key: reviews/{uuid}_thumb.jpg │
│                                              │
│   Step 4: Upload to R2                      │
│   - Upload full image                       │
│   - Upload thumbnail (200px) [future]       │
│                                              │
│   Step 5: Store Metadata                    │
│   - Insert into review_photos table         │
│   - Set moderation_status = 'pending'       │
│                                              │
└────┬─────────────────────┬───────────────────┘
     │                     │
     │                     │
     ↓                     ↓
┌────────────────┐   ┌──────────────────────┐
│  R2 Bucket     │   │  D1 Database         │
│                │   │                      │
│  Full Image    │   │  review_photos table │
│  Thumbnail     │   │  - id, user_id       │
│                │   │  - cafe_id           │
│                │   │  - image_key         │
│                │   │  - image_url         │
│                │   │  - moderation_status │
└────────────────┘   └──────────────────────┘
         │
         │
         ↓
┌─────────────────────────────────┐
│  Admin Moderation Queue         │
│  - Review photos                │
│  - Approve/Reject               │
│  - Add moderation notes         │
└─────────────────────────────────┘
         │
         │ PUT /api/admin/photos/:id/moderate
         │ {status: 'approved', notes: '...'}
         ↓
┌─────────────────────────────────┐
│  Public Gallery                 │
│  - Display approved photos      │
│  - Filter by cafe               │
│  - Sort by date                 │
└─────────────────────────────────┘
```

---

## Upload Flow Step-by-Step

### 1. User Selects Photo

```typescript
// Frontend: User selects file
<input
  type="file"
  accept="image/jpeg,image/png,image/webp"
  onChange={handleFileSelect}
/>
```

### 2. Frontend Validation

```typescript
// Check file size client-side (10MB limit)
if (file.size > 10 * 1024 * 1024) {
  alert('File too large. Maximum size is 10MB.');
  return;
}

// Check file type
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!allowedTypes.includes(file.type)) {
  alert('Invalid file type. Please upload JPEG, PNG, or WebP.');
  return;
}
```

### 3. Upload to Backend

```typescript
// Create FormData
const formData = new FormData();
formData.append('photo', file);
formData.append('cafeId', cafeId.toString());
formData.append('caption', caption);

// Upload
const response = await fetch('/api/photos/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include', // Include auth cookies
});
```

### 4. Backend Processing

```typescript
// Backend: routes/photos.ts

// 1. Extract file from multipart data
const formData = await request.formData();
const photo = formData.get('photo') as File;

// 2. Validate image
validateImage(photo); // Checks type, size, dimensions

// 3. Generate unique key
const imageKey = `reviews/${crypto.randomUUID()}.${ext}`;

// 4. Upload to R2
await env.PHOTOS_BUCKET.put(imageKey, await photo.arrayBuffer(), {
  httpMetadata: {
    contentType: photo.type,
  },
});

// 5. Store metadata in D1
await db.insert(reviewPhotos).values({
  userId: user.id,
  cafeId: cafeId,
  imageKey: imageKey,
  imageUrl: `https://photos.matchamap.app/${imageKey}`,
  moderationStatus: 'pending',
  width: dimensions.width,
  height: dimensions.height,
  fileSize: photo.size,
  mimeType: photo.type,
});
```

---

## Moderation Flow

### Admin Reviews Photo

```
1. Admin accesses moderation queue
   GET /api/admin/photos?status=pending

2. View photo details
   - Image preview
   - User info
   - Cafe info
   - Upload date

3. Approve or Reject
   PUT /api/admin/photos/:id/moderate
   {
     "status": "approved",
     "notes": "Looks good!"
   }

4. Update database
   - Set moderation_status
   - Set moderated_at timestamp
   - Set moderated_by (admin user ID)
   - Store moderation_notes
```

### Auto-moderation (Future)

- Content moderation API (Cloudflare AI)
- NSFW detection
- Image quality checks
- Duplicate detection

---

## Retrieval Flow

### Get Photos for Cafe

```
User views cafe detail page
    ↓
GET /api/cafes/:cafeId/photos
    ↓
Backend queries D1:
  SELECT * FROM review_photos
  WHERE cafe_id = :cafeId
    AND moderation_status = 'approved'
  ORDER BY created_at DESC
    ↓
Return photo URLs
    ↓
Frontend displays gallery
```

### Image URLs

**Full Image:**
```
https://photos.matchamap.app/reviews/abc-123-def.jpg
```

**Thumbnail:**
```
https://photos.matchamap.app/reviews/abc-123-def_thumb.jpg
```

---

## Storage Structure

### R2 Bucket: `matchamap-photos`

```
/reviews/
  ├── abc-123-def.jpg           (Full image)
  ├── abc-123-def_thumb.jpg     (Thumbnail - 200px width)
  ├── xyz-456-ghi.jpg
  ├── xyz-456-ghi_thumb.jpg
  └── ...

/avatars/                        (Future)
  ├── user-1.jpg
  └── ...
```

### Naming Convention

```
{category}/{uuid}.{extension}

Examples:
- reviews/550e8400-e29b-41d4-a716-446655440000.jpg
- reviews/550e8400-e29b-41d4-a716-446655440000_thumb.jpg
- avatars/user-123.jpg
```

---

## Validation Rules

### File Type

**Allowed:**
- `image/jpeg`
- `image/png`
- `image/webp`

**Rejected:**
- GIF, BMP, TIFF
- SVG (security risk)
- Any non-image files

### File Size

**Maximum:** 10MB (10,485,760 bytes)

**Rationale:**
- Balance quality vs upload time
- Prevent storage abuse
- Mobile network friendly

### Dimensions

**Maximum:** 4000 x 4000 pixels

**Minimum:** 200 x 200 pixels (recommended)

**Rationale:**
- Prevent extremely large images
- Ensure image is viewable
- Balance quality vs performance

---

## Performance Considerations

### Upload Optimization

- **Client-side compression:** Future enhancement
- **Progress indicator:** Show upload progress
- **Retry logic:** Auto-retry on network errors

### Retrieval Optimization

- **CDN caching:** R2 behind Cloudflare CDN
- **Lazy loading:** Load images as user scrolls
- **Thumbnail first:** Show thumbnail, load full on click
- **WebP format:** Better compression than JPEG

### Storage Optimization

- **Thumbnail generation:** Reduce bandwidth for galleries
- **Image compression:** Lossy compression for non-critical quality
- **Cleanup job:** Delete orphaned R2 objects (future)

---

## Security Considerations

### Upload Security

- ✅ **Authentication required:** Only logged-in users can upload
- ✅ **File type validation:** Prevent executable uploads
- ✅ **Size limits:** Prevent storage abuse
- ✅ **Dimension limits:** Prevent memory issues
- ✅ **Rate limiting:** 10 uploads/minute per user (future)

### Storage Security

- ✅ **Unique keys:** UUID prevents guessing
- ✅ **Moderation queue:** Photos not public until approved
- ⏳ **Signed URLs:** For private/pending photos (future)
- ⏳ **CORS configuration:** Prevent hotlinking (future)

### Privacy

- ✅ **User ownership:** Users can delete their photos
- ✅ **Moderation notes:** Only visible to admins
- ⏳ **EXIF stripping:** Remove location data (future)

---

## Error Handling

### Common Errors

| Error | Status | Message |
|-------|--------|---------|
| File too large | 400 | "File size exceeds 10MB limit" |
| Invalid type | 400 | "Invalid file type. Allowed: JPEG, PNG, WebP" |
| Dimensions too large | 400 | "Image dimensions exceed 4000x4000px" |
| Not authenticated | 401 | "Authentication required to upload photos" |
| Cafe not found | 404 | "Cafe not found" |
| R2 upload failed | 500 | "Failed to upload photo. Please try again" |
| Database error | 500 | "Failed to save photo metadata" |

---

## Future Enhancements

- [ ] **Image resizing:** Auto-resize large images server-side
- [ ] **EXIF stripping:** Remove metadata for privacy
- [ ] **Content moderation AI:** Auto-detect NSFW content
- [ ] **Duplicate detection:** Prevent same photo uploaded twice
- [ ] **Batch upload:** Upload multiple photos at once
- [ ] **Client-side compression:** Reduce upload size
- [ ] **Progressive upload:** Show progress percentage
- [ ] **Drag-and-drop:** Improved UX
- [ ] **Photo editing:** Basic cropping/filters
- [ ] **Photo attribution:** Credit photographer in display

---

## See Also

- [Photo Upload System - Technical Guide](../photo-upload-guide.md) - Complete implementation details
- [API Reference](../api/api-reference.md) - Photo upload endpoints
- [Database Schema](../api/database-schema.md) - review_photos table
- [Admin Guide](../admin/moderation.md) - Photo moderation workflow
