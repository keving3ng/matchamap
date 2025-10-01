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
- **Node.js**: 18.x or later
- **npm**: 9.x or later
- **Wrangler CLI**: `npm install -g wrangler`
- **Git**: For version control

### Cloudflare Account
- Sign up at https://dash.cloudflare.com
- Free tier is sufficient for V1
- No credit card required for development

## Local Development

### Frontend Development

```bash
# Start React dev server
npm run dev

# Runs on http://localhost:5173
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

```bash
# Any push to main triggers deployment
git add .
git commit -m "feat: add new feature"
git push origin main

# Cloudflare Pages automatically:
# 1. Detects push
# 2. Runs npm run build
# 3. Deploys to edge CDN (~1 min)
```

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
# Navigate to workers directory
cd workers

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create matchamap-db

# Update wrangler.toml with database ID
```

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
analytics.track('cafe_view', { cafeId: 42 })
analytics.track('directions_click', { cafeId: 42 })
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

```bash
# Via Cloudflare Pages Dashboard
Pages → Deployments → [previous deployment] → Rollback

# Or redeploy previous commit
git revert HEAD
git push origin main
```

### Workers Rollback

```bash
# Deploy previous version
git checkout <previous-commit>
cd workers && npx wrangler deploy
git checkout main

# Or use Cloudflare Dashboard
Workers → Deployments → Rollback
```

### Database Rollback

```bash
# Restore from backup
npx wrangler d1 execute matchamap-db --file=backups/db-20251001.sql

# Or run rollback migration
npx wrangler d1 execute matchamap-db --file=migrations/rollback.sql
```

## Production Checklist

### Pre-Launch
- [ ] Frontend builds successfully
- [ ] Workers deploy successfully
- [ ] Database migrations applied
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Admin routes protected (Cloudflare Access)
- [ ] Analytics configured
- [ ] Performance tested (Lighthouse > 90)
- [ ] Mobile tested on real devices

### Post-Launch
- [ ] Monitoring dashboards configured
- [ ] Backup cron job running
- [ ] Error alerting setup
- [ ] Team access configured
- [ ] Documentation updated

## Maintenance

### Daily
- Monitor Cloudflare Analytics
- Check error rates in Workers

### Weekly
- Review performance metrics
- Check database size
- Update content via admin UI

### Monthly
- Dependency updates
- Security patches
- Database backup verification
- Cost review (should be $0)

---

**Deployment Guide Status:** Production Ready
**Last Updated:** October 1, 2025
**Infrastructure:** Cloudflare Pages + Workers + D1
