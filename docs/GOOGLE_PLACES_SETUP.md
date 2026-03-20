# Google Places API Setup Guide

## Quick Setup (5 minutes)

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "MatchaMap" and click Create
4. Wait for the project to be created (10-15 seconds)

### 2. Enable the Places API

1. In the Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Places API (New)"
3. Click on it and click **Enable**
4. Wait for it to enable (5-10 seconds)

### 3. Create an API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API Key**
3. Copy the API key that appears
4. Click **Edit API key** to restrict it

### 4. Restrict the API Key (Security)

**Restrict which APIs can use this key:**

1. Under "API restrictions", select "Restrict key"
2. Check only: **Places API (New)**
3. Click Save

**Add HTTP referrer restrictions (optional for local dev):**

-   For local development: No restrictions needed
-   For production: Add your domain (e.g., `https://matchamap.pages.dev/*`)

### 5. Add API Key to Your Project

1. Open `backend/wrangler.toml`
2. Replace `YOUR_API_KEY_HERE` with your actual API key:
    ```toml
    GOOGLE_PLACES_API_KEY = "AIzaSy..."
    ```
3. Save the file

### 6. Restart Your Backend Server

```bash
cd backend
npm run dev
```

That's it! The Google Maps lookup feature is now enabled.

## Testing the Integration

1. Go to your admin panel: http://localhost:3000/admin/cafes
2. Click "Add New Cafe"
3. Paste a Google Maps URL (e.g., `https://www.google.com/maps/place/...`)
4. Click Continue
5. You should see the cafe details auto-filled!

## Getting a Google Maps URL

1. Go to [Google Maps](https://maps.google.com)
2. Search for a cafe
3. Click on the cafe to open its details
4. Click the "Share" button
5. Copy the URL from the share dialog
6. **Important**: Use the full URL, not shortened goo.gl links

Example URL format:

```
https://www.google.com/maps/place/Cafe+Name/@43.6532,-79.3832,17z/data=...!1sChIJ...
```

## Pricing

-   **Free tier**: $200/month credit (renews monthly)
-   **Cost per lookup**: ~$0.04-0.05 per cafe
-   **Your usage**: If adding 20 cafes/month = $1/month (well within free tier!)

You'll never pay anything unless you add 4000+ cafes in a single month.

## Troubleshooting

### "Could not extract place ID from URL"

-   Make sure you're using the full Google Maps URL
-   Avoid shortened goo.gl links (they won't work)
-   The URL should contain place data (click "Share" to get the right URL)

### "Google Places API returned 403"

-   Check that Places API (New) is enabled in Google Cloud Console
-   Verify your API key is correct in wrangler.toml
-   Make sure the API key has Places API (New) enabled

### "Google Places API returned 400"

-   The place ID might be invalid
-   Try getting a fresh URL from Google Maps

## Need Help?

Check the [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)

---

## Integration reference (code)

Setup steps above enable the feature. Implementation lives in the repo (not duplicated here—avoid drift):

| Layer | Location |
|--------|----------|
| Backend lookup | `backend/src/routes/places.ts` — `POST /api/admin/places/lookup` |
| API client | `frontend/src/utils/api.ts` — `api.places.lookup(...)` |
| Admin UI | Cafe form uses lookup to pre-fill fields when a Google Maps URL is present |

**Security:** Keep `GOOGLE_PLACES_API_KEY` in Wrangler/backend only—never in the frontend bundle. Restrict the key to Places API (and Photos if you enable photo media URLs). Rate-limit or cache admin lookups if exposed beyond trusted editors.

**Cost:** Occasional cafe imports stay well within typical Google Maps Platform free credit; see **Pricing** above.
