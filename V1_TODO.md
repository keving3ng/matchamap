# MatchaMap V1 Development TODO

This document tracks all remaining tasks to complete V1 based on the PRD requirements and current implementation status.

## 📊 **Progress Overview**

-   **Total V1 Tasks**: 26
-   **Completed**: 8
-   **In Progress**: 0
-   **Remaining**: 18
-   **Moved to V2**: 4 (Passport features)

---

## 🗺️ **MAP FUNCTIONALITY** (High Priority - Core Feature)

### Status: Currently mock grid background with static pins → Need real map integration

-   [x] **#1** Implement real Leaflet map integration

    -   Replace mock grid with actual Toronto map
    -   Configure map tiles and styling
    -   Set proper initial zoom/center on Toronto downtown

-   [x] **#2** Add geolocation functionality with user permission handling

    -   Implement "Find me" button functionality
    -   Handle permission denied gracefully
    -   Show user location on map with distinct marker

-   [x] **#3** Implement map zoom and pan controls

    -   Make +/- buttons functional
    -   Add pinch/zoom support for mobile
    -   Implement double-tap to zoom

-   [x] **#4** Add custom matcha-themed map markers

    -   Design custom pin icons with matcha branding
    -   Different states: default, selected, visited
    -   Score badges on pins

-   [x] **#5** Implement distance calculation from user location

    -   Haversine formula for real distance calculations
    -   Update distances dynamically when user moves
    -   Handle no location permission scenario

-   [x] **#6** Add map-to-list view toggle functionality
    -   Seamless transition between map and list
    -   Maintain selected cafe across views
    -   Preserve scroll position where appropriate

---

## 📋 **LIST & SEARCH FUNCTIONALITY** (High Priority - Core Feature)

### Status: Static list with mock expand/collapse → Need real filtering/sorting

-   [x] **#7** Implement list sorting (by rating, distance, neighborhood)

    -   Make filter button tabs functional
    -   Sort algorithms for each criteria
    -   Visual indication of current sort

-   [x] **#8** Add list filtering capabilities

    -   Filter by price range
    -   Filter by rating threshold
    -   Filter by neighborhood selection
    -   Combine multiple filters

-   [x] **#9** Implement search functionality for cafes
    -   Text search across cafe names
    -   Search by neighborhood
    -   Search by keywords/tags
    -   Real-time search results

---

## 🎫 **MATCHA PASSPORT** ~~(MOVED TO V2)~~

### Status: Deprioritized - focusing on core discovery & content features first

-   ~~[ ] **#11** Implement persistent localStorage for Matcha Passport~~ → V2
-   ~~[ ] **#12** Add progress tracking and stats calculations~~ → V2
-   ~~[ ] **#13** Implement achievement/badge system~~ → V2

---

## 🏪 **CAFE DATA & DETAILS** (⭐ HIGH PRIORITY - Content Foundation)

### Status: Basic mock data → Need comprehensive cafe profiles (waiting on real data collection)

-   [ ] **#14** Expand cafe data with all required fields from PRD

    -   Complete cafe profiles with all metadata
    -   Standardize data structure
    -   Validation for required fields

-   [ ] **#15** Add cafe photos and image handling

    -   Photo storage and optimization
    -   Multiple photos per cafe
    -   Lazy loading for performance
    -   Fallback images

-   [ ] **#16** Implement detailed rating breakdown (primary/secondary scores)

    -   Matcha quality (primary score)
    -   Value, ambiance, other drinks (secondary)
    -   Visual breakdown in detail view
    -   Rating calculation methodology

-   [ ] **#17** Add hours/availability display with current status

    -   Parse hours data structure
    -   "Open now" / "Closes soon" indicators
    -   Holiday hours handling
    -   Timezone considerations

-   [ ] **#18** Implement social media link integration

    -   Working Instagram links
    -   TikTok integration
    -   Link validation and fallbacks
    -   External link handling

-   [ ] **#19** Add contact information display
    -   Phone number with click-to-call
    -   Website links
    -   Full address formatting
    -   Copy address functionality

---

## 📰 **NEWS & CONTENT** (⭐ HIGH PRIORITY - Engagement & Social Proof)

### Status: Static news list → Need social media feed integration

-   [ ] **#20** Implement social media feed integration

    -   **Instagram Feed**: Pull recent posts automatically (investigate Instagram Basic Display API or embed options)
    -   **TikTok Integration**: Explore TikTok embed API or feed options
    -   Fallback to manual JSON updates if APIs are restricted
    -   Combine social content with manual news updates
    -   Mobile-optimized feed cards

-   [ ] **#21** Add news categorization and filtering

    -   Filter by content type (Instagram post, TikTok video, announcement, new location)
    -   Category-specific styling and icons
    -   Filter persistence
    -   Visual distinction between content sources

-   [ ] **#22** Implement news date sorting and caching
    -   Chronological organization
    -   "New" indicators for recent items
    -   Cache social media content to reduce API calls
    -   Refresh strategy (manual trigger or time-based)

---

## 🎯 **NAVIGATION & UX** (High Priority - Usability)

### Status: Basic view switching → Need enhanced navigation

-   [ ] **#10** Add 'Get Directions' integration with native maps apps
    -   iOS Maps integration
    -   Google Maps fallback
    -   Platform detection
    -   Deep link generation

---

## 📱 **MOBILE OPTIMIZATION** (🔥 HIGHEST PRIORITY - Primary Platform)

### Status: Mobile-first is THE experience → This is our main audience, nail it perfectly

