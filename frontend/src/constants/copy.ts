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
    searchPlaceholder: 'Search cafes, neighborhoods, or keywords...',
    clearSearch: 'Clear search',
    minimumRating: 'Minimum Rating',
    maxDistance: 'Max Distance',
    maxDistanceRequiresLocation: 'Max Distance (Enable location first)',
    drinkType: 'Drink Type',
    allDrinks: 'All Drinks',
    allCities: 'All Cities',
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
    stats: 'Analytics',
    users: 'Users',
    settings: 'Settings',
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
    },

    // Cafe Management
    cafeManagement: {
      missingFieldsTooltip: (count: number) =>
        `${count} optional field${count !== 1 ? 's' : ''} missing`,
      missingFieldsList: (fields: string[]) =>
        `Missing: ${fields.join(', ')}`,
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
      viewDetails: 'Details',
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

  // Reviews & Rating (Phase 2B)
  reviews: {
    writeReview: 'Write a Review',
    overallRating: 'Overall Rating',
    overallRatingRequired: 'Overall Rating *',
    aspectRatings: 'Detailed Ratings (Optional)',
    matchaQuality: 'Matcha Quality',
    ambiance: 'Ambiance',
    service: 'Service',
    value: 'Value',
    title: 'Review Title',
    titlePlaceholder: 'Sum up your experience...',
    yourReview: 'Your Review',
    contentPlaceholder: 'Share your experience with the matcha, ambiance, service, and overall visit...',
    tags: 'Tags',
    visitDate: 'Visit Date',
    addPhotos: 'Add Photos',
    photosOptional: 'Photos (Optional)',
    makePublic: 'Make this review public',
    submitReview: 'Submit Review',
    submitting: 'Submitting...',
    charCount: (current: number, max: number) => `${current}/${max} characters`,
    minCharacters: (min: number) => `Minimum ${min} characters`,
    maxPhotos: (max: number) => `Up to ${max} photos`,
    photoUploadProgress: (current: number, total: number) => `Uploading photo ${current} of ${total}...`,
    removePhoto: 'Remove photo',
    ratingRequired: 'Please select an overall rating',
    contentTooShort: (min: number) => `Review must be at least ${min} characters`,
    contentTooLong: (max: number) => `Review must be no more than ${max} characters`,
    submitSuccess: 'Review submitted successfully!',
    submitSuccessMessage: 'Thank you for sharing your experience!',
    submitError: 'Failed to submit review. Please try again.',
    photoUploadError: 'Failed to upload photos. Please try again.',
    
    // Aggregated Ratings & Display
    expertScore: 'Expert Score',
    userScore: 'User Score',
    communityRating: 'Community Rating',
    basedOnReviews: (count: number) => `Based on ${count} review${count === 1 ? '' : 's'}`,
    noReviews: 'No reviews yet',
    
    // Review List
    sortBy: 'Sort by',
    sortRecent: 'Most Recent',
    sortRating: 'Highest Rating',
    sortHelpful: 'Most Helpful',
    filterBy: 'Filter by Rating',
    allRatings: 'All Ratings',
    ratingRange: (min: number, max: number) => `${min}-${max} stars`,
    loadMore: 'Load More Reviews',
    noReviewsFound: 'No reviews found',
    
    // Review Card
    helpful: 'Helpful',
    markHelpful: 'Mark as helpful',
    visitedOn: 'Visited on',
    ago: (time: string) => `${time} ago`,
    viewProfile: 'View profile',
    showPhotos: 'Show photos',
    hidePhotos: 'Hide photos',
    featuredReview: 'Featured Review',

    // Error States
    loadError: 'Failed to load reviews',
    tryAgain: 'Please try again',
    retry: 'Retry',
  },

  // Photos & Gallery (Phase 2C)
  photos: {
    title: 'Photos',
    noPhotos: 'No photos yet',
    beFirst: 'Be the first to share a photo!',
    showMore: (count: number) => `Show ${count} more photo${count !== 1 ? 's' : ''}`,
    lightbox: {
      close: 'Close photo',
      previous: 'Previous photo',
      next: 'Next photo',
      viewFullSize: 'View full size',
      caption: 'Photo caption',
      uploadedBy: 'Uploaded by',
      uploadedOn: 'Uploaded on',
      downloadOriginal: 'Download original',
    },
    upload: {
      title: 'Upload Photo',
      selectFile: 'Select Photo',
      dragDrop: 'Drag and drop a photo here, or click to select',
      fileTypes: 'JPEG, PNG, or WebP (max 5MB)',
      caption: 'Caption (optional)',
      captionPlaceholder: 'Describe your photo...',
      uploading: 'Uploading...',
      success: 'Photo uploaded successfully!',
      pending: 'Your photo is pending moderation and will appear soon.',
      error: 'Failed to upload photo',
      submit: 'Upload Photo',
      cancel: 'Cancel',
      invalidFileType: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      fileTooLarge: 'File too large. Maximum size is 5MB.',
      emptyFile: 'File is empty. Please select a valid image.',
    },
    myPhotos: {
      title: 'My Photos',
      noPhotos: 'You haven\'t uploaded any photos yet.',
      startVisiting: 'Start by visiting a cafe and sharing your experience!',
      status: {
        pending: 'Pending Review',
        approved: 'Approved',
        rejected: 'Rejected',
      },
      delete: 'Delete Photo',
      confirmDelete: 'Are you sure you want to delete this photo?',
      deleteSuccess: 'Photo deleted successfully',
      deleteError: 'Failed to delete photo',
    },
    moderation: {
      title: 'Photo Moderation',
      queue: 'Moderation Queue',
      noPending: 'No photos pending moderation',
      allReviewed: 'All photos have been reviewed. New uploads will appear here.',
      approve: 'Approve',
      reject: 'Reject',
      notes: 'Notes (optional)',
      notesPlaceholder: 'Add notes about your decision...',
      approveSuccess: 'Photo approved',
      rejectSuccess: 'Photo rejected',
      moderationError: 'Failed to moderate photo',
      uploadedBy: 'Uploaded by',
      uploadedOn: 'on',
      cafe: 'Cafe',
      fileSize: 'File size',
      dimensions: 'Dimensions',
    },
  },
} as const

// Type helper to ensure type safety when accessing COPY
export type CopyKeys = typeof COPY
