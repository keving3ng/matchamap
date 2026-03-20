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
    it.each([
      ['image/jpeg', 'test.jpg', 1024 * 1024],
      ['image/png', 'test.png', 2 * 1024 * 1024],
      ['image/webp', 'test.webp', 512 * 1024],
    ] as const)('accepts %s', (mime, name, size) => {
      const data = new Uint8Array(size);
      const file = new File([data], name, { type: mime });
      const result = validateImage(file);
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe(mime);
      expect(result.fileSize).toBe(size);
    });

    it('rejects bad type, size, and empty files', () => {
      expect(validateImage(new File(['test'], 'test.gif', { type: 'image/gif' })).isValid).toBe(false);
      const huge = new File([new Uint8Array(6 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
      expect(validateImage(huge).isValid).toBe(false);
      expect(validateImage(new File([''], 'test.jpg', { type: 'image/jpeg' })).error).toBe('Empty file');
    });
  });

  describe('generateImageKey', () => {
    it('builds distinct paths per cafe, user, extension', () => {
      const key1 = generateImageKey('1', '123', 'jpg');
      const key2 = generateImageKey('2', '123', 'jpg');
      const key3 = generateImageKey('1', '456', 'jpg');
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1).toContain('photos/1/123/');
      expect(generateImageKey('1', '123', 'png').endsWith('.png')).toBe(true);
      expect(generateImageKey('1', '123', 'webp').endsWith('.webp')).toBe(true);
    });
  });

  describe('generateThumbnailKey', () => {
    it('builds distinct thumbnail keys', () => {
      const key1 = generateThumbnailKey('1', '123');
      const key2 = generateThumbnailKey('2', '123');
      expect(key1).not.toBe(key2);
      expect(key1).toContain('thumbnails/1/123/');
      expect(key1).toContain('.webp');
    });
  });

  describe('getFileExtension', () => {
    it('maps MIME to extension with fallback', () => {
      expect(getFileExtension('image/jpeg')).toBe('jpg');
      expect(getFileExtension('image/png')).toBe('png');
      expect(getFileExtension('image/webp')).toBe('webp');
      expect(getFileExtension('image/unknown')).toBe('jpg');
    });
  });

  describe('generateThumbnail', () => {
    it('returns buffer placeholder', async () => {
      const buf = new ArrayBuffer(1024);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await generateThumbnail(buf, 200);
      expect(result).toBe(buf);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getImageDimensions', () => {
    it('parses JPEG and PNG dimensions', async () => {
      const jpegBytes = new Uint8Array([
        0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x2c, 0x01, 0x90, 0x03,
      ]);
      expect(await getImageDimensions(jpegBytes.buffer, 'image/jpeg')).toEqual({
        width: 400,
        height: 300,
      });

      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
        0x44, 0x52, 0x00, 0x00, 0x01, 0x90, 0x00, 0x00, 0x01, 0x2c, 0x08, 0x02, 0x00, 0x00, 0x00,
      ]);
      expect(await getImageDimensions(pngBytes.buffer, 'image/png')).toEqual({
        width: 400,
        height: 300,
      });
    });

    it('returns null for bad or unsupported data', async () => {
      const dead = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      expect(await getImageDimensions(dead.buffer, 'image/jpeg')).toBe(null);
      expect(await getImageDimensions(dead.buffer, 'image/png')).toBe(null);
      expect(await getImageDimensions(new ArrayBuffer(100), 'image/gif')).toBe(null);
      expect(await getImageDimensions(new Uint8Array([0xff, 0xd8]).buffer, 'image/jpeg')).toBe(null);
    });
  });
});
