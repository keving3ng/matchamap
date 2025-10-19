import { IRequest } from 'itty-router';
import { Env } from '../types';
import { jsonResponse } from '../utils/response';
import { HTTP_STATUS } from '../constants';
import { getDb } from '../db';
import { reviewPhotos, cafes, users } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';
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
export async function uploadPhoto(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return jsonResponse({ error: 'Authentication required' }, HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const userId = request.user.userId;

    // Parse multipart form data
    const formData = await request.formData();
    const fileData = formData.get('photo');
    const file = (fileData && typeof fileData === 'object' && 'arrayBuffer' in fileData) ? fileData as File : null;
    const cafeId = formData.get('cafeId') as string | null;
    const caption = formData.get('caption') as string | null;

    // Validate required fields
    if (!file) {
      return jsonResponse({ error: 'No photo provided' }, HTTP_STATUS.BAD_REQUEST, request, env);
    }

    if (!cafeId) {
      return jsonResponse({ error: 'cafeId is required' }, HTTP_STATUS.BAD_REQUEST, request, env);
    }

    // Validate image
    const validation = validateImage(file);
    if (!validation.isValid) {
      return jsonResponse({ error: validation.error }, HTTP_STATUS.BAD_REQUEST, request, env);
    }

    // Verify cafe exists
    const db = getDb(env.DB);
    const cafe = await db.select().from(cafes).where(eq(cafes.id, parseInt(cafeId))).get();
    if (!cafe) {
      return jsonResponse({ error: 'Cafe not found' }, HTTP_STATUS.NOT_FOUND, request, env);
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

    // Generate public URLs using environment variable or default
    const baseUrl = env.PHOTOS_BASE_URL || 'https://photos.matchamap.app';
    const imageUrl = `${baseUrl}/${imageKey}`;
    const thumbnailUrl = `${baseUrl}/${thumbnailKey}`;

    // Save metadata to database
    const newPhoto = await db.insert(reviewPhotos).values({
      userId: userId,
      cafeId: parseInt(cafeId),
      imageKey: imageKey,
      imageUrl: imageUrl,
      thumbnailKey: thumbnailKey,
      thumbnailUrl: thumbnailUrl,
      caption: caption || null,
      width: dimensions?.width || null,
      height: dimensions?.height || null,
      fileSize: validation.fileSize!,
      mimeType: validation.mimeType!,
      moderationStatus: 'approved', // Auto-approve photos for now
    }).returning().get();

    return jsonResponse({
      photo: newPhoto,
      message: 'Photo uploaded successfully!'
    }, HTTP_STATUS.CREATED, request, env);

  } catch (error) {
    console.error('Photo upload error:', error);
    return jsonResponse({ error: 'Failed to upload photo' }, HTTP_STATUS.INTERNAL_SERVER_ERROR, request, env);
  }
}

/**
 * Get approved photos for a specific cafe
 * GET /api/cafes/:id/photos
 */
export async function getCafePhotos(request: IRequest, env: Env): Promise<Response> {
  try {
    const { id: cafeId } = request.params;

    if (!cafeId) {
      return jsonResponse({ error: 'Cafe ID is required' }, HTTP_STATUS.BAD_REQUEST, request, env);
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

    return jsonResponse({ photos }, HTTP_STATUS.OK, request, env);

  } catch (error) {
    console.error('Get cafe photos error:', error);
    return jsonResponse({ error: 'Failed to retrieve photos' }, HTTP_STATUS.INTERNAL_SERVER_ERROR, request, env);
  }
}

/**
 * Delete a photo (only by the owner)
 * DELETE /api/photos/:id
 */
export async function deletePhoto(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return jsonResponse({ error: 'Authentication required' }, HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const userId = request.user.userId;
    const { id: photoId } = request.params;

    if (!photoId) {
      return jsonResponse({ error: 'Photo ID is required' }, HTTP_STATUS.BAD_REQUEST, request, env);
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
      return jsonResponse({ error: 'Photo not found or access denied' }, HTTP_STATUS.NOT_FOUND, request, env);
    }

    // Delete files from R2
    await env.PHOTOS_BUCKET.delete(photo.imageKey);
    if (photo.thumbnailKey) {
      await env.PHOTOS_BUCKET.delete(photo.thumbnailKey);
    }

    // Delete from database
    await db.delete(reviewPhotos).where(eq(reviewPhotos.id, parseInt(photoId)));

    return jsonResponse({ message: 'Photo deleted successfully' }, HTTP_STATUS.OK, request, env);

  } catch (error) {
    console.error('Delete photo error:', error);
    return jsonResponse({ error: 'Failed to delete photo' }, HTTP_STATUS.INTERNAL_SERVER_ERROR, request, env);
  }
}

/**
 * Get photos uploaded by the current user
 * GET /api/users/me/photos
 */
export async function getMyPhotos(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return jsonResponse({ error: 'Authentication required' }, HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const userId = request.user.userId;

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

    return jsonResponse({ photos }, HTTP_STATUS.OK, request, env);

  } catch (error) {
    console.error('Get user photos error:', error);
    return jsonResponse({ error: 'Failed to retrieve photos' }, HTTP_STATUS.INTERNAL_SERVER_ERROR, request, env);
  }
}

/**
 * Admin: Get all photos for moderation
 * GET /api/admin/photos
 */
export async function getPhotosForModeration(request: IRequest, env: Env): Promise<Response> {
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

    return jsonResponse({ photos }, HTTP_STATUS.OK, request, env);

  } catch (error) {
    console.error('Get photos for moderation error:', error);
    return jsonResponse({ error: 'Failed to retrieve photos' }, HTTP_STATUS.INTERNAL_SERVER_ERROR, request, env);
  }
}

/**
 * Admin: Get all photos for a specific cafe (including hidden ones)
 * GET /api/admin/cafes/:id/photos
 */
export async function getAdminCafePhotos(request: IRequest, env: Env): Promise<Response> {
  try {
    const { id: cafeId } = request.params;

    if (!cafeId) {
      return jsonResponse({ error: 'Cafe ID is required' }, HTTP_STATUS.BAD_REQUEST, request, env);
    }

    const db = getDb(env.DB);

    // Get all photos (including hidden) for the cafe
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
      })
      .from(reviewPhotos)
      .innerJoin(users, eq(reviewPhotos.userId, users.id))
      .where(eq(reviewPhotos.cafeId, parseInt(cafeId)))
      .orderBy(desc(reviewPhotos.createdAt))
      .limit(100)
      .all();

    return jsonResponse({ photos }, HTTP_STATUS.OK, request, env);

  } catch (error) {
    console.error('Get admin cafe photos error:', error);
    return jsonResponse({ error: 'Failed to retrieve photos' }, HTTP_STATUS.INTERNAL_SERVER_ERROR, request, env);
  }
}

