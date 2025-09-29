# MatchaMap Component Architecture Guide

## Overview

MatchaMap uses Astro's component architecture with a clear separation between static components (rendered at build time) and interactive islands (hydrated in the browser). This guide outlines the component structure, patterns, and implementation details.

## Architecture Principles

### Static-First Approach
- **Default**: All components render to static HTML
- **Islands**: Interactive components only where needed
- **Performance**: Minimal JavaScript shipped to browser
- **SEO**: Full server-side rendering for content

### Component Hierarchy

```
┌─────────────────────────┐
│     Layout Components   │  ← Static, wraps pages
├─────────────────────────┤
│     Page Components     │  ← Static, route-based
├─────────────────────────┤
│    Shared Components    │  ← Static, reusable UI
├─────────────────────────┤
│    Island Components    │  ← Interactive, client-side
└─────────────────────────┘
```

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── BaseLayout.astro
│   │   ├── Navigation.astro
│   │   └── Footer.astro
│   ├── ui/
│   │   ├── CafeCard.astro
│   │   ├── ScoreDisplay.astro
│   │   ├── Button.astro
│   │   └── Badge.astro
│   ├── sections/
│   │   ├── HeroSection.astro
│   │   ├── CafeGrid.astro
│   │   └── NewsSection.astro
│   └── islands/
│       ├── InteractiveMap.astro
│       ├── ListFilters.astro
│       └── PassportTracker.astro
├── layouts/
│   ├── BaseLayout.astro
│   └── CafeLayout.astro
└── pages/
    ├── index.astro
    ├── list.astro
    └── cafe/
        └── [id].astro
```

## Layout Components

### BaseLayout.astro

**Purpose**: Root layout for all pages
**Type**: Static
**Responsibilities**: HTML structure, head tags, global navigation

```astro
---
// src/layouts/BaseLayout.astro
export interface Props {
  title: string;
  description?: string;
  image?: string;
}

const { title, description, image } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta name="generator" content={Astro.generator}>
  <link rel="canonical" href={canonicalURL}>
  
  <!-- SEO Meta Tags -->
  <title>{title}</title>
  <meta name="description" content={description || "Discover the best matcha cafes in Toronto"}>
  
  <!-- Open Graph -->
  <meta property="og:title" content={title}>
  <meta property="og:description" content={description}>
  <meta property="og:image" content={image || "/og-image.jpg"}>
  <meta property="og:url" content={canonicalURL}>
  
  <!-- Leaflet CSS (only on pages that need it) -->
  {Astro.url.pathname === '/' && 
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  }
</head>
<body class="bg-cream text-charcoal font-clean">
  <Navigation />
  <main>
    <slot />
  </main>
  <Footer />
</body>
</html>
```

### Navigation.astro

**Purpose**: Site navigation
**Type**: Static with mobile-responsive behavior
**Pattern**: Bottom tab bar on mobile, top nav on desktop

```astro
---
// src/components/layout/Navigation.astro
const currentPath = Astro.url.pathname;

const navItems = [
  { href: '/', label: 'Map', icon: 'map' },
  { href: '/list', label: 'List', icon: 'list' },
  { href: '/passport', label: 'Passport', icon: 'bookmark' },
  { href: '/news', label: 'News', icon: 'newspaper' }
];
---

