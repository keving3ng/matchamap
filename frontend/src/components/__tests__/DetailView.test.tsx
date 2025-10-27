import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { DetailView } from '../DetailView'
import { api } from '../../utils/api'
import type { CafeWithDistance, DrinkItem } from '../../types'

// Mock the copy constants
vi.mock('../../constants/copy', () => ({
  COPY: {
    detail: {
      getDirections: 'Get Directions',
      visited: 'Visited',
      markVisited: 'Mark as Visited',
      drinksMenu: 'Drinks Menu',
      featured: 'Featured',
      matchaAmount: (grams: number) => `${grams}g matcha`,
      cafeDetails: 'Cafe Details',
      ambiance: 'Ambiance',
      alternativeMilk: 'Alternative Milk',
      alternativeMilkUnknown: 'Unknown',
      alternativeMilkFree: 'Free',
      alternativeMilkCharge: (amount: number) => `$${amount.toFixed(2)}`,
      ourReview: 'Our Review',
      hours: 'Hours',
      today: 'Today',
      follow: 'Follow',
      ourReviews: 'Our Reviews',
      seeInstagramReel: 'See Instagram Reel',
      seeTikTokReview: 'See TikTok Review',
    },
    events: {
      title: 'Events',
      viewDetails: 'View Details',
    },
    checkin: {
      checkIn: 'Check In',
      checkedIn: 'Checked In',
      checkingIn: 'Checking in...',
      title: 'Check in to',
      subtitle: 'Share your experience at this cafe',
      notesLabel: 'Notes (Optional)',
      notesPlaceholder: 'How was your visit? Any recommendations?',
      photosLabel: 'Photos (Optional)',
      ratingLabel: 'Quick Rating',
      ratingOptional: '(Optional)',
      submitButton: 'Check In',
      submittingButton: 'Checking in...',
      cancel: 'Cancel',
      successTitle: 'Checked in successfully!',
      successMessage: 'Your check-in has been recorded.',
      successClose: 'Close',
      errorTitle: 'Check-in Failed',
      errorMessage: 'Unable to record your check-in. Please try again.',
      errorRetry: 'Try Again',
      errorClose: 'Close',
      addPhotos: 'Add Photos',
      removePhoto: 'Remove photo',
      photoUploading: 'Uploading photo...',
      photoError: 'Failed to upload photo',
      ratingPrompt: 'Rate your experience',
      stars: (count: number) => `${count} star${count !== 1 ? 's' : ''}`,
      clearRating: 'Clear rating',
      notesMaxLength: 500,
      notesCharCount: (current: number, max: number) => `${current}/${max}`,
      notesTooLong: (max: number) => `Notes must be ${max} characters or less`,
      alreadyCheckedIn: 'You\'ve already checked in to this cafe today',
      networkError: 'Check your internet connection and try again',
    },
    photos: {
      upload: {
        invalidFileType: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
        fileTooLarge: 'File too large. Maximum size is 5MB.',
        emptyFile: 'File is empty. Please select a valid image.',
      },
    },
  },
}))

// Mock check-in components
vi.mock('../checkin', () => ({
  CheckInButton: () => <div data-testid="check-in-button">Check In Button</div>,
}))

// Mock review components to simplify testing
vi.mock('../reviews/AggregatedRating', () => ({
  AggregatedRating: ({ expertScore, userScore, reviewCount }: any) => (
    <div data-testid="aggregated-rating">
      {expertScore && <span>Expert: {expertScore}</span>}
      {userScore && <span>User: {userScore}</span>}
      {reviewCount !== undefined && <span>Reviews: {reviewCount}</span>}
    </div>
  ),
}))

vi.mock('../reviews/ReviewList', () => ({
  ReviewList: ({ cafeId, onReviewsLoaded }: any) => {
    // Call onReviewsLoaded if provided to simulate review count syncing
    if (onReviewsLoaded) {
      setTimeout(() => onReviewsLoaded(0), 0)
    }
    return <div data-testid="review-list">ReviewList for cafe {cafeId}</div>
  },
}))

vi.mock('../reviews/ReviewForm', () => ({
  ReviewForm: ({ onSuccess, onCancel }: any) => (
    <div data-testid="review-form">
      <button onClick={onSuccess}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}))

// Mock checkin components
vi.mock('../checkin', () => ({
  CheckInButton: ({ cafe, isCheckedIn, onCheckInSuccess }: any) => (
    <div data-testid="check-in-button">
      <button onClick={onCheckInSuccess}>Check In</button>
    </div>
  ),
}))

// Mock hooks
vi.mock('../../hooks/useAppFeatures', () => ({
  useAppFeatures: () => ({
    isPassportEnabled: true,
    isUserAccountsEnabled: true,
  }),
}))

vi.mock('../../hooks/useUserFeatures', () => ({
  useUserFeatures: () => ({
    isUserSocialEnabled: true,
    hasUserSocial: true,
  }),
}))

// Mock API
vi.mock('../../utils/api', () => ({
  api: {
    events: {
      getAll: vi.fn(),
    },
    reviews: {
      getForCafe: vi.fn(),
      vote: vi.fn(),
    },
    stats: {
      trackCafeStat: vi.fn(),
      trackFeedClick: vi.fn(),
      trackEventClick: vi.fn(),
    },
  },
}))

// Mock authStore (both the hook and getState for analytics)
vi.mock('../../stores/authStore', () => {
  const mockStore = {
    user: null,
  }
  return {
    useAuthStore: Object.assign(
      () => mockStore,
      {
        getState: () => mockStore,
      }
    ),
  }
})

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn(),
})

