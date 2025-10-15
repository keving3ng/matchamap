# MatchaMap Deployment Guide

**Version:** 2.0
**Date:** October 1, 2025
**Status:** Updated for Cloudflare Stack

## Overview

MatchaMap deploys to Cloudflare's edge infrastructure for zero-latency global performance. Frontend hosted on Cloudflare Pages, backend API on Cloudflare Workers, database on D1.

## Deployment Architecture

```
┌──────────────────┐
│  React Frontend  │ → Cloudflare Pages (static SPA)
└──────────────────┘

┌──────────────────┐
│ Workers Backend  │ → Cloudflare Workers (API + routing)
└──────────────────┘

┌──────────────────┐
│   D1 Database    │ → SQLite at the edge
└──────────────────┘

┌──────────────────┐
│  R2 Storage      │ → Image storage (future)
└──────────────────┘
```

## Prerequisites

### Required Tools

-   **Node.js**: 18.x or later
-   **npm**: 9.x or later
-   **Wrangler CLI**: `npm install -g wrangler`
-   **Git**: For version control

### Cloudflare Account

-   Sign up at https://dash.cloudflare.com
-   Free tier is sufficient for V1
-   No credit card required for development

## Local Development

### Frontend Development

```bash
# Start React dev server
npm run dev

# Runs on http://localhost:3000
# Hot module reloading enabled
# Points to local Workers API (if running)
```

### Backend Development

```bash
# Start Workers dev server
cd workers
npm run dev

# Runs on http://localhost:8787
# Local D1 database in .wrangler/state
# Simulates production edge environment
```

### Full Stack Development

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd workers && npm run dev

# Frontend proxies API requests to Workers
# Full local development environment
```

## Cloudflare Pages Setup (Frontend)

### Initial Setup

1. **Connect Repository**

    ```bash
    # Via Cloudflare Dashboard:
    Pages → Create Project → Connect to Git
    Select: GitHub/GitLab repository
    ```

2. **Build Configuration**

    ```
    Framework preset: Vite
    Build command: npm run build
    Build output directory: dist
    Root directory: /
    Branch: main
    ```

3. **Environment Variables** (none needed for V1)

### Automatic Deployment

**Using GitHub MCP Server (Recommended):**

Use the GitHub MCP server tools to push changes:
1. Use `mcp__github__create_or_update_file` to update individual files
2. Use `mcp__github__push_files` to push multiple files in a single commit
3. Cloudflare Pages automatically detects the push and deploys

**Example commit message format:** `feat: add new feature`

Cloudflare Pages automatically:
1. Detects push to main
2. Runs npm run build
3. Deploys to edge CDN (~1 min)

### Manual Deployment

```bash
# Deploy via Wrangler
npx wrangler pages deploy dist

# Preview deployment (doesn't affect production)
npx wrangler pages deploy dist --branch preview
```

## Cloudflare Workers Setup (Backend)

### Initial Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create matchamap-db

# Update wrangler.toml with database ID
```

### R2 Bucket Setup (Photo Storage)

**Required for:** User photo uploads, profile avatars, cafe photos

```bash
# Create production R2 bucket
npx wrangler r2 bucket create matchamap-photos

# Create development R2 bucket
npx wrangler r2 bucket create matchamap-photos-dev

# Verify buckets were created
npx wrangler r2 bucket list
```

**Configuration:**
The R2 buckets are already configured in `backend/wrangler.toml`:

```toml
[[r2_buckets]]
binding = "PHOTOS_BUCKET"
bucket_name = "matchamap-photos"
preview_bucket_name = "matchamap-photos-dev"
```

**Custom Domain (Optional):**
For production deployments, configure a custom domain for photo URLs:

1. Navigate to R2 in Cloudflare Dashboard
2. Select `matchamap-photos` bucket
3. Go to Settings → Public Access
4. Click "Connect Domain"
5. Enter subdomain: `photos.matchamap.club`
6. Add DNS record (CNAME): `photos → matchamap-photos.r2.dev`

**Environment Variable:**
Set `PHOTOS_BASE_URL` in `wrangler.toml` for custom photo URLs:

```toml
[vars]
PHOTOS_BASE_URL = "https://photos.matchamap.club"
```

If not set, defaults to `https://photos.matchamap.app`

### wrangler.toml Configuration

