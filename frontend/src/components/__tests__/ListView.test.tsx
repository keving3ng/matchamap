import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ListView } from '../ListView'
import type { CafeWithDistance } from '../../types'

const mockCafes: CafeWithDistance[] = [
  {
    id: 1,
    name: 'Matcha Cafe A',
    slug: 'matcha-cafe-a',
    displayScore: 8.5,
    latitude: 43.65,
    longitude: -79.38,
    link: 'https://maps.google.com',
    address: '123 Main St',
    quickNote: 'Great matcha',
    city: 'toronto',
    distanceInfo: {
      kilometers: 2.5,
      miles: 1.55,
      formattedKm: '2.5 km',
      formattedMiles: '1.6 miles',
      walkTime: '30 min',
    },
  },
  {
    id: 2,
    name: 'Matcha Cafe B',
    slug: 'matcha-cafe-b',
    displayScore: 9.2,
    latitude: 43.66,
    longitude: -79.39,
    link: 'https://maps.google.com',
    address: '456 Queen St',
    quickNote: 'Amazing quality',
    city: 'toronto',
    distanceInfo: {
      kilometers: 1.2,
      miles: 0.75,
      formattedKm: '1.2 km',
      formattedMiles: '0.7 miles',
      walkTime: '15 min',
    },
  },
  {
    id: 3,
    name: 'Matcha Cafe C',
    slug: 'matcha-cafe-c',
    displayScore: 7.8,
    latitude: 43.67,
    longitude: -79.40,
    link: 'https://maps.google.com',
    address: '789 King St',
    quickNote: 'Good spot',
    city: 'toronto',
    distanceInfo: null,
  },
]