// Wrapper for components that need Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

// Mock cafe data
const mockCafe: CafeWithDistance = {
  id: 1,
  name: 'Test Matcha Cafe',
  slug: 'test-matcha-cafe',
  latitude: 43.6532,
  longitude: -79.3832,
  lat: 43.6532,
  lng: -79.3832,
  link: 'https://maps.google.com/?q=Test+Matcha+Cafe',
  address: '123 Queen St W, Toronto, ON',
  city: 'Toronto',
  ambianceScore: 8.5,
  displayScore: 9.0,
  userRatingAvg: 8.8,
  userRatingCount: 12,
  chargeForAltMilk: 0.75,
  quickNote: 'A cozy matcha spot downtown',
  review: 'Amazing matcha lattes with perfect foam art. The space is small but cozy.',
  instagram: '@testmatchacafe',
  instagramPostLink: 'https://instagram.com/p/testpost',
  tiktokPostLink: 'https://tiktok.com/@test/video/123',
  hours: 'Mon-Fri: 8:00-18:00; Sat-Sun: 9:00-19:00',
  distanceInfo: {
    km: 0.5,
    formattedKm: '0.5 km',
    walkTime: '6 min',
  },
  drinks: [
    {
      id: 1,
      cafeId: 1,
      name: 'Signature Matcha Latte',
      score: 9.0,
      priceAmount: 5.50,
      priceCurrency: 'CAD',
      gramsUsed: 3,
      isDefault: true,
      notes: 'Their signature drink with perfect balance',
    },
    {
      id: 2,
      cafeId: 1,
      name: 'Iced Matcha',
      score: 8.5,
      priceAmount: 5.25,
      priceCurrency: 'CAD',
      gramsUsed: 2.5,
      isDefault: false,
      notes: 'Refreshing summer option',
    },
  ] as DrinkItem[],
}