```toml
name = "matchamap-api"
main = "src/index.ts"
compatibility_date = "2025-10-01"

[[d1_databases]]
binding = "DB"
database_name = "matchamap-db"
database_id = "<your-database-id-here>"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "matchamap-images"
preview_bucket_name = "matchamap-images-preview"

[env.production]
name = "matchamap-api"

[env.staging]
name = "matchamap-api-staging"
```

### Database Migrations

```bash
# Run migrations locally
npx wrangler d1 execute matchamap-db --local --file=./migrations/0001_initial.sql

# Run migrations in production
npx wrangler d1 execute matchamap-db --remote --file=./migrations/0001_initial.sql

# Generate migration with Drizzle
npm run db:generate

# Apply migrations
npm run db:migrate
```

### Deploy Workers

```bash
# Deploy to production
npm run deploy

# Or via wrangler directly
npx wrangler deploy

# Deploy to staging
npx wrangler deploy --env staging
```

## Environment Variables

### Frontend (.env)

```bash
# Development
VITE_API_URL=http://localhost:8787

# Production (set in Cloudflare Pages dashboard)
VITE_API_URL=https://api.matchamap.com
```

### Backend (wrangler.toml)

```toml
[vars]
ENVIRONMENT = "production"

[env.staging.vars]
ENVIRONMENT = "staging"
```

## Custom Domain Setup

### Frontend Domain

1. **Add Custom Domain** (Cloudflare Pages Dashboard)

    ```
    Pages → Settings → Custom Domains
    Add: matchamap.com
    ```

2. **DNS Configuration** (automatic if using Cloudflare DNS)

    ```
    Type: CNAME
    Name: @
    Target: matchamap.pages.dev
    Proxy: Enabled
    ```

3. **SSL Certificate**
    - Automatic via Cloudflare Universal SSL
    - Active within minutes

### API Domain

1. **Add Route** (Workers Dashboard)

    ```
    Workers → matchamap-api → Triggers
    Add Route: api.matchamap.com/*
    ```

2. **DNS Configuration**
    ```
    Type: CNAME
    Name: api
    Target: matchamap.com
    Proxy: Enabled
    ```

## Cloudflare Access (Admin Protection)

### Setup Admin Authentication

```bash
# Via Cloudflare Dashboard:
Zero Trust → Access → Applications → Add Application

Application name: MatchaMap Admin
Type: Self-hosted
Domain: matchamap.com
Path: /admin/*

Policy:
  Name: Admin Only
  Action: Allow
  Include: Emails (your@email.com)
```

### Access Configuration

```toml
# No code changes needed
# Cloudflare Access protects /admin/* routes
# Users authenticate via Google/GitHub/etc
```

## Database Management

### Backup Strategy

```bash
# Export database (daily via GitHub Actions)
npx wrangler d1 export matchamap-db --output=backups/db-$(date +%Y%m%d).sql

# Restore from backup
npx wrangler d1 execute matchamap-db --file=backups/db-20251001.sql
```

### Data Seeding

```bash
# Seed initial data from JSON
npm run db:seed

# Migrate from old JSON to D1
npm run migrate:json-to-d1
```

## Monitoring & Analytics

### Cloudflare Analytics

```
Dashboard → Analytics → Web Analytics
- Page views
- Unique visitors
- Core Web Vitals
- Geographic distribution
```

### Workers Analytics

```
Workers → matchamap-api → Analytics
- Request count
- Error rate
- CPU time
- Response time
```

### Custom Metrics (Phase 2)

```typescript
// Track custom events
analytics.track("cafe_view", { cafeId: 42 });
analytics.track("directions_click", { cafeId: 42 });
```

## CI/CD Pipeline

### GitHub Actions (Future)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
    push:
        branches: [main]

jobs:
    deploy-frontend:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
            - run: npm install
            - run: npm run build
            - uses: cloudflare/pages-action@v1
              with:
                  apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
                  accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
                  projectName: matchamap

    deploy-workers:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - run: cd workers && npm install
            - run: cd workers && npm run deploy
              env:
                  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Troubleshooting

### Build Failures

```bash
# Frontend build fails
npm run build -- --verbose
# Check for TypeScript errors, missing deps

# Workers build fails
cd workers && npm run build
# Check wrangler.toml config
```

### Database Issues

```bash
# Can't connect to D1
npx wrangler d1 list
# Verify database ID in wrangler.toml

# Migration fails
npx wrangler d1 execute DB --local --file=migrations/rollback.sql
```