-   [ ] **#23** Perfect mobile-first responsive design

    -   **Touch targets**: Minimum 44px for all interactive elements
    -   **Safe areas**: Handle iPhone notches and Android gesture bars
    -   **Typography**: Mobile-optimized font sizes (16px+ base to prevent zoom)
    -   **Spacing**: Generous padding for thumb-friendly navigation
    -   **Orientation**: Perfect both portrait and landscape
    -   **Test on real devices**: iPhone SE through iPhone 15 Pro Max, Android range

-   [ ] **#24** Implement intuitive touch gestures

    -   **Swipe gestures**: Natural navigation between views
    -   **Pull-to-refresh**: Refresh cafe data and social feeds
    -   **Touch feedback**: Immediate visual/haptic response
    -   **Prevent zoom**: No accidental zoom on double-tap or form inputs
    -   **Smooth scrolling**: Momentum and bounce effects

-   [ ] **#25** Bulletproof loading states and error handling

    -   **Loading states**: Skeleton screens for better perceived performance
    -   **Error boundaries**: Graceful component failure handling
    -   **Network errors**: Clear user-friendly messages with retry
    -   **Empty states**: Helpful messaging when no data available
    -   **Timeout handling**: For slow networks or API failures

-   [ ] **#26** Implement offline-capable data caching
    -   **Service worker**: Core functionality works offline
    -   **Cache-first strategy**: Instant load for returning users
    -   **Offline indicator**: Clear online/offline status
    -   **Background sync**: Update when connection returns
    -   **Image optimization**: WebP with fallbacks, lazy loading

---

## ⚡ **PERFORMANCE & TECHNICAL** (Medium Priority - Quality)

### Status: Basic React app → Need production optimizations

-   [ ] **#27** Add performance optimizations (lazy loading, etc.)

    -   Component lazy loading
    -   Image lazy loading
    -   Bundle splitting by route
    -   Memoization for expensive calculations

-   [ ] **#28** Implement accessibility features (ARIA labels, keyboard nav)

    -   WCAG 2.1 AA compliance
    -   Screen reader support
    -   Keyboard navigation
    -   Focus management
    -   Color contrast verification

-   [ ] **#29** Add PWA capabilities (manifest, service worker)

    -   Web app manifest
    -   Install prompt handling
    -   App icons and splash screens
    -   Service worker for caching

-   [ ] **#30** Create comprehensive test suite

    -   Unit tests for components
    -   Integration tests for user flows
    -   E2E tests for critical paths
    -   Performance testing

-   [ ] **#31** Create local dev admin panel for data management

    -   Admin interface only accessible in development mode
    -   Form to add new cafe entries to data JSON
    -   Google Maps API integration for automatic lat/lng from address
    -   Save/export functionality to update cafes.json
    -   Validation for required fields

---

## 🚀 **REVISED IMPLEMENTATION ORDER** (V1 Focus)

### Phase 1: Mobile-First Foundation (HIGHEST PRIORITY)
**Goal**: Nail the core mobile experience first

1. **#23** Perfect mobile-first responsive design
2. **#24** Implement touch gestures
3. **#25** Loading states and error handling
4. **#10** Get Directions integration (critical mobile feature)

### Phase 2: Content & Social Integration (HIGH PRIORITY)
**Goal**: Rich content that keeps users engaged

5. **#14** Expand cafe data structure (prepare for real data)
6. **#20** Social media feed integration (Instagram/TikTok)
7. **#21** News categorization and filtering
8. **#22** News date sorting and caching
9. **#15** Photo handling and optimization
10. **#16** Rating breakdown display
11. **#17** Hours/availability display
12. **#18** Social media links
13. **#19** Contact information

### Phase 3: Performance & Polish (MEDIUM PRIORITY)
**Goal**: Fast, reliable, professional experience

14. **#26** Offline caching and PWA basics
15. **#27** Performance optimizations (lazy loading, bundle splitting)
16. **#29** PWA capabilities (install prompt, manifest)
17. **#28** Accessibility features (WCAG compliance)

### Phase 4: Quality Assurance (LAUNCH PREP)
**Goal**: Production-ready

18. **#30** Comprehensive testing on real devices
19. **#31** Local dev admin panel for data management

### ⏭️ **MOVED TO V2**
- **#11** Matcha Passport localStorage
- **#12** Progress tracking and stats
- **#13** Achievement/badge system

**Rationale**: Focus V1 on discovery and content. Passport gamification can be a major V2 feature that brings users back.

---

## 📝 **NOTES & KEY DECISIONS**

### Priority Changes (Latest)
-   **Mobile-first is paramount**: This is our primary audience - every feature must be perfect on mobile
-   **Passport moved to V2**: Focusing on core discovery and content first; gamification later
-   **Social media integration**: Exploring Instagram/TikTok feed automation for news section
-   **Real data pending**: Content structure ready, waiting for actual cafe data collection

### Development Guidelines
-   Test on **real devices** constantly (not just browser dev tools)
-   Every feature must pass mobile usability test before considering complete
-   Performance budgets: <2.5s LCP, <100KB bundle per page
-   Instagram/TikTok APIs may have restrictions - have manual JSON fallback ready

### Social Feed Integration Notes
-   **Instagram**: Basic Display API requires app review, may use embed or manual curation
-   **TikTok**: Embed API available, explore oEmbed endpoint
-   **Fallback**: JSON structure that can accept manual social post data
-   **Refresh strategy**: Time-based cache (hourly?) or manual admin trigger

---

_Last updated: 2025-09-30_
_Status: V1 Development Phase - Mobile & Content Focus_
