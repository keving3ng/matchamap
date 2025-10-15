---
description: Add a new city to MatchaMap (updates shared types and city store)
args:
  - name: city_key
    description: City key in lowercase (e.g., vancouver, los-angeles, san-francisco)
    required: true
  - name: city_name
    description: Display name (e.g., "Vancouver", "Los Angeles", "San Francisco")
    required: true
  - name: short_code
    description: 2-3 letter code (e.g., VAN, LA, SF)
    required: true
  - name: latitude
    description: City center latitude (e.g., 49.2827)
    required: true
  - name: longitude
    description: City center longitude (e.g., -123.1207)
    required: true
---

Add a new city to MatchaMap by updating the shared types and city store configuration.

## Steps to Complete

### 1. Add to Shared Types (VALID_CITY_KEYS)

Update `shared/types/index.ts`:

```typescript
export const VALID_CITY_KEYS = [
  'toronto',
  'montreal',
  'new york',
  'mississauga',
  'scarborough',
  'tokyo',
  'kyoto',
  'osaka',
  '{{city_key}}', // ← ADD THIS LINE (keep alphabetical order if preferred)
] as const
```

**Important:**
- City key MUST be lowercase
- Use spaces for multi-word cities (e.g., `'new york'`, `'los angeles'`)
- Keep the format consistent with existing keys

### 2. Add City Configuration to Frontend

Update `frontend/src/stores/cityStore.ts`:

Add to the `CITIES` constant:

```typescript
export const CITIES: Record<CityKey, City> = {
  // ... existing cities
  '{{city_key}}': {
    key: '{{city_key}}',
    name: '{{city_name}}',
    shortCode: '{{short_code}}',
    center: [{{latitude}}, {{longitude}}],
    zoom: 13, // Default zoom level (adjust if needed: 11=country, 13=city, 15=neighborhood)
  },
}
```

**Map Center Tips:**
- Use the approximate city center (downtown area)
- Find coordinates: https://www.latlong.net/
- Zoom levels:
  - `11` = Wide view (country/region)
  - `13` = City view (recommended default)
  - `15` = Neighborhood view

### 3. Verify Changes

After making the updates:

1. **Type check:** `npm run typecheck`
2. **Build:** `npm run build`
3. **Test locally:** Start dev server and verify:
   - Admin UI shows new city in dropdown
   - Map city selector includes new city
   - List view city filter includes new city

### 4. Deploy

**Using GitHub MCP Server:**

Use `mcp__github__push_files` to push the changes:
- Files to push: `shared/types/index.ts`, `frontend/src/stores/cityStore.ts`
- Commit message: `feat(cities): add {{city_name}}`
- Branch: `main`

Cloudflare Pages will auto-deploy in 1-2 minutes.

### 5. Add Cafes

Once deployed:
1. Login to admin UI
2. Click "Add New Cafe"
3. Select "{{city_name}}" from city dropdown
4. Add cafe details and save

## What Gets Updated Automatically

When you add a city using this process:
- ✅ Admin UI dropdown (all cafe forms)
- ✅ Map city selector
- ✅ List view city filter (desktop + mobile)
- ✅ `/api/cities` endpoint (once cafes are added)
- ✅ Backend validation (prevents invalid city keys)
- ✅ TypeScript type safety

## Example Usage

```bash
/add-city vancouver "Vancouver" VAN 49.2827 -123.1207
/add-city "los angeles" "Los Angeles" LA 34.0522 -118.2437
/add-city "san francisco" "San Francisco" SF 37.7749 -122.4194
```

## Notes

- **City keys with spaces:** Use quotes in the slash command (e.g., `"los angeles"`)
- **No database changes needed:** Cities are code-controlled for type safety
- **Case sensitive:** Always use lowercase for city keys
- **Validation:** Backend automatically validates new cafes against VALID_CITY_KEYS

## Troubleshooting

**TypeScript errors after adding city?**
- Make sure city key is in VALID_CITY_KEYS
- Verify key matches exactly between shared types and city store
- Run `npm run typecheck` to see specific errors

**City not showing in dropdowns?**
- Clear browser cache
- Verify build succeeded (`npm run build`)
- Check both files were updated correctly

**Backend rejecting new cafe?**
- Ensure city key is in VALID_CITY_KEYS (shared/types/index.ts)
- Check backend logs for validation error message
- Verify key is lowercase and matches exactly

---

**Related Documentation:** `docs/adding-new-cities.md`