### Deployment Issues

```bash
# Pages deployment stuck
# Check Cloudflare status page
# Clear build cache in Pages settings

# Workers not updating
npx wrangler deploy --force
```

## Performance Optimization

### Frontend Optimization

```bash
# Analyze bundle size
npm run build
npx vite-bundle-visualizer

# Optimize images
npm run optimize-images

# Check Lighthouse score
npx lighthouse https://matchamap.com
```

### Workers Optimization

```bash
# Check CPU time
# Dashboard → Workers → Analytics → CPU Time

# Optimize queries
# Use prepared statements
# Add database indexes
```

## Cost Monitoring

### Free Tier Limits

```
Cloudflare Pages:
- 500 builds/month: ✅ Far more than needed
- Unlimited bandwidth: ✅ Free forever

Cloudflare Workers:
- 100K requests/day: ✅ Covers ~3K daily users
- 10ms CPU time/request: ✅ Plenty for API

D1 Database:
- 5GB storage: ✅ Years of growth
- 5M reads/day: ✅ Covers heavy usage
```

### When to Upgrade

```
Workers Free → Paid ($5/month):
- When exceeding 100K requests/day
- Need more CPU time

D1 Free → Paid:
- When DB > 5GB (unlikely for years)
```

## Rollback Procedures

### Frontend Rollback

**Via Cloudflare Pages Dashboard:**
Pages → Deployments → [previous deployment] → Rollback

**Or use GitHub MCP Server to revert:**
1. Use `mcp__github__list_commits` to find the commit to revert
2. Use `mcp__github__create_or_update_file` to revert changes
3. Use `mcp__github__push_files` to push the reverted changes to main

### Workers Rollback

**Deploy previous version using GitHub MCP Server:**
1. Use `mcp__github__list_commits` to find the previous working commit
2. Use `mcp__github__get_file_contents` to retrieve previous worker files
3. Deploy the previous version: `cd workers && npx wrangler deploy`

**Or use Cloudflare Dashboard:**
Workers → Deployments → Rollback

### Database Rollback

```bash
# Restore from backup
npx wrangler d1 execute matchamap-db --file=backups/db-20251001.sql

# Or run rollback migration
npx wrangler d1 execute matchamap-db --file=migrations/rollback.sql
```

## Production Checklist

### Pre-Launch

-   [ ] Frontend builds successfully
-   [ ] Workers deploy successfully
-   [ ] Database migrations applied
-   [ ] Custom domain configured
-   [ ] SSL certificate active
-   [ ] Admin routes protected (Cloudflare Access)
-   [ ] Analytics configured
-   [ ] Performance tested (Lighthouse > 90)
-   [ ] Mobile tested on real devices

### Post-Launch

-   [ ] Monitoring dashboards configured
-   [ ] Backup cron job running
-   [ ] Error alerting setup
-   [ ] Team access configured
-   [ ] Documentation updated

## Maintenance

### Daily

-   Monitor Cloudflare Analytics
-   Check error rates in Workers

### Weekly

-   Review performance metrics
-   Check database size
-   Update content via admin UI

### Monthly

-   Dependency updates
-   Security patches
-   Database backup verification
-   Cost review (should be $0)

---

## Quick Command Reference

### Essential Production Deployment

#### 1. Generate and Set JWT Secret (REQUIRED FIRST TIME)

```bash
# Generate a secure random secret
openssl rand -base64 32

# Set JWT_SECRET for production worker
cd backend
wrangler secret put JWT_SECRET --env production
# Paste the generated secret when prompted
```

#### 2. Deploy Backend to Production

```bash
# Deploy backend with production environment
cd backend
wrangler deploy --env production

# Alternative: from root
npm run deploy:backend
```

#### 3. Run Database Migrations on Production

```bash
# Apply migrations to production D1 database
cd backend
npm run db:migrate:prod

# Or directly:
wrangler d1 migrations apply matchamap-db --remote
```

#### 4. Deploy Frontend to Production

**Using GitHub MCP Server (Recommended):**
- Use `mcp__github__push_files` to push changes to main branch
- Cloudflare Pages will automatically detect and deploy

**Manual build (if needed):**
```bash
cd frontend
npm run build
```

### Useful Wrangler Commands

#### Check Deployment Status

```bash
# List recent deployments
cd backend
wrangler deployments list --env production

# View live logs
wrangler tail --env production
```