<!-- Mobile Navigation (Bottom Tab Bar) -->
<nav class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 lg:hidden pb-safe">
  <div class="flex items-center justify-around px-4 py-2">
    {navItems.map(item => (
      <a 
        href={item.href} 
        class={`flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors ${
          currentPath === item.href 
            ? 'text-matcha-500' 
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <Icon name={item.icon} class="w-6 h-6" />
        <span class="text-xs font-medium">{item.label}</span>
      </a>
    ))}
  </div>
</nav>

<!-- Desktop Navigation (Top Bar) -->
<nav class="hidden lg:block bg-white border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <div class="flex items-center space-x-4">
        <a href="/" class="text-xl font-japanese font-bold text-matcha-500">
          MatchaMap
        </a>
      </div>
      <div class="flex space-x-8">
        {navItems.map(item => (
          <a 
            href={item.href}
            class={`px-3 py-2 text-sm font-medium transition-colors ${
              currentPath === item.href
                ? 'text-matcha-500 border-b-2 border-matcha-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  </div>
</nav>
```

## UI Components

### CafeCard.astro

**Purpose**: Display cafe information in list view
**Type**: Static with expandable content
**Props**: cafe object, compact/expanded state

```astro
---
// src/components/ui/CafeCard.astro
export interface Props {
  cafe: {
    id: string;
    name: string;
    neighborhood: string;
    primaryScore: number;
    quickNotes?: string;
    address: string;
    distance?: number;
  };
  expanded?: boolean;
}

const { cafe, expanded = false } = Astro.props;
---

<div class="cafe-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden touch-manipulation transition-all duration-200 ease-out hover:shadow-md active:scale-[0.98]">
  
  <!-- Compact View (Always Visible) -->
  <div class="p-4 flex items-center justify-between">
    <div class="flex-1 min-w-0">
      <h3 class="font-japanese font-medium text-gray-900 truncate">
        {cafe.name}
      </h3>
      <div class="flex items-center gap-4 mt-1 text-sm text-gray-600">
        <ScoreDisplay score={cafe.primaryScore} />
        <span>{cafe.neighborhood}</span>
        {cafe.distance && (
          <span>{cafe.distance.toFixed(1)}km</span>
        )}
      </div>
    </div>
    
    <!-- Expand Button -->
    <button 
      class="expand-btn p-2 text-gray-400 hover:text-gray-600 touch-manipulation transition-colors"
      aria-label="Expand cafe details"
    >
      <Icon name="chevron-down" class="w-5 h-5 transition-transform" />
    </button>
  </div>
  
  <!-- Expanded View (Hidden by Default) -->
  <div class="expanded-content hidden px-4 pb-4 border-t border-gray-100">
    <p class="text-sm text-gray-600 mt-3">{cafe.address}</p>
    {cafe.quickNotes && (
      <p class="text-sm text-gray-700 mt-2">{cafe.quickNotes}</p>
    )}
    <a 
      href={`/cafe/${cafe.id}`}
      class="inline-block mt-3 bg-matcha-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-matcha-600 touch-manipulation transition-colors"
    >
      View Details
    </a>
  </div>
</div>

<script>
  // Client-side expansion logic
  document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.cafe-card');
    
    cards.forEach(card => {
      const expandBtn = card.querySelector('.expand-btn');
      const expandedContent = card.querySelector('.expanded-content');
      const chevron = expandBtn.querySelector('.w-5');
      
      expandBtn.addEventListener('click', () => {
        const isExpanded = !expandedContent.classList.contains('hidden');
        
        if (isExpanded) {
          expandedContent.classList.add('hidden');
          chevron.style.transform = 'rotate(0deg)';
        } else {
          expandedContent.classList.remove('hidden');
          chevron.style.transform = 'rotate(180deg)';
        }
      });
    });
  });
</script>
```

### ScoreDisplay.astro

**Purpose**: Consistent score visualization
**Type**: Static
**Props**: score value, optional label

```astro
---
// src/components/ui/ScoreDisplay.astro
export interface Props {
  score: number;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

const { score, label, size = 'medium' } = Astro.props;

// Determine color based on score
const getScoreColor = (score: number) => {
  if (score >= 8.5) return 'text-green-600 bg-green-50';
  if (score >= 7.0) return 'text-matcha-600 bg-matcha-50';
  if (score >= 5.5) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

const getSizeClasses = (size: string) => {
  switch (size) {
    case 'small': return 'text-xs px-2 py-1';
    case 'large': return 'text-lg px-4 py-2';
    default: return 'text-sm px-3 py-1';
  }
};
---

<div class={`inline-flex items-center gap-1 rounded-full font-medium ${getScoreColor(score)} ${getSizeClasses(size)}`}>
  <div class="w-2 h-2 bg-current rounded-full"></div>
  <span>{score.toFixed(1)}/10</span>
  {label && <span class="text-gray-600">· {label}</span>}
</div>
```

## Island Components

### InteractiveMap.astro

**Purpose**: Interactive map with cafe pins and popover
**Type**: Client-side island
**Dependencies**: Leaflet

```astro
---
// src/components/islands/InteractiveMap.astro
import type { Cafe } from '../types';

export interface Props {
  cafes: Cafe[];
}

const { cafes } = Astro.props;
---

<div id="map-container" class="relative w-full h-screen bg-cream">
  <div id="map" class="w-full h-full"></div>
  
  <!-- Map Controls -->
  <div class="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
    <button 
      id="locate-btn"
      class="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg hover:bg-white transition-colors touch-manipulation"
      aria-label="Center on your location"
    >
      <Icon name="location" class="w-5 h-5" />
    </button>
    <a 
      href="/list"
      class="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg hover:bg-white transition-colors touch-manipulation"
      aria-label="Switch to list view"
    >
      <Icon name="list" class="w-5 h-5" />
    </a>
  </div>
  
  <!-- Popover Template -->
  <template id="popover-template">
    <div class="bg-white rounded-lg shadow-lg p-4 min-w-[250px] max-w-[300px]">
      <h3 class="font-japanese font-medium text-gray-900 mb-2" data-cafe-name></h3>
      <div class="space-y-2 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-matcha-500 rounded-full"></div>
          <span data-cafe-score></span>
        </div>
        <div class="text-gray-600" data-cafe-neighborhood></div>
        <div class="text-gray-600" data-cafe-distance></div>
      </div>
      <a 
        href="#" 
        data-cafe-link
        class="inline-block mt-3 bg-matcha-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-matcha-600 transition-colors"
      >
        View Details
      </a>
    </div>
  </template>
</div>

<script>
  import L from 'leaflet';
  
  // Cafe data passed from Astro
  const cafes = JSON.parse(document.getElementById('cafe-data')?.textContent || '[]');
  
  // Initialize map
  const map = L.map('map', {
    center: [43.6532, -79.3832], // Downtown Toronto
    zoom: 12,
    zoomControl: false,
    attributionControl: true,
    scrollWheelZoom: true,
    touchZoom: true,
    doubleClickZoom: true,
    boxZoom: false,
  });
  
  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);
  
  // Custom marker icon
  const matchaIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="w-8 h-8 bg-matcha-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <div class="w-3 h-3 bg-white rounded-full"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
  
  // Add cafe markers
  cafes.forEach(cafe => {
    const marker = L.marker([cafe.coordinates.lat, cafe.coordinates.lng], {
      icon: matchaIcon
    }).addTo(map);
    
    // Create popover content
    const template = document.getElementById('popover-template').content.cloneNode(true);
    template.querySelector('[data-cafe-name]').textContent = cafe.name;
    template.querySelector('[data-cafe-score]').textContent = `${cafe.primaryScore}/10`;
    template.querySelector('[data-cafe-neighborhood]').textContent = cafe.neighborhood;
    template.querySelector('[data-cafe-link]').href = `/cafe/${cafe.id}`;
    
    // Add distance if user location available
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        cafe.coordinates.lat, cafe.coordinates.lng
      );
      template.querySelector('[data-cafe-distance]').textContent = `${distance.toFixed(1)}km away`;
    }
    
    marker.bindPopup(template.innerHTML, {
      closeButton: false,
      className: 'custom-popup'
    });
  });
  
  // Location control
  let userLocation = null;
  
  document.getElementById('locate-btn').addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          map.setView([userLocation.lat, userLocation.lng], 14);
          
          // Add user location marker
          L.marker([userLocation.lat, userLocation.lng], {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })
          }).addTo(map);
        },
        (error) => {
          console.warn('Geolocation failed:', error);
          // Show toast notification
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  });
  
  // Distance calculation helper
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
</script>

