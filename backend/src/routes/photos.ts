import { Request } from 'itty-router';
import { Env } from '../types';
import { jsonResponse } from '../utils/response';
import { HTTP_STATUS } from '../constants';
import { getDb } from '../db';
import { reviewPhotos, cafes, users } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { 
  validateImage, 
  generateImageKey, 
  generateThumbnailKey,
  getFileExtension,
  generateThumbnail,
  getImageDimensions 
} from '../utils/imageProcessing';

/**
 * Upload photo to R2 bucket
 * POST /api/photos/upload
 */
export async function uploadPhoto(request: Request, env: Env): Promise<Response> {
  try {
    const userId = (request as any).userId;
    
    if (!userId) {
      return jsonResponse({ error: 'Authentication required' }, HTTP_STATUS.UNAUTHORIZED);
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('photo') as File;
    const cafeId = formData.get('cafeId') as string;
    const caption = formData.get('caption') as string;

    // Validate required fields
    if (!file) {
      return jsonResponse({ error: 'No photo provided' }, HTTP_STATUS.BAD_REQUEST);
    }

    if (!cafeId) {
      return jsonResponse({ error: 'cafeId is required' }, HTTP_STATUS.BAD_REQUEST);
    }

    // Validate image
    const validation = validateImage(file);
    if (!validation.isValid) {
      return jsonResponse({ error: validation.error }, HTTP_STATUS.BAD_REQUEST);
    }

    // Verify cafe exists
    const db = getDb(env.DB);
    const cafe = await db.select().from(cafes).where(eq(cafes.id, parseInt(cafeId))).get();
    if (!cafe) {
      return jsonResponse({ error: 'Cafe not found' }, HTTP_STATUS.NOT_FOUND);
    }

    // Generate unique keys for R2 storage
    const fileExtension = getFileExtension(validation.mimeType!);
    const imageKey = generateImageKey(cafeId, userId.toString(), fileExtension);
    const thumbnailKey = generateThumbnailKey(cafeId, userId.toString());

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Get image dimensions (placeholder implementation)
    const dimensions = await getImageDimensions(arrayBuffer, validation.mimeType!);

    // Upload original image to R2
    await env.PHOTOS_BUCKET.put(imageKey, arrayBuffer, {
      httpMetadata: {
        contentType: validation.mimeType,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
      customMetadata: {
        userId: userId.toString(),
        cafeId: cafeId,
        uploadedAt: new Date().toISOString(),
        originalFilename: file.name,
      }
    });

    // Generate and upload thumbnail
    const thumbnail = await generateThumbnail(arrayBuffer, 200);
    await env.PHOTOS_BUCKET.put(thumbnailKey, thumbnail, {
      httpMetadata: { 
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
      }
    });

    // Generate public URLs (placeholder - needs actual R2 custom domain)
    const baseUrl = 'https://photos.matchamap.app'; // TODO: Configure actual R2 custom domain
    const imageUrl = `${baseUrl}/${imageKey}`;
    const thumbnailUrl = `${baseUrl}/${thumbnailKey}`;

    // Save metadata to database
    const newPhoto = await db.insert(reviewPhotos).values({
      userId: userId,
      cafeId: parseInt(cafeId),
      imageKey: imageKey,
      imageUrl: imageUrl,
      thumbnailUrl: thumbnailUrl,
      caption: caption || null,
      width: dimensions?.width || null,
      height: dimensions?.height || null,
      fileSize: validation.fileSize!,
      mimeType: validation.mimeType!,
      moderationStatus: 'pending',
    }).returning().get();

    return jsonResponse({ 
      photo: newPhoto,
      message: 'Photo uploaded successfully. It will be reviewed before appearing publicly.'
    }, HTTP_STATUS.CREATED);

  } catch (error) {
    console.error('Photo upload error:', error);
    return jsonResponse({ error: 'Failed to upload photo' }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get approved photos for a specific cafe
 * GET /api/cafes/:id/photos
 */
export async function getCafePhotos(request: Request, env: Env): Promise<Response> {
  try {
    const { id: cafeId } = request.params;

    if (!cafeId) {
      return jsonResponse({ error: 'Cafe ID is required' }, HTTP_STATUS.BAD_REQUEST);
    }

    const db = getDb(env.DB);
    
    // Get approved photos with user information
    const photos = await db
      .select({
        id: reviewPhotos.id,
        imageUrl: reviewPhotos.imageUrl,
        thumbnailUrl: reviewPhotos.thumbnailUrl,
        caption: reviewPhotos.caption,
        width: reviewPhotos.width,
        height: reviewPhotos.height,
        fileSize: reviewPhotos.fileSize,
        createdAt: reviewPhotos.createdAt,
        userId: reviewPhotos.userId,
        username: users.username,
      })
      .from(reviewPhotos)
      .innerJoin(users, eq(reviewPhotos.userId, users.id))
      .where(
        and(
          eq(reviewPhotos.cafeId, parseInt(cafeId)),
          eq(reviewPhotos.moderationStatus, 'approved')
        )
      )
      .orderBy(desc(reviewPhotos.createdAt))
      .limit(50)
      .all();

    return jsonResponse({ photos }, HTTP_STATUS.OK);

  } catch (error) {
    console.error('Get cafe photos error:', error);
    return jsonResponse({ error: 'Failed to retrieve photos' }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Delete a photo (only by the owner)
 * DELETE /api/photos/:id
 */
export async function deletePhoto(request: Request, env: Env): Promise<Response> {
  try {
    const userId = (request as any).userId;
    const { id: photoId } = request.params;

    if (!userId) {
      return jsonResponse({ error: 'Authentication required' }, HTTP_STATUS.UNAUTHORIZED);
    }

    if (!photoId) {
      return jsonResponse({ error: 'Photo ID is required' }, HTTP_STATUS.BAD_REQUEST);
    }

    const db = getDb(env.DB);

    // Get photo metadata and verify ownership
    const photo = await db
      .select()
      .from(reviewPhotos)
      .where(
        and(
          eq(reviewPhotos.id, parseInt(photoId)),
          eq(reviewPhotos.userId, userId)
        )
      )
      .get();

    if (!photo) {
      return jsonResponse({ error: 'Photo not found or access denied' }, HTTP_STATUS.NOT_FOUND);
    }

    // Delete files from R2
    await env.PHOTOS_BUCKET.delete(photo.imageKey);
    if (photo.thumbnailUrl) {
      // Extract thumbnail key from URL (assumes URL format: baseUrl/thumbnailKey)
      const thumbnailKey = photo.thumbnailUrl.split('/').slice(-4).join('/'); // Extract last 4 path segments
      await env.PHOTOS_BUCKET.delete(thumbnailKey);
    }

    // Delete from database
    await db.delete(reviewPhotos).where(eq(reviewPhotos.id, parseInt(photoId)));

    return jsonResponse({ message: 'Photo deleted successfully' }, HTTP_STATUS.OK);

  } catch (error) {
    console.error('Delete photo error:', error);
    return jsonResponse({ error: 'Failed to delete photo' }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get photos uploaded by the current user
 * GET /api/users/me/photos
 */
export async function getMyPhotos(request: Request, env: Env): Promise<Response> {
  try {
    const userId = (request as any).userId;

    if (!userId) {
      return jsonResponse({ error: 'Authentication required' }, HTTP_STATUS.UNAUTHORIZED);
    }

    const db = getDb(env.DB);
    
    // Get user's photos with cafe information
    const photos = await db
      .select({
        id: reviewPhotos.id,
        imageUrl: reviewPhotos.imageUrl,
        thumbnailUrl: reviewPhotos.thumbnailUrl,
        caption: reviewPhotos.caption,
        width: reviewPhotos.width,
        height: reviewPhotos.height,
        fileSize: reviewPhotos.fileSize,
        moderationStatus: reviewPhotos.moderationStatus,
        createdAt: reviewPhotos.createdAt,
        cafeId: reviewPhotos.cafeId,
        cafeName: cafes.name,
      })
      .from(reviewPhotos)
      .innerJoin(cafes, eq(reviewPhotos.cafeId, cafes.id))
      .where(eq(reviewPhotos.userId, userId))
      .orderBy(desc(reviewPhotos.createdAt))
      .limit(100)
      .all();

    return jsonResponse({ photos }, HTTP_STATUS.OK);

  } catch (error) {
    console.error('Get user photos error:', error);
    return jsonResponse({ error: 'Failed to retrieve photos' }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Admin: Get all photos for moderation
 * GET /api/admin/photos
 */
export async function getPhotosForModeration(request: Request, env: Env): Promise<Response> {
  try {
    const db = getDb(env.DB);
    
    // Get all photos pending moderation
    const photos = await db
      .select({
        id: reviewPhotos.id,
        imageUrl: reviewPhotos.imageUrl,
        thumbnailUrl: reviewPhotos.thumbnailUrl,
        caption: reviewPhotos.caption,
        width: reviewPhotos.width,
        height: reviewPhotos.height,
        fileSize: reviewPhotos.fileSize,
        moderationStatus: reviewPhotos.moderationStatus,
        createdAt: reviewPhotos.createdAt,
        userId: reviewPhotos.userId,
        username: users.username,
        cafeId: reviewPhotos.cafeId,
        cafeName: cafes.name,
      })
      .from(reviewPhotos)
      .innerJoin(users, eq(reviewPhotos.userId, users.id))
      .innerJoin(cafes, eq(reviewPhotos.cafeId, cafes.id))
      .where(eq(reviewPhotos.moderationStatus, 'pending'))
      .orderBy(desc(reviewPhotos.createdAt))
      .limit(50)
      .all();

    return jsonResponse({ photos }, HTTP_STATUS.OK);

  } catch (error) {
    console.error('Get photos for moderation error:', error);
    return jsonResponse({ error: 'Failed to retrieve photos' }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Admin: Approve or reject a photo
 * PUT /api/admin/photos/:id/moderate
 */
export async function moderatePhoto(request: Request, env: Env): Promise<Response> {
  try {
    const adminUserId = (request as any).userId;
    const { id: photoId } = request.params;
    const { status, notes } = await request.json();

    if (!adminUserId) {
      return jsonResponse({ error: 'Authentication required' }, HTTP_STATUS.UNAUTHORIZED);
    }

    if (!photoId) {
      return jsonResponse({ error: 'Photo ID is required' }, HTTP_STATUS.BAD_REQUEST);
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return jsonResponse({ error: 'Valid status is required (approved or rejected)' }, HTTP_STATUS.BAD_REQUEST);
    }

    const db = getDb(env.DB);

    // Update photo moderation status
    const updatedPhoto = await db
      .update(reviewPhotos)
      .set({
        moderationStatus: status,
        moderatedAt: new Date().toISOString(),
        moderatedBy: adminUserId,
        moderationNotes: notes || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(reviewPhotos.id, parseInt(photoId)))
      .returning()
      .get();

    if (!updatedPhoto) {
      return jsonResponse({ error: 'Photo not found' }, HTTP_STATUS.NOT_FOUND);
    }

    // If rejected, optionally delete from R2 (keeping for audit trail for now)
    // if (status === 'rejected') {
    //   await env.PHOTOS_BUCKET.delete(updatedPhoto.imageKey);
    // }

    return jsonResponse({ 
      photo: updatedPhoto,
      message: `Photo ${status} successfully`
    }, HTTP_STATUS.OK);

  } catch (error) {
    console.error('Moderate photo error:', error);
    return jsonResponse({ error: 'Failed to moderate photo' }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}