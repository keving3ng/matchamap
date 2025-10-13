import { describe, it, expect, vi } from 'vitest';
import {
  validateImage,
  generateImageKey,
  generateThumbnailKey,
  getFileExtension,
  generateThumbnail,
  getImageDimensions,
} from '../imageProcessing';

describe('Image Processing Utils', () => {
  describe('validateImage', () => {
    it('should validate JPEG images', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      file.size = 1024 * 1024; // 1MB
      
      const result = validateImage(file);
      
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.fileSize).toBe(1024 * 1024);
    });

    it('should validate PNG images', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      file.size = 2 * 1024 * 1024; // 2MB
      
      const result = validateImage(file);
      
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe('image/png');
      expect(result.fileSize).toBe(2 * 1024 * 1024);
    });

    it('should validate WebP images', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      file.size = 512 * 1024; // 512KB
      
      const result = validateImage(file);
      
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe('image/webp');
      expect(result.fileSize).toBe(512 * 1024);
    });

    it('should reject unsupported file types', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      file.size = 1024;
      
      const result = validateImage(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Unsupported file type. Please use JPEG, PNG, or WebP.');
    });

    it('should reject files that are too large', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      file.size = 6 * 1024 * 1024; // 6MB (over 5MB limit)
      
      const result = validateImage(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File size must be less than 5MB');
    });

    it('should reject empty files', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      file.size = 0;
      
      const result = validateImage(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File size must be less than 5MB');
    });
  });

  describe('generateImageKey', () => {
    it('should generate unique keys for different inputs', () => {
      const key1 = generateImageKey('1', '123', '.jpg');
      const key2 = generateImageKey('2', '123', '.jpg');
      const key3 = generateImageKey('1', '456', '.jpg');
      
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
      
      // Should contain cafe and user info
      expect(key1).toContain('cafe-1');
      expect(key1).toContain('user-123');
      expect(key1).toContain('.jpg');
    });

    it('should handle different file extensions', () => {
      const jpegKey = generateImageKey('1', '123', '.jpg');
      const pngKey = generateImageKey('1', '123', '.png');
      const webpKey = generateImageKey('1', '123', '.webp');
      
      expect(jpegKey.endsWith('.jpg')).toBe(true);
      expect(pngKey.endsWith('.png')).toBe(true);
      expect(webpKey.endsWith('.webp')).toBe(true);
    });
  });

  describe('generateThumbnailKey', () => {
    it('should generate unique thumbnail keys', () => {
      const key1 = generateThumbnailKey('1', '123');
      const key2 = generateThumbnailKey('2', '123');
      const key3 = generateThumbnailKey('1', '456');
      
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
      
      // Should contain cafe and user info
      expect(key1).toContain('cafe-1');
      expect(key1).toContain('user-123');
      expect(key1).toContain('thumb');
    });
  });

  describe('getFileExtension', () => {
    it('should return correct extensions for MIME types', () => {
      expect(getFileExtension('image/jpeg')).toBe('.jpg');
      expect(getFileExtension('image/png')).toBe('.png');
      expect(getFileExtension('image/webp')).toBe('.webp');
    });

    it('should return default extension for unknown MIME types', () => {
      expect(getFileExtension('image/unknown')).toBe('.jpg');
      expect(getFileExtension('')).toBe('.jpg');
    });
  });

  describe('generateThumbnail', () => {
    it('should return original buffer as placeholder', async () => {
      const originalBuffer = new ArrayBuffer(1024);
      
      // Mock console.warn to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = await generateThumbnail(originalBuffer, 200);
      
      expect(result).toBe(originalBuffer);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PLACEHOLDER] Thumbnail generation not implemented')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getImageDimensions', () => {
    it('should extract JPEG dimensions correctly', async () => {
      // Create a minimal JPEG with SOI (0xFFD8) and SOF0 (0xFFC0) markers
      const jpegBytes = new Uint8Array([
        0xFF, 0xD8, // SOI marker
        0xFF, 0xC0, // SOF0 marker
        0x00, 0x11, // Segment length (17 bytes)
        0x08,       // Precision
        0x01, 0x2C, // Height: 300 (0x012C)
        0x01, 0x90, // Width: 400 (0x0190)
        0x03,       // Number of components
        // ... additional SOF data would follow
      ]);

      const buffer = jpegBytes.buffer;
      const result = await getImageDimensions(buffer, 'image/jpeg');
      
      expect(result).toEqual({ width: 400, height: 300 });
    });

    it('should extract PNG dimensions correctly', async () => {
      // Create a minimal PNG with IHDR chunk
      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // "IHDR"
        0x00, 0x00, 0x01, 0x90, // Width: 400
        0x00, 0x00, 0x01, 0x2C, // Height: 300
        0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
        // ... CRC would follow
      ]);

      const buffer = pngBytes.buffer;
      const result = await getImageDimensions(buffer, 'image/png');
      
      expect(result).toEqual({ width: 400, height: 300 });
    });

    it('should return null for invalid JPEG', async () => {
      const invalidJpegBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const buffer = invalidJpegBytes.buffer;
      
      const result = await getImageDimensions(buffer, 'image/jpeg');
      expect(result).toBe(null);
    });

    it('should return null for invalid PNG', async () => {
      const invalidPngBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const buffer = invalidPngBytes.buffer;
      
      const result = await getImageDimensions(buffer, 'image/png');
      expect(result).toBe(null);
    });

    it('should return null for unsupported format', async () => {
      const buffer = new ArrayBuffer(100);
      const result = await getImageDimensions(buffer, 'image/gif');
      expect(result).toBe(null);
    });

    it('should handle errors gracefully', async () => {
      // Create malformed buffer that will cause parsing errors
      const malformedBytes = new Uint8Array([0xFF, 0xD8]); // Valid JPEG start but incomplete
      const buffer = malformedBytes.buffer;
      
      const result = await getImageDimensions(buffer, 'image/jpeg');
      expect(result).toBe(null);
    });
  });
});