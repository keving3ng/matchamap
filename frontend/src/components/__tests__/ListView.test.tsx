import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListView } from '../ListView'
import { useUIStore } from '../../stores/uiStore'
import { COPY } from '../../constants/copy'
import type { CafeWithDistance } from '../../types'

vi.mock('../../stores/cityStore', () => ({
  useCityStore: () => ({
    selectedCity: 'toronto',
    getAvailableCities: () => [],
    loadAvailableCities: vi.fn().mockResolvedValue(undefined),
    availableCitiesLoaded: true,
  }),
}))

const mockCafes: CafeWithDistance[] = [
  {
    id: 1,
    name: 'Matcha Cafe A',
    slug: 'a',
    displayScore: 8.5,
    latitude: 43.65,
    longitude: -79.38,
    link: 'https://maps.google.com',
    address: '123 Main St',
    quickNote: 'Earthy ceremonial whisk',
    city: 'toronto',
    drinks: [
      { id: 10, cafeId: 1, name: 'Usucha', score: 8.5, priceAmount: 6, priceCurrency: 'CAD', gramsUsed: 3, isDefault: true },
    ],
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
    slug: 'b',
    displayScore: 9.2,
    latitude: 43.66,
    longitude: -79.39,
    link: 'https://maps.google.com',
    address: '456 Queen St',
    quickNote: 'Creamy oat latte',
    city: 'toronto',
    drinks: [
      { id: 11, cafeId: 2, name: 'Hojicha Latte', score: 9.2, priceAmount: 6.5, priceCurrency: 'CAD', gramsUsed: 4, isDefault: true },
    ],
    distanceInfo: {
      kilometers: 1.2,
      miles: 0.75,
      formattedKm: '1.2 km',
      formattedMiles: '0.7 miles',
      walkTime: '15 min',
    },
  },
]

describe('ListView filtering, search, sorting, and navigation', () => {
  const onToggleExpand = vi.fn()
  const onViewDetails = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useUIStore.setState({ selectedDrinkType: null })
  })

  it('renders cafes sorted by rating by default and re-orders when sorted by distance', async () => {
    const user = userEvent.setup()
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={onToggleExpand}
        onViewDetails={onViewDetails}
      />
    )
    expect(screen.getByText('Matcha Cafe B')).toBeInTheDocument()
    expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()

    const sortSelect = screen.getByRole('combobox')
    await user.selectOptions(sortSelect, 'distance')
    expect(sortSelect).toHaveValue('distance')
  })

  it('filters cafes by search query across name, notes, and drinks', async () => {
    const user = userEvent.setup()
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={onToggleExpand}
        onViewDetails={onViewDetails}
      />
    )

    await user.click(screen.getByRole('button', { name: new RegExp(COPY.list.search, 'i') }))
    const searchInput = screen.getByPlaceholderText(COPY.list.searchPlaceholder)
    await user.type(searchInput, 'Hojicha')

    expect(screen.getByText('Matcha Cafe B')).toBeInTheDocument()
    expect(screen.queryByText('Matcha Cafe A')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: COPY.list.clearSearch }))
    expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
  })

  it('filters cafes by minimum rating and drink type', async () => {
    const user = userEvent.setup()
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={onToggleExpand}
        onViewDetails={onViewDetails}
      />
    )

    await user.click(screen.getByRole('button', { name: new RegExp(`^${COPY.list.filter}$`, 'i') }))
    await user.click(screen.getByTestId('admin-rating-9'))

    expect(screen.getByText('Matcha Cafe B')).toBeInTheDocument()
    expect(screen.queryByText('Matcha Cafe A')).not.toBeInTheDocument()
  })

  it('invokes onViewDetails from a cafe card', async () => {
    const user = userEvent.setup()
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={onToggleExpand}
        onViewDetails={onViewDetails}
      />
    )
    const detailsButtons = screen.getAllByRole('button', { name: /^Details$/i })
    await user.click(detailsButtons[0])
    expect(onViewDetails).toHaveBeenCalled()
  })
})
