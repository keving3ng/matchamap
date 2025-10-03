import { Env } from '../types';

/**
 * Extract place ID from various Google Maps URL formats
 */
export function extractPlaceIdFromUrl(url: string): string | null {
  try {
    // Format 1: /place/Name/@lat,lng with CID in URL path
    const cidMatch = url.match(/:0x([a-f0-9]+)/i);
    if (cidMatch) {
      // Try to find a ChIJ format ID in the URL first
      const chijMatch = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
      if (chijMatch) {
        return chijMatch[1];
      }
      // If no ChIJ format, return the hex CID
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

    return null;
  } catch {
    return null;
  }
}

export interface PlaceData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  hours?: string;
  phone?: string;
  website?: string;
}

/**
 * Enrich cafe data by looking up Google Places information
 */
export async function enrichCafeFromGoogleMaps(
  googleMapsUrl: string,
  env: Env
): Promise<PlaceData | null> {
  try {
    const placeId = extractPlaceIdFromUrl(googleMapsUrl);
    if (!placeId) {
      console.warn('Could not extract place ID from URL:', googleMapsUrl);
      return null;
    }

    let data: any;

    if (placeId.startsWith('0x')) {
      // Use Text Search to find the place by name from the URL
      const nameMatch = googleMapsUrl.match(/\/place\/([^/@]+)/);
      const placeName = nameMatch ? decodeURIComponent(nameMatch[1].replace(/\+/g, ' ')) : '';

      if (!placeName) {
        console.warn('Could not extract place name from URL');
        return null;
      }

      const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY || '',
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.currentOpeningHours,places.internationalPhoneNumber,places.websiteUri',
        },
        body: JSON.stringify({
          textQuery: placeName,
          maxResultCount: 1,
        }),
      });

      if (!searchResponse.ok) {
        console.error('Google Places Text Search error:', await searchResponse.text());
        return null;
      }

      const searchData: any = await searchResponse.json();
      if (!searchData.places || searchData.places.length === 0) {
        console.warn('Place not found');
        return null;
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
      ].join(',');

      const apiUrl = `https://places.googleapis.com/v1/places/${placeId}`;
      const response = await fetch(apiUrl, {
        headers: {
          'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY || '',
          'X-Goog-FieldMask': fields,
        },
      });

      if (!response.ok) {
        console.error('Google Places API error:', await response.text());
        return null;
      }

      data = await response.json();
    }

    // Transform to our format
    return {
      name: data.displayName?.text || '',
      address: data.formattedAddress || '',
      latitude: data.location?.latitude || 0,
      longitude: data.location?.longitude || 0,
      hours: data.currentOpeningHours?.weekdayDescriptions
        ? JSON.stringify(data.currentOpeningHours.weekdayDescriptions)
        : undefined,
      phone: data.internationalPhoneNumber || undefined,
      website: data.websiteUri || undefined,
    };
  } catch (error) {
    console.error('Error enriching cafe from Google Maps:', error);
    return null;
  }
}
