import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeedView } from '../FeedView'
import { FeedItem, FeedItemType } from '../../types'

// Mock stores and hooks
const mockDataStore = {
  fetchFeed: vi.fn(),
  feedFetched: false,
  isLoading: false,
}

vi.mock('../../stores/dataStore', () => ({
  useDataStore: () => mockDataStore,
}))

vi.mock('../../hooks/useLazyData', () => ({
  useLazyData: vi.fn(),
}))

// Mock UI components
vi.mock('../ui', () => ({
  ListSkeleton: ({ count }: { count: number }) => (
    <div data-testid="list-skeleton">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} data-testid={`skeleton-item-${i}`}>Loading...</div>
      ))}
    </div>
  ),
}))

// Mock feed items
const mockFeedItems: FeedItem[] = [
  {
    id: 1,
    type: FeedItemType.NEW_LOCATION,
    title: 'New Matcha Spot Opens in Queen West',
    date: '2023-12-15',
    preview: 'A new artisanal matcha cafe has opened its doors in the trendy Queen West district.',
    image: '🍵',
    cafeName: 'Green Tea House',
    neighborhood: 'Queen West',
    published: true,
  },
  {
    id: 2,
    type: FeedItemType.SCORE_UPDATE,
    title: 'Updated Review: Cafe Matcha Express',
    date: '2023-12-10',
    preview: 'We revisited this popular spot and updated our review based on recent changes.',
    image: '⭐',
    score: 8.5,
    previousScore: 7.8,
    cafeName: 'Cafe Matcha Express',
    neighborhood: 'Downtown',
    published: true,
  },
  {
    id: 3,
    type: FeedItemType.ANNOUNCEMENT,
    title: 'Winter Matcha Festival Announced',
    date: '2023-12-05',
    preview: 'Get ready for a celebration of all things matcha this winter season.',
    image: '❄️',
    published: true,
  },
]

