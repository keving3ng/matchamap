# MatchaMap Technical Specifications

## System Architecture

### Overview
MatchaMap is built as a React single-page application using Vite for build tooling, optimized for mobile-first performance and zero hosting costs.

```
┌─────────────────────────────────────┐
│             Frontend                │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │  React  │ │Tailwind │ │ Vite   │ │
│  │  Pages  │ │   CSS   │ │ Build  │ │
│  └─────────┘ └─────────┘ └────────┘ │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│          Static Assets              │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │  JSON   │ │ Images  │ │  CSS   │ │
│  │  Data   │ │         │ │   JS   │ │
│  └─────────┘ └─────────┘ └────────┘ │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│            CDN/Hosting              │
│           (Netlify)                 │
└─────────────────────────────────────┘
```

## Technical Stack

### Core Technologies
- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Routing**: React Router 6.x
- **Styling**: Tailwind CSS 3.x
- **Maps**: Leaflet 1.9.x
- **Language**: JavaScript/TypeScript

### Development Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "vite": "^5.0.8",
  "@vitejs/plugin-react": "^4.2.1",
  "tailwindcss": "^3.3.6",
  "leaflet": "^1.9.4",
  "@types/leaflet": "^1.9.8",
  "typescript": "^5.2.2"
}
```

## Data Architecture

### Data Flow
```
JSON File → Vite Build → React SPA → CDN
     ↓           ↓            ↓         ↓
  Manual      Build Time   Runtime   Browser
  Updates     Processing   Hydration  Display
```

### Storage Strategy
- **Primary Data**: Single JSON file (`src/data/cafes.json`)
- **Images**: Static assets in `public/images/`
- **User Data**: Browser localStorage (Matcha Passport)
- **No Database**: Static-first approach for V1

## Component Architecture

### React Component Strategy
All components are React components with state management:

1. **Interactive Map Component** (`InteractiveMap.jsx`)
   - Leaflet map initialization
   - Pin interactions and popover
   - Geolocation handling
   - View toggle functionality

2. **List Components** (`CafeList.jsx`, `ListFilters.jsx`)
   - Sort and filter controls
   - Search functionality
   - State management for list view

3. **Passport Components** (`PassportTracker.jsx`)
   - localStorage visit tracking
   - Progress visualization
   - Check/uncheck interactions

### Page Components
Page-level components for routing:
- HomePage - Map interface
- ListPage - Cafe list view
- CafeDetailPage - Individual cafe details
- PassportPage - User progress tracking
- NewsPage - Updates and blog
- AboutPage - Information and FAQ

## Performance Specifications

### Bundle Size Targets
- **Base CSS**: ~20KB (Tailwind purged)
- **Map Page JS**: ~45KB (Leaflet + custom)
- **List Page JS**: ~15KB (filter/sort logic)
- **Other Pages**: ~5KB (minimal interactions)

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Optimization Strategies
1. **Code Splitting**: Islands load JS only when needed
2. **Image Optimization**: Sharp processing with multiple formats
3. **CSS Purging**: Tailwind removes unused styles
4. **Static Generation**: No runtime server processing
5. **CDN Caching**: Long-term caching for static assets

## Mobile-First Design Specifications

### Viewport and Breakpoints
```css
/* Mobile First Approach */
/* Base: 320px-640px */
.container { /* mobile styles */ }

/* Tablet: 640px+ */
@media (min-width: 640px) { /* sm: */ }

