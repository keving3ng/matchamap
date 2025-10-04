# MatchaMap Deployment Commands

## Essential Production Deployment Commands

### 1. Generate and Set JWT Secret (REQUIRED FIRST TIME)

```bash
# Generate a secure random secret
openssl rand -base64 32

# Set JWT_SECRET for production worker
cd backend
wrangler secret put JWT_SECRET --env production
# Paste the generated secret when prompted
```

### 2. Deploy Backend to Production

```bash
# Deploy backend with production environment
cd backend
wrangler deploy --env production

# Alternative: from root
npm run deploy:backend
```

### 3. Run Database Migrations on Production

```bash
# Apply migrations to production D1 database
cd backend
npm run db:migrate:prod

# Or directly:
wrangler d1 migrations apply matchamap-db --remote
```

### 4. Deploy Frontend to Production

```bash
# Frontend auto-deploys on push to main via Cloudflare Pages
git add .
git commit -m "Your commit message"
git push origin main

# Manual build (if needed):
cd frontend
npm run build
```

## Useful Wrangler Commands

### Check Deployment Status

```bash
# List recent deployments
cd backend
wrangler deployments list --env production

# View live logs
wrangler tail --env production
```

### Manage Secrets

```bash
# List all secrets for production worker
wrangler secret list --env production

# Update a secret
wrangler secret put SECRET_NAME --env production

# Delete a secret
wrangler secret delete SECRET_NAME --env production
```

### Database Commands

```bash
# List D1 databases
wrangler d1 list

# Execute SQL query on production database
wrangler d1 execute matchamap-db --remote --command "SELECT * FROM cafes LIMIT 5"

# Run migrations list
wrangler d1 migrations list matchamap-db --remote
```

### Worker Management

```bash
# Delete a worker
wrangler delete <worker-name>

# Example: Delete production worker
wrangler delete matchamap-api-production

# View worker details
wrangler whoami
```

## Testing Production Endpoints

### Health Check
```bash
curl https://matchamap-api-production.kevingeng33.workers.dev/api/health
```

### Test API Endpoints
```bash
# Get cafes
curl https://matchamap-api-production.kevingeng33.workers.dev/api/cafes

# Get events
curl https://matchamap-api-production.kevingeng33.workers.dev/api/events
```

### Test Admin Endpoint (requires auth)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://matchamap-api-production.kevingeng33.workers.dev/api/admin/cafes
```

## Development Commands

### Local Development

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

### Database Development

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

### Type Checking & Linting

```bash
# Type check all workspaces
npm run typecheck

# Type check specific workspace
cd frontend && npm run typecheck
cd backend && npm run typecheck

# Lint code
cd frontend && npm run lint
```

## Important URLs

### Production
- **Frontend**: https://matchamap.pages.dev
- **API**: https://matchamap-api-production.kevingeng33.workers.dev
- **Health Check**: https://matchamap-api-production.kevingeng33.workers.dev/api/health

### Development
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8787
- **Health Check**: http://localhost:8787/api/health

## Configuration Files

### Backend Configuration
- **Wrangler Config**: `backend/wrangler.toml`
- **Environment Variables**: Set via `wrangler secret put`
- **Database Schema**: `backend/drizzle/schema.ts`

### Frontend Configuration
- **Production API URL**: `frontend/.env.production`
- **Feature Flags**: `frontend/src/config/features.yaml`

## Troubleshooting Commands

### Check Worker Logs
```bash
cd backend
wrangler tail --env production
```

### Verify D1 Database Binding
```bash
# Check if database is properly bound to worker
wrangler deployments list --env production
```

### Test CORS
```bash
curl -H "Origin: https://matchamap.pages.dev" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://matchamap-api-production.kevingeng33.workers.dev/api/cafes
```

## Security Checklist Before Production Deploy

- [ ] JWT_SECRET set via `wrangler secret put` (never in code)
- [ ] D1 database bound to production worker
- [ ] Migrations run on production database
- [ ] CORS origins configured correctly in wrangler.toml
- [ ] HTTPS enforcement enabled (automatic in production)
- [ ] Rate limiting configured
- [ ] Admin routes protected with JWT + role check
- [ ] Input validation (Zod schemas) in place
- [ ] Security headers configured

## Quick Deploy Checklist

1. ✅ Set JWT_SECRET: `wrangler secret put JWT_SECRET --env production`
2. ✅ Deploy backend: `wrangler deploy --env production`
3. ✅ Run migrations: `npm run db:migrate:prod`
4. ✅ Test health: `curl https://matchamap-api-production.kevingeng33.workers.dev/api/health`
5. ✅ Deploy frontend: `git push origin main`
6. ✅ Verify app: Visit https://matchamap.pages.dev