describe('FeedView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDataStore.isLoading = false
    mockDataStore.feedFetched = false
  })

  it('should render feed header', () => {
    render(<FeedView feedItems={[]} />)

    expect(screen.getByText("What's New")).toBeInTheDocument()
    expect(screen.getByText('Latest updates from the Toronto matcha scene')).toBeInTheDocument()
  })

  it('should display loading skeleton when loading and no items', () => {
    mockDataStore.isLoading = true
    render(<FeedView feedItems={[]} />)

    expect(screen.getByTestId('list-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-item-0')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-item-1')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-item-2')).toBeInTheDocument()
  })

  it('should display empty state when no feed items', () => {
    render(<FeedView feedItems={[]} />)

    expect(screen.getByText('No news items yet')).toBeInTheDocument()
    expect(screen.getByText('Stay tuned for updates from the matcha scene!')).toBeInTheDocument()
  })

  it('should render feed items when provided', () => {
    render(<FeedView feedItems={mockFeedItems} />)

    expect(screen.getByText('New Matcha Spot Opens in Queen West')).toBeInTheDocument()
    expect(screen.getByText('Updated Review: Cafe Matcha Express')).toBeInTheDocument()
    expect(screen.getByText('Winter Matcha Festival Announced')).toBeInTheDocument()
  })

  it('should display correct feed item types with appropriate styling', () => {
    render(<FeedView feedItems={mockFeedItems} />)

    // New location item
    expect(screen.getByText('New Location')).toBeInTheDocument()
    const newLocationHeader = screen.getByText('New Location').closest('div')
    expect(newLocationHeader).toHaveClass('bg-green-500')

    // Score update item
    expect(screen.getByText('Updated Review')).toBeInTheDocument()
    const scoreUpdateHeader = screen.getByText('Updated Review').closest('div')
    expect(scoreUpdateHeader).toHaveClass('bg-blue-500')

    // Announcement item
    expect(screen.getByText('Announcement')).toBeInTheDocument()
    const announcementHeader = screen.getByText('Announcement').closest('div')
    expect(announcementHeader).toHaveClass('bg-purple-500')
  })

  it('should display feed item images', () => {
    render(<FeedView feedItems={mockFeedItems} />)

    expect(screen.getByText('🍵')).toBeInTheDocument()
    expect(screen.getByText('⭐')).toBeInTheDocument()
    expect(screen.getByText('❄️')).toBeInTheDocument()
  })

  it('should display dates for all feed items', () => {
    render(<FeedView feedItems={mockFeedItems} />)

    expect(screen.getByText('2023-12-15')).toBeInTheDocument()
    expect(screen.getByText('2023-12-10')).toBeInTheDocument()
    expect(screen.getByText('2023-12-05')).toBeInTheDocument()
  })

  it('should display preview text for all items', () => {
    render(<FeedView feedItems={mockFeedItems} />)

    expect(screen.getByText(/A new artisanal matcha cafe has opened/)).toBeInTheDocument()
    expect(screen.getByText(/We revisited this popular spot/)).toBeInTheDocument()
    expect(screen.getByText(/Get ready for a celebration/)).toBeInTheDocument()
  })

  it('should display score and previous score for score update items', () => {
    render(<FeedView feedItems={mockFeedItems} />)

    expect(screen.getByText('8.5')).toBeInTheDocument()
    expect(screen.getByText('(was 7.8)')).toBeInTheDocument()
  })

  it('should display neighborhood information when available', () => {
    render(<FeedView feedItems={mockFeedItems} />)

    expect(screen.getByText('Queen West')).toBeInTheDocument()
    expect(screen.getByText('Downtown')).toBeInTheDocument()
  })

  it('should not display score section for non-score-update items', () => {
    const nonScoreItems = mockFeedItems.filter(item => item.type !== FeedItemType.SCORE_UPDATE)
    render(<FeedView feedItems={nonScoreItems} />)

    expect(screen.queryByText('8.5')).not.toBeInTheDocument()
    expect(screen.queryByText('(was 7.8)')).not.toBeInTheDocument()
  })

  it('should handle feed items without optional fields', () => {
    const minimalFeedItem: FeedItem = {
      id: 4,
      type: FeedItemType.ANNOUNCEMENT,
      title: 'Minimal Announcement',
      date: '2023-12-01',
      preview: 'This is a minimal announcement.',
      published: true,
    }

    render(<FeedView feedItems={[minimalFeedItem]} />)

    expect(screen.getByText('Minimal Announcement')).toBeInTheDocument()
    expect(screen.getByText('This is a minimal announcement.')).toBeInTheDocument()
    expect(screen.getByText('2023-12-01')).toBeInTheDocument()
    // Should not crash when optional fields are missing
  })

  it('should display correct icons for different feed item types', () => {
    render(<FeedView feedItems={mockFeedItems} />)

    // The icons are rendered as SVG elements within the type headers
    const newLocationHeader = screen.getByText('New Location').closest('div')!
    const scoreUpdateHeader = screen.getByText('Updated Review').closest('div')!
    const announcementHeader = screen.getByText('Announcement').closest('div')!

    // Check that SVG icons are present
    expect(newLocationHeader.querySelector('svg')).toBeInTheDocument()
    expect(scoreUpdateHeader.querySelector('svg')).toBeInTheDocument()
    expect(announcementHeader.querySelector('svg')).toBeInTheDocument()
  })

  it('should render feed items as articles for semantic HTML', () => {
    render(<FeedView feedItems={mockFeedItems} />)

    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(3)
  })

  it('should handle feed items with scores but no previous score', () => {
    const scoreOnlyItem: FeedItem = {
      id: 5,
      type: FeedItemType.SCORE_UPDATE,
      title: 'New Review: Test Cafe',
      date: '2023-12-20',
      preview: 'Our first review of this new spot.',
      score: 9.0,
      published: true,
    }

    render(<FeedView feedItems={[scoreOnlyItem]} />)

    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.queryByText(/was/)).not.toBeInTheDocument()
  })

  it('should handle feed items with neighborhood but no score', () => {
    const neighborhoodOnlyItem: FeedItem = {
      id: 6,
      type: FeedItemType.NEW_LOCATION,
      title: 'New Spot in Kensington',
      date: '2023-12-22',
      preview: 'A new cafe opens in Kensington Market.',
      neighborhood: 'Kensington Market',
      published: true,
    }

    render(<FeedView feedItems={[neighborhoodOnlyItem]} />)

    expect(screen.getByText('Kensington Market')).toBeInTheDocument()
    expect(screen.queryByText(/bg-green-500/)).not.toBeInTheDocument() // No score badge
  })

  it('should not show loading skeleton when items are present and loading', () => {
    mockDataStore.isLoading = true
    render(<FeedView feedItems={mockFeedItems} />)

    expect(screen.queryByTestId('list-skeleton')).not.toBeInTheDocument()
    expect(screen.getByText('New Matcha Spot Opens in Queen West')).toBeInTheDocument()
  })

  it('should handle different feed item types correctly', () => {
    const allTypesItems: FeedItem[] = [
      {
        id: 1,
        type: FeedItemType.NEW_LOCATION,
        title: 'New Location',
        date: '2023-12-01',
        preview: 'New location preview',
        published: true,
      },
      {
        id: 2,
        type: FeedItemType.SCORE_UPDATE,
        title: 'Score Update',
        date: '2023-12-02',
        preview: 'Score update preview',
        published: true,
      },
      {
        id: 3,
        type: FeedItemType.ANNOUNCEMENT,
        title: 'Announcement',
        date: '2023-12-03',
        preview: 'Announcement preview',
        published: true,
      },
      {
        id: 4,
        type: FeedItemType.MENU_UPDATE,
        title: 'Menu Update',
        date: '2023-12-04',
        preview: 'Menu update preview',
        published: true,
      },
      {
        id: 5,
        type: FeedItemType.CLOSURE,
        title: 'Closure',
        date: '2023-12-05',
        preview: 'Closure preview',
        published: true,
      },
    ]

    render(<FeedView feedItems={allTypesItems} />)

    // Should render correct type labels
    expect(screen.getByText('New Location')).toBeInTheDocument()
    expect(screen.getByText('Updated Review')).toBeInTheDocument()
    expect(screen.getAllByText('Announcement')).toHaveLength(3) // 3 non-specific types default to announcement
  })

  it('should be accessible with proper heading structure', () => {
    render(<FeedView feedItems={mockFeedItems} />)

    expect(screen.getByRole('heading', { level: 2, name: "What's New" })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'New Matcha Spot Opens in Queen West' })).toBeInTheDocument()
  })

  it('should maintain proper responsive layout classes', () => {
    const { container } = render(<FeedView feedItems={mockFeedItems} />)

    // Check for responsive and layout classes
    expect(container.querySelector('.flex-1.overflow-y-auto')).toBeInTheDocument()
    expect(container.querySelector('.space-y-4')).toBeInTheDocument()
  })
})