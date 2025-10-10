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
    myProfile: 'My Profile',
    about: 'About',
    shop: 'Shop',
    contact: 'Contact',
    settings: 'Settings',
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
    availability: 'Availability',
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

  // Authentication
  auth: {
    // Login Page
    welcomeBack: 'Welcome Back',
    joinCommunity: 'Join the Community',
    adminAccess: 'Admin Access',
    signInToSave: 'Sign in to save your matcha journey',
    createAccountToTrack: 'Create an account to track cafes and write reviews',
    signInForAdmin: 'Sign in to access the admin panel',
    adminAccessRestricted: 'Access restricted to authorized administrators',

    // Login Form
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    dontHaveAccount: "Don't have an account? Sign up",

    // Register Form
    username: 'Username',
    usernamePlaceholder: 'matchalover',
    usernameHint: 'Letters, numbers, and underscores only',
    confirmPassword: 'Confirm Password',
    createAccount: 'Create Account',
    creatingAccount: 'Creating Account...',
    alreadyHaveAccount: 'Already have an account? Sign in',
    passwordMinLength: 'At least 8 characters',

    // Validation Errors
    passwordTooShort: 'Password must be at least 8 characters long',
    passwordsDoNotMatch: 'Passwords do not match',
    usernameTooShort: 'Username must be at least 3 characters long',
    usernameInvalidChars: 'Username can only contain letters, numbers, and underscores',

    // Session Expiration
    sessionExpired: {
      title: 'Session Expired',
      message: 'Your session has expired. Please sign in again to continue.',
      signInAgain: 'Sign In Again',
      dismiss: 'Dismiss',
    },
  },

  // Profile
  profile: {
    editProfile: 'Edit Profile',
    loadingProfile: 'Loading profile...',
    profileNotFound: 'Profile Not Found',
    edit: 'Edit',
    website: 'Website',
    memberSince: 'Member since',

    // Welcome Banner
    welcomeTitle: 'Welcome to MatchaMap! 🍵',
    welcomeSubtitle: "You're all set! Here's how to get started on your matcha journey:",
    exploreCafes: 'Explore Cafes',
    exploreCafesDescription: 'Browse our curated list of the best matcha cafes in Toronto',
    buildPassport: 'Build Your Passport',
    buildPassportDescription: 'Visit cafes and mark them on your passport to track your journey',
    startExploringButton: 'Start Exploring',
    dismissButton: 'Dismiss',

    // Edit Profile Modal
    displayName: 'Display Name',
    displayNamePlaceholder: 'Your name',
    bio: 'Bio',
    bioPlaceholder: 'Tell us about yourself...',
    bioCharCount: (current: number, max: number) => `${current}/${max}`,
    location: 'Location',
    locationPlaceholder: 'Toronto, ON',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    usernamePlaceholder: 'username',
    websiteUrl: 'Website',
    websitePlaceholder: 'https://example.com',
    privacySettings: 'Privacy Settings',
    publicProfile: 'Public Profile',
    publicProfileDescription: 'Allow anyone to view your profile',
    showActivity: 'Show Activity',
    showActivityDescription: 'Display your recent reviews and check-ins',
    saving: 'Saving...',
    saveChanges: 'Save Changes',
    failedToUpdate: 'Failed to update profile',

    // Profile Stats
    reviews: 'Reviews',
    checkins: 'Check-ins',
    photos: 'Photos',
    passport: 'Passport',
    reputation: (score: number) => `Reputation: ${score} points`,

    // Profile Activity
    badges: 'Badges',
    ownActivityPlaceholder: 'Your recent activity will appear here once you start reviewing cafes!',
    userActivityPlaceholder: (username: string) => `${username}'s recent activity will appear here.`,
  },

  // Admin (basic strings, admin has more specific copy in components)
  admin: {
    title: 'Admin Dashboard',
    mode: 'Admin Mode',
    cafes: 'Cafes',
    drinks: 'Drinks',
    events: 'Events',
    feed: 'News Feed',
    stats: 'Analytics',
    users: 'Users',
    settings: 'Settings',

    // Cafe Editor
    cafeEditor: {
      coordsReadOnly: 'Coordinates cannot be edited here',
      coordsAutoUpdated: 'Coordinates are automatically updated when you refresh from Google Maps',
    },

    // Waitlist Management
    waitlist: {
      title: 'Waitlist Signups',
      subtitle: 'Manage and track early access signups',
      exportCsv: 'Export CSV',
      totalSignups: (count: number) => `${count} total signups`,
      dailySignups: (count: number) => `${count} today`,
      weeklySignups: (count: number) => `${count} this week`,
      conversionRate: (rate: number) => `${rate}% conversion rate`,
      email: 'Email',
      signupDate: 'Signup Date',
      referralSource: 'Referral Source',
      status: 'Status',
      converted: 'Converted',
      pending: 'Pending',
      sortByEmail: 'Sort by Email',
      sortByDate: 'Sort by Date',
      sortAscending: 'Sort Ascending',
      sortDescending: 'Sort Descending',
      loading: 'Loading waitlist...',
      loadingMore: 'Loading more...',
      noEntries: 'No waitlist entries found',
      errorLoading: 'Failed to load waitlist entries',
      analytics: 'Analytics',
      entriesPerPage: (limit: number) => `Showing ${limit} entries per page`,
      loadMore: 'Load More',
      unknown: 'Unknown',
    },

    // User Management
    userManagement: {
      title: 'User Management',
      searchPlaceholder: 'Search users...',
      filterByRole: 'Filter by Role',
      allRoles: 'All Roles',
      adminRole: 'Admins',
      userRole: 'Users',
      totalUsers: 'Total Users',
      adminUsers: 'Admin Users',
      regularUsers: 'Regular Users',
      activeThisWeek: 'Active This Week',
      newThisMonth: 'New This Month',
      confirmRoleChange: (role: string) => `Are you sure you want to change this user's role to ${role}?`,
      confirmDelete: (username: string) => `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      roleUpdateSuccess: 'User role updated successfully',
      roleUpdateError: 'Failed to update user role',
      deleteSuccess: 'User deleted successfully',
      deleteError: 'Failed to delete user',
      loadError: 'Failed to load users',
      viewDetails: 'View Details',
      makeAdmin: 'Make Admin',
      makeUser: 'Make User',
      deleteUser: 'Delete User',
      email: 'Email',
      username: 'Username',
      role: 'Role',
      status: 'Status',
      lastActive: 'Last Active',
      joined: 'Joined',
      verified: 'Verified',
      unverified: 'Unverified',
      admin: 'Admin',
      user: 'User',
      never: 'Never',
      today: 'Today',
      yesterday: 'Yesterday',
      daysAgo: (days: number) => `${days} days ago`,
      weeksAgo: (weeks: number) => `${weeks} weeks ago`,
    },

    // Date formatting
    dateTime: {
      justNow: 'Just now',
      minutesAgo: (minutes: number) => `${minutes} minute${minutes === 1 ? '' : 's'} ago`,
      hoursAgo: (hours: number) => `${hours} hour${hours === 1 ? '' : 's'} ago`,
    },
  },
} as const

// Type helper to ensure type safety when accessing COPY
export type CopyKeys = typeof COPY
