/**
 * Client-Side Image Compression Utility
 *
 * Compresses images before upload to reduce bandwidth and improve performance.
 * Uses Canvas API for compression - no external dependencies.
 *
 * Usage:
 *   const compressedBlob = await compressImage(file, { maxWidth: 1920, quality: 0.85 })
 */

export interface ImageCompressionOptions {
  /** Maximum width in pixels (default: 1920) */
  maxWidth?: number
  /** Maximum height in pixels (default: 1440) */
  maxHeight?: number
  /** JPEG quality 0-1 (default: 0.85) */
  quality?: number
  /** Target file size in bytes (optional - will reduce quality to meet target) */
  maxSizeBytes?: number
  /** Output format (default: 'image/jpeg') */
  outputFormat?: 'image/jpeg' | 'image/webp' | 'image/png'
}

export interface ImageCompressionResult {
  /** Compressed image blob */
  blob: Blob
  /** Original file size in bytes */
  originalSize: number
  /** Compressed file size in bytes */
  compressedSize: number
  /** Compression ratio (0-1, lower is better) */
  ratio: number
  /** Original dimensions */
  originalDimensions: { width: number; height: number }
  /** Final dimensions */
  finalDimensions: { width: number; height: number }
}

/**
 * Load image from File/Blob
 */
function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth
  let height = originalHeight

  // Scale down if needed
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height)
    height = maxHeight
  }

  return { width, height }
}

/**
 * Compress image using Canvas API
 */
async function compressImageWithQuality(
  img: HTMLImageElement,
  dimensions: { width: number; height: number },
  quality: number,
  outputFormat: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Draw image
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to compress image'))
        }
      },
      outputFormat,
      quality
    )
  })
}

/**
 * Compress image with options
 *
 * @param file - Image file to compress
 * @param options - Compression options
 * @returns Compressed image result with metadata
 *
 * @example
 * ```ts
 * const file = event.target.files[0]
 * const result = await compressImage(file, {
 *   maxWidth: 1920,
 *   quality: 0.85,
 *   maxSizeBytes: 500 * 1024, // 500KB
 * })
 * console.log(`Reduced from ${result.originalSize} to ${result.compressedSize} bytes`)
 * ```
 */
export async function compressImage(
  file: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<ImageCompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1440,
    quality = 0.85,
    maxSizeBytes,
    outputFormat = 'image/jpeg',
  } = options

  // Load image
  const img = await loadImage(file)

  const originalDimensions = {
    width: img.naturalWidth,
    height: img.naturalHeight,
  }

  const originalSize = file.size

  // Calculate new dimensions
  const finalDimensions = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    maxWidth,
    maxHeight
  )

  // Compress with initial quality
  let currentQuality = quality
  let blob = await compressImageWithQuality(img, finalDimensions, currentQuality, outputFormat)

  // If maxSizeBytes specified, iteratively reduce quality to meet target
  if (maxSizeBytes && blob.size > maxSizeBytes) {
    let attempts = 0
    const maxAttempts = 10

    while (blob.size > maxSizeBytes && attempts < maxAttempts && currentQuality > 0.1) {
      // Reduce quality by 10% each iteration
      currentQuality -= 0.1
      blob = await compressImageWithQuality(img, finalDimensions, currentQuality, outputFormat)
      attempts++
    }

    if (import.meta.env.DEV) {
      console.log(`[Image Compression] Reduced quality to ${currentQuality.toFixed(2)} after ${attempts} attempts`)
    }
  }

  const compressedSize = blob.size
  const ratio = compressedSize / originalSize

  if (import.meta.env.DEV) {
    console.log('[Image Compression]', {
      originalSize: `${Math.round(originalSize / 1024)}KB`,
      compressedSize: `${Math.round(compressedSize / 1024)}KB`,
      ratio: `${Math.round(ratio * 100)}%`,
      originalDimensions,
      finalDimensions,
    })
  }

  return {
    blob,
    originalSize,
    compressedSize,
    ratio,
    originalDimensions,
    finalDimensions,
  }
}

/**
 * Create thumbnail from image
 *
 * @param file - Image file
 * @param size - Thumbnail size (square)
 * @returns Thumbnail blob
 */
export async function createThumbnail(
  file: File | Blob,
  size: number = 150
): Promise<Blob> {
  const result = await compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.8,
    outputFormat: 'image/jpeg',
  })

  return result.blob
}

/**
 * Validate image file
 *
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export interface ImageValidationOptions {
  /** Maximum file size in bytes (default: 10MB) */
  maxSizeBytes?: number
  /** Allowed MIME types (default: jpeg, png, webp) */
  allowedTypes?: string[]
  /** Minimum dimensions */
  minDimensions?: { width: number; height: number }
  /** Maximum dimensions */
  maxDimensions?: { width: number; height: number }
}

export interface ImageValidationResult {
  valid: boolean
  error?: string
  dimensions?: { width: number; height: number }
}

export async function validateImage(
  file: File | Blob,
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  const {
    maxSizeBytes = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    minDimensions,
    maxDimensions,
  } = options

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    }
  }

  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
    }
  }

  // Load image to check dimensions
  try {
    const img = await loadImage(file)
    const dimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight,
    }

    // Check minimum dimensions
    if (minDimensions) {
      if (dimensions.width < minDimensions.width || dimensions.height < minDimensions.height) {
        return {
          valid: false,
          error: `Image too small. Minimum: ${minDimensions.width}x${minDimensions.height}`,
          dimensions,
        }
      }
    }

    // Check maximum dimensions
    if (maxDimensions) {
      if (dimensions.width > maxDimensions.width || dimensions.height > maxDimensions.height) {
        return {
          valid: false,
          error: `Image too large. Maximum: ${maxDimensions.width}x${maxDimensions.height}`,
          dimensions,
        }
      }
    }

    return {
      valid: true,
      dimensions,
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to load image',
    }
  }
}
