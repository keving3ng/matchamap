import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PassportView } from '../PassportView'
import type { Cafe } from '../../types'

const mockCafes: Cafe[] = [
  {
    id: 1,
    name: 'Test Cafe 1',
    slug: 'test-cafe-1',
    latitude: 43.6532,
    longitude: -79.3832,
    link: 'https://maps.google.com/?q=1',
    city: 'Toronto',
    displayScore: 8.5,
    quickNote: 'Great matcha',
  },
  {
    id: 2,
    name: 'Test Cafe 2',
    slug: 'test-cafe-2',
    latitude: 43.6632,
    longitude: -79.3932,
    link: 'https://maps.google.com/?q=2',
    city: 'Toronto',
    displayScore: 9.0,
    quickNote: 'Amazing atmosphere',
  },
  {
    id: 3,
    name: 'Test Cafe 3',
    slug: 'test-cafe-3',
    latitude: 43.6732,
    longitude: -79.4032,
    link: 'https://maps.google.com/?q=3',
    city: 'Toronto',
    displayScore: 7.5,
    quickNote: 'Cozy spot',
  },
]

describe('PassportView', () => {
  const onToggleStamp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders header and empty progress', () => {
    render(<PassportView cafes={mockCafes} visitedStamps={[]} onToggleStamp={onToggleStamp} />)
    expect(screen.getByText('Matcha Passport')).toBeInTheDocument()
    expect(screen.getByText('0/3')).toBeInTheDocument()
  })

  it('shows partial and full progress', () => {
    const { rerender } = render(
      <PassportView cafes={mockCafes} visitedStamps={[1, 2]} onToggleStamp={onToggleStamp} />
    )
    expect(screen.getByText('2/3')).toBeInTheDocument()

    rerender(<PassportView cafes={mockCafes} visitedStamps={[1, 2, 3]} onToggleStamp={onToggleStamp} />)
    expect(screen.getByText('3/3')).toBeInTheDocument()
  })

  it('lists cafes in collection', () => {
    render(<PassportView cafes={mockCafes} visitedStamps={[]} onToggleStamp={onToggleStamp} />)
    expect(screen.getByText('Collection')).toBeInTheDocument()
    expect(screen.getByText('Test Cafe 1')).toBeInTheDocument()
    expect(screen.getByText('Test Cafe 3')).toBeInTheDocument()
  })
})