#### Manage Secrets

```bash
# List all secrets for production worker
wrangler secret list --env production

# Update a secret
wrangler secret put SECRET_NAME --env production

# Delete a secret
wrangler secret delete SECRET_NAME --env production
```

#### Database Commands

```bash
# List D1 databases
wrangler d1 list

# Execute SQL query on production database
wrangler d1 execute matchamap-db --remote --command "SELECT * FROM cafes LIMIT 5"

# Run migrations list
wrangler d1 migrations list matchamap-db --remote
```

#### Worker Management

```bash
# Delete a worker
wrangler delete <worker-name>

# Example: Delete production worker
wrangler delete matchamap-api-production

# View worker details
wrangler whoami
```

### Testing Production Endpoints

#### Health Check

```bash
curl https://matchamap-api-production.kevingeng33.workers.dev/api/health
```

#### Test API Endpoints

```bash
# Get cafes
curl https://matchamap-api-production.kevingeng33.workers.dev/api/cafes

# Get events
curl https://matchamap-api-production.kevingeng33.workers.dev/api/events
```

#### Test Admin Endpoint (requires auth)

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://matchamap-api-production.kevingeng33.workers.dev/api/admin/cafes
```

### Development Commands

#### Local Development

```bash
# Run frontend dev server
npm run dev:frontend
# Or: cd frontend && npm run dev

# Run backend dev server
npm run dev:backend
# Or: cd backend && npm run dev

# Run both (from root)
npm run dev
```

#### Database Development

```bash
# Generate migration from schema changes
cd backend
npm run db:generate

# Apply migrations locally
npm run db:migrate:local
# Or: wrangler d1 migrations apply matchamap-db --local

# Seed database with test data
npm run db:seed
```

#### Type Checking & Linting

```bash
# Type check all workspaces
npm run typecheck

# Type check specific workspace
cd frontend && npm run typecheck
cd backend && npm run typecheck

# Lint code
cd frontend && npm run lint
```

### Important URLs

#### Production

-   **Frontend**: https://matchamap.pages.dev
-   **API**: https://matchamap-api-production.kevingeng33.workers.dev
-   **Health Check**: https://matchamap-api-production.kevingeng33.workers.dev/api/health

#### Development

-   **Frontend**: http://localhost:3000
-   **API**: http://localhost:8787
-   **Health Check**: http://localhost:8787/api/health

### Configuration Files

#### Backend Configuration

-   **Wrangler Config**: `backend/wrangler.toml`
-   **Environment Variables**: Set via `wrangler secret put`
-   **Database Schema**: `backend/drizzle/schema.ts`

#### Frontend Configuration

-   **Production API URL**: `frontend/.env.production`
-   **Feature Flags**: `frontend/src/config/features.yaml`

### Troubleshooting Commands

#### Check Worker Logs

```bash
cd backend
wrangler tail --env production
```

#### Verify D1 Database Binding

```bash
# Check if database is properly bound to worker
wrangler deployments list --env production
```

#### Test CORS

```bash
curl -H "Origin: https://matchamap.pages.dev" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://matchamap-api-production.kevingeng33.workers.dev/api/cafes
```

### Security Checklist Before Production Deploy

-   [ ] JWT_SECRET set via `wrangler secret put` (never in code)
-   [ ] D1 database bound to production worker
-   [ ] Migrations run on production database
-   [ ] CORS origins configured correctly in wrangler.toml
-   [ ] HTTPS enforcement enabled (automatic in production)
-   [ ] Rate limiting configured
-   [ ] Admin routes protected with JWT + role check
-   [ ] Input validation (Zod schemas) in place
-   [ ] Security headers configured

### Quick Deploy Checklist

1. ✅ Set JWT_SECRET: `wrangler secret put JWT_SECRET --env production`
2. ✅ Deploy backend: `wrangler deploy --env production`
3. ✅ Run migrations: `npm run db:migrate:prod`
4. ✅ Test health: `curl https://matchamap-api-production.kevingeng33.workers.dev/api/health`
5. ✅ Deploy frontend: Use `mcp__github__push_files` to push to main branch
6. ✅ Verify app: Visit https://matchamap.pages.dev

---

**Deployment Guide Status:** Production Ready
**Last Updated:** October 10, 2025
**Infrastructure:** Cloudflare Pages + Workers + D1
