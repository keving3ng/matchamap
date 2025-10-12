import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../../index';
import {
  createTestRequest,
  createAuthenticatedRequest,
  mockUser,
  mockAdminUser,
  createTestToken,
  cleanupTestData,
  seedTestData,
  expectJsonResponse,
  expectErrorResponse,
} from '../../test/utils';

describe('Places Routes', () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await cleanupTestData(env);
    await seedTestData(env);
    userToken = await createTestToken(mockUser);
    adminToken = await createTestToken(mockAdminUser);
  });

  describe('POST /api/places/enrich', () => {
    it('should enrich place data when authenticated as admin', async () => {
      const placeData = {
        name: 'Test Cafe',
        address: '123 Test Street, Toronto, ON',
        coordinates: {
          lat: 43.6532,
          lng: -79.3832,
        },
      };

      const request = createAuthenticatedRequest('/api/places/enrich', adminToken, {
        method: 'POST',
        body: JSON.stringify(placeData),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.enrichedPlace).toMatchObject({
        name: placeData.name,
        address: placeData.address,
        coordinates: placeData.coordinates,
        // Additional enriched data would be added here
        googlePlaceId: expect.any(String),
        enrichedAt: expect.any(String),
      });
    });

    it('should return 401 when not authenticated', async () => {
      const placeData = {
        name: 'Test Cafe',
        address: '123 Test Street',
      };

      const request = createTestRequest('/api/places/enrich', {
        method: 'POST',
        body: JSON.stringify(placeData),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const placeData = {
        name: 'Test Cafe',
        address: '123 Test Street',
      };

      const request = createAuthenticatedRequest('/api/places/enrich', userToken, {
        method: 'POST',
        body: JSON.stringify(placeData),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 403);
    });

    it('should return 400 for missing required fields', async () => {
      const incompletePlaceData = {
        name: 'Test Cafe',
        // missing address
      };

      const request = createAuthenticatedRequest('/api/places/enrich', adminToken, {
        method: 'POST',
        body: JSON.stringify(incompletePlaceData),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'required');
    });

    it('should validate coordinates format', async () => {
      const invalidCoordinates = [
        { lat: 'invalid', lng: -79.3832 },
        { lat: 43.6532, lng: 'invalid' },
        { lat: 91.0, lng: -79.3832 }, // Invalid latitude
        { lat: 43.6532, lng: 181.0 }, // Invalid longitude
        { lat: -91.0, lng: -79.3832 }, // Invalid latitude
        { lat: 43.6532, lng: -181.0 }, // Invalid longitude
      ];

      for (const coords of invalidCoordinates) {
        const placeData = {
          name: 'Test Cafe',
          address: '123 Test Street',
          coordinates: coords,
        };

        const request = createAuthenticatedRequest('/api/places/enrich', adminToken, {
          method: 'POST',
          body: JSON.stringify(placeData),
        });
        
        const response = await worker.fetch(request, env);
        

        await expectErrorResponse(response, 400, 'Invalid coordinates');
      }
    });

    it('should handle Google Places API errors gracefully', async () => {
      // Mock a place that would cause Google Places API to error
      const problematicPlace = {
        name: 'Nonexistent Cafe',
        address: 'Fake Street, Nowhere City',
        coordinates: {
          lat: 0.0,
          lng: 0.0,
        },
      };

      const request = createAuthenticatedRequest('/api/places/enrich', adminToken, {
        method: 'POST',
        body: JSON.stringify(problematicPlace),
      });
      
      const response = await worker.fetch(request, env);
      

      // Should handle API errors gracefully
      if (response.status === 200) {
        const data = await response.json() as any;
        expect(data.enrichedPlace).toBeDefined();
      } else {
        await expectErrorResponse(response, 404, 'Place not found');
      }
    });

    it('should enrich place with additional Google data', async () => {
      const placeData = {
        name: 'CN Tower',
        address: '290 Bremner Blvd, Toronto, ON M5V 3L9',
        coordinates: {
          lat: 43.6426,
          lng: -79.3871,
        },
      };

      const request = createAuthenticatedRequest('/api/places/enrich', adminToken, {
        method: 'POST',
        body: JSON.stringify(placeData),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.enrichedPlace).toMatchObject({
        name: expect.any(String),
        address: expect.any(String),
        coordinates: {
          lat: expect.any(Number),
          lng: expect.any(Number),
        },
        googlePlaceId: expect.any(String),
        phoneNumber: expect.any(String),
        website: expect.any(String),
        businessHours: expect.any(Object),
        priceLevel: expect.any(Number),
        rating: expect.any(Number),
        reviewCount: expect.any(Number),
      });
    });

    it('should handle international addresses', async () => {
      const internationalPlace = {
        name: 'Tokyo Tower',
        address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan',
        coordinates: {
          lat: 35.6586,
          lng: 139.7454,
        },
      };

      const request = createAuthenticatedRequest('/api/places/enrich', adminToken, {
        method: 'POST',
        body: JSON.stringify(internationalPlace),
      });
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.enrichedPlace.name).toBeDefined();
      expect(data.enrichedPlace.address).toBeDefined();
    });

    it('should validate name and address length limits', async () => {
      const longDataPlace = {
        name: 'a'.repeat(256), // Assuming 255 character limit
        address: 'b'.repeat(513), // Assuming 512 character limit
        coordinates: {
          lat: 43.6532,
          lng: -79.3832,
        },
      };

      const request = createAuthenticatedRequest('/api/places/enrich', adminToken, {
        method: 'POST',
        body: JSON.stringify(longDataPlace),
      });
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'too long');
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = createAuthenticatedRequest('/api/places/enrich', adminToken, {
        method: 'POST',
        body: 'invalid json{',
      });
      
      const response = await worker.fetch(request, env);
      

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/places/search', () => {
    it('should search places when authenticated as admin', async () => {
      const searchQuery = 'cafe toronto';

      const request = createAuthenticatedRequest(`/api/places/search?query=${encodeURIComponent(searchQuery)}`, adminToken);
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.places).toBeInstanceOf(Array);
      expect(data.query).toBe(searchQuery);
      
      if (data.places.length > 0) {
        expect(data.places[0]).toMatchObject({
          placeId: expect.any(String),
          name: expect.any(String),
          address: expect.any(String),
          coordinates: {
            lat: expect.any(Number),
            lng: expect.any(Number),
          },
        });
      }
    });

    it('should return 401 when not authenticated', async () => {
      const request = createTestRequest('/api/places/search?query=cafe');
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 401);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const request = createAuthenticatedRequest('/api/places/search?query=cafe', userToken);
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 403);
    });

    it('should return 400 for missing query parameter', async () => {
      const request = createAuthenticatedRequest('/api/places/search', adminToken);
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'query parameter is required');
    });

    it('should return 400 for empty query', async () => {
      const request = createAuthenticatedRequest('/api/places/search?query=', adminToken);
      
      const response = await worker.fetch(request, env);
      

      await expectErrorResponse(response, 400, 'query cannot be empty');
    });

    it('should handle location-based search', async () => {
      const searchQuery = 'matcha';
      const location = '43.6532,-79.3832'; // Toronto coordinates

      const request = createAuthenticatedRequest(
        `/api/places/search?query=${encodeURIComponent(searchQuery)}&location=${location}`,
        adminToken
      );
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.places).toBeInstanceOf(Array);
      expect(data.location).toBe(location);
    });

    it('should validate location format', async () => {
      const invalidLocations = [
        'invalid',
        '43.6532', // Missing longitude
        '43.6532,', // Missing longitude
        ',79.3832', // Missing latitude
        '91.0,-79.3832', // Invalid latitude
        '43.6532,181.0', // Invalid longitude
      ];

      for (const location of invalidLocations) {
        const request = createAuthenticatedRequest(
          `/api/places/search?query=cafe&location=${encodeURIComponent(location)}`,
          adminToken
        );
        
        const response = await worker.fetch(request, env);
        

        await expectErrorResponse(response, 400, 'Invalid location format');
      }
    });

    it('should handle radius parameter', async () => {
      const searchQuery = 'cafe';
      const location = '43.6532,-79.3832';
      const radius = '1000'; // 1km radius

      const request = createAuthenticatedRequest(
        `/api/places/search?query=${encodeURIComponent(searchQuery)}&location=${location}&radius=${radius}`,
        adminToken
      );
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.radius).toBe(parseInt(radius));
    });

    it('should validate radius parameter', async () => {
      const invalidRadiuses = [
        'invalid',
        '0', // Too small
        '50001', // Too large (assuming 50km max)
        '-100', // Negative
      ];

      for (const radius of invalidRadiuses) {
        const request = createAuthenticatedRequest(
          `/api/places/search?query=cafe&radius=${radius}`,
          adminToken
        );
        
        const response = await worker.fetch(request, env);
        

        await expectErrorResponse(response, 400);
      }
    });

    it('should handle search with type filter', async () => {
      const searchQuery = 'restaurant';
      const type = 'restaurant';

      const request = createAuthenticatedRequest(
        `/api/places/search?query=${encodeURIComponent(searchQuery)}&type=${type}`,
        adminToken
      );
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.type).toBe(type);
    });

    it('should limit search results', async () => {
      const searchQuery = 'cafe';

      const request = createAuthenticatedRequest(
        `/api/places/search?query=${encodeURIComponent(searchQuery)}`,
        adminToken
      );
      
      const response = await worker.fetch(request, env);
      

      expectJsonResponse(response, 200);
      
      const data = await response.json() as any;
      expect(data.places.length).toBeLessThanOrEqual(20); // Assuming max 20 results
    });
  });

  describe('Places API Security', () => {
    it('should prevent API key exposure in responses', async () => {
      const placeData = {
        name: 'Test Cafe',
        address: '123 Test Street',
        coordinates: {
          lat: 43.6532,
          lng: -79.3832,
        },
      };

      const request = createAuthenticatedRequest('/api/places/enrich', adminToken, {
        method: 'POST',
        body: JSON.stringify(placeData),
      });
      
      const response = await worker.fetch(request, env);
      

      const responseText = await response.text();
      expect(responseText).not.toContain('AIza'); // Google API key prefix
      expect(responseText).not.toContain('key=');
    });

    it('should handle special characters in search queries', async () => {
      const specialQueries = [
        'café français',
        'matcha & tea',
        'café (downtown)',
        'café "special"',
        "café's best",
      ];

      for (const query of specialQueries) {
        const request = createAuthenticatedRequest(
          `/api/places/search?query=${encodeURIComponent(query)}`,
          adminToken
        );
        
        const response = await worker.fetch(request, env);
        

        expectJsonResponse(response, 200);
      }
    });

    it('should sanitize place data input', async () => {
      const maliciousPlace = {
        name: '<script>alert("xss")</script>',
        address: 'javascript:alert("xss")',
        coordinates: {
          lat: 43.6532,
          lng: -79.3832,
        },
      };

      const request = createAuthenticatedRequest('/api/places/enrich', adminToken, {
        method: 'POST',
        body: JSON.stringify(maliciousPlace),
      });
      
      const response = await worker.fetch(request, env);
      

      if (response.ok) {
        const data = await response.json() as any;
        expect(data.enrichedPlace.name).not.toContain('<script>');
        expect(data.enrichedPlace.address).not.toContain('javascript:');
      } else {
        await expectErrorResponse(response, 400);
      }
    });

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1000);

      const request = createAuthenticatedRequest(
        `/api/places/search?query=${encodeURIComponent(longQuery)}`,
        adminToken
      );
      
      const response = await worker.fetch(request, env);
      

      // Should either handle gracefully or return appropriate error
      expect([200, 400]).toContain(response.status);
    });

    it('should validate admin permissions on all endpoints', async () => {
      const adminEndpoints = [
        {
          method: 'POST',
          path: '/api/places/enrich',
          body: {
            name: 'Test',
            address: 'Test Address',
            coordinates: { lat: 43.6532, lng: -79.3832 },
          },
        },
        {
          method: 'GET',
          path: '/api/places/search?query=test',
        },
      ];

      for (const endpoint of adminEndpoints) {
        const request = createAuthenticatedRequest(endpoint.path, userToken, {
          method: endpoint.method,
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        });
        
        const response = await worker.fetch(request, env);
        

        expect(response.status).toBe(403);
      }
    });
  });
});