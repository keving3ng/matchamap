/**
 * Image processing utilities for photo uploads
 * Handles validation, resizing, and format conversion
 */

// Allowed MIME types for photo uploads
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  // Note: HEIC files will be rejected as they require special handling
] as const;

// File size limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const THUMBNAIL_SIZE = 200; // 200px for thumbnails

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  mimeType?: string;
  fileSize?: number;
}

/**
 * Validate uploaded image file
 */
export function validateImage(file: File): ImageValidationResult {
  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return { 
      isValid: false, 
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` 
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return { 
      isValid: false, 
      error: `File too large. Maximum size: ${maxSizeMB}MB` 
    };
  }

  // Check for empty file
  if (file.size === 0) {
    return { isValid: false, error: 'Empty file' };
  }

  return {
    isValid: true,
    mimeType: file.type,
    fileSize: file.size,
  };
}

/**
 * Generate unique storage key for R2
 */
export function generateImageKey(cafeId: string, userId: string, extension: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `photos/${cafeId}/${userId}/${timestamp}-${randomId}.${extension}`;
}

/**
 * Generate thumbnail key for R2
 */
export function generateThumbnailKey(cafeId: string, userId: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `thumbnails/${cafeId}/${userId}/${timestamp}-${randomId}.webp`;
}

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  
  return extensions[mimeType] || 'jpg';
}

/**
 * Generate thumbnail from image buffer
 * 
 * Note: This is a placeholder implementation. In a production environment,
 * you would want to use either:
 * 1. Canvas API in Workers (limited browser APIs)
 * 2. Sharp via WASM (adds significant bundle size)
 * 3. External service like Cloudflare Images Transform API
 * 4. ImageMagick via WASM
 * 
 * For now, we'll return the original buffer and rely on client-side resizing
 * or implement proper server-side thumbnail generation in a follow-up task.
 */
export async function generateThumbnail(buffer: ArrayBuffer, targetSize: number): Promise<ArrayBuffer> {
  // TODO: Implement actual thumbnail generation
  // This is a placeholder that returns the original buffer
  // In production, this should resize the image to targetSize pixels
  
  console.log(`Thumbnail generation requested for ${targetSize}px (not implemented - returning original)`);
  return buffer;
}

/**
 * Get image dimensions from buffer
 * 
 * Note: This is also a placeholder. In production, you'd want to parse
 * image headers to extract actual dimensions.
 */
export async function getImageDimensions(buffer: ArrayBuffer, mimeType: string): Promise<{ width: number; height: number } | null> {
  // TODO: Implement actual dimension extraction
  // For now, return null to indicate unknown dimensions
  
  console.log(`Dimension extraction requested for ${mimeType} (not implemented)`);
  return null;
}