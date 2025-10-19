import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadPhoto, getUserPhotos, deletePhoto, getPhotosByCafe } from '../photos';
import { getDb } from '../../db';
import { reviewPhotos } from '../../../drizzle/schema';
import { HTTP_STATUS } from '../../constants';

// Mock dependencies
vi.mock('../../db');
vi.mock('../../utils/imageProcessing');

const mockDb = vi.mocked(getDb);
const mockEnv = {
  PHOTOS_BUCKET: {
    put: vi.fn(),
    delete: vi.fn(),
  },
  PHOTOS_BASE_URL: 'https://photos.matchamap.app',
  DB: {} as any,
};

const mockUser = { id: 1 };
const mockCafe = { id: 1 };

describe('Photo Upload Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock database
    const mockDbInstance = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              id: 1,
              userId: 1,
              cafeId: 1,
              imageKey: 'test-key',
              imageUrl: 'https://photos.matchamap.app/test-key',
              thumbnailKey: 'test-thumbnail-key',
              thumbnailUrl: 'https://photos.matchamap.app/test-thumbnail-key',
              caption: 'Test photo',
              width: 800,
              height: 600,
              fileSize: 102400,
              mimeType: 'image/jpeg',
              moderationStatus: 'pending',
              createdAt: '2023-10-13T12:00:00Z',
            }),
          }),
        }),
      }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              id: 1,
              imageKey: 'test-key',
              thumbnailKey: 'test-thumbnail-key',
            }),
          }),
        }),
      }),
    };
    
    mockDb.mockResolvedValue(mockDbInstance as any);
  });

  describe('uploadPhoto', () => {
    it('should upload photo successfully', async () => {
      const formData = new FormData();
      const mockFile = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('photo', mockFile);
      formData.append('cafeId', '1');
      formData.append('caption', 'Test photo');

      const mockRequest = {
        user: { userId: 1 },
        formData: vi.fn().mockResolvedValue(formData),
        headers: new Headers({ 'origin': 'http://localhost:3000' }),
      } as any;

      mockEnv.PHOTOS_BUCKET.put.mockResolvedValue(undefined);

      const response = await uploadPhoto(mockRequest, mockEnv as any);
      const result = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(result.message).toBe('Photo uploaded successfully!');
      expect(result.photo).toBeDefined();
      expect(result.photo.imageUrl).toContain('https://photos.matchamap.app/');
    });

    it('should return 401 when user is not authenticated', async () => {
      const mockRequest = {
        user: null,
        headers: new Headers({ 'origin': 'http://localhost:3000' }),
      } as any;

      const response = await uploadPhoto(mockRequest, mockEnv as any);
      const result = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(result.error).toBe('Authentication required');
    });

    it('should return 400 when no file is provided', async () => {
      const formData = new FormData();
      formData.append('cafeId', '1');

      const mockRequest = {
        user: { userId: 1 },
        formData: vi.fn().mockResolvedValue(formData),
        headers: new Headers({ 'origin': 'http://localhost:3000' }),
      } as any;

      const response = await uploadPhoto(mockRequest, mockEnv as any);
      const result = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(result.error).toBe('No photo provided');
    });

    it('should return 400 when cafeId is missing', async () => {
      const formData = new FormData();
      const mockFile = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('photo', mockFile);

      const mockRequest = {
        user: { userId: 1 },
        formData: vi.fn().mockResolvedValue(formData),
        headers: new Headers({ 'origin': 'http://localhost:3000' }),
      } as any;

      const response = await uploadPhoto(mockRequest, mockEnv as any);
      const result = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(result.error).toBe('cafeId is required');
    });
  });

  describe('getUserPhotos', () => {
    it('should return user photos successfully', async () => {
      const mockPhotos = [
        {
          id: 1,
          userId: 1,
          cafeId: 1,
          imageUrl: 'https://photos.matchamap.app/photo1',
          thumbnailUrl: 'https://photos.matchamap.app/thumb1',
          caption: 'My first photo',
          createdAt: '2023-10-13T12:00:00Z',
          cafeName: 'Test Cafe',
        },
      ];

      const mockDbInstance = await mockDb();
      mockDbInstance.select().from().innerJoin = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              all: vi.fn().mockResolvedValue(mockPhotos),
            }),
          }),
        }),
      });

      const mockRequest = {
        user: { userId: 1 },
        query: {},
        headers: new Headers({ 'origin': 'http://localhost:3000' }),
      } as any;

      const response = await getUserPhotos(mockRequest, mockEnv as any);
      const result = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(result.photos).toHaveLength(1);
    });

    it('should return 401 when user is not authenticated', async () => {
      const mockRequest = {
        user: null,
        headers: new Headers({ 'origin': 'http://localhost:3000' }),
      } as any;

      const response = await getUserPhotos(mockRequest, mockEnv as any);
      const result = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(result.error).toBe('Authentication required');
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo successfully', async () => {
      const mockDbInstance = await mockDb();
      mockDbInstance.select().from().where = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          id: 1,
          userId: 1,
          imageKey: 'test-key',
          thumbnailKey: 'test-thumbnail-key',
        }),
      });

      const mockRequest = {
        user: { userId: 1 },
        params: { id: '1' },
        headers: new Headers({ 'origin': 'http://localhost:3000' }),
      } as any;

      mockEnv.PHOTOS_BUCKET.delete.mockResolvedValue(undefined);

      const response = await deletePhoto(mockRequest, mockEnv as any);
      const result = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(result.message).toBe('Photo deleted successfully');
    });

    it('should return 401 when user is not authenticated', async () => {
      const mockRequest = {
        user: null,
        params: { id: '1' },
        headers: new Headers({ 'origin': 'http://localhost:3000' }),
      } as any;

      const response = await deletePhoto(mockRequest, mockEnv as any);
      const result = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(result.error).toBe('Authentication required');
    });

    it('should return 404 when photo not found', async () => {
      const mockDbInstance = await mockDb();
      mockDbInstance.select().from().where = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(null),
      });

      const mockRequest = {
        user: { userId: 1 },
        params: { id: '999' },
        headers: new Headers({ 'origin': 'http://localhost:3000' }),
      } as any;

      const response = await deletePhoto(mockRequest, mockEnv as any);
      const result = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(result.error).toBe('Photo not found or access denied');
    });
  });

  describe('getPhotosByCafe', () => {
    it('should return cafe photos successfully', async () => {
      const mockPhotos = [
        {
          id: 1,
          userId: 1,
          cafeId: 1,
          imageUrl: 'https://photos.matchamap.app/photo1',
          thumbnailUrl: 'https://photos.matchamap.app/thumb1',
          caption: 'Cafe photo',
          createdAt: '2023-10-13T12:00:00Z',
          username: 'testuser',
        },
      ];

      const mockDbInstance = await mockDb();
      mockDbInstance.select().from().innerJoin = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              all: vi.fn().mockResolvedValue(mockPhotos),
            }),
          }),
        }),
      });

      const mockRequest = {
        params: { id: '1' },
        query: {},
        headers: new Headers({ 'origin': 'http://localhost:3000' }),
      } as any;

      const response = await getPhotosByCafe(mockRequest, mockEnv as any);
      const result = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(result.photos).toHaveLength(1);
    });

    it('should return empty array for cafe with no photos', async () => {
      const mockDbInstance = await mockDb();
      mockDbInstance.select().from().innerJoin = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              all: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const mockRequest = {
        params: { id: '1' },
        query: {},
        headers: new Headers({ 'origin': 'http://localhost:3000' }),
      } as any;

      const response = await getPhotosByCafe(mockRequest, mockEnv as any);
      const result = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(result.photos).toHaveLength(0);
    });
  });
});