# MatchaMap - Claude Code Development Guide

## Project Overview

MatchaMap is a mobile-first web application providing a curated, map-based guide to matcha cafes in Toronto. The platform features expert reviews, ratings, and location-based discovery tools with a Japanese-inspired aesthetic.

## Tech Stack

-   **Framework**: React 18 (component-based UI)
-   **Build Tool**: Vite (fast build and dev server)
-   **Styling**: Tailwind CSS with custom matcha theme
-   **Routing**: React Router (client-side routing)
-   **Maps**: Leaflet (vanilla JS in React components)
-   **Data**: JSON file with weekly manual updates
-   **Hosting**: Netlify (zero-config static hosting)

## Architecture Principles

### Performance-First

-   React with Vite for fast builds and HMR
-   Component-based architecture for reusability
-   Mobile-first responsive design
-   Target bundle size: 25-65KB per page

### Design Principles

-   **Mobile-first**: Optimize for on-the-go discovery
-   **Curated quality**: Expert reviews over user-generated content
-   **Geographic focus**: Map-based interface for location discovery
-   **Japanese aesthetic**: Matcha color schemes, subtly cutesy design
-   **Lean & efficient**: Quick wins on optimization, minimal complexity

## Key Features (V1)

1. **Interactive Map Interface**

    - Toronto-centered map with cafe pins
    - Popover with key cafe info
    - User location centering (optional)
    - Toggle to list view

2. **List View**

    - Expandable card interface
    - Sorting by neighborhood, rating, distance
    - Compact and expanded view states

3. **Location Detail Pages**

    - Static pages generated from JSON data
    - Primary/secondary scores, reviews, social links
    - Navigation integration with maps apps

4. **Matcha Passport**

    - Local storage visit tracking
    - Progress visualization
    - "I've been here" checkbox functionality

5. **News/Blog Feed**

    - Updates about new cafes and changes
    - Blog-style layout fed from same JSON data

6. **FAQ/About Section**
    - Rating rubric explanation
    - About the reviewer
    - How to suggest locations

## Data Management

### Current Approach

-   Single JSON file containing all cafe data
-   Manual weekly updates
-   Static site rebuilds on data changes
-   No database or CMS required

### Update Workflow

1. Edit JSON file weekly
2. Commit changes to repository
3. Automatic rebuild and deploy via Netlify
4. Cache invalidation handled automatically

## Development Guidelines

### Component Organization

```
src/
├── components/          # Reusable React components
├── pages/              # Page components for routing
├── hooks/              # Custom React hooks
├── data/               # JSON data files
├── utils/              # Utility functions
├── styles/             # Global styles and Tailwind config
├── App.jsx             # Root component
└── main.jsx            # React entry point
```

### Mobile-First Development

-   Always start with mobile viewport (320px)
-   Use Tailwind's responsive utilities (`sm:`, `md:`, `lg:`)
-   Touch-friendly interface elements (44px minimum touch targets)
-   Optimize for one-handed use

### Performance Targets

-   **LCP**: < 2.5 seconds
-   **FID**: < 100ms
-   **CLS**: < 0.1
-   **Bundle size**: < 100KB total per page

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview built site

# Styling
npx tailwindcss --watch # Watch Tailwind changes (if needed)

# Deployment
npm run build && netlify deploy --prod
```

## Testing Approach

### Manual Testing Checklist

-   [ ] Mobile responsiveness (320px-768px)
-   [ ] Touch interactions work properly
-   [ ] Map functionality on mobile
-   [ ] Geolocation permission handling
-   [ ] Local storage persistence
-   [ ] Performance on slow networks

### Cross-Browser Testing

-   Safari (iOS) - Primary mobile target
-   Chrome (Android) - Secondary mobile target
-   Desktop browsers - Tertiary support

## File Naming Conventions

-   **Components**: PascalCase (e.g., `CafeCard.jsx`)
-   **Pages**: PascalCase (e.g., `CafeDetailPage.jsx`)
-   **Hooks**: camelCase with 'use' prefix (e.g., `useGeolocation.js`)
-   **Utilities**: camelCase (e.g., `distanceCalculator.js`)
-   **Styles**: kebab-case (e.g., `global.css`)

## Git Workflow

### Branch Strategy

-   `main` - Production-ready code
-   `develop` - Integration branch
-   `feature/*` - Feature development
-   `hotfix/*` - Production fixes

### Commit Message Format

```
type(scope): description

feat(map): add geolocation functionality
fix(passport): resolve localStorage persistence issue
docs(readme): update deployment instructions
style(ui): improve mobile navigation spacing
```

## Deployment Process

### Netlify Configuration

-   Auto-deploy from `main` branch
-   Build command: `npm run build`
-   Publish directory: `dist`
-   Environment variables: None required for V1

### Weekly Content Updates

1. Update `src/data/cafes.json`
2. Commit to `main` branch
3. Netlify auto-deploys within 2-3 minutes
4. Verify changes on production site

## Future Considerations (V2+)

-   User-submitted reviews
-   Social features (favorites, sharing)
-   Geographic expansion beyond Toronto
-   Content management system
-   Analytics integration
-   User accounts and enhanced passport features

## Quick Reference

### Color Palette

-   Primary Matcha: `#7cb342`
-   Light Matcha: `#aed581`
-   Dark Matcha: `#558b2f`
-   Cream Background: `#faf7f2`
-   Charcoal Text: `#2e2e2e`
-   Accent Pink: `#f8bbd9`

### Breakpoints

-   Mobile: 320px-640px (base)
-   Tablet: 640px-1024px (`sm:`)
-   Desktop: 1024px+ (`lg:`)

### Key Dependencies

-   `react` - UI Framework
-   `react-router-dom` - Client-side routing
-   `vite` - Build tool and dev server
-   `tailwindcss` - Styling
-   `leaflet` - Maps

## Troubleshooting

### Common Issues

1. **Map not loading**: Check Leaflet CSS import and container height
2. **Styles not applying**: Verify Tailwind purge configuration
3. **Build failures**: Check JSON syntax and component imports
4. **Mobile layout issues**: Test on actual devices, not just browser dev tools

### Debug Commands

```bash
npm run build -- --verbose    # Verbose build output
npm run dev -- --host        # Expose dev server to network
```

## Support Resources

-   [React Documentation](https://react.dev/)
-   [Vite Documentation](https://vitejs.dev/)
-   [React Router Documentation](https://reactrouter.com/)
-   [Tailwind CSS Documentation](https://tailwindcss.com/docs)
-   [Leaflet Documentation](https://leafletjs.com/reference.html)
-   [Netlify Documentation](https://docs.netlify.com/)

---

_Last updated: [Current Date]_
_Project Phase: V1 Development_
