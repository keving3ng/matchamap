# Google Places API Integration

## Setup

1. **Enable APIs in Google Cloud Console:**
   - Places API (New)
   - Photos API

2. **Get API Key:**
   - Create a new API key in Google Cloud Console
   - Restrict it to Places API only
   - Add HTTP referrer restrictions for security

3. **Add to Backend Environment:**
   ```toml
   # backend/wrangler.toml
   [vars]
   GOOGLE_PLACES_API_KEY = "your-api-key-here"
   ```

## Backend Route

```typescript
// backend/src/routes/places.ts
import { IRequest } from 'itty-router';
import { Env } from '../types';
import { jsonResponse, errorResponse } from '../utils/response';

// POST /api/admin/places/lookup
export async function lookupPlace(request: IRequest, env: Env): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { googleMapsUrl } = body;

    // Extract place ID from Google Maps URL
    // Example: https://maps.app.goo.gl/... or https://www.google.com/maps/place/...
    const placeId = extractPlaceIdFromUrl(googleMapsUrl);

    if (!placeId) {
      return errorResponse('Invalid Google Maps URL', 400, request as Request, env);
    }

    // Call Google Places API (New)
    const apiUrl = `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,location,currentOpeningHours,photos,internationalPhoneNumber,websiteUri,rating,userRatingCount,priceLevel&key=${env.GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch place details');
    }

    const data = await response.json();

    // Transform to our format
    const placeData = {
      name: data.displayName?.text || '',
      address: data.formattedAddress || '',
      latitude: data.location?.latitude || 0,
      longitude: data.location?.longitude || 0,
      hours: data.currentOpeningHours ? JSON.stringify(data.currentOpeningHours) : '',
      phone: data.internationalPhoneNumber || '',
      website: data.websiteUri || '',
      googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      rating: data.rating || 0,
      reviewCount: data.userRatingCount || 0,
      priceLevel: data.priceLevel || '',
      photos: data.photos?.slice(0, 5).map((photo: any) => ({
        name: photo.name,
        // Photos need separate API call to fetch
        url: `https://places.googleapis.com/v1/${photo.name}/media?key=${env.GOOGLE_PLACES_API_KEY}&maxHeightPx=800&maxWidthPx=800`
      })) || [],
    };

    return jsonResponse(placeData, 200, request as Request, env);
  } catch (error) {
    console.error('Error looking up place:', error);
    return errorResponse('Failed to lookup place', 500, request as Request, env);
  }
}

function extractPlaceIdFromUrl(url: string): string | null {
  try {
    // Handle different Google Maps URL formats

    // Format 1: https://maps.app.goo.gl/... (shortened)
    // Need to follow redirect first, then extract place ID

    // Format 2: https://www.google.com/maps/place/.../@lat,lng,zoom/data=...
    const placeIdMatch = url.match(/!1s([^!]+)/);
    if (placeIdMatch) {
      return placeIdMatch[1];
    }

    // Format 3: https://www.google.com/maps/place/?q=place_id:ChIJ...
    const directMatch = url.match(/place_id[=:]([A-Za-z0-9_-]+)/);
    if (directMatch) {
      return directMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}
```

## Frontend Integration

```typescript
// frontend/src/utils/api.ts

export const placesAPI = {
  async lookup(googleMapsUrl: string): Promise<any> {
    return fetchAPI('/admin/places/lookup', {
      method: 'POST',
      body: JSON.stringify({ googleMapsUrl }),
    })
  },
}
```

## Usage in CafeForm

```typescript
// Add to CafeForm.tsx

const [isLookingUp, setIsLookingUp] = useState(false)

const handleLookupPlace = async () => {
  if (!formData.googleMapsUrl) {
    alert('Please enter a Google Maps URL first')
    return
  }

  try {
    setIsLookingUp(true)
    const placeData = await api.places.lookup(formData.googleMapsUrl)

    // Pre-populate form with fetched data
    setFormData(prev => ({
      ...prev,
      name: placeData.name || prev.name,
      lat: placeData.latitude || prev.lat,
      lng: placeData.longitude || prev.lng,
      hours: placeData.hours || prev.hours,
      // Let user manually fill in matcha-specific fields
    }))

    alert('Place info loaded! Review and fill in matcha-specific details.')
  } catch (error) {
    alert(`Failed to lookup place: ${(error as Error).message}`)
  } finally {
    setIsLookingUp(false)
  }
}

// Add button in form:
<button
  type="button"
  onClick={handleLookupPlace}
  disabled={isLookingUp || !formData.googleMapsUrl}
>
  {isLookingUp ? 'Looking up...' : '🔍 Auto-fill from Google Maps'}
</button>
```

## Cost Estimate

**For occasional cafe additions:**
- 5 cafes/week = 20 cafes/month
- 20 × $0.046 = **$0.92/month**
- Well within the $200 free tier

**Even at scale:**
- 100 cafes/month = **$4.60/month**
- Still within free tier!

## Security Notes

1. **Never expose API key in frontend** - always call from backend
2. **Restrict API key** to specific APIs and domains
3. **Rate limit** the lookup endpoint to prevent abuse
4. Consider caching results to avoid duplicate lookups

## Alternative: Manual Entry

If you want to avoid Google API entirely:
- User manually copies lat/lng from Google Maps
- Paste Google Maps URL directly
- Manually enter hours
- Upload photos from Instagram/TikTok posts

This is free but requires more manual work.
