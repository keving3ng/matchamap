/**
 * Centralized copy/text constants for MatchaMap
 *
 * All user-facing strings should be defined here to:
 * - Make copy updates easier across the entire app
 * - Enable future internationalization (i18n)
 * - Provide type-safety via TypeScript
 * - Make copy audits/searches easier
 *
 * Organization: Grouped by feature/component
 */

export const COPY = {
  // Header & Navigation
  header: {
    title: 'MatchaMap',
    instagramAriaLabel: 'Instagram',
    tiktokAriaLabel: 'TikTok',
    menuAriaLabel: 'Menu',
  },

  // Menu Items
  menu: {
    signIn: 'Sign In',
    signOut: 'Sign Out',
    about: 'About',
    shop: 'Shop',
    contact: 'Contact',
    settings: 'Settings',
    admin: 'Admin',
  },

  // Map View
  map: {
    directions: 'Directions',
    viewDetails: 'View Details',
    viewFullDetails: 'View Full Details',
    getDirections: 'Get Directions',
    enableLocationServices: 'Enable location services',
    findLocation: 'Find my location',
    locationFound: 'Location found',
    drinks: 'Drinks',
    hours: 'Hours',
    today: 'Today',
    follow: 'Follow',
    openNow: 'Open Now',
    underPrice: (price: number) => `Under $${price}`,
    ratingFilter: (rating: number) => `${rating}+ ★`,
    drinkType: 'Drink Type',
    allDrinks: 'All Drinks',
    showRoute: 'Show Route',
    hideRoute: 'Hide Route',
    routeLoading: 'Loading route...',
    routeError: 'Unable to load route',
    walkingTime: (duration: string) => `${duration} walk`,
    walkingDistance: (distance: string) => distance,
  },

  // Location Dialogs
  location: {
    permissionDenied: {
      title: 'Location Access Needed',
      description: 'We need location access to calculate distances to cafes. Your location is never stored or shared.',
      tryAgain: 'Try Again',
      skip: 'Skip for Now',
    },
    loading: {
      title: 'Finding Your Location',
      description: 'Please allow location access when prompted. This may take a few seconds...',
      cancel: 'Cancel',
    },
    unavailable: {
      title: 'Location Unavailable',
      close: 'Close',
      tryAgain: 'Try Again',
      errorMessages: {
        positionUnavailable: 'Unable to determine your location. Try moving to an open area with better GPS signal, or make sure location services are enabled for your browser.',
        timeout: 'Location request timed out. This often happens indoors or in areas with poor GPS signal. Try again when you have better signal or are outdoors.',
        notSupported: 'Geolocation is not supported by your browser. Try using a modern browser like Chrome, Safari, or Firefox.',
        generic: 'Location services are not available. Make sure you\'re on a secure (HTTPS) connection and location services are enabled.',
      },
    },
  },

  // List View
  list: {
    sortByRating: 'Sort: Rating',
    sortByDistance: 'Sort: Distance',
    search: 'Search',
    filter: 'Filter',
    city: 'City',
    searchPlaceholder: 'Search cafes, neighborhoods, or keywords...',
    clearSearch: 'Clear search',
    minimumRating: 'Minimum Rating',
    maxDistance: 'Max Distance',
    maxDistanceRequiresLocation: 'Max Distance (Enable location first)',
    drinkType: 'Drink Type',
    allDrinks: 'All Drinks',
    clearAllFilters: 'Clear All Filters',
    clearFilters: 'Clear filters',
    noResults: 'No cafes match your filters',
    tapLocationForDistance: 'Tap location for distance',
    walkTime: (distance: string, time: string) => `${distance} • ${time} walk`,
    kmDistance: (km: number) => `${km}km`,
    filterByCity: 'Filter by City',
    citiesSelected: (count: number) => `${count} cities selected`,
    clearAll: 'Clear All',
  },

  // Detail View
  detail: {
    getDirections: 'Get Directions',
    visited: 'Visited! ✓',
    markVisited: 'Mark as visited (Matcha Passport)',
    drinksMenu: 'Drinks Menu',
    featured: '⭐ Featured',
    cafeDetails: 'Cafe Details',
    ambiance: 'Ambiance',
    alternativeMilk: 'Alternative Milk',
    alternativeMilkFree: 'Free ✓',
    alternativeMilkCharge: (price: number) => `+$${price.toFixed(2)}`,
    alternativeMilkUnknown: 'Unknown',
    ourReview: 'Our Review',
    hours: 'Hours',
    today: 'Today',
    showFullWeek: 'Show full week',
    showLess: 'Show less',
    quickNote: 'Quick Note',
    socialMedia: 'Social Media',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    matchaAmount: (grams: number) => `${grams}g matcha`,
    icedMatchaLatte: 'Iced Matcha Latte',
    awayDistance: (distance: string, time: string) => `${distance} away • ${time} walk`,
    scoreOutOf: '/ 10',
  },

  // Passport View
  passport: {
    title: 'Matcha Passport',
    subtitle: 'Track your matcha journey across Toronto',
    visited: 'Visited',
    total: 'Total',
    clearAll: 'Clear All',
    confirmClear: 'Are you sure you want to clear all your visited locations?',
    cancel: 'Cancel',
    confirm: 'Clear',
    noVisited: 'No cafes visited yet',
    startExploring: 'Start exploring to build your matcha passport!',
  },

  // Feed View
  feed: {
    title: 'Feed',
    noUpdates: 'No updates yet',
    checkBackSoon: 'Check back soon for matcha news and updates!',
  },

  // Events View
  events: {
    title: 'Events',
    noEvents: 'No upcoming events',
    checkBackSoon: 'Check back soon for matcha events!',
  },

  // Contact Page
  contact: {
    title: 'Get in Touch',
    subtitle: 'Have a question or suggestion?',
    emailPlaceholder: 'your@email.com',
    messagePlaceholder: 'Tell us what\'s on your mind...',
    send: 'Send Message',
    sending: 'Sending...',
    success: 'Message sent! We\'ll get back to you soon.',
    error: 'Failed to send message. Please try again.',
  },

  // About Page
  about: {
    title: 'About MatchaMap',
    subtitle: 'Your guide to Toronto\'s best matcha cafes',
  },

  // Store Page
  store: {
    title: 'Shop',
    comingSoon: 'Coming Soon',
  },

  // Settings Page
  settings: {
    title: 'Settings',
    preferences: 'Preferences',
    account: 'Account',
  },

  // Coming Soon
  comingSoon: {
    title: 'Coming Soon',
    description: 'This feature is under development. Check back soon!',
  },

  // Bottom Navigation
  nav: {
    map: 'Map',
    list: 'List',
    passport: 'Passport',
    feed: 'Feed',
    events: 'Events',
  },

  // Common/Shared
  common: {
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    viewMore: 'View More',
    viewLess: 'View Less',
    seeAll: 'See All',
    unknown: 'Unknown',
  },

  // Admin (basic strings, admin has more specific copy in components)
  admin: {
    title: 'Admin Dashboard',
    cafes: 'Cafes',
    drinks: 'Drinks',
    events: 'Events',
    feed: 'News Feed',
    stats: 'Analytics',
    users: 'Users',
    settings: 'Settings',
  },
} as const

// Type helper to ensure type safety when accessing COPY
export type CopyKeys = typeof COPY