<!-- Pass cafe data to script -->
<script type="application/json" id="cafe-data">
  {JSON.stringify(cafes)}
</script>

<style>
  /* Custom marker styles */
  .custom-marker {
    background: none;
    border: none;
  }
  
  /* Custom popup styles */
  .custom-popup .leaflet-popup-content-wrapper {
    padding: 0;
    border-radius: 0.5rem;
  }
  
  .custom-popup .leaflet-popup-tip {
    background: white;
  }
</style>
```

### ListFilters.astro

**Purpose**: Sort and filter controls for list view
**Type**: Client-side island
**State**: Filter criteria, sort order

```astro
---
// src/components/islands/ListFilters.astro
---

<div class="bg-white border-b border-gray-200 sticky top-0 z-40">
  <div class="px-4 py-3">
    <div class="flex items-center justify-between gap-4">
      <!-- Sort Controls -->
      <div class="flex items-center gap-2">
        <label for="sort-select" class="text-sm font-medium text-gray-700">Sort by:</label>
        <select 
          id="sort-select"
          class="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-matcha-500 focus:border-matcha-500"
        >
          <option value="score">Top Rated</option>
          <option value="distance">Distance</option>
          <option value="neighborhood">Neighborhood</option>
          <option value="name">Name</option>
        </select>
      </div>
      
      <!-- Filter Controls -->
      <div class="flex items-center gap-2">
        <button 
          id="filter-btn"
          class="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Filters
        </button>
      </div>
    </div>
    
    <!-- Filter Panel (Hidden by Default) -->
    <div id="filter-panel" class="hidden mt-3 pt-3 border-t border-gray-200">
      <div class="grid grid-cols-2 gap-4">
        <!-- Neighborhood Filter -->
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-2">Neighborhood</label>
          <select id="neighborhood-filter" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2">
            <option value="">All Neighborhoods</option>
            <option value="Downtown">Downtown</option>
            <option value="King West">King West</option>
            <option value="Queen West">Queen West</option>
            <option value="Kensington Market">Kensington Market</option>
          </select>
        </div>
        
        <!-- Score Range Filter -->
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-2">Minimum Score</label>
          <select id="score-filter" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2">
            <option value="0">Any Score</option>
            <option value="7">7.0+</option>
            <option value="8">8.0+</option>
            <option value="9">9.0+</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  class ListFilters {
    constructor() {
      this.sortSelect = document.getElementById('sort-select');
      this.filterBtn = document.getElementById('filter-btn');
      this.filterPanel = document.getElementById('filter-panel');
      this.neighborhoodFilter = document.getElementById('neighborhood-filter');
      this.scoreFilter = document.getElementById('score-filter');
      
      this.init();
    }
    
    init() {
      // Sort functionality
      this.sortSelect.addEventListener('change', (e) => {
        this.applySorting(e.target.value);
      });
      
      // Filter panel toggle
      this.filterBtn.addEventListener('click', () => {
        this.toggleFilterPanel();
      });
      
      // Filter functionality
      this.neighborhoodFilter.addEventListener('change', () => {
        this.applyFilters();
      });
      
      this.scoreFilter.addEventListener('change', () => {
        this.applyFilters();
      });
    }
    
    toggleFilterPanel() {
      const isHidden = this.filterPanel.classList.contains('hidden');
      
      if (isHidden) {
        this.filterPanel.classList.remove('hidden');
        this.filterBtn.textContent = 'Hide Filters';
        this.filterBtn.classList.add('bg-matcha-50', 'text-matcha-600');
      } else {
        this.filterPanel.classList.add('hidden');
        this.filterBtn.textContent = 'Filters';
        this.filterBtn.classList.remove('bg-matcha-50', 'text-matcha-600');
      }
    }
    
    applySorting(sortBy) {
      const container = document.getElementById('cafe-list');
      const cards = Array.from(container.children);
      
      cards.sort((a, b) => {
        switch (sortBy) {
          case 'score':
            return this.getScore(b) - this.getScore(a);
          case 'distance':
            return this.getDistance(a) - this.getDistance(b);
          case 'neighborhood':
            return this.getNeighborhood(a).localeCompare(this.getNeighborhood(b));
          case 'name':
            return this.getName(a).localeCompare(this.getName(b));
          default:
            return 0;
        }
      });
      
      // Reorder DOM elements
      cards.forEach(card => container.appendChild(card));
    }
    
    applyFilters() {
      const neighborhood = this.neighborhoodFilter.value;
      const minScore = parseFloat(this.scoreFilter.value) || 0;
      
      const cards = document.querySelectorAll('.cafe-card');
      
      cards.forEach(card => {
        const cardNeighborhood = this.getNeighborhood(card);
        const cardScore = this.getScore(card);
        
        const showNeighborhood = !neighborhood || cardNeighborhood === neighborhood;
        const showScore = cardScore >= minScore;
        
        if (showNeighborhood && showScore) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    }
    
    // Helper methods to extract data from DOM
    getScore(element) {
      const scoreText = element.querySelector('[data-score]')?.textContent || '0';
      return parseFloat(scoreText);
    }
    
    getDistance(element) {
      const distanceText = element.querySelector('[data-distance]')?.textContent || '999';
      return parseFloat(distanceText);
    }
    
    getNeighborhood(element) {
      return element.querySelector('[data-neighborhood]')?.textContent || '';
    }
    
    getName(element) {
      return element.querySelector('h3')?.textContent || '';
    }
  }
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    new ListFilters();
  });
