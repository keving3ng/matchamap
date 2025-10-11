import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EventsView } from '../EventsView'
import { EventItem } from '../../types'

// Mock stores and hooks
const mockDataStore = {
  fetchEvents: vi.fn(),
  eventsFetched: false,
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

// Mock event items
const mockEventItems: EventItem[] = [
  {
    id: 1,
    title: 'Matcha Tea Ceremony Workshop',
    date: 'December 20, 2023',
    time: '2:00 PM - 4:00 PM',
    location: 'Queen West',
    venue: 'Green Tea House',
    description: 'Learn the traditional art of Japanese tea ceremony with premium matcha.',
    image: '🍵',
    price: '$45',
    featured: true,
    published: true,
  },
  {
    id: 2,
    title: 'Matcha Latte Art Class',
    date: 'December 25, 2023',
    time: '10:00 AM - 12:00 PM',
    location: 'Downtown',
    venue: 'Matcha Central',
    description: 'Master the art of creating beautiful designs in your matcha lattes.',
    image: '🎨',
    price: 'Free',
    featured: false,
    published: true,
  },
  {
    id: 3,
    title: 'New Year Matcha Tasting',
    date: 'January 1, 2024',
    time: '7:00 PM - 9:00 PM',
    location: 'Kensington Market',
    venue: 'Zen Matcha Bar',
    description: 'Ring in the new year with a curated tasting of premium matcha varieties.',
    image: '🎊',
    price: '$60',
    featured: false,
    published: true,
  },
]

describe('EventsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDataStore.isLoading = false
    mockDataStore.eventsFetched = false
  })

  it('should render events header', () => {
    render(<EventsView eventItems={[]} />)

    expect(screen.getByText('Upcoming Events')).toBeInTheDocument()
    expect(screen.getByText('Toronto matcha community gatherings & workshops')).toBeInTheDocument()
  })

  it('should display loading skeleton when loading and no items', () => {
    mockDataStore.isLoading = true
    render(<EventsView eventItems={[]} />)

    expect(screen.getByTestId('list-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-item-0')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-item-1')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-item-2')).toBeInTheDocument()
  })

  it('should display empty state when no events', () => {
    render(<EventsView eventItems={[]} />)

    expect(screen.getByText('No upcoming events')).toBeInTheDocument()
    expect(screen.getByText('Check back soon for matcha community gatherings!')).toBeInTheDocument()
  })

  it('should render event items when provided', () => {
    render(<EventsView eventItems={mockEventItems} />)

    expect(screen.getByText('Matcha Tea Ceremony Workshop')).toBeInTheDocument()
    expect(screen.getByText('Matcha Latte Art Class')).toBeInTheDocument()
    expect(screen.getByText('New Year Matcha Tasting')).toBeInTheDocument()
  })

  it('should display featured event badge for featured events', () => {
    render(<EventsView eventItems={mockEventItems} />)

    expect(screen.getByText('Featured Event')).toBeInTheDocument()
    
    const featuredBadge = screen.getByText('Featured Event').closest('div')
    expect(featuredBadge).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-green-600')
  })

  it('should apply different styling to featured events', () => {
    render(<EventsView eventItems={mockEventItems} />)

    const featuredEvent = screen.getByText('Matcha Tea Ceremony Workshop').closest('article')!
    const regularEvent = screen.getByText('Matcha Latte Art Class').closest('article')!

    expect(featuredEvent).toHaveClass('border-green-400')
    expect(regularEvent).toHaveClass('border-green-100')
  })

  it('should display event images', () => {
    render(<EventsView eventItems={mockEventItems} />)

    expect(screen.getByText('🍵')).toBeInTheDocument()
    expect(screen.getByText('🎨')).toBeInTheDocument()
    expect(screen.getByText('🎊')).toBeInTheDocument()
  })

  it('should display all event details', () => {
    render(<EventsView eventItems={mockEventItems} />)

    // Dates
    expect(screen.getByText('December 20, 2023')).toBeInTheDocument()
    expect(screen.getByText('December 25, 2023')).toBeInTheDocument()
    expect(screen.getByText('January 1, 2024')).toBeInTheDocument()

    // Times
    expect(screen.getByText('2:00 PM - 4:00 PM')).toBeInTheDocument()
    expect(screen.getByText('10:00 AM - 12:00 PM')).toBeInTheDocument()
    expect(screen.getByText('7:00 PM - 9:00 PM')).toBeInTheDocument()

    // Venues and locations
    expect(screen.getByText('Green Tea House, Queen West')).toBeInTheDocument()
    expect(screen.getByText('Matcha Central, Downtown')).toBeInTheDocument()
    expect(screen.getByText('Zen Matcha Bar, Kensington Market')).toBeInTheDocument()

    // Prices
    expect(screen.getByText('$45')).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('$60')).toBeInTheDocument()
  })

  it('should display event descriptions', () => {
    render(<EventsView eventItems={mockEventItems} />)

    expect(screen.getByText(/Learn the traditional art of Japanese tea ceremony/)).toBeInTheDocument()
    expect(screen.getByText(/Master the art of creating beautiful designs/)).toBeInTheDocument()
    expect(screen.getByText(/Ring in the new year with a curated tasting/)).toBeInTheDocument()
  })

  it('should display correct icons for event details', () => {
    render(<EventsView eventItems={mockEventItems} />)

    const eventDetails = screen.getByText('Green Tea House, Queen West').closest('div')!.parentElement!

    // Check that all required icons are present
    const calendarIcon = eventDetails.querySelector('svg')
    expect(calendarIcon).toBeInTheDocument()
  })

  it('should render events as articles for semantic HTML', () => {
    render(<EventsView eventItems={mockEventItems} />)

    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(3)
  })

  it('should handle minimal event data gracefully', () => {
    const minimalEvent: EventItem = {
      id: 4,
      title: 'Minimal Event',
      date: 'TBD',
      time: 'TBD',
      location: 'TBD',
      venue: 'TBD',
      description: 'More details coming soon.',
      image: '📅',
      price: 'TBD',
      featured: false,
    }

    render(<EventsView eventItems={[minimalEvent]} />)

    expect(screen.getByText('Minimal Event')).toBeInTheDocument()
    expect(screen.getByText('More details coming soon.')).toBeInTheDocument()
    expect(screen.getByText('📅')).toBeInTheDocument()
    expect(screen.getAllByText('TBD')).toHaveLength(4) // date, time, location, price
  })

  it('should not show loading skeleton when items are present and loading', () => {
    mockDataStore.isLoading = true
    render(<EventsView eventItems={mockEventItems} />)

    expect(screen.queryByTestId('list-skeleton')).not.toBeInTheDocument()
    expect(screen.getByText('Matcha Tea Ceremony Workshop')).toBeInTheDocument()
  })

  it('should apply different gradient styling to featured event images', () => {
    render(<EventsView eventItems={mockEventItems} />)

    const featuredEventImage = screen.getByText('🍵').closest('div')!
    const regularEventImage = screen.getByText('🎨').closest('div')!

    expect(featuredEventImage).toHaveClass('from-green-500', 'to-green-700')
    expect(regularEventImage).toHaveClass('from-green-400', 'to-green-600')
  })

  it('should be accessible with proper heading structure', () => {
    render(<EventsView eventItems={mockEventItems} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Upcoming Events' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Matcha Tea Ceremony Workshop' })).toBeInTheDocument()
  })

  it('should handle events with special characters in text', () => {
    const eventWithSpecialChars: EventItem = {
      id: 5,
      title: 'Matcha & Meditation',
      date: 'December 30, 2023',
      time: '6:00 PM - 8:00 PM',
      location: 'Chinatown',
      venue: 'Zen Center',
      description: 'Experience mindfulness through matcha preparation & consumption.',
      image: '🧘',
      price: '$25',
      featured: false,
    }

    render(<EventsView eventItems={[eventWithSpecialChars]} />)

    expect(screen.getByText('Matcha & Meditation')).toBeInTheDocument()
    expect(screen.getByText(/mindfulness through matcha preparation & consumption/)).toBeInTheDocument()
  })

  it('should handle very long event descriptions', () => {
    const longDescEvent: EventItem = {
      id: 6,
      title: 'Comprehensive Matcha Course',
      date: 'January 15, 2024',
      time: '9:00 AM - 5:00 PM',
      location: 'Yorkville',
      venue: 'Matcha Academy',
      description: 'This is a very long description that goes on and on about all the amazing things you will learn in this comprehensive matcha course including history, preparation methods, tasting techniques, and much more detailed information about the wonderful world of matcha.',
      image: '📚',
      price: '$150',
      featured: false,
    }

    render(<EventsView eventItems={[longDescEvent]} />)

    expect(screen.getByText('Comprehensive Matcha Course')).toBeInTheDocument()
    expect(screen.getByText(/This is a very long description/)).toBeInTheDocument()
  })

  it('should maintain proper responsive layout classes', () => {
    const { container } = render(<EventsView eventItems={mockEventItems} />)

    expect(container.querySelector('.flex-1.overflow-y-auto')).toBeInTheDocument()
    expect(container.querySelector('.space-y-4')).toBeInTheDocument()
  })

  it('should handle empty string values gracefully', () => {
    const eventWithEmptyStrings: EventItem = {
      id: 7,
      title: 'Event with Empty Fields',
      date: '',
      time: '',
      location: '',
      venue: '',
      description: '',
      image: '❓',
      price: '',
      featured: false,
    }

    render(<EventsView eventItems={[eventWithEmptyStrings]} />)

    expect(screen.getByText('Event with Empty Fields')).toBeInTheDocument()
    expect(screen.getByText('❓')).toBeInTheDocument()
    // Should render without crashing even with empty strings
  })

  it('should not show featured badge for non-featured events', () => {
    const nonFeaturedEvents = mockEventItems.filter(event => !event.featured)
    render(<EventsView eventItems={nonFeaturedEvents} />)

    expect(screen.queryByText('Featured Event')).not.toBeInTheDocument()
  })
})