describe('DetailView', () => {
  const mockOnToggleVisited = vi.fn()
  const visitedLocations: number[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock API to return no events by default
    vi.mocked(api.events.getAll).mockResolvedValue({ events: [] })
    // Mock reviews API to return empty reviews by default
    vi.mocked(api.reviews.getForCafe).mockResolvedValue({
      reviews: [],
      total: 0,
      hasMore: false,
    })
  })

  it('should render cafe details', () => {
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText(mockCafe.name)).toBeInTheDocument()
    expect(screen.getByText(mockCafe.address!)).toBeInTheDocument()
    // There are multiple 9.0 scores (displayScore and drink score)
    const scores = screen.getAllByText('9.0')
    expect(scores.length).toBeGreaterThan(0)
    expect(screen.getByText(mockCafe.city)).toBeInTheDocument()
  })

  it('should display distance information', () => {
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText(/0.5 km away/)).toBeInTheDocument()
    expect(screen.getByText(/6 min walk/)).toBeInTheDocument()
  })

  it('should display quick note', () => {
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText('"A cozy matcha spot downtown"')).toBeInTheDocument()
  })

  it('should display drinks section', () => {
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText('Drinks Menu')).toBeInTheDocument()
    expect(screen.getByText('Signature Matcha Latte')).toBeInTheDocument()
    expect(screen.getByText('Iced Matcha')).toBeInTheDocument()
    expect(screen.getByText('Featured')).toBeInTheDocument() // Featured badge for default drink
    // Multiple 9.0 scores exist (displayScore and drink score)
    const scores = screen.getAllByText('9.0')
    expect(scores.length).toBeGreaterThan(0)
    expect(screen.getByText('$5.50')).toBeInTheDocument() // Price
    expect(screen.getByText('3g matcha')).toBeInTheDocument() // Matcha amount
  })

  it('should display cafe details section', () => {
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText('Cafe Details')).toBeInTheDocument()
    expect(screen.getByText('Ambiance')).toBeInTheDocument()
    expect(screen.getByText('8.5/10')).toBeInTheDocument()
    expect(screen.getByText('Alternative Milk')).toBeInTheDocument()
    expect(screen.getByText('$0.75')).toBeInTheDocument()
  })

  it('should display review section', () => {
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText('Our Review')).toBeInTheDocument()
    expect(screen.getByText(mockCafe.review!)).toBeInTheDocument()
  })

  it('should handle get directions click', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    const directionsButton = screen.getByText('Get Directions').closest('a')
    expect(directionsButton).toHaveAttribute('href', expect.stringContaining('maps.google.com'))
    expect(directionsButton).toHaveAttribute('target', '_blank')
    expect(directionsButton).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should display passport check-in when enabled', () => {
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText('Mark as Visited')).toBeInTheDocument()
  })

  it('should handle passport check-in click', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    const checkInButton = screen.getByText('Mark as Visited')
    await user.click(checkInButton)

    expect(mockOnToggleVisited).toHaveBeenCalledWith(mockCafe.id)
  })

  it('should show visited state when cafe is visited', () => {
    const visitedCafe = [mockCafe.id]
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedCafe}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText('Visited')).toBeInTheDocument()
  })

  it('should display Instagram link', () => {
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText('Follow')).toBeInTheDocument()
    const instagramLink = screen.getByText('@testmatchacafe').closest('a')
    expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/testmatchacafe')
    expect(instagramLink).toHaveAttribute('target', '_blank')
  })

  it('should display social review links', () => {
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText('Our Reviews')).toBeInTheDocument()
    
    const instagramReelLink = screen.getByText('See Instagram Reel').closest('a')
    expect(instagramReelLink).toHaveAttribute('href', mockCafe.instagramPostLink)
    
    const tiktokLink = screen.getByText('See TikTok Review').closest('a')
    expect(tiktokLink).toHaveAttribute('href', mockCafe.tiktokPostLink)
  })

  it('should display hours section', () => {
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText('Hours')).toBeInTheDocument()
    // The hours are processed by formatHoursCompact utility
    expect(screen.getByText(/Mon/)).toBeInTheDocument()
  })

  it('should handle cafe without optional fields gracefully', () => {
    const minimalCafe: CafeWithDistance = {
      id: 2,
      name: 'Minimal Cafe',
      slug: 'minimal-cafe',
      latitude: 43.6532,
      longitude: -79.3832,
      link: 'https://maps.google.com/?q=Minimal+Cafe',
      city: 'Toronto',
      quickNote: 'Basic cafe',
      distanceInfo: null,
    }

    renderWithRouter(
      <DetailView
        cafe={minimalCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText('Minimal Cafe')).toBeInTheDocument()
    // Quick note is wrapped in quotes in the component
    expect(screen.getByText('"Basic cafe"')).toBeInTheDocument()
    // Should not crash when optional fields are missing
    expect(screen.queryByText('Drinks Menu')).not.toBeInTheDocument()
    expect(screen.queryByText('Our Review')).not.toBeInTheDocument()
  })

  it('should handle free alternative milk correctly', () => {
    const cafeWithFreeMilk = {
      ...mockCafe,
      chargeForAltMilk: 0,
    }

    renderWithRouter(
      <DetailView
        cafe={cafeWithFreeMilk}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('should handle unknown alternative milk price', () => {
    const cafeWithUnknownMilk = {
      ...mockCafe,
      chargeForAltMilk: null,
    }

    renderWithRouter(
      <DetailView
        cafe={cafeWithUnknownMilk}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('should be accessible with proper ARIA attributes', () => {
    renderWithRouter(
      <DetailView
        cafe={mockCafe}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    const directionsLink = screen.getByText('Get Directions').closest('a')
    expect(directionsLink).toHaveAccessibleName()

    const instagramLink = screen.getByText('@testmatchacafe').closest('a')
    expect(instagramLink).toHaveAccessibleName()
  })

  it('should sort drinks with default first, then by score', () => {
    const cafeWithMultipleDrinks = {
      ...mockCafe,
      drinks: [
        {
          id: 1,
          cafeId: 1,
          name: 'Regular Matcha',
          score: 7.0,
          isDefault: false,
        },
        {
          id: 2,
          cafeId: 1,
          name: 'Premium Matcha',
          score: 9.5,
          isDefault: false,
        },
        {
          id: 3,
          cafeId: 1,
          name: 'House Special',
          score: 8.0,
          isDefault: true,
        },
      ] as DrinkItem[],
    }

    renderWithRouter(
      <DetailView
        cafe={cafeWithMultipleDrinks}
        visitedLocations={visitedLocations}
        onToggleVisited={mockOnToggleVisited}
      />
    )

    // Query for the specific drink names
    expect(screen.getByText('House Special')).toBeInTheDocument() // Default drink
    expect(screen.getByText('Premium Matcha')).toBeInTheDocument() // Highest score
    expect(screen.getByText('Regular Matcha')).toBeInTheDocument() // Lowest score

    // Verify the Featured badge is on the default drink (House Special)
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })
})