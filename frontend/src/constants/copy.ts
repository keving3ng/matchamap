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
  cafeData: {
    invalidData: 'The café data could not be read. Please refresh.',
    unsupportedQuery: 'This café query is not supported.',
    unsupportedCity: 'Café data is not available for this city.',
    searchTooLong: 'Please shorten the café search to 100 characters.',
    storageUnavailable: 'Offline café storage is unavailable.',
    timeout: 'Café refresh timed out.',
    changed: 'Café data changed. Please retry.',
  },
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
    installHelp: 'Install and offline help',
    offlineHelp: 'Offline help',
  },

  pwa: {
    title: 'Install and offline help',
    offlineTitle: 'Offline help',
    intro: 'Save MatchaMap to your home screen and revisit recently viewed café lists when your connection drops.',
    standaloneIntro: 'Revisit recently viewed café lists when your connection drops.',
    installButton: 'Install MatchaMap',
    installStarted: 'Installation started in your browser.',
    installDismissed: 'Installation was dismissed. You can try again if your browser offers the install button.',
    installFailed: 'The install prompt could not open. You can still use MatchaMap in your browser.',
    installed: 'MatchaMap is open as an app.',
    installUnavailable: 'Your browser does not offer an install button here. You can still use MatchaMap in a browser.',
    iosTitle: 'Add to an iPhone Home Screen',
    iosSteps: [
      'Open MatchaMap in Safari.',
      'Tap the page menu, then Share. Some Safari layouts show Share directly at the top or bottom. Choose Add to Home Screen; if it is missing, use Edit Actions to add it.',
      'Turn on Open as Web App if Safari offers it, then tap Add.',
    ],
    appleGuide: 'Apple’s Add to Home Screen instructions',
    offlineTitleSection: 'What works offline',
    offlineStored: 'Recently viewed public café lists and their included details can be available on this device for up to seven days. A first visit to a city or search needs internet, and your browser may remove saved data.',
    offlineLimits: 'Map backgrounds, current hours, photos, events, and directions may need internet. Map tiles are not saved for offline use.',
    clearData: 'Clear offline café data',
    updateAvailable: 'A MatchaMap update is ready.',
    updateAction: 'How to update',
    updateInstructions: 'Save any editor changes, then close every MatchaMap browser tab and app window. Reopen MatchaMap to use the update.',
    dismissUpdate: 'Dismiss update notice',
    clearRetry: 'Choose Retry to load and save café data again.',
    clearDone: 'Saved café data was cleared from this device.',
    clearFailed: 'Saved café data could not be cleared. Please try again.',
    clearing: 'Clearing saved café data…',
    refreshing: 'Refreshing cafés…',
    refreshDone: 'Café data was refreshed. Your browser may save it for offline use.',
    backToList: 'Open café list',
    retry: 'Retry',
    offline: 'Offline',
    lookingForSaved: 'Looking for saved cafés for this city…',
    savedFrom: (date: string) => `Showing saved café data from ${date}.`,
    savedOffline: 'You are offline. Saved data may be outdated.',
    savedRefreshFailed: 'The latest café data could not be loaded. Saved data may be outdated.',
    expired: 'Saved café data for this city has expired.',
    missingOffline: 'No saved café data is available for this city. Connect to the internet to load it.',
    refreshFailed: 'Unable to refresh café data right now.',
    offlineMap: 'Map backgrounds may be unavailable offline. Use the café list for saved places.',
    detailMissing: 'This café is not available offline.',
    detailUnavailable: 'This café could not be loaded right now.',
    detailNotFound: 'This café is not in the current city’s results.',
    emptyCity: 'No cafés are available for this city yet.',
    emptySearch: 'No cafés match this search or these filters.',
  },

  // Map View
  map: {
    directions: 'Directions',
    viewDetails: 'Details',
    viewFullDetails: 'Details',
    getDirections: 'Get Directions',
    backToMap: 'Back to Map',
    enableLocationServices: 'Enable location services',
    findLocation: 'Find my location',
    locationFound: 'Location found',
    drinks: 'Drinks',
    hours: 'Hours',
    today: 'Today',
    follow: 'Follow',
    openNow: 'Open Now',
    closedNow: 'Closed',
    underPrice: (price: number) => `Under $${price}`,
    ratingFilter: (rating: number) => `${rating}+ ★`,
    drinkType: 'Drink Type',
    allDrinks: 'All Drinks',
    clearFilters: 'Clear filters',
    allCities: 'All Cities',
    showRoute: 'Show Route',
    hideRoute: 'Hide Route',
    routeLoading: 'Loading route...',
    routeError: 'Unable to load route',
    walkingTime: (duration: string) => `${duration} walk`,
    walkingDistance: (distance: string) => distance,
    viewInstagramReview: 'View Instagram review',
    viewTikTokReview: 'View TikTok review',
    seeInstagramReel: 'Reel',
    seeTikTokReview: 'TikTok',
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
    searchPlaceholder: 'Search cafes, reviews, tags, or neighborhoods...',
    clearSearch: 'Clear search',
    minimumRating: 'Minimum Rating',
    userMinRating: 'Min User Rating',
    userMaxRating: 'Max User Rating',
    userRatingRange: 'User Rating',
    maxDistance: 'Max Distance',
    maxDistanceRequiresLocation: 'Max Distance (Enable location first)',
    drinkType: 'Drink Type',
    allDrinks: 'All Drinks',
    allCities: 'All Cities',
    availability: 'Availability',
    clearAllFilters: 'Clear All Filters',
    clearFilters: 'Clear filters',
    noResults: 'No cafes match your search or filters',
    tapLocationForDistance: 'Tap location for distance',
    reviewSnippets: 'Matching Reviews',
    fromReview: 'From review',
    walkTime: (distance: string, time: string) => `${distance} • ${time} walk`,
    kmDistance: (km: number) => `${km}km`,
    filterByCity: 'Filter by City',
    citiesSelected: (count: number) => `${count} cities selected`,
    clearAll: 'Clear All',
    viewInstagramReview: 'View Instagram review',
    viewTikTokReview: 'View TikTok review',
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
    ourReviews: 'Our Reviews',
    hours: 'Hours',
    today: 'Today',
    showFullWeek: 'Show full week',
    showLess: 'Show less',
    quickNote: 'Quick Note',
    socialMedia: 'Social Media',
    follow: 'Follow',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    matchaAmount: (grams: number) => `${grams}g matcha`,
    icedMatchaLatte: 'Iced Matcha Latte',
    awayDistance: (distance: string, time: string) => `${distance} away • ${time} walk`,
    scoreOutOf: '/ 10',
    seeInstagramReel: 'Reel',
    seeTikTokReview: 'TikTok',
    closedNow: 'Closed',
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
    visitedOn: (date: string) => `Visited on ${date}`,
    addNote: 'Add Note',
    notes: 'Notes',
    migrationModal: {
      title: 'Sync Your Passport',
      description: 'We found visits saved locally on your device. Would you like to sync them to your account?',
      localVisits: (count: number) => `${count} local visit${count !== 1 ? 's' : ''} found`,
      migrate: 'Sync to Account',
      skip: 'Skip for Now',
      migrating: 'Syncing...',
      success: 'Successfully synced your visits!',
      error: 'Failed to sync visits. Please try again.',
    },
  },


  // Events View
  events: {
    title: 'Events',
    subtitle: 'Toronto matcha community gatherings & workshops',
    noEvents: 'No upcoming events',
    checkBackSoon: 'Check back soon for matcha events!',
    featuredEvent: 'Featured Event',
    viewCafe: 'View Cafe',
    viewDetails: 'View Details',
    goingCount: (count: number) => `${count} matchamappers are going!`,
    eventDetails: 'Event Details',
    date: 'Date',
    time: 'Time',
    venue: 'Venue',
    location: 'Location',
    price: 'Price',
    description: 'Description',
    hostedAt: 'Hosted At',
    viewOnInstagram: 'View on Instagram',
    getDirections: 'Get Directions',
    showPastEvents: 'Show Past Events',
    hidePastEvents: 'Hide Past Events',
    failedToLoadPastEvents: 'Failed to load past events. Please try again.',
    networkError: 'Network error. Please check your connection and try again.',
  },

  // Contact Page
  contact: {
    pageTitle: 'Contact Us',
    pageSubtitle: 'Have a question or want to suggest a cafe?',
    nameLabel: 'Name',
    emailLabel: 'Email',
    subjectLabel: 'Subject',
    messageLabel: 'Message',
    namePlaceholder: 'Your name',
    emailPlaceholder: 'your@email.com',
    messagePlaceholder: 'Tell us more...',
    selectTopic: 'Select a topic...',
    topicCafeSuggestion: 'Suggest a Cafe',
    topicCorrection: 'Report an Error',
    topicGeneral: 'General Inquiry',
    topicPartnership: 'Partnership Opportunity',
    topicFeedback: 'Feedback',
    send: 'Send Message',
    sending: 'Sending...',
    successTitle: 'Message Sent!',
    success: 'Thanks for reaching out. We\'ll get back to you soon.',
    error: 'Failed to send message. Please try again.',
    emailSupportHeading: 'Email',
    emailSupportAddress: 'hello@matchamap.com',
    socialHeading: 'Social',
    socialHandle: '@vivisual.diary',
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

  // Admin (basic strings, admin has more specific copy in components)
  admin: {
    title: 'Admin Dashboard',
    mode: 'Admin Mode',
    cafes: 'Cafes',
    drinks: 'Drinks',
    events: 'Events',
    stats: 'Analytics',
    users: 'Users',
    settings: 'Settings',
    moderation: 'Moderation',

    // Analytics Dashboard
    analytics: {
      title: 'Analytics Dashboard',
      subtitle: 'Partner-actionable metrics and insights',

      // User Activity Section
      userActivity: 'User Activity',
      totalUsers: 'Total Users',
      activeUsers7d: 'Active (7d)',
      activeUsers30d: 'Active (30d)',
      totalCheckins: 'Total Check-ins',
      repeatVisitors: 'Repeat Visitors',

      // Cafe Performance Section
      cafePerformance: 'Cafe Performance',
      totalViews: 'Total Views',
      totalDirections: 'Directions',
      totalAnonymousMarks: 'Anonymous Marks',
      totalAuthCheckins: 'Auth Check-ins',
      totalDemand: 'Total Demand',
      avgCtr: 'Avg CTR',

      // Table Headers
      cafe: 'Cafe',
      city: 'City',
      views: 'Views',
      directions: 'Directions',
      ctr: 'CTR',
      anonymousMarks: 'Anon Marks',
      checkins: 'Check-ins',
      demand: 'Demand',
      social: 'Social',

      // Tooltips
      demandTooltip: 'Anonymous marks + authenticated check-ins',
      ctrTooltip: 'Click-through rate: directions / views',
      /** Accessible label for sortable column header buttons */
      sortTableByColumn: (columnLabel: string) => `Sort by ${columnLabel}`,

      // Loading/Error
      loading: 'Loading analytics...',
      error: 'Failed to load analytics',
      noData: 'No data available yet',
      retry: 'Retry',
    },
    // Error Boundaries
    errorBoundary: {
      title: 'Something went wrong in the admin panel',
      description: "Don't worry - your data is safe. You can try refreshing or go back to continue working.",
      tryAgain: 'Try Again',
      goBack: 'Go Back',
      showDetails: 'Show Technical Details',
      hideDetails: 'Hide Technical Details',
      copyReport: 'Copy Error Report',
      reportIssue: 'Report Issue',
      helpText: 'If this error persists, please copy the error report and contact the development team.',
      componentError: (componentName: string) => `${componentName} Error`,
      componentErrorDescription: 'This component encountered an error and couldn\'t load properly. You can try refreshing this section.',
    },

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
      dailySignups: (count: number) => `${count} signups`,
      last24Hours: 'Past 24h',
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
      
      // Fraud Detection
      showFraudStats: 'Show Fraud Stats',
      hideFraudStats: 'Hide Fraud Stats',
      suspectedFraud: 'Suspected Fraud',
      fraudReasons: 'Fraud Reasons:',
      filterAll: 'All Signups',
      filterClean: 'Clean Only', 
      filterSuspected: 'Suspected Fraud',
      fraudAnalytics: 'Fraud Analytics',
      suspectedFraudCount: (count: number) => `${count} flagged`,
    },

    // Cafe Management
    cafeManagement: {
      missingFieldsTooltip: (count: number) =>
        `${count} optional field${count !== 1 ? 's' : ''} missing`,
      missingFieldsList: (fields: string[]) =>
        `Missing: ${fields.join(', ')}`,
    },

    // User Management (relative date formatting)
    userManagement: {
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

    // Drinks Management
    drinksManagement: {
      setAsDefault: 'Set as Default',
      defaultLabel: 'Default',
      setAsDefaultConfirm: 'Set this drink as the default?',
      setAsDefaultSuccess: 'Default drink updated successfully',
      setAsDefaultError: 'Failed to set as default',
      settingDefault: 'Setting as default...',
    },

    // Event Management
    eventManagement: {
      title: 'Event Management',
      subtitle: 'Create and manage matcha-related events',
      addNewEvent: 'Add New Event',
      editEvent: 'Edit Event',
      createEvent: 'Create Event',
      searchPlaceholder: 'Search events...',
      noEventsFound: 'No events found',
      exportJson: 'Export JSON',
      importJson: 'Import JSON',
      copyToClipboard: 'Copy to Clipboard',
      preview: 'Preview',
      viewDetailsPage: 'View Details Page',
      makeFeatured: 'Make Featured',
      removeFeatured: 'Remove Featured',
      publish: 'Publish',
      unpublish: 'Unpublish',
      deleteEvent: 'Delete Event',
      confirmDelete: 'Are you sure you want to delete this event?',
      confirmMakeFeatured: 'Make this the featured event? This will remove featured status from other events.',
      jsonCopied: 'Event JSON copied to clipboard!',
      jsonExported: 'Event exported as JSON',
      importSuccess: (count: number) => `Successfully imported ${count} event${count !== 1 ? 's' : ''}`,
      importError: 'Failed to import events',
      linkField: 'Link (Instagram Handle or Post URL)',
      linkFieldPlaceholder: '@username or https://instagram.com/p/...',
      selectCafe: 'Link to Cafe (Optional)',
      selectCafePlaceholder: 'Choose a cafe...',
      noCafeLinked: 'No cafe linked',
      moreOptionsAriaLabel: 'More options',
    },
  },
} as const

// Type helper to ensure type safety when accessing COPY
export type CopyKeys = typeof COPY
