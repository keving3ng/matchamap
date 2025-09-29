# MatchaMap Deployment Guide

## Overview

MatchaMap is designed for simple, zero-cost static site deployment. This guide covers the complete deployment process from development to production, with a focus on Netlify as the primary hosting platform.

## Deployment Architecture

```
Local Development → Git Repository → Netlify Build → CDN Distribution
                ↓                    ↓              ↓
        Code Changes          Automatic Build    Global CDN
        JSON Updates          Optimization       Edge Caching
        Asset Changes         Static Generation   Fast Delivery
```

## Prerequisites

### Required Tools
- **Node.js**: 18.x or later
- **npm**: 9.x or later
- **Git**: For version control
- **Modern Browser**: For testing

### Account Setup
- **GitHub/GitLab**: Repository hosting
- **Netlify**: Static site hosting (free tier)

## Local Development Setup

### Initial Project Setup

```bash
# Clone or create the project
git clone <repository-url> matchamap
cd matchamap

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Environment Configuration

```bash
# .env.local (for local development only)
NODE_ENV=development
ASTRO_BUILD_CACHE=true
```

### Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Start dev server and expose to network
npm run dev -- --host

# Build for production locally
npm run build

# Preview production build locally
npm run preview

# Check for build errors
npm run build -- --verbose

# Type checking
npm run astro check
```

## Production Build Process

### Build Configuration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  build: {
    assets: 'assets',
    inlineStylesheets: 'auto',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  compressHTML: true,
  site: 'https://matchamap.netlify.app', // Update with your domain
});
```

### Build Optimization

```json
// package.json build scripts
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "build:analyze": "astro build --verbose",
    "build:clean": "rm -rf dist && npm run build"
  }
}
```

## Netlify Deployment

### Automatic Deployment Setup

1. **Connect Repository**
   - Log in to Netlify
   - Click "New site from Git"
   - Connect your GitHub/GitLab account
   - Select the MatchaMap repository

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   Branch: main
   ```

3. **Environment Variables**
   - None required for V1 (static site)

### Netlify Configuration File

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--production=false"

