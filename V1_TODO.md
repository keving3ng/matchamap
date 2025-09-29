# MatchaMap V1 Development TODO

This document tracks all remaining tasks to complete V1 based on the PRD requirements and current implementation status.

## 📊 **Progress Overview**

-   **Total Tasks**: 30
-   **Completed**: 0
-   **In Progress**: 0
-   **Remaining**: 30

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

-   [ ] **#6** Add map-to-list view toggle functionality
    -   Seamless transition between map and list
    -   Maintain selected cafe across views
    -   Preserve scroll position where appropriate

---

## 📋 **LIST & SEARCH FUNCTIONALITY** (High Priority - Core Feature)

### Status: Static list with mock expand/collapse → Need real filtering/sorting

-   [ ] **#7** Implement list sorting (by rating, distance, neighborhood)

    -   Make filter button tabs functional
    -   Sort algorithms for each criteria
    -   Visual indication of current sort

-   [ ] **#8** Add list filtering capabilities

    -   Filter by price range
    -   Filter by rating threshold
    -   Filter by neighborhood selection
    -   Combine multiple filters

-   [ ] **#9** Implement search functionality for cafes
    -   Text search across cafe names
    -   Search by neighborhood
    -   Search by keywords/tags
    -   Real-time search results

---

## 🎫 **MATCHA PASSPORT** (High Priority - Unique Feature)

### Status: Visual mockup with basic state → Need persistent storage & logic

-   [ ] **#11** Implement persistent localStorage for Matcha Passport

    -   Save visited cafes across browser sessions
    -   Data structure for user progress
    -   Migration strategy for data format changes

-   [ ] **#12** Add progress tracking and stats calculations

    -   Real percentage calculations
    -   Visit counts and averages
    -   Favorite cafe tracking
    -   Time-based statistics

-   [ ] **#13** Implement achievement/badge system
    -   Define achievement criteria
    -   Unlock system with notifications
    -   Achievement display in passport
    -   Special badges for milestones

---

## 🏪 **CAFE DATA & DETAILS** (Medium Priority - Content)

### Status: Basic mock data → Need comprehensive cafe profiles

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

## 📰 **NEWS & CONTENT** (Medium Priority - Engagement)

### Status: Static news list → Need dynamic content management

-   [ ] **#20** Implement news content management

    -   Dynamic news loading from data
    -   News item creation workflow
    -   Content versioning

-   [ ] **#21** Add news categorization and filtering

    -   Filter by news type (new location, updates, announcements)
    -   Category-specific styling
    -   Filter persistence

-   [ ] **#22** Implement news date sorting
    -   Chronological organization
    -   "New" indicators for recent items
    -   Archive old news functionality

---

## 🎯 **NAVIGATION & UX** (High Priority - Usability)

### Status: Basic view switching → Need enhanced navigation

-   [ ] **#10** Add 'Get Directions' integration with native maps apps
    -   iOS Maps integration
    -   Google Maps fallback
    -   Platform detection
    -   Deep link generation

---

## 📱 **MOBILE OPTIMIZATION** (High Priority - Platform)

### Status: Responsive design basics → Need mobile-first perfection

-   [ ] **#23** Add responsive mobile-first optimizations

    -   Perfect touch targets (44px minimum)
    -   Safe area handling for notched devices
    -   Optimal font sizes and spacing
    -   Landscape orientation support

-   [ ] **#24** Implement touch gesture support

    -   Swipe gestures for navigation
    -   Pull-to-refresh functionality
    -   Touch feedback animations
    -   Prevent zoom on form inputs

-   [ ] **#25** Add loading states and error handling

    -   Loading spinners for async operations
    -   Error boundaries for component failures
    -   Network error handling
    -   Retry mechanisms

-   [ ] **#26** Implement offline-capable data caching
    -   Service worker for offline functionality
    -   Cache strategies for different content types
    -   Offline indicator
    -   Data sync when online

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

## 🚀 **SUGGESTED IMPLEMENTATION ORDER**

### Sprint 1: Core Map Functionality

1. **#1** Leaflet Map Integration
2. **#2** Geolocation functionality
3. **#3** Map controls
4. **#5** Distance calculations

### Sprint 2: Data & Content

5. **#14** Expand cafe data
6. **#16** Rating breakdown
7. **#17** Hours display
8. **#4** Custom map markers

### Sprint 3: Core Features

9. **#11** localStorage Passport
10. **#7** List sorting
11. **#8** List filtering
12. **#10** Get Directions

### Sprint 4: Enhancement & Polish

13. **#12** Progress tracking
14. **#23** Mobile optimizations
15. **#25** Loading states
16. **#15** Photo handling

### Sprint 5: Advanced Features

17. **#9** Search functionality
18. **#13** Achievement system
19. **#20-22** News management
20. **#27** Performance optimizations

### Sprint 6: Quality & Launch Prep

21. **#28** Accessibility
22. **#29** PWA capabilities
23. **#30** Testing
24. **#24** Touch gestures
25. **#26** Offline capabilities

---

## 📝 **NOTES**

-   This document should be updated as tasks are completed
-   Each task should include acceptance criteria before implementation
-   Consider dependencies between tasks when planning sprints
-   Regular testing on actual mobile devices is essential
-   Performance budgets should be established and monitored

---

_Last updated: [Current Date]_
_Status: V1 Development Phase_