</script>
```

### PassportTracker.astro

**Purpose**: Track visited cafes in localStorage
**Type**: Client-side island
**State**: Visited cafe IDs, progress tracking

```astro
---
// src/components/islands/PassportTracker.astro
export interface Props {
  totalCafes: number;
}

const { totalCafes } = Astro.props;
---

<div class="bg-gradient-to-r from-matcha-500 to-matcha-600 text-white rounded-xl p-6 mb-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-japanese font-bold">Matcha Passport</h2>
    <div class="text-right">
      <div class="text-2xl font-bold" id="visit-count">0</div>
      <div class="text-sm opacity-90">of {totalCafes} cafes</div>
    </div>
  </div>
  
  <!-- Progress Bar -->
  <div class="w-full bg-white/20 rounded-full h-3 mb-4">
    <div 
      id="progress-bar"
      class="bg-white rounded-full h-3 transition-all duration-300 ease-out"
      style="width: 0%"
    ></div>
  </div>
  
  <!-- Progress Message -->
  <p id="progress-message" class="text-sm opacity-90">
    Start your matcha journey by visiting cafes!
  </p>
</div>

<!-- Visited Cafe Checkboxes (on cafe detail pages) -->
<div class="visited-checkbox-container" style="display: none;">
  <label class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
    <input 
      type="checkbox" 
      id="visited-checkbox"
      class="w-5 h-5 text-matcha-500 bg-white border-gray-300 rounded focus:ring-matcha-500 focus:ring-2"
    >
    <span class="font-medium text-gray-900">I've been here!</span>
  </label>
