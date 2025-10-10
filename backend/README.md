# MatchaMap Backend API

Backend API for MatchaMap built with Cloudflare Workers, D1 Database, and Drizzle ORM.

## Tech Stack

-   **Runtime**: Cloudflare Workers
-   **Database**: Cloudflare D1 (SQLite at the edge)
-   **Router**: itty-router (450 bytes)
-   **ORM**: Drizzle ORM
-   **TypeScript**: Strict mode enabled

## Project Structure

```
backend/
├── src/
│   ├── index.ts          # Worker entry point
│   ├── types.ts          # TypeScript types
│   ├── routes/           # API route handlers
│   │   ├── health.ts
│   │   ├── cafes.ts
│   │   ├── feed.ts
│   │   ├── events.ts
│   │   └── neighborhoods.ts
│   ├── utils/            # Utility functions
│   │   ├── cors.ts
│   │   └── response.ts
│   └── db/               # Database utilities
│       └── index.ts
├── drizzle/
│   ├── schema.ts         # Database schema (source of truth)
│   ├── seed.ts           # Seed script
│   └── migrations/       # Generated SQL migrations
├── wrangler.toml         # Cloudflare Workers config
├── drizzle.config.ts     # Drizzle Kit config
├── package.json
└── tsconfig.json
```

## Prerequisites

1. [Node.js](https://nodejs.org/) 18+ installed
2. [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier)
3. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed globally

```bash
npm install -g wrangler
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Create D1 Database

```bash
npm run db:create
```

This will output a database ID. Copy it and paste into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "matchamap-db"
database_id = "paste-your-database-id-here"
```

### 4. Run Migrations

**For local development:**

```bash
npm run db:migrate:local
```

**For production:**

```bash
npm run db:migrate:prod
```

### 5. Seed Database (Optional)

```bash
wrangler d1 execute matchamap-db --local --file=./drizzle/migrations/seed.sql
```

This adds sample cafes, neighborhoods, drinks, feed items, and events for testing.

### 6. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:8787`

## Development Workflow

### Making Schema Changes

1. Edit `drizzle/schema.ts`
2. Generate migration:
    ```bash
    npm run db:generate
    ```
3. Apply migration locally:
    ```bash
    npm run db:migrate:local
    ```
4. Test changes
5. Apply to production:
    ```bash
    npm run db:migrate:prod
    ```

### Testing Locally

```bash
# Start dev server
npm run dev

# In another terminal, test endpoints
curl http://localhost:8787/api/health
curl http://localhost:8787/api/cafes
curl http://localhost:8787/api/cafes/1
```

### Type Checking

```bash
npm run typecheck
```

## Deployment

### Deploy to Production

```bash
npm run deploy:production
```

### Rollback

If something breaks:

```bash
wrangler rollback
```

## API Endpoints

### Public Endpoints (No Auth)

-   `GET /api/health` - Health check
-   `GET /api/cafes` - List cafes (with filters: city, neighborhood, minScore, maxPrice, limit, offset)
-   `GET /api/cafes/:id` - Get single cafe with drinks
-   `GET /api/neighborhoods` - List neighborhoods with cafe counts
-   `GET /api/feed` - List feed items (with filters: type, limit, offset)
-   `GET /api/events` - List events (with filters: upcoming, featured, limit)

### Admin Endpoints (Cloudflare Access Required)

-   `POST /api/admin/cafes` - Create cafe
-   `PUT /api/admin/cafes/:id` - Update cafe
-   `DELETE /api/admin/cafes/:id` - Soft delete cafe

## Environment Variables

Set in `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "development"
ALLOWED_ORIGINS = "http://localhost:3000,https://matchamap.club,https://*.matchamap.club"
```

## Database Schema

See `drizzle/schema.ts` for the complete schema. Main tables:

-   `cafes` - Cafe locations and details
-   `drinks` - Drink menu items
-   `neighborhoods` - Neighborhood boundaries
-   `feed_items` - News feed content
-   `events` - Upcoming events

## Caching Strategy

-   Public endpoints: `Cache-Control: public, max-age=300` (5 min)
-   Admin endpoints: `Cache-Control: no-store`
-   ETags supported on GET requests

## CORS Configuration

Allowed origins are configured in `wrangler.toml` and enforced in the CORS middleware.

## Rate Limiting

Cloudflare's built-in rate limiting: 100 req/min per IP (configured in dashboard).

## Troubleshooting

### Database not found

Make sure you've created the D1 database and updated `wrangler.toml` with the database ID.

### CORS errors

Check that your origin is in the `ALLOWED_ORIGINS` list in `wrangler.toml`.

### TypeScript errors

Run `npm run typecheck` to see all type errors.

### Migration errors

Check migration files in `drizzle/migrations/` for SQL syntax errors.

## Next Steps

1. Set up Cloudflare Access for admin endpoints
2. Build admin UI (React SPA)
3. Connect frontend to API
4. Set up daily backups via GitHub Actions
5. Add monitoring with UptimeRobot

## Resources

-   [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
-   [Drizzle ORM Docs](https://orm.drizzle.team/)
-   [itty-router Docs](https://itty.dev/)
-   [D1 Database Docs](https://developers.cloudflare.com/d1/)