describe('ListView', () => {
  const mockOnToggleExpand = vi.fn()
  const mockOnViewDetails = vi.fn()

  it('renders all cafes', () => {
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={mockOnToggleExpand}
        onViewDetails={mockOnViewDetails}
      />
    )

    expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
    expect(screen.getByText('Matcha Cafe B')).toBeInTheDocument()
    expect(screen.getByText('Matcha Cafe C')).toBeInTheDocument()
  })

  it('renders all three sort buttons', () => {
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={mockOnToggleExpand}
        onViewDetails={mockOnViewDetails}
      />
    )

    expect(screen.getByRole('button', { name: 'Rating' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Distance' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Area' })).toBeInTheDocument()
  })

  it('defaults to rating sort (highest first)', () => {
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={mockOnToggleExpand}
        onViewDetails={mockOnViewDetails}
      />
    )

    const cafeCards = screen.getAllByRole('button').filter(btn => btn.className.includes('w-full'))
    // First card should be Cafe B (score 9.2)
    expect(cafeCards[0]).toHaveTextContent('Matcha Cafe B')
    expect(cafeCards[0]).toHaveTextContent('9.2')
  })

  it('sorts by distance when distance button is clicked', () => {
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={mockOnToggleExpand}
        onViewDetails={mockOnViewDetails}
      />
    )

    const distanceButton = screen.getByRole('button', { name: 'Distance' })
    fireEvent.click(distanceButton)

    const cafeCards = screen.getAllByRole('button').filter(btn => btn.className.includes('w-full'))
    // First card should be Cafe B (1.2 km)
    expect(cafeCards[0]).toHaveTextContent('Matcha Cafe B')
    expect(cafeCards[0]).toHaveTextContent('1.2 km')
  })

  it('sorts by area alphabetically when area button is clicked', () => {
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={mockOnToggleExpand}
        onViewDetails={mockOnViewDetails}
      />
    )

    const areaButton = screen.getByRole('button', { name: 'Area' })
    fireEvent.click(areaButton)

    const cafeCards = screen.getAllByRole('button').filter(btn => btn.className.includes('w-full'))
    // First card should be Cafe B (Annex comes first alphabetically)
    expect(cafeCards[0]).toHaveTextContent('Annex')
  })

  it('highlights the active sort button', () => {
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={mockOnToggleExpand}
        onViewDetails={mockOnViewDetails}
      />
    )

    const ratingButton = screen.getByRole('button', { name: 'Rating' })
    expect(ratingButton).toHaveClass('bg-green-600')

    const distanceButton = screen.getByRole('button', { name: 'Distance' })
    fireEvent.click(distanceButton)

    expect(distanceButton).toHaveClass('bg-green-600')
    expect(ratingButton).not.toHaveClass('bg-green-600')
  })

  it('expands a cafe card when clicked', () => {
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={mockOnToggleExpand}
        onViewDetails={mockOnViewDetails}
      />
    )

    const cafeCards = screen.getAllByRole('button').filter(btn => btn.className.includes('w-full'))
    fireEvent.click(cafeCards[0])

    expect(mockOnToggleExpand).toHaveBeenCalled()
  })

  it('shows distance info when available', () => {
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={mockOnToggleExpand}
        onViewDetails={mockOnViewDetails}
      />
    )

    expect(screen.getByText('2.5 km')).toBeInTheDocument()
    expect(screen.getByText('1.2 km')).toBeInTheDocument()
  })

  it('shows message for cafes without distance info', () => {
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={mockOnToggleExpand}
        onViewDetails={mockOnViewDetails}
      />
    )

    expect(screen.getByText('Tap location button for distance')).toBeInTheDocument()
  })

  it('places cafes without distance at the end when sorting by distance', () => {
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={mockOnToggleExpand}
        onViewDetails={mockOnViewDetails}
      />
    )

    const distanceButton = screen.getByRole('button', { name: 'Distance' })
    fireEvent.click(distanceButton)

    const cafeCards = screen.getAllByRole('button').filter(btn => btn.className.includes('w-full'))
    // Last card should be Cafe C (no distance info)
    expect(cafeCards[cafeCards.length - 1]).toHaveTextContent('Matcha Cafe C')
  })

  describe('Filtering', () => {
    it('shows filter button', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument()
    })

    it('toggles filter panel when filter button is clicked', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      const filterButton = screen.getByRole('button', { name: /filter/i })

      // Filter panel should not be visible initially
      expect(screen.queryByText('Price Range')).not.toBeInTheDocument()

      // Click to show filters
      fireEvent.click(filterButton)
      expect(screen.getByText('Price Range')).toBeInTheDocument()
      expect(screen.getByText('Minimum Rating')).toBeInTheDocument()
      expect(screen.getByText('Neighborhood')).toBeInTheDocument()
    })

    it('filters cafes by price range', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      // Click on $ price filter
      const dollarButton = screen.getByRole('button', { name: '$' })
      fireEvent.click(dollarButton)

      // Should only show cafes with $ price (A and C)
      expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe B')).not.toBeInTheDocument()
      expect(screen.getByText('Matcha Cafe C')).toBeInTheDocument()
    })

    it('filters cafes by minimum rating', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      // Click on 9+ rating filter
      const ratingButton = screen.getByRole('button', { name: '9+' })
      fireEvent.click(ratingButton)

      // Should only show cafe with rating >= 9 (B)
      expect(screen.queryByText('Matcha Cafe A')).not.toBeInTheDocument()
      expect(screen.getByText('Matcha Cafe B')).toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe C')).not.toBeInTheDocument()
    })

    it('filters cafes by neighborhood', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      // Click on Downtown neighborhood filter
      const downtownButton = screen.getByRole('button', { name: 'Downtown' })
      fireEvent.click(downtownButton)

      // Should only show Downtown cafe (A)
      expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe B')).not.toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe C')).not.toBeInTheDocument()
    })

    it('combines multiple filters', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      // Apply both price and rating filters
      const dollarButton = screen.getByRole('button', { name: '$' })
      fireEvent.click(dollarButton)

      const rating8Button = screen.getByRole('button', { name: '8+' })
      fireEvent.click(rating8Button)

      // Should only show cafe A ($ and >= 8 rating)
      expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe B')).not.toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe C')).not.toBeInTheDocument()
    })

    it('shows "no cafes" message when filters match nothing', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      // Apply conflicting filters ($ price and 9+ rating)
      const dollarButton = screen.getByRole('button', { name: '$' })
      fireEvent.click(dollarButton)

      const rating9Button = screen.getByRole('button', { name: '9+' })
      fireEvent.click(rating9Button)

      // Should show empty state
      expect(screen.getByText('No cafes match your filters')).toBeInTheDocument()
    })

    it('clears all filters when clear button is clicked', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      // Apply a filter
      const dollarButton = screen.getByRole('button', { name: '$' })
      fireEvent.click(dollarButton)

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear all filters/i })
      fireEvent.click(clearButton)

      // All cafes should be visible again
      expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      expect(screen.getByText('Matcha Cafe B')).toBeInTheDocument()
      expect(screen.getByText('Matcha Cafe C')).toBeInTheDocument()
    })

    it('shows red indicator badge when filters are active but panel is closed', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      // Apply a filter
      const dollarButton = screen.getByRole('button', { name: '$' })
      fireEvent.click(dollarButton)

      // Close filter panel
      fireEvent.click(filterButton)

      // Filter button should be highlighted since filters are active
      expect(filterButton).toHaveClass('bg-green-600')
    })
  })

  describe('Search', () => {
    it('shows search toggle button', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
    })

    it('toggles search bar when search button is clicked', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      const searchButton = screen.getByRole('button', { name: /search/i })

      // Search input should not be visible initially
      expect(screen.queryByPlaceholderText(/search cafes/i)).not.toBeInTheDocument()

      // Click to show search
      fireEvent.click(searchButton)
      expect(screen.getByPlaceholderText(/search cafes/i)).toBeInTheDocument()

      // Click to hide search
      fireEvent.click(searchButton)
      expect(screen.queryByPlaceholderText(/search cafes/i)).not.toBeInTheDocument()
    })

    it('filters cafes by name search', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      // Open search
      const searchButton = screen.getByRole('button', { name: /search/i })
      fireEvent.click(searchButton)

      const searchInput = screen.getByPlaceholderText(/search cafes/i)
      fireEvent.change(searchInput, { target: { value: 'Cafe A' } })

      // Should only show Cafe A
      expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe B')).not.toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe C')).not.toBeInTheDocument()
    })

    it('filters cafes by neighborhood search', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      // Open search
      fireEvent.click(screen.getByRole('button', { name: /search/i }))

      const searchInput = screen.getByPlaceholderText(/search cafes/i)
      fireEvent.change(searchInput, { target: { value: 'Downtown' } })

      // Should only show Downtown cafe
      expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe B')).not.toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe C')).not.toBeInTheDocument()
    })

    it('filters cafes by keyword in quick note', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      // Open search
      fireEvent.click(screen.getByRole('button', { name: /search/i }))

      const searchInput = screen.getByPlaceholderText(/search cafes/i)
      fireEvent.change(searchInput, { target: { value: 'Amazing' } })

      // Should only show Cafe B with "Amazing quality" in quick note
      expect(screen.queryByText('Matcha Cafe A')).not.toBeInTheDocument()
      expect(screen.getByText('Matcha Cafe B')).toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe C')).not.toBeInTheDocument()
    })

    it('search is case-insensitive', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      // Open search
      fireEvent.click(screen.getByRole('button', { name: /search/i }))

      const searchInput = screen.getByPlaceholderText(/search cafes/i)
      fireEvent.change(searchInput, { target: { value: 'DOWNTOWN' } })

      // Should still find cafe with lowercase neighborhood
      expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
    })

    it('shows clear button when search is active', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      // Open search
      fireEvent.click(screen.getByRole('button', { name: /search/i }))

      const searchInput = screen.getByPlaceholderText(/search cafes/i)

      // No clear button initially
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()

      // Type in search
      fireEvent.change(searchInput, { target: { value: 'test' } })

      // Clear button should appear
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
    })

    it('clears search when clear button is clicked', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      // Open search
      fireEvent.click(screen.getByRole('button', { name: /search/i }))

      const searchInput = screen.getByPlaceholderText(/search cafes/i) as HTMLInputElement
      fireEvent.change(searchInput, { target: { value: 'Downtown' } })

      // Only one cafe shown
      expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe B')).not.toBeInTheDocument()

      // Click clear button
      const clearButton = screen.getByLabelText('Clear search')
      fireEvent.click(clearButton)

      // Search should be cleared
      expect(searchInput.value).toBe('')

      // All cafes should be visible
      expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      expect(screen.getByText('Matcha Cafe B')).toBeInTheDocument()
      expect(screen.getByText('Matcha Cafe C')).toBeInTheDocument()
    })

    it('search works with filters', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      // Open search
      fireEvent.click(screen.getByRole('button', { name: /search/i }))

      // Apply search
      const searchInput = screen.getByPlaceholderText(/search cafes/i)
      fireEvent.change(searchInput, { target: { value: 'Cafe' } })

      // All cafes match "Cafe" in their names
      expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      expect(screen.getByText('Matcha Cafe B')).toBeInTheDocument()
      expect(screen.getByText('Matcha Cafe C')).toBeInTheDocument()

      // Now apply price filter
      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const dollarButton = screen.getByRole('button', { name: '$' })
      fireEvent.click(dollarButton)

      // Should show only $ cafes that match search (A and C)
      expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      expect(screen.queryByText('Matcha Cafe B')).not.toBeInTheDocument()
      expect(screen.getByText('Matcha Cafe C')).toBeInTheDocument()
    })

    it('shows no results message when search matches nothing', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      // Open search
      fireEvent.click(screen.getByRole('button', { name: /search/i }))

      const searchInput = screen.getByPlaceholderText(/search cafes/i)
      fireEvent.change(searchInput, { target: { value: 'NonexistentCafe123' } })

      expect(screen.getByText('No cafes match your filters')).toBeInTheDocument()
    })

    it('real-time search updates as user types', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      // Open search
      fireEvent.click(screen.getByRole('button', { name: /search/i }))

      const searchInput = screen.getByPlaceholderText(/search cafes/i)

      // Type 'A'
      fireEvent.change(searchInput, { target: { value: 'A' } })
      expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()

      // Type more to narrow down
      fireEvent.change(searchInput, { target: { value: 'Annex' } })
      expect(screen.queryByText('Matcha Cafe A')).not.toBeInTheDocument()
      expect(screen.getByText('Matcha Cafe B')).toBeInTheDocument()
    })

    it('shows indicator badge when search is active but collapsed', () => {
      render(
        <ListView
          cafes={mockCafes}
          expandedCard={null}
          onToggleExpand={mockOnToggleExpand}
          onViewDetails={mockOnViewDetails}
        />
      )

      const searchButton = screen.getByRole('button', { name: /search/i })

      // Open search
      fireEvent.click(searchButton)

      // Type search query
      const searchInput = screen.getByPlaceholderText(/search cafes/i)
      fireEvent.change(searchInput, { target: { value: 'test' } })

      // Close search
      fireEvent.click(searchButton)

      // Search button should be highlighted since search is active
      expect(searchButton).toHaveClass('bg-green-600')
    })
  })
})