</div>

<script>
  class PassportTracker {
    constructor() {
      this.storageKey = 'matchaPassport';
      this.visitedCafes = this.loadVisitedCafes();
      this.totalCafes = parseInt(document.querySelector('[data-total-cafes]')?.textContent || '0');
      
      this.init();
    }
    
    init() {
      this.updateDisplay();
      this.setupCheckboxListeners();
    }
    
    loadVisitedCafes() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.warn('Failed to load passport data:', error);
        return [];
      }
    }
    
    saveVisitedCafes() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.visitedCafes));
      } catch (error) {
        console.warn('Failed to save passport data:', error);
      }
    }
    
    toggleCafeVisit(cafeId) {
      const index = this.visitedCafes.indexOf(cafeId);
      
      if (index > -1) {
        this.visitedCafes.splice(index, 1);
      } else {
        this.visitedCafes.push(cafeId);
      }
      
      this.saveVisitedCafes();
      this.updateDisplay();
    }
    
    updateDisplay() {
      const visitCount = this.visitedCafes.length;
      const percentage = this.totalCafes > 0 ? (visitCount / this.totalCafes) * 100 : 0;
      
      // Update visit count
      const countElement = document.getElementById('visit-count');
      if (countElement) {
        countElement.textContent = visitCount;
      }
      
      // Update progress bar
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
      }
      
      // Update progress message
      const messageElement = document.getElementById('progress-message');
      if (messageElement) {
        messageElement.textContent = this.getProgressMessage(visitCount, percentage);
      }
      
      // Update checkbox state on cafe detail pages
      const checkbox = document.getElementById('visited-checkbox');
      if (checkbox) {
        const cafeId = checkbox.dataset.cafeId;
        checkbox.checked = this.visitedCafes.includes(cafeId);
      }
    }
    
    getProgressMessage(visitCount, percentage) {
      if (visitCount === 0) {
        return 'Start your matcha journey by visiting cafes!';
      } else if (percentage < 25) {
        return 'Great start! Keep exploring new matcha spots.';
      } else if (percentage < 50) {
        return 'You\'re making good progress through Toronto\'s matcha scene!';
      } else if (percentage < 75) {
        return 'Impressive! You\'re becoming a true matcha connoisseur.';
      } else if (percentage < 100) {
        return 'Almost there! Just a few more cafes to complete your passport.';
      } else {
        return '🎉 Congratulations! You\'ve visited every matcha cafe in Toronto!';
      }
    }
    
    setupCheckboxListeners() {
      const checkbox = document.getElementById('visited-checkbox');
      if (checkbox) {
        const cafeId = checkbox.dataset.cafeId;
        
        checkbox.addEventListener('change', (e) => {
          this.toggleCafeVisit(cafeId);
          
          // Show feedback animation
          if (e.target.checked) {
            this.showVisitedFeedback();
          }
        });
      }
    }
    
    showVisitedFeedback() {
      // Create temporary success message
      const feedback = document.createElement('div');
      feedback.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-matcha-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse';
      feedback.textContent = '✓ Added to your Matcha Passport!';
      
      document.body.appendChild(feedback);
      
      setTimeout(() => {
        feedback.remove();
      }, 2000);
    }
  }
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    new PassportTracker();
  });
