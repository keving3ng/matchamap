# MatchaMap Backend Quick Start

This guide will get your backend API running locally in ~10 minutes.

## Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier)
- Wrangler CLI: `npm install -g wrangler`

## Quick Setup (5 steps)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create D1 Database

```bash
wrangler d1 create matchamap-db
```

Copy the database ID from the output and paste it into `backend/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "matchamap-db"
database_id = "paste-your-database-id-here"  # <-- Update this line
```

### 4. Run Migrations

```bash
# Apply database schema
npm run db:migrate:local

# Note: Sample data is in drizzle/seed.ts for reference
# Use the admin UI to add cafes, or manually insert data
```

### 5. Start Dev Server

```bash
npm run dev
```

The API is now running at `http://localhost:8787`

## Test Your API

Open a new terminal and try these commands:

```bash
# Health check
curl http://localhost:8787/api/health

# List cafes
curl http://localhost:8787/api/cafes

# Get specific cafe with drinks
curl http://localhost:8787/api/cafes/1

# List feed items
curl http://localhost:8787/api/feed

# List events
curl http://localhost:8787/api/events
```

## What You Just Built

✅ Cloudflare Workers API with TypeScript
✅ D1 SQLite database at the edge
✅ Drizzle ORM with type safety
✅ REST endpoints for cafes, drinks, feed, events
✅ CORS support for frontend integration
✅ Sample data loaded

## Next Steps

1. **Deploy to production**: `npm run deploy:production`
2. **Set up admin UI**: See Phase 1 checklist in PRD
3. **Connect frontend**: Update API client to use Workers endpoints
4. **Set up Cloudflare Access**: Protect `/api/admin/*` endpoints

## Troubleshooting

**Database not found?**
- Make sure you updated `wrangler.toml` with your database ID

**Port already in use?**
- Kill the process using port 8787: `lsof -ti:8787 | xargs kill`

**TypeScript errors?**
- Run `npm run typecheck` to see what's wrong

**Need help?**
- Check [backend/README.md](backend/README.md) for detailed docs
- Review [docs/backend-prd.md](docs/backend-prd.md) for architecture

## File Structure

```
backend/
├── src/
│   ├── index.ts              # Main entry point
│   ├── routes/               # API endpoints
│   │   ├── cafes.ts         # Cafe CRUD
│   │   ├── feed.ts          # Feed items
│   │   └── events.ts        # Events
│   └── utils/               # Helpers (CORS, responses)
├── drizzle/
│   ├── schema.ts            # Database schema
│   ├── seed.ts              # Sample data reference
│   └── migrations/          # SQL migrations
└── wrangler.toml            # Cloudflare config
```

## Common Commands

```bash
# Development
npm run dev                    # Start local server
npm run typecheck             # Check TypeScript

# Database
npm run db:generate           # Generate new migration
npm run db:migrate:local      # Apply migrations locally
npm run db:migrate:prod       # Apply migrations to production

# Deployment
npm run deploy                # Deploy to production
wrangler rollback             # Rollback if needed
```

## Phase 1 Complete! 🎉

You've successfully implemented the Phase 1 backend from the PRD:

- ✅ Cloudflare Workers project set up
- ✅ D1 database configured
- ✅ Database schema created
- ✅ Basic CRUD API implemented
- ✅ Migration pipeline ready
- ✅ Seed data loaded
- ✅ Health check endpoint working

**Time to ship:** ~10 minutes
**Infrastructure cost:** $0/month

Now you can build the admin UI and connect your frontend!