# Headers for security and performance
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache static assets for 1 year
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Cache images for 1 month
[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=2592000"

# PWA headers (for future)
[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"

# Redirects for SPA-like behavior (if needed)
[[redirects]]
  from = "/cafe/*"
  to = "/cafe/:splat"
  status = 200

# 404 page
[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
```

### Deploy Process

1. **Automatic Deployment**
   ```bash
   # Any push to main branch triggers deployment
   git add .
   git commit -m "feat: add new cafe locations"
   git push origin main
   
   # Netlify automatically:
   # 1. Detects the push
   # 2. Runs npm run build
   # 3. Deploys to CDN
   # 4. Sends notification
   ```

2. **Manual Deployment**
   ```bash
   # Build locally
   npm run build
   
   # Deploy with Netlify CLI
   netlify deploy --prod --dir=dist
   ```

### Netlify CLI Setup

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to existing site
netlify link

# Deploy preview
netlify deploy --dir=dist

# Deploy to production
netlify deploy --prod --dir=dist
```

## Content Updates Workflow

### Weekly Content Updates

```bash
# 1. Update cafe data
vim src/data/cafes.json

# 2. Test locally
npm run dev
# Verify changes in browser

# 3. Build and test
npm run build
npm run preview

# 4. Commit and deploy
git add src/data/cafes.json
git commit -m "content: weekly cafe updates"
git push origin main

# 5. Verify deployment
# Check site in 2-3 minutes
```

### Adding New Cafes

```bash
# 1. Add images to public/images/
cp new-cafe-*.jpg public/images/cafes/

# 2. Update JSON data
# Add new cafe object to src/data/cafes.json

# 3. Update metadata
# Increment totalCafes count

# 4. Create news entry (optional)
# Add to news array in JSON

# 5. Test and deploy
npm run build
git add .
git commit -m "feat: add [Cafe Name] to [Neighborhood]"
git push origin main
```

## Domain and DNS Setup

### Custom Domain Configuration

1. **Purchase Domain** (optional)
   - Recommended: Namecheap, Cloudflare, Google Domains

2. **Configure DNS in Netlify**
   ```
   Netlify Dashboard → Domain Settings → Add Custom Domain
   Domain: matchamap.com
   ```

3. **DNS Records**
   ```
   Type: A
   Name: @
   Value: 75.2.60.5
   
   Type: CNAME
   Name: www
   Value: matchamap.netlify.app
   ```

4. **SSL Certificate**
   - Automatic via Netlify (Let's Encrypt)
   - Usually active within 24 hours

### Subdomain Setup

```
# For staging environment
Type: CNAME
Name: staging
Value: staging--matchamap.netlify.app
```

## Performance Optimization

### Build Optimization

```bash
# Bundle analyzer (if needed)
npm install --save-dev @astrojs/partytown

# Check bundle sizes
npm run build -- --verbose

# Lighthouse CI
npm install --save-dev @lhci/cli
```

### Image Optimization

```javascript
// astro.config.mjs
export default defineConfig({
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
  },
});
```

### CDN Configuration

```toml
# netlify.toml
[build.processing]
  skip_processing = false

[build.processing.css]
  bundle = true
  minify = true

[build.processing.js]
  bundle = true
  minify = true

[build.processing.html]
  pretty_urls = true

[build.processing.images]
  compress = true
```

## Monitoring and Analytics

### Build Monitoring

```bash
# Netlify build logs
netlify open --admin

# Check deploy status
netlify status

# View recent deploys
netlify open --site
```

### Performance Monitoring

```javascript
// Basic performance tracking (V2)
if ('webVitals' in window) {
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
}
```

## Backup and Recovery

### Data Backup Strategy

```bash
# Backup data files
cp src/data/cafes.json backups/cafes-$(date +%Y%m%d).json

# Backup images
tar -czf backups/images-$(date +%Y%m%d).tar.gz public/images/

# Git backup (automatic)
git push origin main
```

### Site Recovery

```bash
# Revert to previous deployment
netlify rollback

# Restore from git
git revert <commit-hash>
git push origin main

# Emergency static backup
wget -r -np -nH --cut-dirs=1 https://matchamap.netlify.app/
```

## Alternative Hosting Options

### Vercel Deployment

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro"
}
```

### GitHub Pages Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### Cloudflare Pages

```bash
# Build settings
Build command: npm run build
Build output directory: dist
Root directory: /
```

## Security Considerations

### Content Security Policy

```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = '''
      default-src 'self';
      script-src 'self' 'unsafe-inline' unpkg.com;
      style-src 'self' 'unsafe-inline' unpkg.com;
      img-src 'self' data: https:;
      connect-src 'self' https:;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    '''
```

### Environment Security

```bash
# Never commit sensitive data
echo "*.env*" >> .gitignore
echo "backups/" >> .gitignore

# Use Netlify environment variables for sensitive configs
# (None needed for V1)
```

## Troubleshooting

### Common Build Errors

1. **Node.js Version Mismatch**
   ```bash
   # Solution: Update netlify.toml
   [build.environment]
     NODE_VERSION = "18"
   ```

2. **Missing Dependencies**
   ```bash
   # Solution: Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Image Optimization Errors**
   ```bash
   # Solution: Check image files and formats
   npm run build -- --verbose
   ```

4. **JSON Syntax Errors**
   ```bash
   # Solution: Validate JSON
   npx jsonlint src/data/cafes.json
   ```

### Deployment Issues

1. **Build Timeout**
   - Check for infinite loops in build process
   - Optimize image sizes
   - Review dependencies

2. **Deploy Failed**
   ```bash
   # Check Netlify logs
   netlify open --admin
   
   # Test build locally
   npm run build
   ```

3. **Site Not Updating**
   - Check deploy status
   - Clear browser cache
   - Verify git push completed

### Performance Issues

```bash
# Audit bundle size
npm run build -- --verbose

# Check Lighthouse scores
npx lighthouse https://matchamap.netlify.app --output=html

# Monitor Core Web Vitals
# Use browser dev tools Performance tab
```

## Production Checklist

### Pre-Launch

- [ ] **Content Complete**: All cafe data added
- [ ] **Images Optimized**: All images < 200KB
- [ ] **JSON Validated**: No syntax errors
- [ ] **Build Successful**: No build errors
- [ ] **Mobile Testing**: Tested on actual devices
- [ ] **Performance**: Lighthouse score > 90
- [ ] **Security Headers**: CSP and security headers configured
- [ ] **404 Page**: Custom 404 page created
- [ ] **Favicon**: Site favicon added
- [ ] **Meta Tags**: SEO meta tags complete

### Post-Launch

- [ ] **Domain Configured**: Custom domain (if applicable)
- [ ] **SSL Active**: HTTPS certificate working
- [ ] **Analytics**: Basic monitoring setup
- [ ] **Backup Process**: Data backup workflow established
- [ ] **Update Process**: Weekly update workflow documented
- [ ] **Monitoring**: Deploy notifications configured

## Maintenance Schedule

### Daily
- Monitor Netlify deploy status
- Check for any broken builds

### Weekly
- Update cafe data JSON file
- Review and deploy content changes
- Check site performance

### Monthly
- Review and update dependencies
- Performance audit with Lighthouse
- Backup data files
- Review hosting costs (should be $0)

### Quarterly
- Security review and updates
- Dependency updates
- Performance optimization review
- Content audit and cleanup

---

*Deployment Guide Version: 1.0*
*Last Updated: [Current Date]*
*Status: V1 Production Ready*