</script>

<!-- Pass total cafes count to script -->
<div data-total-cafes style="display: none;">{totalCafes}</div>
```

## Component Patterns

### Props Interface Pattern

```typescript
// Define TypeScript interfaces for props
export interface CafeProps {
  cafe: {
    id: string;
    name: string;
    primaryScore: number;
    // ... other cafe properties
  };
  showDistance?: boolean;
  compact?: boolean;
}
```

### Data Passing Pattern

```astro
---
// Pass data from Astro to client-side islands
const cafes = await getCafes();
---

<InteractiveMap cafes={cafes} />

<script type="application/json" id="cafe-data">
  {JSON.stringify(cafes)}
</script>
```

### Event Handling Pattern

```javascript
// Use event delegation for dynamic content
document.addEventListener('click', (e) => {
  if (e.target.matches('.cafe-card')) {
    handleCafeCardClick(e.target);
  }
});
```

### State Management Pattern

```javascript
// Simple state management with localStorage
class ComponentState {
  constructor(key) {
    this.storageKey = key;
    this.state = this.load();
  }
  
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || {};
    } catch {
      return {};
    }
  }
  
  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.state));
  }
  
  update(changes) {
    this.state = { ...this.state, ...changes };
    this.save();
  }
}
```

## Testing Components

### Manual Testing Checklist

- [ ] **Responsive Design**: Test on mobile, tablet, desktop
- [ ] **Touch Interactions**: Ensure 44px+ touch targets
- [ ] **Accessibility**: Keyboard navigation, screen readers
- [ ] **Performance**: Check bundle sizes and loading times
- [ ] **Browser Compatibility**: Test on iOS Safari, Chrome Mobile

### Component Isolation

```astro
---
// Create isolated test pages for components
// src/pages/test/cafe-card.astro
import CafeCard from '../../components/ui/CafeCard.astro';

const sampleCafe = {
  id: 'test-cafe',
  name: 'Test Matcha Cafe',
  neighborhood: 'Downtown',
  primaryScore: 8.5,
  address: '123 Test St, Toronto'
};
---

<html>
<head>
  <title>CafeCard Test</title>
</head>
<body>
  <div class="p-4">
    <CafeCard cafe={sampleCafe} />
  </div>
</body>
</html>
```

---

*Component Guide Version: 1.0*
*Last Updated: [Current Date]*
*Status: V1 Implementation*