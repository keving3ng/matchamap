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
 * Get image dimensions from buffer by parsing image headers
 * Supports JPEG, PNG, and WebP formats
 */
export async function getImageDimensions(buffer: ArrayBuffer, mimeType: string): Promise<{ width: number; height: number } | null> {
  try {
    const bytes = new Uint8Array(buffer);

    // JPEG format
    if (mimeType === 'image/jpeg') {
      return getJPEGDimensions(bytes);
    }

    // PNG format
    if (mimeType === 'image/png') {
      return getPNGDimensions(bytes);
    }

    // WebP format
    if (mimeType === 'image/webp') {
      return getWebPDimensions(bytes);
    }

    console.warn(`Unsupported image type for dimension extraction: ${mimeType}`);
    return null;
  } catch (error) {
    console.error('Error extracting image dimensions:', error);
    return null;
  }
}

/**
 * Extract dimensions from JPEG image
 */
function getJPEGDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  // JPEG markers: SOI (0xFFD8), SOF (0xFFC0-0xFFC3, 0xFFC5-0xFFC7, 0xFFC9-0xFFCB, 0xFFCD-0xFFCF)
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
    return null; // Not a valid JPEG
  }

  let offset = 2;
  while (offset < bytes.length) {
    // Find next marker
    if (bytes[offset] !== 0xFF) {
      offset++;
      continue;
    }

    const marker = bytes[offset + 1];

    // SOF markers contain dimensions
    if ((marker >= 0xC0 && marker <= 0xC3) ||
        (marker >= 0xC5 && marker <= 0xC7) ||
        (marker >= 0xC9 && marker <= 0xCB) ||
        (marker >= 0xCD && marker <= 0xCF)) {
      // SOF structure: FF Cn [length] [precision] [height] [width]
      const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
      return { width, height };
    }

    // Skip to next marker
    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    offset += 2 + segmentLength;
  }

  return null;
}

/**
 * Extract dimensions from PNG image
 */
function getPNGDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4E || bytes[3] !== 0x47) {
    return null; // Not a valid PNG
  }

  // IHDR chunk starts at byte 8, dimensions start at byte 16
  // Width: 4 bytes (big-endian) at offset 16
  // Height: 4 bytes (big-endian) at offset 20
  const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];

  return { width, height };
}

/**
 * Extract dimensions from WebP image
 */
function getWebPDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  // WebP signature: "RIFF" + file size + "WEBP"
  if (bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46 ||
      bytes[8] !== 0x57 || bytes[9] !== 0x45 || bytes[10] !== 0x42 || bytes[11] !== 0x50) {
    return null; // Not a valid WebP
  }

  // VP8 (lossy) format
  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
    const width = ((bytes[26] | (bytes[27] << 8)) & 0x3fff);
    const height = ((bytes[28] | (bytes[29] << 8)) & 0x3fff);
    return { width, height };
  }

  // VP8L (lossless) format
  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4C) {
    const bits = (bytes[21] << 24) | (bytes[22] << 16) | (bytes[23] << 8) | bytes[24];
    const width = ((bits & 0x3FFF) + 1);
    const height = (((bits >> 14) & 0x3FFF) + 1);
    return { width, height };
  }

  // VP8X (extended) format
  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58) {
    const width = (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)) + 1;
    const height = (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) + 1;
    return { width, height };
  }

  return null;
}