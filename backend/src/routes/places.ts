import { IRequest } from 'itty-router';
import { Env } from '../types';
import { jsonResponse, errorResponse, badRequestResponse } from '../utils/response';
import { HTTP_STATUS, CACHE_CONSTANTS } from '../constants';
import { safeValidate, lookupPlaceRequestSchema } from '../validators';

/**
 * Extract place ID from various Google Maps URL formats
 */
function extractPlaceIdFromUrl(url: string): string | null {
  try {
    // Format 1: /place/Name/@lat,lng with CID in URL path
    // Example: /place/.../@43.65,-79.42/...
    // The place ID is encoded in the hex after the colon (0x...)
    const cidMatch = url.match(/:0x([a-f0-9]+)/i);
    if (cidMatch) {
      // Convert hex CID to place ID
      // For now, we'll use the CID format which Google also accepts
      const cid = cidMatch[0]; // e.g., ":0xa01b0587e1b29337"

      // Try to find a ChIJ format ID in the URL first
      const chijMatch = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
      if (chijMatch) {
        return chijMatch[1];
      }

      // If no ChIJ format, return the hex CID (without the colon)
      return '0x' + cidMatch[1];
    }

    // Format 2: https://www.google.com/maps/place/.../@lat,lng,zoom/data=...!1sChIJ...
    const placeIdMatch = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
    if (placeIdMatch) {
      return placeIdMatch[1];
    }

    // Format 3: https://www.google.com/maps/place/?q=place_id:ChIJ...
    const directMatch = url.match(/place_id[=:](ChIJ[A-Za-z0-9_-]+)/);
    if (directMatch) {
      return directMatch[1];
    }

    // Format 4: https://maps.app.goo.gl/... (shortened URLs)
    // These need to be resolved by following the redirect
    if (url.includes('maps.app.goo.gl')) {
      // We'll need to follow the redirect on the client side first
      // For now, return null and handle in frontend
      return null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * POST /api/admin/places/lookup
 * Look up a place from Google Maps URL and return structured data
 */
export async function lookupPlace(request: IRequest, env: Env): Promise<Response> {
  try {
    const body = await request.json();

    // Validate input using Zod schema
    const validation = safeValidate(lookupPlaceRequestSchema, body);
    if (!validation.success) {
      return badRequestResponse(validation.error, request as Request, env);
    }

    const { googleMapsUrl } = validation.data;

    // Extract place ID from URL
    const placeId = extractPlaceIdFromUrl(googleMapsUrl);

    if (!placeId) {
      return badRequestResponse(
        'Could not extract place ID from URL. Please use a full Google Maps URL (not shortened link).',
        request as Request,
        env
      );
    }

    // Call Google Places API (New)
    // For hex CID format (0x...), use Text Search to find the place by name
    let data: any;

    if (placeId.startsWith('0x')) {
      // Use Text Search to find the place by name from the URL
      const nameMatch = googleMapsUrl.match(/\/place\/([^/@]+)/);
      const placeName = nameMatch ? decodeURIComponent(nameMatch[1].replace(/\+/g, ' ')) : '';

      if (!placeName) {
        throw new Error('Could not extract place name from URL');
      }

      // Use Text Search API with correct field mask format
      const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.currentOpeningHours,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri',
        },
        body: JSON.stringify({
          textQuery: placeName,
          maxResultCount: 1,
        }),
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Google Places Text Search error:', {
          status: searchResponse.status,
          statusText: searchResponse.statusText,
          body: errorText,
          placeName,
        });
        
        // Return specific error message based on status code
        if (searchResponse.status === 400) {
          throw new Error('Invalid Google Maps URL or place ID');
        } else if (searchResponse.status === 403) {
          throw new Error('Google API key is invalid or disabled');
        } else if (searchResponse.status === 429) {
          throw new Error('Google API rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Google Places API error: ${searchResponse.status} ${searchResponse.statusText}`);
        }
      }

      const searchData = await searchResponse.json() as { places?: any[] };
      if (!searchData.places || searchData.places.length === 0) {
        throw new Error('Place not found');
      }

      data = searchData.places[0];
    } else {
      // Use Place Details API for ChIJ format IDs
      const fields = [
        'id',
        'displayName',
        'formattedAddress',
        'location',
        'currentOpeningHours',
        'internationalPhoneNumber',
        'websiteUri',
        'rating',
        'userRatingCount',
        'googleMapsUri',
      ].join(',');

      const apiUrl = `https://places.googleapis.com/v1/places/${placeId}`;

      const response = await fetch(apiUrl, {
        headers: {
          'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': fields,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Places API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          placeId,
        });
        
        // Return specific error message based on status code
        if (response.status === 400) {
          throw new Error('Invalid Google Maps URL or place ID');
        } else if (response.status === 403) {
          throw new Error('Google API key is invalid or disabled');
        } else if (response.status === 404) {
          throw new Error('Place not found. Please verify the Google Maps URL.');
        } else if (response.status === 429) {
          throw new Error('Google API rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
        }
      }

      data = await response.json();
    }

    // Transform to our format
    const placeData = {
      name: data.displayName?.text || '',
      address: data.formattedAddress || '',
      latitude: data.location?.latitude || 0,
      longitude: data.location?.longitude || 0,
      hours: data.currentOpeningHours?.weekdayDescriptions
        ? JSON.stringify(data.currentOpeningHours.weekdayDescriptions)
        : '',
      phone: data.internationalPhoneNumber || '',
      website: data.websiteUri || '',
      googleMapsUrl: data.googleMapsUri || googleMapsUrl,
      rating: data.rating || 0,
      reviewCount: data.userRatingCount || 0,
    };

    return jsonResponse(
      { place: placeData },
      HTTP_STATUS.OK,
      request as Request,
      env,
      CACHE_CONSTANTS.NO_STORE
    );
  } catch (error) {
    console.error('Error looking up place:', error);
    
    // Return specific error message if available, otherwise generic message
    const errorMessage = error instanceof Error ? error.message : 'Failed to lookup place from Google Maps';

    // Determine appropriate HTTP status code
    let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('Invalid Google Maps URL')) {
        statusCode = HTTP_STATUS.NOT_FOUND;
      } else if (error.message.includes('rate limit')) {
        statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
      } else if (error.message.includes('API key is invalid')) {
        statusCode = HTTP_STATUS.FORBIDDEN;
      }
    }
    
    return errorResponse(
      errorMessage,
      statusCode,
      request as Request,
      env
    );
  }
}
