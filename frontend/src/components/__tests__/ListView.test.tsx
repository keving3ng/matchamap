import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListView } from '../ListView'
import type { CafeWithDistance } from '../../types'

vi.mock('../../stores/cityStore', () => ({
  useCityStore: () => ({
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
    slug: 'b',
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
]

describe('ListView', () => {
  const onToggleExpand = vi.fn()
  const onViewDetails = vi.fn()

  it('renders cafe rows and sort control', () => {
    render(
      <ListView
        cafes={mockCafes}
        expandedCard={null}
        onToggleExpand={onToggleExpand}
        onViewDetails={onViewDetails}
      />
    )
    expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
    expect(screen.getByText('Matcha Cafe B')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('invokes onViewDetails from a card', async () => {
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