/**
 * Serve photo from R2 bucket
 * GET /photos/* or /thumbnails/*
 * Used for local development to serve files from local R2 storage
 */
export async function servePhoto(request: IRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    // Remove leading slash from pathname
    const key = url.pathname.substring(1);

    // Get file from R2
    const object = await env.PHOTOS_BUCKET.get(key);

    if (!object) {
      return new Response('Photo not found', { status: HTTP_STATUS.NOT_FOUND });
    }

    // Return the file with appropriate headers
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': object.httpMetadata?.cacheControl || 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error('Serve photo error:', error);
    return new Response('Failed to serve photo', { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}

/**
 * Admin: Approve or reject a photo
 * PUT /api/admin/photos/:id/moderate
 */
export async function moderatePhoto(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return jsonResponse({ error: 'Authentication required' }, HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const adminUserId = request.user.userId;
    const { id: photoId } = request.params;
    const body = await request.json() as { status?: string; notes?: string };

    if (!photoId) {
      return jsonResponse({ error: 'Photo ID is required' }, HTTP_STATUS.BAD_REQUEST, request, env);
    }

    if (!body.status || !['approved', 'rejected'].includes(body.status)) {
      return jsonResponse({ error: 'Valid status is required (approved or rejected)' }, HTTP_STATUS.BAD_REQUEST, request, env);
    }

    const db = getDb(env.DB);

    // Update photo moderation status
    const updatedPhoto = await db
      .update(reviewPhotos)
      .set({
        moderationStatus: body.status as 'approved' | 'rejected',
        moderatedAt: new Date().toISOString(),
        moderatedBy: adminUserId,
        moderationNotes: body.notes || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(reviewPhotos.id, parseInt(photoId)))
      .returning()
      .get();

    if (!updatedPhoto) {
      return jsonResponse({ error: 'Photo not found' }, HTTP_STATUS.NOT_FOUND, request, env);
    }

    // If rejected, optionally delete from R2 (keeping for audit trail for now)
    // if (body.status === 'rejected') {
    //   await env.PHOTOS_BUCKET.delete(updatedPhoto.imageKey);
    // }

    return jsonResponse({
      photo: updatedPhoto,
      message: `Photo ${body.status} successfully`
    }, HTTP_STATUS.OK, request, env);

  } catch (error) {
    console.error('Moderate photo error:', error);
    return jsonResponse({ error: 'Failed to moderate photo' }, HTTP_STATUS.INTERNAL_SERVER_ERROR, request, env);
  }
}