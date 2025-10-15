# Adding New Cities to MatchaMap

## Overview

MatchaMap uses a code-based, bulletproof city management system that ensures type safety and prevents data inconsistencies.

## City Key Rules

1. **Database stores normalized keys only** (e.g., `"new york"`, not `"New York City"`)
2. **All keys must be lowercase**
3. **Keys must match exactly** between frontend `CITIES` constant and database
4. **Backend validates all city keys** on create/update operations

## How to Add a New City

### Quick Method: Use Slash Command

```bash
/add-city <city_key> <city_name> <short_code> <latitude> <longitude>

# Examples:
/add-city vancouver "Vancouver" VAN 49.2827 -123.1207
/add-city "los angeles" "Los Angeles" LA 34.0522 -118.2437
```

The slash command will guide you through the exact steps and provide the code snippets.

### Manual Method

### Step 1: Add to Shared Types

Edit `shared/types/index.ts`:

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
  'vancouver', // ← Add new city key here
] as const
```

### Step 2: Add City Details to Frontend

Edit `frontend/src/stores/cityStore.ts`:

```typescript
export const CITIES: Record<CityKey, City> = {
  // ... existing cities
  vancouver: {
    key: 'vancouver',
    name: 'Vancouver',
    shortCode: 'VAN',
    center: [49.2827, -123.1207], // [latitude, longitude]
    zoom: 13,
  },
}
```

### Step 3: Deploy

**Using GitHub MCP Server (Recommended):**

Use `mcp__github__push_files` to push the changes:
- Files: `shared/types/index.ts`, `frontend/src/stores/cityStore.ts`
- Commit message: `feat(cities): add Vancouver`
- Branch: `main`

Auto-deploys via Cloudflare Pages (1-2 minutes)

### Step 4: Add Cafes

Once deployed:
1. Login to admin UI
2. "Add New Cafe" dropdown will now include Vancouver
3. Create cafes with `city: "vancouver"`

## Architecture

### Type Safety Flow

```
┌─────────────────────────────────────┐
│ shared/types/index.ts               │
│ - VALID_CITY_KEYS (source of truth) │
│ - CityKey type                      │
└───────────┬─────────────────────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌───────────┐  ┌──────────────┐
│ Backend   │  │ Frontend     │
│ Validates │  │ CITIES const │
│ on write  │  │ Display info │
└───────────┘  └──────────────┘
```

### Data Flow

1. **Admin creates cafe** → Backend validates city key against `VALID_CITY_KEYS`
2. **Database stores** → Normalized lowercase key (e.g., `"vancouver"`)
3. **API returns** → Exact database value (already normalized)
4. **Frontend displays** → Maps key to `CITIES[key].name` (e.g., "Vancouver")
5. **Filters work** → Direct string comparison (no normalization needed)

## What Gets Updated Automatically

When you add a city:
- ✅ Admin UI dropdown (all 3 admin forms)
- ✅ Map city selector
- ✅ List view city filter (desktop + mobile)
- ✅ `/api/cities` endpoint (once cafes exist)
- ✅ Type safety (TypeScript enforces valid keys)

## Validation

### Backend Validation

```typescript
// backend/src/routes/cafes.ts
if (!VALID_CITY_KEYS.includes(cityKey as any)) {
  return badRequestResponse(
    `Invalid city. Must be one of: ${VALID_CITY_KEYS.join(', ')}`,
    request,
    env
  );
}
```

### Frontend Type Safety

```typescript
// TypeScript prevents this:
const invalidCity: CityKey = "invalid" // ❌ Compile error

// TypeScript allows this:
const validCity: CityKey = "vancouver" // ✅ Works
```

## Migration History

### 2025-10-10: Normalized City Keys

**Migration:** `0009_normalize_city_keys.sql`
- Converted `"new york city"` → `"new york"`
- Lowercased all city values
- Established bulletproof normalization

## FAQs

### Can admins add cities via UI?

No. Cities are code-controlled for:
- Type safety (TypeScript)
- Data integrity (validated keys)
- Simplicity (no complex admin UI)
- Performance (static configuration)

Adding a city takes ~5 minutes of dev work.

### What if a city name has spaces?

Use lowercase with spaces in the key:
```typescript
'new york': { name: 'New York', ... }
'los angeles': { name: 'Los Angeles', ... }
```

### Can we rename a city?

Yes, but requires a migration:
```sql
UPDATE cafes SET city = 'new-name' WHERE city = 'old-name';
```

Then update `VALID_CITY_KEYS` and `CITIES` constant.

### What about internationalization?

City names in `CITIES.name` can be translated in the future via i18n. Keys remain English lowercase.

## Related Files

- `shared/types/index.ts` - City key source of truth
- `frontend/src/stores/cityStore.ts` - City display config
- `frontend/src/components/admin/CafeFormWizard.tsx` - Admin dropdown
- `frontend/src/components/MapView.tsx` - Map city selector
- `frontend/src/components/ListView.tsx` - List city filter
- `backend/src/routes/cafes.ts` - City validation
- `backend/drizzle/migrations/0009_normalize_city_keys.sql` - Normalization migration