/* Desktop: 1024px+ */
@media (min-width: 1024px) { /* lg: */ }
```

### Touch Interface Requirements
- **Minimum Touch Target**: 44px × 44px
- **Touch Gestures**: Tap, scroll, pinch-to-zoom (map only)
- **Hover States**: Graceful degradation on touch devices
- **Active States**: Visual feedback for all interactive elements

### Responsive Behavior
- **Navigation**: Bottom tab bar on mobile, top nav on desktop
- **Cards**: Single column on mobile, grid on tablet+
- **Map**: Full viewport on mobile, sidebar layout on desktop
- **Typography**: Fluid scaling with `clamp()` for optimal readability

## Map Implementation Specifications

### Leaflet Configuration
```javascript
// Map initialization
const map = L.map('map', {
  center: [43.6532, -79.3832], // Toronto downtown
  zoom: 12,
  zoomControl: false, // Custom controls
  attributionControl: true,
  scrollWheelZoom: true,
  touchZoom: true,
  doubleClickZoom: true,
  boxZoom: false, // Disable on mobile
});

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18,
}).addTo(map);
```

### Custom Markers
- **Design**: Matcha-themed pin design
- **States**: Default, hover, active, visited
- **Clustering**: None for V1 (small dataset)
- **Popover**: Custom HTML with cafe info

### Geolocation Integration
```javascript
// Geolocation with fallback
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      // Update map center and calculate distances
    },
    (error) => {
      // Graceful fallback to Toronto center
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}
```

## State Management

### Client-Side State
- **Map State**: Zoom level, center position, selected pin
- **List State**: Sort order, filter criteria, expanded cards
- **Passport State**: Visited locations (localStorage)
- **User Preferences**: View mode, location permission

### localStorage Schema
```javascript
// Matcha Passport data
{
  "matchaPassport": {
    "visitedCafes": ["cafe-id-1", "cafe-id-2"],
    "lastUpdated": "2024-01-15T10:30:00Z"
  },
  "userPreferences": {
    "defaultView": "map", // "map" | "list"
    "locationPermission": "granted" // "granted" | "denied" | "prompt"
  }
}
```

## Route Structure

### Static Routes
```
/                    # Homepage (map view)
/list               # List view
/news               # News/blog feed
/passport           # Matcha Passport
/about              # FAQ/About section
```

### Dynamic Routes
```
/cafe/[id]          # Individual cafe detail pages
```

### Route Configuration
```javascript
// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="/cafe/:id" element={<CafeDetailPage />} />
        <Route path="/passport" element={<PassportPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Router>
  )
}
```

## Build Process

### Development Build
```bash
npm run dev
# - Vite dev server with HMR
# - React Fast Refresh
# - Tailwind watch mode
# - TypeScript checking
# - Asset serving from public/
```

### Production Build
```bash
npm run build
# 1. TypeScript compilation
# 2. React component bundling
# 3. Tailwind CSS purging
# 4. Asset optimization
# 5. Code splitting and minification
# 6. Output to dist/ directory
```

### Build Optimization
- **Tree Shaking**: Remove unused JavaScript
- **CSS Purging**: Remove unused Tailwind classes
- **Image Optimization**: Multiple formats and sizes
- **Asset Compression**: Gzip/Brotli compression
- **Cache Headers**: Long-term caching strategy

## API Integration

### Distance Calculation
```javascript
// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}
```

### External Maps Integration
```javascript
// iOS Maps
window.open(`maps://maps.apple.com/?q=${lat},${lng}`);

// Google Maps (Android/Web)
window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
```

## Security Considerations

### Content Security Policy
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https:;
  font-src 'self';
```

### Data Validation
- JSON schema validation for cafe data
- Input sanitization for any user-generated content
- XSS prevention through React's built-in escaping

## Monitoring and Analytics

### Performance Monitoring
- **Core Web Vitals**: Built-in browser APIs
- **Bundle Analysis**: Vite build reports
- **Lighthouse**: Automated performance testing

### Error Handling
```javascript
// Client-side error boundary
window.addEventListener('error', (event) => {
  // Log errors for debugging
  console.error('Client error:', event.error);
});

// Geolocation error handling
navigator.geolocation.getCurrentPosition(
  successCallback,
  (error) => {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        // Handle permission denied
        break;
      case error.POSITION_UNAVAILABLE:
        // Handle position unavailable
        break;
      case error.TIMEOUT:
        // Handle timeout
        break;
    }
  }
);
```

## Deployment Specifications

### Netlify Configuration
```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Environment Variables
None required for V1 (static site with no external APIs)

## Browser Support

### Primary Support (Testing Required)
- **iOS Safari**: 14+ (iPhone users)
- **Chrome Mobile**: Latest 2 versions (Android users)

### Secondary Support (Best Effort)
- **Desktop Chrome**: Latest version
- **Desktop Safari**: Latest version
- **Desktop Firefox**: Latest version

### Polyfills
- **IntersectionObserver**: For lazy loading (if needed)
- **ResizeObserver**: For responsive components (if needed)

## Future Technical Considerations

### Scalability Preparations
- **Database Migration Path**: JSON → Headless CMS
- **API Layer**: RESTful endpoints for dynamic features
- **User Authentication**: Integration points for accounts
- **Geographic Expansion**: Multi-city data architecture

### Performance Monitoring
- **Bundle Size Tracking**: Automated size regression testing
- **Core Web Vitals**: Continuous performance monitoring
- **Mobile Performance**: Real device testing pipeline

---

*Technical Specification Version: 1.0*
*Last Updated: [Current Date]*
*Status: V1 Development Phase*